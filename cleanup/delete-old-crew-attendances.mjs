#!/usr/bin/env node

/**
 * Delete crew attendances from 2024 and before.
 *
 * Uses Firestore REST API PATCH with updateMask to atomically delete nested
 * fields (attendances.{id}) without read-modify-write, avoiding race conditions.
 *
 * Matches the existing Cloud Function behavior: docs are kept even if their
 * attendances map becomes empty.
 *
 * Usage:
 *   node scripts/delete-old-crew-attendances.mjs              # dry run
 *   node scripts/delete-old-crew-attendances.mjs --execute     # actually delete
 */

import { execSync } from "child_process";

const DRY_RUN = !process.argv.includes("--execute");
const PROJECT = "hoepel-app";
const DB_BASE = `projects/${PROJECT}/databases/(default)/documents`;
const CUTOFF = "2024-12-31"; // delete attendances on shifts with day_id <= this
const SQLITE_DB = "2026-03-15 backup hoepel-app.sqlite";

function getToken() {
  return execSync("gcloud auth print-access-token --account=thomas@toye.io", {
    encoding: "utf-8",
  }).trim();
}

async function deleteFields(token, collection, docId, fieldPaths) {
  const params = fieldPaths
    .map((fp) => `updateMask.fieldPaths=${encodeURIComponent(fp)}`)
    .join("&");

  const url = `https://firestore.googleapis.com/v1/${DB_BASE}/${collection}/${docId}?${params}`;

  const resp = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields: {} }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    if (resp.status === 404) return true;
    console.error(`  ERROR patching ${collection}/${docId}: ${resp.status} ${err}`);
    return false;
  }
  return true;
}

function loadAttendancesToDelete() {
  const sql = `SELECT ca.crew_id, ca.shift_id, ca.tenant FROM crew_attendances ca JOIN shifts s ON s.id = ca.shift_id WHERE s.day_id <= '${CUTOFF}' ORDER BY ca.crew_id, ca.shift_id`;
  const raw = execSync(`sqlite3 -json "${SQLITE_DB}" "${sql}"`, {
    encoding: "utf-8",
    maxBuffer: 100 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== EXECUTING DELETIONS ===");
  console.log(`Cutoff: crew attendances on shifts with day_id <= ${CUTOFF}\n`);

  // Load from SQLite
  console.log(`Loading crew attendances from ${SQLITE_DB}...`);
  const rows = loadAttendancesToDelete();
  console.log(`Found ${rows.length} crew attendances to delete.\n`);

  // Group by crew_id -> list of shift_ids to remove
  const byCrew = new Map();
  for (const { crew_id, shift_id } of rows) {
    if (!byCrew.has(crew_id)) byCrew.set(crew_id, []);
    byCrew.get(crew_id).push(shift_id);
  }

  // Group by shift_id -> list of crew_ids to remove
  const byShift = new Map();
  for (const { crew_id, shift_id } of rows) {
    if (!byShift.has(shift_id)) byShift.set(shift_id, []);
    byShift.get(shift_id).push(crew_id);
  }

  console.log(`crew-attendances-by-crew: ${byCrew.size} docs to patch`);
  console.log(`crew-attendances-by-shift: ${byShift.size} docs to patch`);

  // Per-tenant summary
  const tenantCounts = new Map();
  for (const { tenant } of rows) {
    tenantCounts.set(tenant, (tenantCounts.get(tenant) || 0) + 1);
  }
  console.log("\nPer tenant:");
  for (const [tenant, count] of [...tenantCounts.entries()].sort()) {
    console.log(`  ${tenant}: ${count}`);
  }

  if (DRY_RUN) {
    console.log(`\n=== DRY RUN COMPLETE ===`);
    console.log(`Would delete ${rows.length} crew attendances from ${byCrew.size} crew docs and ${byShift.size} shift docs.`);
    console.log(`Run with --execute to actually delete.`);
    return;
  }

  let token = getToken();
  let patched = 0;
  let errors = 0;
  const totalDocs = byCrew.size + byShift.size;

  // Patch crew-attendances-by-crew docs
  console.log(`\nPatching ${byCrew.size} crew-attendances-by-crew docs...`);
  for (const [crewId, shiftIds] of byCrew) {
    const fieldPaths = shiftIds.map((sid) => `attendances.\`${sid}\``);

    for (let i = 0; i < fieldPaths.length; i += 100) {
      const chunk = fieldPaths.slice(i, i + 100);
      const ok = await deleteFields(token, "crew-attendances-by-crew", crewId, chunk);
      if (!ok) errors++;
    }

    patched++;
    if (patched % 500 === 0) {
      console.log(`  Progress: ${patched}/${totalDocs} docs`);
      token = getToken();
    }
  }

  // Patch crew-attendances-by-shift docs
  console.log(`\nPatching ${byShift.size} crew-attendances-by-shift docs...`);
  for (const [shiftId, crewIds] of byShift) {
    const fieldPaths = crewIds.map((cid) => `attendances.\`${cid}\``);

    for (let i = 0; i < fieldPaths.length; i += 100) {
      const chunk = fieldPaths.slice(i, i + 100);
      const ok = await deleteFields(token, "crew-attendances-by-shift", shiftId, chunk);
      if (!ok) errors++;
    }

    patched++;
    if (patched % 500 === 0) {
      console.log(`  Progress: ${patched}/${totalDocs} docs`);
      token = getToken();
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Patched: ${patched} docs, errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
