#!/usr/bin/env node

/**
 * Dry-run cleanup script for hoepel-app.
 *
 * Shows what would be DELETED and what would be KEPT for:
 *   1. Report files in GCS (gs://hoepel-app-reports)
 *   2. Firestore `reports` docs
 *   3. Attendances (child + crew) for inactive/stale tenants
 *   4. Children with no attendance in the past 2 years
 *   5. Crew members from inactive/stale tenants
 *
 * Usage:
 *   node scripts/cleanup-dry-run.mjs
 *
 * Requires: gcloud auth (thomas@toye.io) with Firestore access.
 */

import { execSync } from "child_process";

// --- Configuration ---

const ACTIVE_TENANTS = ["demicroob", "travottertje"];
const STALE_TENANTS = ["despeelberg", "krombeke", "splasj", "piepauw"]; // some activity 2023-2024
const INACTIVE_TENANTS = [
  "alveringem",
  "debollaert",
  "dekastanjes",
  "demo",
  "depleute",
  "desselgem",
  "dewip",
  "eleba",
  "example",
  "fantastiek",
  "sporrewoan",
  "tnoageltje",
  "tpleintje",
  "tpompierke",
  "vlamertinge",
  "zonnestraal",
];

const REMOVABLE_TENANTS = [...STALE_TENANTS, ...INACTIVE_TENANTS];

const TWO_YEARS_AGO = new Date();
TWO_YEARS_AGO.setFullYear(TWO_YEARS_AGO.getFullYear() - 2);
const CUTOFF_DATE = TWO_YEARS_AGO.toISOString().slice(0, 10); // e.g. "2024-03-15"

const PROJECT = "hoepel-app";
const DB_BASE = `projects/${PROJECT}/databases/(default)/documents`;

// --- Helpers ---

function getToken() {
  return execSync("gcloud auth print-access-token --account=thomas@toye.io", {
    encoding: "utf-8",
  }).trim();
}

async function firestoreQuery(token, collectionId, where, select, pageSize = 300, startAfter = null) {
  const query = {
    structuredQuery: {
      from: [{ collectionId }],
      limit: pageSize,
    },
  };
  if (where) query.structuredQuery.where = where;
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

  const resp = await fetch(
    `https://firestore.googleapis.com/v1/${DB_BASE}:runQuery`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(query),
    }
  );
  const data = await resp.json();
  return data.filter((x) => x.document);
}

async function getAllDocs(token, collectionId, where, select) {
  const allDocs = [];
  let startAfter = null;
  while (true) {
    const batch = await firestoreQuery(token, collectionId, where, select, 300, startAfter);
    if (batch.length === 0) break;
    allDocs.push(...batch);
    if (batch.length < 300) break;
    startAfter = batch[batch.length - 1].document.name;
  }
  return allDocs;
}

function getField(doc, field) {
  const f = doc.document?.fields?.[field];
  if (!f) return undefined;
  return f.stringValue ?? f.booleanValue ?? f.integerValue ?? undefined;
}

function getMapKeys(doc, field) {
  const f = doc.document?.fields?.[field];
  if (!f?.mapValue?.fields) return [];
  return Object.keys(f.mapValue.fields);
}

function docId(doc) {
  return doc.document.name.split("/").pop();
}

function section(title) {
  console.log("\n" + "=".repeat(70));
  console.log(`  ${title}`);
  console.log("=".repeat(70));
}

// --- Main ---

async function main() {
  const token = getToken();
  console.log(`Cutoff date for "recent" activity: ${CUTOFF_DATE}`);
  console.log(`Active tenants: ${ACTIVE_TENANTS.join(", ")}`);
  console.log(`Stale tenants: ${STALE_TENANTS.join(", ")}`);
  console.log(`Inactive tenants: ${INACTIVE_TENANTS.join(", ")}`);

  // =========================================================================
  // 1. REPORT FILES (GCS)
  // =========================================================================
  section("1. REPORT FILES (gs://hoepel-app-reports)");

  const reportLines = execSync("gsutil ls gs://hoepel-app-reports/", {
    encoding: "utf-8",
  })
    .trim()
    .split("\n")
    .filter(Boolean);

  const reportsByTenant = {};
  for (const line of reportLines) {
    // format: gs://hoepel-app-reports/{timestamp} {tenant} {filename}
    const match = line.match(/gs:\/\/hoepel-app-reports\/\d+\s+(\S+)\s+/);
    if (match) {
      const tenant = match[1];
      if (!reportsByTenant[tenant]) reportsByTenant[tenant] = [];
      reportsByTenant[tenant].push(line);
    }
  }

  let reportsToDelete = 0;
  let reportsToKeep = 0;

  for (const tenant of Object.keys(reportsByTenant).sort()) {
    const count = reportsByTenant[tenant].length;
    const isRemovable = REMOVABLE_TENANTS.includes(tenant);
    const label = isRemovable ? "DELETE" : "KEEP";
    const marker = isRemovable ? "x" : " ";
    console.log(`  [${marker}] ${tenant}: ${count} files -> ${label}`);
    if (isRemovable) reportsToDelete += count;
    else reportsToKeep += count;
  }

  console.log(
    `\n  Summary: ${reportsToDelete} files to DELETE, ${reportsToKeep} files to KEEP`
  );

  // =========================================================================
  // 2. FIRESTORE `reports` DOCS
  // =========================================================================
  section("2. FIRESTORE `reports` COLLECTION");

  const reportDocs = await getAllDocs(token, "reports", null, [
    "tenant",
    "created",
    "format",
    "type",
  ]);

  const reportDocsByTenant = {};
  for (const doc of reportDocs) {
    const tenant = getField(doc, "tenant") || "unknown";
    if (!reportDocsByTenant[tenant]) reportDocsByTenant[tenant] = [];
    reportDocsByTenant[tenant].push(doc);
  }

  let reportDocsToDelete = 0;
  let reportDocsToKeep = 0;

  for (const tenant of Object.keys(reportDocsByTenant).sort()) {
    const count = reportDocsByTenant[tenant].length;
    const isRemovable = REMOVABLE_TENANTS.includes(tenant);
    const label = isRemovable ? "DELETE" : "KEEP";
    const marker = isRemovable ? "x" : " ";
    console.log(`  [${marker}] ${tenant}: ${count} docs -> ${label}`);
    if (isRemovable) reportDocsToDelete += count;
    else reportDocsToKeep += count;
  }

  console.log(
    `\n  Summary: ${reportDocsToDelete} docs to DELETE, ${reportDocsToKeep} docs to KEEP`
  );

  // =========================================================================
  // 3. SHIFTS — build a map of shiftId -> dayId for date lookups
  // =========================================================================
  section("3. LOADING SHIFTS (for date lookups)");

  const shiftDocs = await getAllDocs(token, "shifts", null, ["tenant", "dayId"]);

  const shiftDateById = {}; // shiftId -> dayId string
  const shiftsByTenant = {};
  for (const doc of shiftDocs) {
    const id = docId(doc);
    const tenant = getField(doc, "tenant");
    const dayId = getField(doc, "dayId");
    shiftDateById[id] = dayId;
    if (!shiftsByTenant[tenant]) shiftsByTenant[tenant] = [];
    shiftsByTenant[tenant].push({ id, dayId });
  }

  console.log(`  Loaded ${shiftDocs.length} shifts total`);
  for (const tenant of Object.keys(shiftsByTenant).sort()) {
    const shifts = shiftsByTenant[tenant];
    const dates = shifts.map((s) => s.dayId).filter(Boolean).sort();
    console.log(
      `    ${tenant}: ${shifts.length} shifts (${dates[0] || "?"} - ${dates[dates.length - 1] || "?"})`
    );
  }

  // =========================================================================
  // 4. CHILD ATTENDANCES
  // =========================================================================
  section("4. CHILD ATTENDANCES (child-attendances-by-child)");

  const childAttDocs = await getAllDocs(token, "child-attendances-by-child", null, [
    "tenant",
    "attendances",
  ]);

  console.log(`  Loaded ${childAttDocs.length} child attendance docs`);

  // For each child attendance doc, determine if there's any recent attendance
  const childAttAnalysis = []; // { docId, tenant, totalShifts, recentShifts, latestDate, action }

  for (const doc of childAttDocs) {
    const tenant = getField(doc, "tenant");
    const id = docId(doc);
    const shiftIds = getMapKeys(doc, "attendances");

    let latestDate = null;
    let recentCount = 0;

    for (const shiftId of shiftIds) {
      const dayId = shiftDateById[shiftId];
      if (dayId) {
        if (!latestDate || dayId > latestDate) latestDate = dayId;
        if (dayId >= CUTOFF_DATE) recentCount++;
      }
    }

    const isActiveTenant = ACTIVE_TENANTS.includes(tenant);
    const isRemovableTenant = REMOVABLE_TENANTS.includes(tenant);

    let action;
    if (isActiveTenant) {
      action = "KEEP";
    } else if (isRemovableTenant) {
      action = "DELETE (stale/inactive tenant)";
    } else {
      action = "KEEP";
    }

    childAttAnalysis.push({
      docId: id,
      tenant,
      totalShifts: shiftIds.length,
      recentShifts: recentCount,
      latestDate,
      action,
    });
  }

  const childAttByTenantAction = {};
  for (const item of childAttAnalysis) {
    const key = `${item.tenant}|${item.action}`;
    if (!childAttByTenantAction[key]) childAttByTenantAction[key] = 0;
    childAttByTenantAction[key]++;
  }

  const tenants = [...new Set(childAttAnalysis.map((x) => x.tenant))].sort();
  for (const tenant of tenants) {
    const items = childAttAnalysis.filter((x) => x.tenant === tenant);
    const toDelete = items.filter((x) => x.action !== "KEEP");
    const toKeep = items.filter((x) => x.action === "KEEP");
    console.log(`  ${tenant}: ${toDelete.length} DELETE, ${toKeep.length} KEEP (of ${items.length} total)`);
  }

  const totalChildAttDelete = childAttAnalysis.filter((x) => x.action !== "KEEP").length;
  const totalChildAttKeep = childAttAnalysis.filter((x) => x.action === "KEEP").length;
  console.log(
    `\n  Summary: ${totalChildAttDelete} attendance docs to DELETE, ${totalChildAttKeep} to KEEP`
  );

  // =========================================================================
  // 5. CREW ATTENDANCES
  // =========================================================================
  section("5. CREW ATTENDANCES (crew-attendances-by-crew)");

  const crewAttDocs = await getAllDocs(token, "crew-attendances-by-crew", null, [
    "tenant",
    "attendances",
  ]);

  console.log(`  Loaded ${crewAttDocs.length} crew attendance docs`);

  const crewAttAnalysis = [];

  for (const doc of crewAttDocs) {
    const tenant = getField(doc, "tenant");
    const id = docId(doc);
    const shiftIds = getMapKeys(doc, "attendances");

    let latestDate = null;
    let recentCount = 0;

    for (const shiftId of shiftIds) {
      const dayId = shiftDateById[shiftId];
      if (dayId) {
        if (!latestDate || dayId > latestDate) latestDate = dayId;
        if (dayId >= CUTOFF_DATE) recentCount++;
      }
    }

    const isActiveTenant = ACTIVE_TENANTS.includes(tenant);
    const isRemovableTenant = REMOVABLE_TENANTS.includes(tenant);

    let action;
    if (isActiveTenant) {
      action = "KEEP";
    } else if (isRemovableTenant) {
      action = "DELETE (stale/inactive tenant)";
    } else {
      action = "KEEP";
    }

    crewAttAnalysis.push({ docId: id, tenant, totalShifts: shiftIds.length, recentShifts: recentCount, latestDate, action });
  }

  for (const tenant of [...new Set(crewAttAnalysis.map((x) => x.tenant))].sort()) {
    const items = crewAttAnalysis.filter((x) => x.tenant === tenant);
    const toDelete = items.filter((x) => x.action !== "KEEP");
    const toKeep = items.filter((x) => x.action === "KEEP");
    console.log(`  ${tenant}: ${toDelete.length} DELETE, ${toKeep.length} KEEP (of ${items.length} total)`);
  }

  const totalCrewAttDelete = crewAttAnalysis.filter((x) => x.action !== "KEEP").length;
  const totalCrewAttKeep = crewAttAnalysis.filter((x) => x.action === "KEEP").length;
  console.log(
    `\n  Summary: ${totalCrewAttDelete} crew attendance docs to DELETE, ${totalCrewAttKeep} to KEEP`
  );

  // =========================================================================
  // 6. CHILDREN
  // =========================================================================
  section("6. CHILDREN");

  const childDocs = await getAllDocs(token, "children", null, [
    "tenant",
    "firstName",
    "lastName",
  ]);

  console.log(`  Loaded ${childDocs.length} children total`);

  // Build set of child IDs that have recent attendance (from step 4)
  const childIdsWithRecentAttendance = new Set(
    childAttAnalysis.filter((x) => x.action === "KEEP").map((x) => x.docId)
  );
  // Also build set of child IDs that have ANY attendance doc
  const childIdsWithAnyAttendance = new Set(
    childAttAnalysis.map((x) => x.docId)
  );

  const childAnalysis = [];
  for (const doc of childDocs) {
    const tenant = getField(doc, "tenant");
    const id = docId(doc);
    const firstName = getField(doc, "firstName") || "?";
    const lastName = getField(doc, "lastName") || "?";
    const isActiveTenant = ACTIVE_TENANTS.includes(tenant);
    const isRemovableTenant = REMOVABLE_TENANTS.includes(tenant);
    const hasAnyAttendance = childIdsWithAnyAttendance.has(id);

    let action;
    if (isActiveTenant) {
      action = "KEEP";
    } else if (isRemovableTenant) {
      action = "DELETE (stale/inactive tenant)";
    } else {
      action = "KEEP";
    }

    // Note if attendance doc still exists (needs to be deleted first)
    const attDocExists = hasAnyAttendance;

    childAnalysis.push({ docId: id, tenant, firstName, lastName, action, attDocExists });
  }

  for (const tenant of [...new Set(childAnalysis.map((x) => x.tenant))].sort()) {
    const items = childAnalysis.filter((x) => x.tenant === tenant);
    const toDelete = items.filter((x) => x.action !== "KEEP");
    const toKeep = items.filter((x) => x.action === "KEEP");
    console.log(`  ${tenant}: ${toDelete.length} DELETE, ${toKeep.length} KEEP (of ${items.length} total)`);
    // Show a few names being kept
    if (toKeep.length > 0 && toKeep.length <= 10) {
      for (const c of toKeep) {
        console.log(`    KEEP: ${c.firstName} ${c.lastName}`);
      }
    }
  }

  const totalChildDelete = childAnalysis.filter((x) => x.action !== "KEEP").length;
  const totalChildKeep = childAnalysis.filter((x) => x.action === "KEEP").length;
  console.log(
    `\n  Summary: ${totalChildDelete} children to DELETE, ${totalChildKeep} to KEEP`
  );

  // Children that we want to delete but still have attendance docs
  const blockedChildren = childAnalysis.filter(
    (x) => x.action !== "KEEP" && x.attDocExists
  );
  if (blockedChildren.length > 0) {
    console.log(
      `  NOTE: ${blockedChildren.length} children to delete still have attendance docs (delete those first)`
    );
  }

  // =========================================================================
  // 7. CREW MEMBERS
  // =========================================================================
  section("7. CREW MEMBERS");

  const crewDocs = await getAllDocs(token, "crew-members", null, [
    "tenant",
    "firstName",
    "lastName",
    "active",
  ]);

  console.log(`  Loaded ${crewDocs.length} crew members total`);

  const crewIdsWithAnyAttendance = new Set(
    crewAttAnalysis.map((x) => x.docId)
  );
  const crewIdsWithRecentAttendance = new Set(
    crewAttAnalysis.filter((x) => x.action === "KEEP").map((x) => x.docId)
  );

  const crewAnalysis = [];
  for (const doc of crewDocs) {
    const tenant = getField(doc, "tenant");
    const id = docId(doc);
    const firstName = getField(doc, "firstName") || "?";
    const lastName = getField(doc, "lastName") || "?";
    const isActiveTenant = ACTIVE_TENANTS.includes(tenant);
    const isRemovableTenant = REMOVABLE_TENANTS.includes(tenant);
    const hasAnyAttendance = crewIdsWithAnyAttendance.has(id);

    let action;
    if (isActiveTenant) {
      action = "KEEP";
    } else if (isRemovableTenant) {
      action = "DELETE (stale/inactive tenant)";
    } else {
      action = "KEEP";
    }

    crewAnalysis.push({ docId: id, tenant, firstName, lastName, action, attDocExists: hasAnyAttendance });
  }

  for (const tenant of [...new Set(crewAnalysis.map((x) => x.tenant))].sort()) {
    const items = crewAnalysis.filter((x) => x.tenant === tenant);
    const toDelete = items.filter((x) => x.action !== "KEEP");
    const toKeep = items.filter((x) => x.action === "KEEP");
    console.log(`  ${tenant}: ${toDelete.length} DELETE, ${toKeep.length} KEEP (of ${items.length} total)`);
  }

  const totalCrewDelete = crewAnalysis.filter((x) => x.action !== "KEEP").length;
  const totalCrewKeep = crewAnalysis.filter((x) => x.action === "KEEP").length;
  console.log(
    `\n  Summary: ${totalCrewDelete} crew to DELETE, ${totalCrewKeep} to KEEP`
  );

  const blockedCrew = crewAnalysis.filter(
    (x) => x.action !== "KEEP" && x.attDocExists
  );
  if (blockedCrew.length > 0) {
    console.log(
      `  NOTE: ${blockedCrew.length} crew to delete still have attendance docs (delete those first)`
    );
  }

  // =========================================================================
  // 8. CHILD ATTENDANCE INTENTIONS
  // =========================================================================
  section("8. CHILD ATTENDANCE INTENTIONS");

  const intentionDocs = await getAllDocs(token, "child-attendance-intention", null, [
    "tenant",
    "childId",
    "year",
  ]);

  console.log(`  Loaded ${intentionDocs.length} intention docs`);

  let intentionsToDelete = 0;
  let intentionsToKeep = 0;
  const intentionsByTenant = {};
  for (const doc of intentionDocs) {
    const tenant = getField(doc, "tenant");
    if (!intentionsByTenant[tenant]) intentionsByTenant[tenant] = { delete: 0, keep: 0 };
    if (REMOVABLE_TENANTS.includes(tenant)) {
      intentionsByTenant[tenant].delete++;
      intentionsToDelete++;
    } else {
      intentionsByTenant[tenant].keep++;
      intentionsToKeep++;
    }
  }

  for (const tenant of Object.keys(intentionsByTenant).sort()) {
    const { delete: d, keep: k } = intentionsByTenant[tenant];
    console.log(`  ${tenant}: ${d} DELETE, ${k} KEEP`);
  }
  console.log(`\n  Summary: ${intentionsToDelete} to DELETE, ${intentionsToKeep} to KEEP`);

  // =========================================================================
  // 9. SHIFTS for stale/inactive tenants
  // =========================================================================
  section("9. SHIFTS (for stale/inactive tenants)");

  let shiftsToDelete = 0;
  let shiftsToKeep = 0;
  for (const tenant of Object.keys(shiftsByTenant).sort()) {
    const count = shiftsByTenant[tenant].length;
    const isRemovable = REMOVABLE_TENANTS.includes(tenant);
    const label = isRemovable ? "DELETE" : "KEEP";
    console.log(`  ${tenant}: ${count} shifts -> ${label}`);
    if (isRemovable) shiftsToDelete += count;
    else shiftsToKeep += count;
  }
  console.log(`\n  Summary: ${shiftsToDelete} shifts to DELETE, ${shiftsToKeep} to KEEP`);
  console.log(`  NOTE: only loaded up to ~300 per tenant; actual counts may be higher`);

  // =========================================================================
  // OVERALL SUMMARY
  // =========================================================================
  section("OVERALL DELETION ORDER");
  console.log(`
  The correct deletion order is:
    1. Report files from GCS           (${reportsToDelete} files)
    2. Report docs from Firestore      (${reportDocsToDelete} docs)
    3. Child attendance intentions      (${intentionsToDelete} docs)
    4. Child attendance docs            (${totalChildAttDelete} docs)
    5. Crew attendance docs             (${totalCrewAttDelete} docs)
    6. Children                         (${totalChildDelete} docs)
    7. Crew members                     (${totalCrewDelete} docs)
    8. Shifts (stale/inactive tenants)  (${shiftsToDelete}+ shifts)

  Data KEPT:
    - Report files:      ${reportsToKeep}
    - Report docs:       ${reportDocsToKeep}
    - Child attendances: ${totalChildAttKeep}
    - Crew attendances:  ${totalCrewAttKeep}
    - Children:          ${totalChildKeep}
    - Crew members:      ${totalCrewKeep}
    - Shifts:            ${shiftsToKeep}+
  `);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
