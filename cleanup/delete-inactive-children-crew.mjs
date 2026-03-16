#!/usr/bin/env node

/**
 * Delete children and crew members from non-active tenants that have
 * no remaining attendances in Firestore.
 *
 * Checks live Firestore state: looks up child-attendances-by-child/{childId}
 * and crew-attendances-by-crew/{crewId} to verify the attendances map is
 * empty or the doc doesn't exist before deleting.
 *
 * Usage:
 *   node scripts/delete-inactive-children-crew.mjs              # dry run
 *   node scripts/delete-inactive-children-crew.mjs --execute     # actually delete
 */

import { execSync } from "child_process";

const DRY_RUN = !process.argv.includes("--execute");
const PROJECT = "hoepel-app";
const DB_BASE = `projects/${PROJECT}/databases/(default)/documents`;
const SQLITE_DB = "2026-03-15 backup hoepel-app.sqlite";
const ACTIVE_TENANTS = ["demicroob", "travottertje"];
const BATCH_SIZE = 300;

function getToken() {
  return execSync("gcloud auth print-access-token --account=thomas@toye.io", {
    encoding: "utf-8",
  }).trim();
}

async function getDoc(token, collection, docId) {
  const resp = await fetch(
    `https://firestore.googleapis.com/v1/${DB_BASE}/${collection}/${docId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`GET ${collection}/${docId}: ${resp.status}`);
  return await resp.json();
}

function hasAttendances(doc) {
  if (!doc) return false;
  const attendances = doc.fields?.attendances?.mapValue?.fields;
  return attendances && Object.keys(attendances).length > 0;
}

async function deleteDoc(token, collection, docId) {
  const resp = await fetch(
    `https://firestore.googleapis.com/v1/${DB_BASE}/${collection}/${docId}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!resp.ok && resp.status !== 404) {
    console.error(`  ERROR deleting ${collection}/${docId}: ${resp.status}`);
    return false;
  }
  return true;
}

function loadFromSqlite(table, idCol) {
  const excluded = ACTIVE_TENANTS.map((t) => `'${t}'`).join(", ");
  const sql = `SELECT ${idCol} AS id, tenant FROM ${table} WHERE tenant NOT IN (${excluded}) ORDER BY tenant, ${idCol}`;
  const raw = execSync(`sqlite3 -json "${SQLITE_DB}" "${sql}"`, {
    encoding: "utf-8",
    maxBuffer: 50 * 1024 * 1024,
  });
  return JSON.parse(raw);
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== EXECUTING DELETIONS ===");
  console.log(`Active tenants (excluded): ${ACTIVE_TENANTS.join(", ")}\n`);

  let token = getToken();

  // --- Children ---
  console.log("Loading children from non-active tenants...");
  const children = loadFromSqlite("children", "id");
  console.log(`Found ${children.length} children to check.\n`);

  console.log("Checking attendances in Firestore...");
  const childrenToDelete = [];
  const childrenWithAttendances = [];
  let checked = 0;

  for (const { id, tenant } of children) {
    if (checked > 0 && checked % 500 === 0) {
      console.log(`  Checked ${checked}/${children.length} children (${childrenToDelete.length} to delete, ${childrenWithAttendances.length} have attendances)`);
      token = getToken();
    }

    const doc = await getDoc(token, "child-attendances-by-child", id);
    if (hasAttendances(doc)) {
      childrenWithAttendances.push({ id, tenant });
    } else {
      childrenToDelete.push({ id, tenant });
    }
    checked++;
  }

  // Per-tenant summary for children
  const childDeleteByTenant = new Map();
  for (const { tenant } of childrenToDelete) {
    childDeleteByTenant.set(tenant, (childDeleteByTenant.get(tenant) || 0) + 1);
  }
  const childKeepByTenant = new Map();
  for (const { tenant } of childrenWithAttendances) {
    childKeepByTenant.set(tenant, (childKeepByTenant.get(tenant) || 0) + 1);
  }

  console.log(`\nChildren to delete: ${childrenToDelete.length}`);
  console.log(`Children kept (have attendances): ${childrenWithAttendances.length}`);
  console.log("\nPer tenant (delete / keep):");
  const allChildTenants = [...new Set([...childDeleteByTenant.keys(), ...childKeepByTenant.keys()])].sort();
  for (const t of allChildTenants) {
    console.log(`  ${t}: ${childDeleteByTenant.get(t) || 0} delete, ${childKeepByTenant.get(t) || 0} keep`);
  }

  // --- Crew ---
  console.log("\nLoading crew members from non-active tenants...");
  const crew = loadFromSqlite("crew_members", "id");
  console.log(`Found ${crew.length} crew members to check.\n`);

  console.log("Checking attendances in Firestore...");
  const crewToDelete = [];
  const crewWithAttendances = [];
  checked = 0;

  for (const { id, tenant } of crew) {
    if (checked > 0 && checked % 500 === 0) {
      console.log(`  Checked ${checked}/${crew.length} crew (${crewToDelete.length} to delete, ${crewWithAttendances.length} have attendances)`);
      token = getToken();
    }

    const doc = await getDoc(token, "crew-attendances-by-crew", id);
    if (hasAttendances(doc)) {
      crewWithAttendances.push({ id, tenant });
    } else {
      crewToDelete.push({ id, tenant });
    }
    checked++;
  }

  // Per-tenant summary for crew
  const crewDeleteByTenant = new Map();
  for (const { tenant } of crewToDelete) {
    crewDeleteByTenant.set(tenant, (crewDeleteByTenant.get(tenant) || 0) + 1);
  }
  const crewKeepByTenant = new Map();
  for (const { tenant } of crewWithAttendances) {
    crewKeepByTenant.set(tenant, (crewKeepByTenant.get(tenant) || 0) + 1);
  }

  console.log(`\nCrew to delete: ${crewToDelete.length}`);
  console.log(`Crew kept (have attendances): ${crewWithAttendances.length}`);
  console.log("\nPer tenant (delete / keep):");
  const allCrewTenants = [...new Set([...crewDeleteByTenant.keys(), ...crewKeepByTenant.keys()])].sort();
  for (const t of allCrewTenants) {
    console.log(`  ${t}: ${crewDeleteByTenant.get(t) || 0} delete, ${crewKeepByTenant.get(t) || 0} keep`);
  }

  if (DRY_RUN) {
    console.log(`\n=== DRY RUN COMPLETE ===`);
    console.log(`Would delete ${childrenToDelete.length} children and ${crewToDelete.length} crew members.`);
    console.log(`Would keep ${childrenWithAttendances.length} children and ${crewWithAttendances.length} crew members (have attendances).`);
    console.log(`Run with --execute to actually delete.`);
    return;
  }

  // Execute deletions
  let deleted = 0;
  let errors = 0;

  console.log(`\nDeleting ${childrenToDelete.length} children...`);
  for (const { id } of childrenToDelete) {
    if (deleted > 0 && deleted % 500 === 0) {
      console.log(`  Progress: ${deleted} deleted`);
      token = getToken();
    }
    if (await deleteDoc(token, "children", id)) {
      deleted++;
    } else {
      errors++;
    }
  }
  console.log(`  Children deleted: ${deleted}, errors: ${errors}`);

  const childDeleted = deleted;
  deleted = 0;

  console.log(`\nDeleting ${crewToDelete.length} crew members...`);
  for (const { id } of crewToDelete) {
    if (deleted > 0 && deleted % 500 === 0) {
      console.log(`  Progress: ${deleted} deleted`);
      token = getToken();
    }
    if (await deleteDoc(token, "crew-members", id)) {
      deleted++;
    } else {
      errors++;
    }
  }

  console.log(`\n=== DONE ===`);
  console.log(`Children deleted: ${childDeleted}`);
  console.log(`Crew deleted: ${deleted}`);
  console.log(`Errors: ${errors}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
