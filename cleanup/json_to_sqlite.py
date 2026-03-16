#!/usr/bin/env python3
"""
Convert JSON backup files to a SQLite database with a relational schema.

Usage:
    python scripts/json_to_sqlite.py [--json-dir backup/json/] [--output hoepel.sqlite]
"""

import argparse
import json
import os
import sqlite3
import sys


README = """\
# Hoepel-app Database

This SQLite database is a relational export of the hoepel-app Firestore database,
a multi-tenant platform for managing Belgian childcare centers ("speelpleinen").

## Domain concepts

- **Tenant**: A speelplein (childcare center). Each tenant operates independently.
  Some tenants share the platform but have completely separate data.
- **Children**: Kids registered at a speelplein. Belong to exactly one tenant.
- **Crew members**: Volunteers/staff ("animatoren") who run activities. Belong to one tenant.
- **Contact people**: Parents or guardians linked to children. Belong to one tenant.
- **Shifts**: Time slots within a day (e.g. morning, afternoon). A day can have multiple shifts.
  The `day_id` is a date string like "2023-07-10". Shifts have a kind (e.g. "VM", "NM")
  and optional price, start/end times, and location.
- **Child attendances**: Tracks which children attended which shifts, whether they paid,
  age group, bubble assignment, arrival/departure times, and discounts applied.
  Flattened from Firestore's nested map (one doc per child with {shiftId: attendance}).
- **Crew attendances**: Tracks which crew members were present at which shifts.
  Also flattened from a nested map structure.
- **Reports**: Generated documents (fiscal certificates, attendance lists, etc.)
  stored in GCS. Have an expiration date. Many are expired.
- **Templates**: DOCX templates used to generate reports.
- **Age groups**: Configurable age brackets per tenant (e.g. "kleuters", "grote").
- **Bubbles**: COVID-era groupings of children, later repurposed for general grouping.
- **Consumables**: Items that can be tracked per child (e.g. drinks, snacks).
- **Discounts**: Configured discount rules per tenant.
- **Shift presets**: Predefined shift configurations for quick setup.
- **Child attendance intentions**: Online pre-registrations for specific weeks.
- **Waiting list**: Children registered online awaiting approval.

## Table relationships

- `children.tenant`, `crew_members.tenant`, `shifts.tenant`, etc. → `tenants.id`
- `child_attendances.child_id` → `children.id`
- `child_attendances.shift_id` → `shifts.id`
- `crew_attendances.crew_id` → `crew_members.id`
- `crew_attendances.shift_id` → `shifts.id`
- `user_tenant_permissions.(user_id, tenant_id)` → `users.id`, `tenants.id`
- `reports.child_id` → `children.id` (nullable, only for per-child reports)
- `child_attendance_intentions.child_id` → `children.id`

## Multi-tenancy patterns

Two storage patterns from Firestore are preserved:

1. **Indexed by tenant** (most tables): Each row has a `tenant` column referencing
   `tenants.id`. Multiple rows per tenant.
2. **Doc per tenant** (age_groups, bubbles, consumables, discounts, shift_presets):
   The tenant ID is the primary key. One row per tenant with a JSON blob.

## Useful queries

-- Unique children attending on a specific day:
SELECT COUNT(DISTINCT ca.child_id)
FROM child_attendances ca
JOIN shifts s ON s.id = ca.shift_id
WHERE s.day_id = '2023-07-10' AND ca.did_attend = 1;

-- All shifts for a year with child and crew counts:
SELECT s.day_id, s.kind, s.description,
       COUNT(DISTINCT ca.child_id) AS children,
       COUNT(DISTINCT cr.crew_id) AS crew
FROM shifts s
LEFT JOIN child_attendances ca ON ca.shift_id = s.id AND ca.did_attend = 1
LEFT JOIN crew_attendances cr ON cr.shift_id = s.id AND cr.did_attend = 1
WHERE s.day_id LIKE '2023-%'
GROUP BY s.id
ORDER BY s.day_id, s.start_hour;

-- Revenue per day:
SELECT s.day_id,
       SUM(ca.amount_paid_euro) + SUM(ca.amount_paid_cents) / 100.0 AS total_eur
FROM child_attendances ca
JOIN shifts s ON s.id = ca.shift_id
WHERE s.tenant = 'demicroob' AND s.day_id LIKE '2023-%'
GROUP BY s.day_id
ORDER BY s.day_id;

## Events tables

- `events`: Application-level events (attendance changes, registrations, etc.)
  with structured context. The `firestore_after` column contains the document
  snapshot as JSON.
- `firestore_events`: Low-level Firestore document change events with `before`
  and `after` snapshots as JSON blobs. Very large table (~388k rows).

## Notes

- Foreign keys are NOT enforced (PRAGMA foreign_keys=OFF) because the backup
  may contain orphaned references from deleted documents.
- JSON columns contain serialized objects/arrays from Firestore.
- The `day_id` in shifts is a date string (YYYY-MM-DD format).
- Prices are stored as separate euro and cents integers.
- Timestamps vary: some are ISO strings, some are Unix millis, some are
  Firestore Timestamp objects serialized as strings.
"""


def safe_get(d, *keys, default=None):
    for key in keys:
        if isinstance(d, dict):
            d = d.get(key)
        else:
            return default
        if d is None:
            return default
    return d


def to_text(val):
    """Convert a value to a text-safe form for SQLite TEXT columns."""
    if val is None:
        return None
    if isinstance(val, (dict, list)):
        return json.dumps(val, default=str)
    return val


def load_json(json_dir, name):
    path = os.path.join(json_dir, f"{name}.json")
    if not os.path.exists(path):
        print(f"  WARNING: {path} not found, skipping")
        return []
    with open(path) as f:
        return json.load(f)


def create_schema(db):
    db.executescript("""
        CREATE TABLE tenants (
            id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            description TEXT,
            enable_online_registration BOOLEAN,
            enable_online_enrollment BOOLEAN,
            contact_person_name TEXT,
            contact_person_phone TEXT,
            contact_person_email TEXT,
            address_street TEXT,
            address_number TEXT,
            address_zip TEXT,
            address_city TEXT,
            logo_url TEXT,
            logo_small_url TEXT,
            privacy_policy_url TEXT
        );

        CREATE TABLE users (
            id TEXT PRIMARY KEY,
            email TEXT,
            display_name TEXT,
            accepted_privacy_policy TEXT,
            accepted_terms TEXT
        );

        CREATE TABLE user_tenant_permissions (
            user_id TEXT NOT NULL,
            tenant_id TEXT NOT NULL,
            permissions JSON,
            PRIMARY KEY (user_id, tenant_id)
        );

        CREATE TABLE children (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            phone TEXT,
            address JSON,
            contact_people JSON
        );
        CREATE INDEX idx_children_tenant ON children(tenant);
        CREATE INDEX idx_children_name ON children(tenant, last_name, first_name);

        CREATE TABLE contact_people (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            phone TEXT,
            address JSON,
            remarks TEXT
        );
        CREATE INDEX idx_contact_people_tenant ON contact_people(tenant);

        CREATE TABLE crew_members (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            phone TEXT,
            birth_date TEXT,
            bank_account TEXT,
            address JSON,
            certificates JSON,
            active BOOLEAN,
            remarks TEXT,
            year_started INTEGER
        );
        CREATE INDEX idx_crew_members_tenant ON crew_members(tenant);

        CREATE TABLE shifts (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            day_id TEXT,
            kind TEXT,
            description TEXT,
            location TEXT,
            price_euro INTEGER,
            price_cents INTEGER,
            start_hour INTEGER,
            start_minute INTEGER,
            end_hour INTEGER,
            end_minute INTEGER,
            children_can_be_present BOOLEAN,
            crew_can_be_present BOOLEAN,
            comment TEXT
        );
        CREATE INDEX idx_shifts_tenant ON shifts(tenant);
        CREATE INDEX idx_shifts_day_id ON shifts(day_id);
        CREATE INDEX idx_shifts_tenant_day ON shifts(tenant, day_id);

        -- Flattened: one row per child per shift
        CREATE TABLE child_attendances (
            child_id TEXT NOT NULL,
            shift_id TEXT NOT NULL,
            tenant TEXT NOT NULL,
            did_attend BOOLEAN,
            amount_paid_euro INTEGER,
            amount_paid_cents INTEGER,
            age_group_name TEXT,
            bubble_name TEXT,
            enrolled TEXT,
            arrived TEXT,
            left_at TEXT,
            discounts JSON,
            PRIMARY KEY (child_id, shift_id)
        );
        CREATE INDEX idx_child_att_tenant ON child_attendances(tenant);
        CREATE INDEX idx_child_att_shift ON child_attendances(shift_id);
        CREATE INDEX idx_child_att_child ON child_attendances(child_id);

        -- Flattened: one row per crew member per shift
        CREATE TABLE crew_attendances (
            crew_id TEXT NOT NULL,
            shift_id TEXT NOT NULL,
            tenant TEXT NOT NULL,
            did_attend BOOLEAN,
            age_group_name TEXT,
            enrolled TEXT,
            PRIMARY KEY (crew_id, shift_id)
        );
        CREATE INDEX idx_crew_att_tenant ON crew_attendances(tenant);
        CREATE INDEX idx_crew_att_shift ON crew_attendances(shift_id);

        CREATE TABLE reports (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            type TEXT,
            format TEXT,
            description TEXT,
            ref_path TEXT,
            created TEXT,
            expires TEXT,
            created_by TEXT,
            created_by_uid TEXT,
            child_id TEXT,
            year INTEGER,
            fill_in_parameters JSON
        );
        CREATE INDEX idx_reports_tenant ON reports(tenant);
        CREATE INDEX idx_reports_expires ON reports(expires);

        CREATE TABLE templates (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            file_name TEXT,
            display_name TEXT,
            type TEXT,
            created TEXT,
            created_by TEXT
        );

        CREATE TABLE child_attendance_intentions (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            child_id TEXT,
            year INTEGER,
            week_number INTEGER,
            status TEXT,
            preferred_bubble_name TEXT,
            shifts JSON,
            created REAL,
            edited REAL
        );
        CREATE INDEX idx_intentions_tenant ON child_attendance_intentions(tenant);

        CREATE TABLE child_registration_waiting_list (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            new_child JSON
        );

        -- Doc-per-tenant collections
        CREATE TABLE age_groups (
            tenant TEXT PRIMARY KEY,
            age_groups JSON,
            switch_over_on TEXT
        );

        CREATE TABLE bubbles (
            tenant TEXT PRIMARY KEY,
            bubbles JSON
        );

        CREATE TABLE consumables (
            tenant TEXT PRIMARY KEY,
            consumables JSON
        );

        CREATE TABLE discounts (
            tenant TEXT PRIMARY KEY,
            discounts JSON
        );

        CREATE TABLE shift_presets (
            tenant TEXT PRIMARY KEY,
            shift_presets JSON
        );

        CREATE TABLE events (
            id TEXT PRIMARY KEY,
            name TEXT,
            type TEXT,
            resource TEXT,
            timestamp INTEGER,
            tenant TEXT,
            collection_id TEXT,
            document_id TEXT,
            context JSON,
            firestore_after JSON
        );
        CREATE INDEX idx_events_tenant ON events(tenant);
        CREATE INDEX idx_events_name ON events(name);
        CREATE INDEX idx_events_timestamp ON events(timestamp);

        CREATE TABLE firestore_events (
            id TEXT PRIMARY KEY,
            tenant TEXT,
            collection TEXT,
            document_id TEXT,
            type TEXT,
            timestamp INTEGER,
            before_doc JSON,
            after_doc JSON
        );
        CREATE INDEX idx_fs_events_tenant ON firestore_events(tenant);
        CREATE INDEX idx_fs_events_collection ON firestore_events(collection);
        CREATE INDEX idx_fs_events_timestamp ON firestore_events(timestamp);
    """)


def create_metadata(db):
    """Create a _readme table with free-text documentation about the database."""
    db.executescript("""
        CREATE TABLE IF NOT EXISTS _readme (
            content TEXT NOT NULL
        );
    """)

    db.execute("INSERT INTO _readme (content) VALUES (?)", (README,))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--json-dir", default="backup/json/")
    parser.add_argument("--output", default="hoepel.sqlite")
    args = parser.parse_args()

    if os.path.exists(args.output):
        os.remove(args.output)

    db = sqlite3.connect(args.output)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA synchronous=NORMAL")

    create_schema(db)
    create_metadata(db)

    # --- Tenants ---
    docs = load_json(args.json_dir, "tenants")
    for d in docs:
        db.execute("INSERT INTO tenants VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (
            d["_id"], d.get("name"), d.get("email"), d.get("description"),
            d.get("enableOnlineRegistration"), d.get("enableOnlineEnrollment"),
            safe_get(d, "contactPerson", "name"), safe_get(d, "contactPerson", "phone"),
            safe_get(d, "contactPerson", "email"),
            safe_get(d, "address", "street"), safe_get(d, "address", "number"),
            safe_get(d, "address", "zipCode"), safe_get(d, "address", "city"),
            d.get("logoUrl"), d.get("logoSmallUrl"), d.get("privacyPolicyUrl"),
        ))
    print(f"tenants: {len(docs)}")

    # --- Users ---
    docs = load_json(args.json_dir, "users")
    for d in docs:
        db.execute("INSERT INTO users VALUES (?,?,?,?,?)", (
            d["_id"], d.get("email"), d.get("displayName"),
            str(d["acceptedPrivacyPolicy"]) if d.get("acceptedPrivacyPolicy") else None,
            str(d["acceptedTermsAndConditions"]) if d.get("acceptedTermsAndConditions") else None,
        ))
    print(f"users: {len(docs)}")

    # --- User-tenant permissions ---
    docs = load_json(args.json_dir, "users__tenants")
    for d in docs:
        # _id is "userId/tenantId"
        parts = d["_id"].split("/")
        if len(parts) == 2:
            db.execute("INSERT INTO user_tenant_permissions VALUES (?,?,?)", (
                parts[0], parts[1], json.dumps(d.get("permissions", [])),
            ))
    print(f"user_tenant_permissions: {len(docs)}")

    # --- Children ---
    docs = load_json(args.json_dir, "children")
    for d in docs:
        db.execute("INSERT INTO children VALUES (?,?,?,?,?,?,?,?)", (
            d["_id"], d.get("tenant"), to_text(d.get("firstName")), to_text(d.get("lastName")),
            to_text(d.get("email")), to_text(d.get("phone")),
            json.dumps(d["address"], default=str) if d.get("address") else None,
            json.dumps(d["contactPeople"], default=str) if d.get("contactPeople") else None,
        ))
    print(f"children: {len(docs)}")

    # --- Contact people ---
    docs = load_json(args.json_dir, "contact-people")
    for d in docs:
        db.execute("INSERT INTO contact_people VALUES (?,?,?,?,?,?,?,?)", (
            d["_id"], d.get("tenant"), to_text(d.get("firstName")), to_text(d.get("lastName")),
            to_text(d.get("email")), to_text(d.get("phone")),
            json.dumps(d["address"], default=str) if d.get("address") else None,
            d.get("remarks"),
        ))
    print(f"contact_people: {len(docs)}")

    # --- Crew members ---
    docs = load_json(args.json_dir, "crew-members")
    for d in docs:
        db.execute("INSERT INTO crew_members VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", (
            d["_id"], d.get("tenant"), to_text(d.get("firstName")), to_text(d.get("lastName")),
            to_text(d.get("email")), to_text(d.get("phone")),
            to_text(d.get("birthDate")), to_text(d.get("bankAccount")),
            json.dumps(d["address"], default=str) if d.get("address") else None,
            json.dumps(d["certificates"], default=str) if d.get("certificates") else None,
            d.get("active"), d.get("remarks"), d.get("yearStarted"),
        ))
    print(f"crew_members: {len(docs)}")

    # --- Shifts ---
    docs = load_json(args.json_dir, "shifts")
    for d in docs:
        db.execute("INSERT INTO shifts VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)", (
            d["_id"], d.get("tenant"), d.get("dayId"), d.get("kind"),
            d.get("description") or d.get("desciption"),
            d.get("location"),
            safe_get(d, "price", "euro"), safe_get(d, "price", "cents"),
            safe_get(d, "startAndEnd", "start", "hour"),
            safe_get(d, "startAndEnd", "start", "minute"),
            safe_get(d, "startAndEnd", "end", "hour"),
            safe_get(d, "startAndEnd", "end", "minute"),
            d.get("childrenCanBePresent"), d.get("crewCanBePresent"),
            d.get("comment"),
        ))
    print(f"shifts: {len(docs)}")

    # --- Child attendances (flatten the map) ---
    docs = load_json(args.json_dir, "child-attendances-by-child")
    rows = 0
    for d in docs:
        tenant = d.get("tenant")
        child_id = d["_id"]
        attendances = d.get("attendances", {})
        if not isinstance(attendances, dict):
            continue
        for shift_id, att in attendances.items():
            if not isinstance(att, dict):
                continue
            db.execute("INSERT OR IGNORE INTO child_attendances VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", (
                child_id, shift_id, tenant,
                att.get("didAttend"),
                safe_get(att, "amountPaid", "euro"), safe_get(att, "amountPaid", "cents"),
                att.get("ageGroupName"), att.get("bubbleName"),
                att.get("enrolled"), att.get("arrived"), att.get("left"),
                json.dumps(att["discounts"], default=str) if att.get("discounts") else None,
            ))
            rows += 1
    print(f"child_attendances: {len(docs)} docs -> {rows} rows (flattened)")

    # --- Crew attendances (flatten the map) ---
    docs = load_json(args.json_dir, "crew-attendances-by-crew")
    rows = 0
    for d in docs:
        tenant = d.get("tenant")
        crew_id = d["_id"]
        attendances = d.get("attendances", {})
        if not isinstance(attendances, dict):
            continue
        for shift_id, att in attendances.items():
            if not isinstance(att, dict):
                continue
            db.execute("INSERT OR IGNORE INTO crew_attendances VALUES (?,?,?,?,?,?)", (
                crew_id, shift_id, tenant,
                att.get("didAttend"), att.get("ageGroupName"), att.get("enrolled"),
            ))
            rows += 1
    print(f"crew_attendances: {len(docs)} docs -> {rows} rows (flattened)")

    # --- Reports ---
    docs = load_json(args.json_dir, "reports")
    for d in docs:
        db.execute("INSERT INTO reports VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", (
            d["_id"], d.get("tenant"), d.get("type"), d.get("format"),
            d.get("description"), d.get("refPath"),
            str(d["created"]) if d.get("created") else None,
            str(d["expires"]) if d.get("expires") else None,
            d.get("createdBy"), d.get("createdByUid"),
            d.get("childId"), d.get("year"),
            json.dumps(d["fillInParameters"], default=str) if d.get("fillInParameters") else None,
        ))
    print(f"reports: {len(docs)}")

    # --- Templates ---
    docs = load_json(args.json_dir, "templates")
    for d in docs:
        db.execute("INSERT INTO templates VALUES (?,?,?,?,?,?,?)", (
            d["_id"], d.get("tenant"), d.get("fileName"), d.get("displayName"),
            d.get("type"), str(d["created"]) if d.get("created") else None,
            d.get("createdBy"),
        ))
    print(f"templates: {len(docs)}")

    # --- Child attendance intentions ---
    docs = load_json(args.json_dir, "child-attendance-intention")
    for d in docs:
        db.execute("INSERT INTO child_attendance_intentions VALUES (?,?,?,?,?,?,?,?,?,?)", (
            d["_id"], d.get("tenant"), d.get("childId"),
            d.get("year"), d.get("weekNumber"), d.get("status"),
            d.get("preferredBubbleName"),
            json.dumps(d["shifts"], default=str) if d.get("shifts") else None,
            d.get("created"), d.get("edited"),
        ))
    print(f"child_attendance_intentions: {len(docs)}")

    # --- Child registration waiting list ---
    docs = load_json(args.json_dir, "child-registration-waiting-list")
    for d in docs:
        db.execute("INSERT INTO child_registration_waiting_list VALUES (?,?,?)", (
            d["_id"], d.get("tenant"),
            json.dumps(d["newChild"], default=str) if d.get("newChild") else None,
        ))
    print(f"child_registration_waiting_list: {len(docs)}")

    # --- Events ---
    docs = load_json(args.json_dir, "events")
    for d in docs:
        ctx = d.get("context", {})
        fs = d.get("firestore", {})
        db.execute("INSERT OR IGNORE INTO events VALUES (?,?,?,?,?,?,?,?,?,?)", (
            d["_id"], d.get("name"), d.get("type"), d.get("resource"),
            d.get("timestamp"),
            ctx.get("tenant") or safe_get(fs, "after", "tenant"),
            safe_get(fs, "collectionId"),
            safe_get(fs, "documentId"),
            json.dumps(ctx, default=str) if ctx else None,
            json.dumps(fs.get("after"), default=str) if fs.get("after") else None,
        ))
    print(f"events: {len(docs)}")

    # --- Firestore events ---
    docs = load_json(args.json_dir, "firestore-events")
    for d in docs:
        fs = d.get("firestore", {})
        tenant = safe_get(d, "context", "tenant")
        db.execute("INSERT OR IGNORE INTO firestore_events VALUES (?,?,?,?,?,?,?,?)", (
            d["_id"], tenant,
            safe_get(fs, "collectionId"),
            safe_get(fs, "documentId"),
            d.get("type"),
            d.get("timestamp"),
            json.dumps(fs.get("before"), default=str) if fs.get("before") else None,
            json.dumps(fs.get("after"), default=str) if fs.get("after") else None,
        ))
    print(f"firestore_events: {len(docs)}")

    # --- Doc-per-tenant collections ---
    for name, table, field in [
        ("age-groups", "age_groups", "ageGroups"),
        ("bubbles", "bubbles", "bubbles"),
        ("consumables", "consumables", "consumables"),
        ("discounts", "discounts", "discounts"),
        ("shift-presets", "shift_presets", "shiftPresets"),
    ]:
        docs = load_json(args.json_dir, name)
        for d in docs:
            cols = list(db.execute(f"PRAGMA table_info({table})"))
            if len(cols) == 3:  # tenant, data, extra
                extra = d.get("switchOverOn") if name == "age-groups" else None
                db.execute(f"INSERT INTO {table} VALUES (?,?,?)", (
                    d["_id"], json.dumps(d.get(field), default=str), extra,
                ))
            else:
                db.execute(f"INSERT INTO {table} VALUES (?,?)", (
                    d["_id"], json.dumps(d.get(field), default=str),
                ))
        print(f"{table}: {len(docs)}")

    db.commit()
    db.close()

    size_mb = os.path.getsize(args.output) / (1024 * 1024)
    print(f"\nDatabase: {args.output} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
