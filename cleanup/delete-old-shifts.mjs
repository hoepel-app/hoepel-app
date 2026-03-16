#!/usr/bin/env node

/**
 * Delete shifts from 2024 and before.
 *
 * Usage:
 *   node scripts/delete-old-shifts.mjs              # dry run
 *   node scripts/delete-old-shifts.mjs --execute     # actually delete
 */

import { execSync } from "child_process";

const DRY_RUN = !process.argv.includes("--execute");
const PROJECT = "hoepel-app";
const DB_BASE = `projects/${PROJECT}/databases/(default)/documents`;
const SQLITE_DB = "2026-03-15 backup hoepel-app.sqlite";
const CUTOFF = "2024-12-31";

function getToken() {
  return execSync("gcloud auth print-access-token --account=thomas@toye.io", {
    encoding: "utf-8",
  }).trim();
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

function loadShiftsToDelete() {
  const sql = `SELECT id, tenant FROM shifts WHERE day_id <= '${CUTOFF}' ORDER BY tenant, id`;
  const raw = execSync(`sqlite3 -json "${SQLITE_DB}" "${sql}"`, {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== EXECUTING DELETIONS ===");
  console.log(`Cutoff: shifts with day_id <= ${CUTOFF}\n`);

  const rows = loadShiftsToDelete();
  console.log(`Found ${rows.length} shifts to delete.\n`);

  const byTenant = new Map();
  for (const { tenant } of rows) {
    byTenant.set(tenant, (byTenant.get(tenant) || 0) + 1);
  }
  console.log("Per tenant:");
  for (const [tenant, count] of [...byTenant.entries()].sort()) {
    console.log(`  ${tenant}: ${count}`);
  }

  if (DRY_RUN) {
    console.log(`\n=== DRY RUN COMPLETE ===`);
    console.log(`Would delete ${rows.length} shifts.`);
    console.log(`Run with --execute to actually delete.`);
    return;
  }

  let token = getToken();
  const docNames = rows.map((r) => `${DB_BASE}/shifts/${r.id}`);
  let deleted = 0;
  let errors = 0;

  console.log(`\nDeleting ${docNames.length} shifts in batches of 500...`);
  for (let i = 0; i < docNames.length; i += 500) {
    if (i > 0 && i % 5000 === 0) token = getToken();
    const chunk = docNames.slice(i, i + 500);
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
