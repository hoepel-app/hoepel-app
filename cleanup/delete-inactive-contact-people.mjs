#!/usr/bin/env node

/**
 * Delete contact-people docs from non-active tenants.
 *
 * Usage:
 *   node scripts/delete-inactive-contact-people.mjs              # dry run
 *   node scripts/delete-inactive-contact-people.mjs --execute     # actually delete
 */

import { execSync } from "child_process";

const DRY_RUN = !process.argv.includes("--execute");
const PROJECT = "hoepel-app";
const DB_BASE = `projects/${PROJECT}/databases/(default)/documents`;
const ACTIVE_TENANTS = ["demicroob", "travottertje"];
const COLLECTION = "contact-people";
const BATCH_SIZE = 300;

function getToken() {
  return execSync("gcloud auth print-access-token --account=thomas@toye.io", {
    encoding: "utf-8",
  }).trim();
}

async function listDocs(token, startAfter) {
  const query = {
    structuredQuery: {
      from: [{ collectionId: COLLECTION }],
      select: { fields: [{ fieldPath: "tenant" }] },
      limit: BATCH_SIZE,
    },
  };
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
  if (!resp.ok) throw new Error(`Query failed: ${resp.status} ${await resp.text()}`);
  return (await resp.json()).filter((x) => x.document);
}

async function batchDelete(token, docNames) {
  const writes = docNames.map((name) => ({ delete: name }));
  const resp = await fetch(`https://firestore.googleapis.com/v1/${DB_BASE}:commit`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ writes }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Batch commit failed: ${resp.status} ${err}`);
  }
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== EXECUTING DELETIONS ===");
  console.log(`Active tenants (excluded): ${ACTIVE_TENANTS.join(", ")}\n`);

  let token = getToken();
  const toDelete = [];
  let kept = 0;
  let total = 0;
  let startAfter = null;
  const deleteByTenant = new Map();

  console.log(`Scanning ${COLLECTION}...`);
  while (true) {
    const batch = await listDocs(token, startAfter);
    if (batch.length === 0) break;

    for (const doc of batch) {
      total++;
      const tenant = doc.document.fields?.tenant?.stringValue || "unknown";
      if (ACTIVE_TENANTS.includes(tenant)) {
        kept++;
      } else {
        toDelete.push(doc.document.name);
        deleteByTenant.set(tenant, (deleteByTenant.get(tenant) || 0) + 1);
      }
    }

    if (total % 3000 === 0) {
      console.log(`  scanned ${total}...`);
      token = getToken();
    }

    if (batch.length < BATCH_SIZE) break;
    startAfter = batch[batch.length - 1].document.name;
  }

  console.log(`\nTotal: ${total} docs`);
  console.log(`To delete: ${toDelete.length}`);
  console.log(`To keep (active tenants): ${kept}`);
  console.log("\nPer tenant (to delete):");
  for (const [tenant, count] of [...deleteByTenant.entries()].sort()) {
    console.log(`  ${tenant}: ${count}`);
  }

  if (DRY_RUN) {
    console.log(`\n=== DRY RUN COMPLETE ===`);
    console.log(`Would delete ${toDelete.length} docs, keep ${kept}.`);
    console.log(`Run with --execute to actually delete.`);
    return;
  }

  console.log(`\nDeleting ${toDelete.length} docs in batches of 500...`);
  let deleted = 0;
  let errors = 0;

  for (let i = 0; i < toDelete.length; i += 500) {
    if (i > 0 && i % 5000 === 0) token = getToken();
    const chunk = toDelete.slice(i, i + 500);
    try {
      await batchDelete(token, chunk);
      deleted += chunk.length;
    } catch (err) {
      console.error(`  Batch error: ${err.message}`);
      errors += chunk.length;
    }
    console.log(`  Progress: ${deleted} deleted, ${errors} errors`);
  }

  console.log(`\n=== DONE ===`);
  console.log(`Deleted: ${deleted}, errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
