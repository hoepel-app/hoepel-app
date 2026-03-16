#!/usr/bin/env node

/**
 * Delete expired reports from GCS and Firestore.
 *
 * Usage:
 *   node scripts/cleanup-expired-reports.mjs              # dry run (default)
 *   node scripts/cleanup-expired-reports.mjs --execute     # actually delete
 */

import { execSync } from "child_process";

const DRY_RUN = !process.argv.includes("--execute");
const PROJECT = "hoepel-app";
const DB_BASE = `projects/${PROJECT}/databases/(default)/documents`;
const REPORTS_BUCKET = "gs://hoepel-app-reports";
const NOW = new Date();

function getToken() {
  return execSync("gcloud auth print-access-token --account=thomas@toye.io", {
    encoding: "utf-8",
  }).trim();
}

async function firestoreQuery(token, collectionId, select, pageSize = 300, startAfter = null) {
  const query = {
    structuredQuery: {
      from: [{ collectionId }],
      limit: pageSize,
    },
  };
  if (select) {
    query.structuredQuery.select = {
      fields: select.map((f) => ({ fieldPath: f })),
    };
  }
  if (startAfter) {
    query.structuredQuery.orderBy = [{ field: { fieldPath: "__name__" }, direction: "ASCENDING" }];
    query.structuredQuery.startAt = {
      values: [{ referenceValue: startAfter }],
      before: false,
    };
  }

  const resp = await fetch(`https://firestore.googleapis.com/v1/${DB_BASE}:runQuery`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(query),
  });
  return (await resp.json()).filter((x) => x.document);
}

async function getAllDocs(token, collectionId, select) {
  const allDocs = [];
  let startAfter = null;
  while (true) {
    const batch = await firestoreQuery(token, collectionId, select, 300, startAfter);
    if (batch.length === 0) break;
    allDocs.push(...batch);
    if (batch.length < 300) break;
    startAfter = batch[batch.length - 1].document.name;
  }
  return allDocs;
}

async function deleteFirestoreDoc(token, docName) {
  const resp = await fetch(`https://firestore.googleapis.com/v1/${docName}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    const err = await resp.text();
    console.error(`  ERROR deleting Firestore doc ${docName}: ${err}`);
    return false;
  }
  return true;
}

function deleteGcsFiles(filePaths) {
  if (filePaths.length === 0) return { ok: 0, errors: 0 };
  const args = filePaths.map((p) => `"${p}"`).join(" ");
  try {
    execSync(`gsutil -m rm ${args} 2>&1`, { encoding: "utf-8", timeout: 120000 });
    return { ok: filePaths.length, errors: 0 };
  } catch (e) {
    // gsutil -m rm exits non-zero if some files are missing, but still deletes the rest
    const notFound = (e.message.match(/No URLs matched/g) || []).length;
    return { ok: filePaths.length - notFound, errors: notFound };
  }
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== EXECUTING DELETIONS ===");
  console.log(`Current time: ${NOW.toISOString()}\n`);

  let token = getToken();

  // Load all report docs
  console.log("Loading report docs from Firestore...");
  const reportDocs = await getAllDocs(token, "reports", [
    "tenant",
    "expires",
    "refPath",
    "description",
    "format",
    "created",
  ]);
  console.log(`Loaded ${reportDocs.length} report docs\n`);

  // Categorize
  const expired = [];
  const valid = [];

  for (const doc of reportDocs) {
    const fields = doc.document.fields;
    const tenant = fields.tenant?.stringValue || "unknown";
    const expiresStr = fields.expires?.timestampValue;
    const refPath = fields.refPath?.stringValue;
    const description = fields.description?.stringValue || "";
    const format = fields.format?.stringValue || "";
    const created = fields.created?.timestampValue || "";
    const docName = doc.document.name;

    const expiresDate = expiresStr ? new Date(expiresStr) : null;
    const isExpired = expiresDate ? expiresDate < NOW : false;

    const item = { tenant, expiresDate, refPath, description, format, created, docName, isExpired };

    if (isExpired) {
      expired.push(item);
    } else {
      valid.push(item);
    }
  }

  // --- Per-tenant summary ---
  const allTenants = [...new Set([...expired, ...valid].map((x) => x.tenant))].sort();

  console.log("Per-tenant breakdown:");
  console.log("-".repeat(70));
  console.log(
    "Tenant".padEnd(20) +
      "Expired".padStart(10) +
      "Valid".padStart(10) +
      "Total".padStart(10)
  );
  console.log("-".repeat(70));

  for (const tenant of allTenants) {
    const exp = expired.filter((x) => x.tenant === tenant).length;
    const val = valid.filter((x) => x.tenant === tenant).length;
    console.log(
      tenant.padEnd(20) +
        exp.toString().padStart(10) +
        val.toString().padStart(10) +
        (exp + val).toString().padStart(10)
    );
  }

  console.log("-".repeat(70));
  console.log(
    "TOTAL".padEnd(20) +
      expired.length.toString().padStart(10) +
      valid.length.toString().padStart(10) +
      (expired.length + valid.length).toString().padStart(10)
  );

  // --- What's kept ---
  console.log("\n\nREPORTS KEPT (valid / not expired):");
  console.log("-".repeat(70));
  for (const tenant of allTenants) {
    const items = valid.filter((x) => x.tenant === tenant);
    if (items.length === 0) continue;
    console.log(`\n  ${tenant} (${items.length} reports):`);
    // Show date range
    const dates = items.map((x) => x.created).filter(Boolean).sort();
    if (dates.length > 0) {
      console.log(`    Created: ${dates[0].slice(0, 10)} to ${dates[dates.length - 1].slice(0, 10)}`);
    }
    const expDates = items
      .map((x) => x.expiresDate)
      .filter(Boolean)
      .sort((a, b) => a - b);
    if (expDates.length > 0) {
      console.log(
        `    Expires: ${expDates[0].toISOString().slice(0, 10)} to ${expDates[expDates.length - 1].toISOString().slice(0, 10)}`
      );
    }
  }

  // --- What's deleted ---
  console.log("\n\nREPORTS TO DELETE (expired):");
  console.log("-".repeat(70));
  for (const tenant of allTenants) {
    const items = expired.filter((x) => x.tenant === tenant);
    if (items.length === 0) continue;
    console.log(`\n  ${tenant} (${items.length} reports):`);
    const dates = items.map((x) => x.created).filter(Boolean).sort();
    if (dates.length > 0) {
      console.log(`    Created: ${dates[0].slice(0, 10)} to ${dates[dates.length - 1].slice(0, 10)}`);
    }
    const expDates = items
      .map((x) => x.expiresDate)
      .filter(Boolean)
      .sort((a, b) => a - b);
    if (expDates.length > 0) {
      console.log(
        `    Expired: ${expDates[0].toISOString().slice(0, 10)} to ${expDates[expDates.length - 1].toISOString().slice(0, 10)}`
      );
    }
  }

  if (DRY_RUN) {
    console.log("\n\n=== DRY RUN COMPLETE ===");
    console.log(`Would delete ${expired.length} expired report docs + their GCS files.`);
    console.log(`Would keep ${valid.length} valid reports.`);
    console.log(`\nRun with --execute to actually delete.`);
    return;
  }

  // --- Execute deletions in batches ---
  console.log(`\n\nDeleting ${expired.length} expired reports in batches...`);
  let gcsDeleted = 0;
  let gcsErrors = 0;
  let fsDeleted = 0;
  let fsErrors = 0;
  const BATCH = 100;

  for (let i = 0; i < expired.length; i += BATCH) {
    const chunk = expired.slice(i, i + BATCH);
    token = getToken();

    // Batch GCS delete
    const gcsPaths = chunk.filter((x) => x.refPath).map((x) => `${REPORTS_BUCKET}/${x.refPath}`);
    const gcsResult = deleteGcsFiles(gcsPaths);
    gcsDeleted += gcsResult.ok;
    gcsErrors += gcsResult.errors;

    // Batch Firestore delete
    const docNames = chunk.map((x) => x.docName);
    const writes = docNames.map((name) => ({ delete: name }));
    const resp = await fetch(`https://firestore.googleapis.com/v1/${DB_BASE}:commit`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ writes }),
    });
    if (resp.ok) {
      fsDeleted += docNames.length;
    } else {
      console.error(`  Firestore batch error: ${resp.status} ${await resp.text()}`);
      fsErrors += docNames.length;
    }

    console.log(`  Progress: ${Math.min(i + BATCH, expired.length)}/${expired.length} (GCS: ${gcsDeleted} ok / ${gcsErrors} err, FS: ${fsDeleted} ok / ${fsErrors} err)`);
  }

  console.log(`\n=== DONE ===`);
  console.log(`GCS files deleted: ${gcsDeleted}, errors: ${gcsErrors}`);
  console.log(`Firestore docs deleted: ${fsDeleted}, errors: ${fsErrors}`);
  console.log(`Reports kept: ${valid.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
