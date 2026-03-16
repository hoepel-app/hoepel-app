#!/usr/bin/env node

/**
 * Delete all documents in the firestore-events collection.
 *
 * Usage:
 *   node scripts/delete-firestore-events.mjs              # dry run (default)
 *   node scripts/delete-firestore-events.mjs --execute     # actually delete
 */

import { execSync } from "child_process";

const DRY_RUN = !process.argv.includes("--execute");
const PROJECT = "hoepel-app";
const DB_BASE = `projects/${PROJECT}/databases/(default)/documents`;
const COLLECTION = "firestore-events";
const QUERY_BATCH = 300; // docs per query
const DELETE_BATCH = 500; // max writes per Firestore batch commit

function getToken() {
  return execSync("gcloud auth print-access-token --account=thomas@toye.io", {
    encoding: "utf-8",
  }).trim();
}

async function listDocs(token, startAfter) {
  const query = {
    structuredQuery: {
      from: [{ collectionId: COLLECTION }],
      select: { fields: [{ fieldPath: "__name__" }] },
      limit: QUERY_BATCH,
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

async function batchDelete(token, docNames) {
  const writes = docNames.map((name) => ({ delete: name }));
  const resp = await fetch(
    `https://firestore.googleapis.com/v1/${DB_BASE}:commit`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ writes }),
    }
  );
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Batch commit failed: ${resp.status} ${err}`);
  }
  return docNames.length;
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== EXECUTING DELETIONS ===");

  let token = getToken();

  // Count all docs first
  console.log(`Counting docs in '${COLLECTION}'...`);
  let total = 0;
  let startAfter = null;
  while (true) {
    const batch = await listDocs(token, startAfter);
    if (batch.length === 0) break;
    total += batch.length;
    if (total % 3000 === 0) console.log(`  counted ${total}...`);
    if (batch.length < QUERY_BATCH) break;
    startAfter = batch[batch.length - 1].document.name;
  }

  console.log(`\nFound ${total} documents in '${COLLECTION}'.`);

  if (DRY_RUN) {
    console.log(`\n=== DRY RUN COMPLETE ===`);
    console.log(`Would delete ${total} documents.`);
    console.log(`Run with --execute to actually delete.`);
    return;
  }

  // Delete in batches of 500
  console.log(`\nDeleting ${total} documents in batches of ${DELETE_BATCH}...`);
  let deleted = 0;
  let errors = 0;

  while (true) {
    // Refresh token every 10k deletions
    if (deleted > 0 && deleted % 10000 === 0) {
      token = getToken();
    }

    // Query a batch of doc names (always from the start since we're deleting)
    const results = await listDocs(token, null);
    if (results.length === 0) break;

    const docNames = results.map((r) => r.document.name);

    // Split into chunks of DELETE_BATCH (500) for batch commit
    for (let i = 0; i < docNames.length; i += DELETE_BATCH) {
      const chunk = docNames.slice(i, i + DELETE_BATCH);
      try {
        await batchDelete(token, chunk);
        deleted += chunk.length;
      } catch (err) {
        console.error(`  Batch error: ${err.message}`);
        errors += chunk.length;
      }
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
