#!/usr/bin/env node

/**
 * Delete crew-attendances-by-crew and crew-attendances-by-shift docs
 * that have an empty attendances map.
 *
 * Usage:
 *   node scripts/delete-empty-crew-attendance-docs.mjs              # dry run
 *   node scripts/delete-empty-crew-attendance-docs.mjs --execute     # actually delete
 */

import { execSync } from "child_process";

const DRY_RUN = !process.argv.includes("--execute");
const PROJECT = "hoepel-app";
const DB_BASE = `projects/${PROJECT}/databases/(default)/documents`;
const BATCH_SIZE = 300;

function getToken() {
  return execSync("gcloud auth print-access-token --account=thomas@toye.io", {
    encoding: "utf-8",
  }).trim();
}

async function listDocs(token, collection, startAfter) {
  const query = {
    structuredQuery: {
      from: [{ collectionId: collection }],
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
  if (!resp.ok) {
    throw new Error(`Query failed: ${resp.status} ${await resp.text()}`);
  }
  return (await resp.json()).filter((x) => x.document);
}

function isEmptyAttendances(doc) {
  const attendances = doc.document.fields?.attendances?.mapValue?.fields;
  return !attendances || Object.keys(attendances).length === 0;
}

async function deleteDoc(token, docName) {
  const resp = await fetch(`https://firestore.googleapis.com/v1/${docName}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) {
    console.error(`  ERROR deleting ${docName}: ${resp.status}`);
    return false;
  }
  return true;
}

async function processCollection(token, collection) {
  console.log(`\nScanning ${collection}...`);
  let total = 0;
  let empty = 0;
  const emptyDocs = [];
  let startAfter = null;

  while (true) {
    const batch = await listDocs(token, collection, startAfter);
    if (batch.length === 0) break;

    for (const doc of batch) {
      total++;
      if (isEmptyAttendances(doc)) {
        empty++;
        emptyDocs.push(doc.document.name);
      }
    }

    if (total % 3000 === 0) {
      console.log(`  scanned ${total}... (${empty} empty so far)`);
      token = getToken();
    }

    if (batch.length < BATCH_SIZE) break;
    startAfter = batch[batch.length - 1].document.name;
  }

  console.log(`  ${collection}: ${total} docs, ${empty} empty`);
  return { total, empty, emptyDocs, token };
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== EXECUTING DELETIONS ===");

  let token = getToken();

  const resultByCrew = await processCollection(token, "crew-attendances-by-crew");
  token = resultByCrew.token;
  const resultByShift = await processCollection(token, "crew-attendances-by-shift");
  token = resultByShift.token;

  const allEmpty = [
    ...resultByCrew.emptyDocs,
    ...resultByShift.emptyDocs,
  ];

  console.log(`\nTotal empty docs to delete: ${allEmpty.length}`);

  if (DRY_RUN) {
    console.log(`\n=== DRY RUN COMPLETE ===`);
    console.log(`Would delete ${resultByCrew.empty} empty crew-attendances-by-crew docs.`);
    console.log(`Would delete ${resultByShift.empty} empty crew-attendances-by-shift docs.`);
    console.log(`Run with --execute to actually delete.`);
    return;
  }

  console.log(`\nDeleting ${allEmpty.length} empty docs...`);
  let deleted = 0;
  let errors = 0;

  for (const docName of allEmpty) {
    if (deleted > 0 && deleted % 500 === 0) {
      console.log(`  Progress: ${deleted}/${allEmpty.length}`);
      token = getToken();
    }
    if (await deleteDoc(token, docName)) {
      deleted++;
    } else {
      errors++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Deleted: ${deleted}, errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
