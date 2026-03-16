#!/usr/bin/env python3
"""
Convert a Firestore backup (LevelDB export files) to a SQLite database
with a proper relational schema.

Usage:
    python scripts/backup_to_sqlite.py [--backup-dir backup/] [--output hoepel.sqlite]
"""

import argparse
import glob
import json
import os
import sqlite3
import sys
from collections import defaultdict

from leveldb_export import parse_leveldb_documents


def create_schema(db):
    """Create all tables with a proper relational schema."""
    db.executescript("""
        -- Tenants (organizations)
        CREATE TABLE IF NOT EXISTS tenants (
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

        -- Users
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT,
            display_name TEXT,
            accepted_privacy_policy TEXT,
            accepted_terms TEXT
        );

        -- User-tenant permissions (subcollection users/{uid}/tenants/{tid})
        CREATE TABLE IF NOT EXISTS user_tenant_permissions (
            user_id TEXT NOT NULL,
            tenant_id TEXT NOT NULL,
            permissions JSON,
            PRIMARY KEY (user_id, tenant_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (tenant_id) REFERENCES tenants(id)
        );

        -- Children
        CREATE TABLE IF NOT EXISTS children (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            phone TEXT,
            address JSON,
            contact_people JSON,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );
        CREATE INDEX IF NOT EXISTS idx_children_tenant ON children(tenant);

        -- Contact people (separate collection, linked to children by tenant)
        CREATE TABLE IF NOT EXISTS contact_people (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            email TEXT,
            phone TEXT,
            address JSON,
            remarks TEXT,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );
        CREATE INDEX IF NOT EXISTS idx_contact_people_tenant ON contact_people(tenant);

        -- Crew members
        CREATE TABLE IF NOT EXISTS crew_members (
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
            year_started INTEGER,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );
        CREATE INDEX IF NOT EXISTS idx_crew_members_tenant ON crew_members(tenant);

        -- Shifts
        CREATE TABLE IF NOT EXISTS shifts (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            day_id TEXT,  -- date string like "2020-08-26"
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
            comment TEXT,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );
        CREATE INDEX IF NOT EXISTS idx_shifts_tenant ON shifts(tenant);
        CREATE INDEX IF NOT EXISTS idx_shifts_day_id ON shifts(day_id);
        CREATE INDEX IF NOT EXISTS idx_shifts_tenant_day ON shifts(tenant, day_id);

        -- Child attendances (flattened from the map in child-attendances-by-child)
        -- One row per child per shift
        CREATE TABLE IF NOT EXISTS child_attendances (
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
            PRIMARY KEY (child_id, shift_id),
            FOREIGN KEY (child_id) REFERENCES children(id),
            FOREIGN KEY (shift_id) REFERENCES shifts(id),
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );
        CREATE INDEX IF NOT EXISTS idx_child_att_tenant ON child_attendances(tenant);
        CREATE INDEX IF NOT EXISTS idx_child_att_shift ON child_attendances(shift_id);
        CREATE INDEX IF NOT EXISTS idx_child_att_child ON child_attendances(child_id);

        -- Child attendances by shift (flattened)
        -- One row per shift per child
        CREATE TABLE IF NOT EXISTS child_attendances_by_shift (
            shift_id TEXT NOT NULL,
            child_id TEXT NOT NULL,
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
            PRIMARY KEY (shift_id, child_id),
            FOREIGN KEY (shift_id) REFERENCES shifts(id),
            FOREIGN KEY (child_id) REFERENCES children(id),
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );
        CREATE INDEX IF NOT EXISTS idx_child_att_shift_tenant ON child_attendances_by_shift(tenant);

        -- Crew attendances (flattened from crew-attendances-by-crew)
        CREATE TABLE IF NOT EXISTS crew_attendances (
            crew_id TEXT NOT NULL,
            shift_id TEXT NOT NULL,
            tenant TEXT NOT NULL,
            did_attend BOOLEAN,
            age_group_name TEXT,
            enrolled TEXT,
            PRIMARY KEY (crew_id, shift_id),
            FOREIGN KEY (crew_id) REFERENCES crew_members(id),
            FOREIGN KEY (shift_id) REFERENCES shifts(id),
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );
        CREATE INDEX IF NOT EXISTS idx_crew_att_tenant ON crew_attendances(tenant);
        CREATE INDEX IF NOT EXISTS idx_crew_att_shift ON crew_attendances(shift_id);

        -- Crew attendances by shift (flattened)
        CREATE TABLE IF NOT EXISTS crew_attendances_by_shift (
            shift_id TEXT NOT NULL,
            crew_id TEXT NOT NULL,
            tenant TEXT NOT NULL,
            did_attend BOOLEAN,
            age_group_name TEXT,
            enrolled TEXT,
            PRIMARY KEY (shift_id, crew_id),
            FOREIGN KEY (shift_id) REFERENCES shifts(id),
            FOREIGN KEY (crew_id) REFERENCES crew_members(id),
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );
        CREATE INDEX IF NOT EXISTS idx_crew_att_shift_tenant ON crew_attendances_by_shift(tenant);

        -- Reports
        CREATE TABLE IF NOT EXISTS reports (
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
            fill_in_parameters JSON,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );
        CREATE INDEX IF NOT EXISTS idx_reports_tenant ON reports(tenant);

        -- Templates
        CREATE TABLE IF NOT EXISTS templates (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            file_name TEXT,
            display_name TEXT,
            type TEXT,
            created TEXT,
            created_by TEXT,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );

        -- Child attendance intentions
        CREATE TABLE IF NOT EXISTS child_attendance_intentions (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            child_id TEXT,
            year INTEGER,
            week_number INTEGER,
            status TEXT,
            preferred_bubble_name TEXT,
            shifts JSON,
            created REAL,
            edited REAL,
            FOREIGN KEY (tenant) REFERENCES tenants(id),
            FOREIGN KEY (child_id) REFERENCES children(id)
        );
        CREATE INDEX IF NOT EXISTS idx_intentions_tenant ON child_attendance_intentions(tenant);

        -- Child registration waiting list
        CREATE TABLE IF NOT EXISTS child_registration_waiting_list (
            id TEXT PRIMARY KEY,
            tenant TEXT NOT NULL,
            new_child JSON,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );

        -- Age groups (doc-per-tenant)
        CREATE TABLE IF NOT EXISTS age_groups (
            tenant TEXT PRIMARY KEY,
            age_groups JSON,
            switch_over_on TEXT,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );

        -- Bubbles (doc-per-tenant)
        CREATE TABLE IF NOT EXISTS bubbles (
            tenant TEXT PRIMARY KEY,
            bubbles JSON,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );

        -- Consumables (doc-per-tenant)
        CREATE TABLE IF NOT EXISTS consumables (
            tenant TEXT PRIMARY KEY,
            consumables JSON,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );

        -- Discounts (doc-per-tenant)
        CREATE TABLE IF NOT EXISTS discounts (
            tenant TEXT PRIMARY KEY,
            discounts JSON,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );

        -- Shift presets (doc-per-tenant)
        CREATE TABLE IF NOT EXISTS shift_presets (
            tenant TEXT PRIMARY KEY,
            shift_presets JSON,
            FOREIGN KEY (tenant) REFERENCES tenants(id)
        );

        -- Events (audit log - just JSON)
        CREATE TABLE IF NOT EXISTS events (
            id TEXT PRIMARY KEY,
            name TEXT,
            type TEXT,
            resource TEXT,
            timestamp REAL,
            context JSON,
            firestore JSON
        );
        CREATE INDEX IF NOT EXISTS idx_events_name ON events(name);

        -- Firestore events (change log - just JSON)
        CREATE TABLE IF NOT EXISTS firestore_events (
            id TEXT PRIMARY KEY,
            name TEXT,
            type TEXT,
            resource TEXT,
            timestamp REAL,
            context JSON,
            firestore JSON
        );
        CREATE INDEX IF NOT EXISTS idx_fs_events_name ON firestore_events(name);
    """)


def safe_get(d, *keys, default=None):
    """Safely get nested dict values."""
    for key in keys:
        if isinstance(d, dict):
            d = d.get(key)
        else:
            return default
        if d is None:
            return default
    return d


def process_doc(doc, db, stats):
    """Process a single parsed document and insert into the appropriate table."""
    key = doc.get("_key", {})
    path = key.get("path", "")
    parts = path.split("/")

    if len(parts) < 2:
        return

    data = {k: v for k, v in doc.items() if k != "_key"}
    collection = parts[0]
    doc_id = parts[-1] if len(parts) == 2 else parts[-1]

    try:
        if collection == "tenants":
            db.execute("""
                INSERT OR REPLACE INTO tenants VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_id,
                data.get("name"),
                data.get("email"),
                data.get("description"),
                data.get("enableOnlineRegistration"),
                data.get("enableOnlineEnrollment"),
                safe_get(data, "contactPerson", "name"),
                safe_get(data, "contactPerson", "phone"),
                safe_get(data, "contactPerson", "email"),
                safe_get(data, "address", "street"),
                safe_get(data, "address", "number"),
                safe_get(data, "address", "zipCode"),
                safe_get(data, "address", "city"),
                data.get("logoUrl"),
                data.get("logoSmallUrl"),
                data.get("privacyPolicyUrl"),
            ))

        elif collection == "users" and len(parts) == 2:
            db.execute("""
                INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?, ?)
            """, (
                doc_id,
                data.get("email"),
                data.get("displayName"),
                str(data.get("acceptedPrivacyPolicy", "")) or None,
                str(data.get("acceptedTermsAndConditions", "")) or None,
            ))

        elif collection == "users" and len(parts) == 4 and parts[2] == "tenants":
            user_id = parts[1]
            tenant_id = parts[3]
            db.execute("""
                INSERT OR REPLACE INTO user_tenant_permissions VALUES (?, ?, ?)
            """, (
                user_id,
                tenant_id,
                json.dumps(data.get("permissions", []), default=str),
            ))

        elif collection == "children":
            db.execute("""
                INSERT OR REPLACE INTO children VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_id,
                data.get("tenant"),
                data.get("firstName"),
                data.get("lastName"),
                data.get("email"),
                data.get("phone"),
                json.dumps(data.get("address"), default=str) if data.get("address") else None,
                json.dumps(data.get("contactPeople"), default=str) if data.get("contactPeople") else None,
            ))

        elif collection == "contact-people":
            db.execute("""
                INSERT OR REPLACE INTO contact_people VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_id,
                data.get("tenant"),
                data.get("firstName"),
                data.get("lastName"),
                data.get("email"),
                data.get("phone"),
                json.dumps(data.get("address"), default=str) if data.get("address") else None,
                data.get("remarks"),
            ))

        elif collection == "crew-members":
            db.execute("""
                INSERT OR REPLACE INTO crew_members VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_id,
                data.get("tenant"),
                data.get("firstName"),
                data.get("lastName"),
                data.get("email"),
                data.get("phone"),
                data.get("birthDate"),
                data.get("bankAccount"),
                json.dumps(data.get("address"), default=str) if data.get("address") else None,
                json.dumps(data.get("certificates"), default=str) if data.get("certificates") else None,
                data.get("active"),
                data.get("remarks"),
                data.get("yearStarted"),
            ))

        elif collection == "shifts":
            db.execute("""
                INSERT OR REPLACE INTO shifts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_id,
                data.get("tenant"),
                data.get("dayId"),
                data.get("kind"),
                data.get("description") or data.get("desciption"),  # typo in some docs
                data.get("location"),
                safe_get(data, "price", "euro"),
                safe_get(data, "price", "cents"),
                safe_get(data, "startAndEnd", "start", "hour"),
                safe_get(data, "startAndEnd", "start", "minute"),
                safe_get(data, "startAndEnd", "end", "hour"),
                safe_get(data, "startAndEnd", "end", "minute"),
                data.get("childrenCanBePresent"),
                data.get("crewCanBePresent"),
                data.get("comment"),
            ))

        elif collection == "child-attendances-by-child":
            tenant = data.get("tenant")
            attendances = data.get("attendances", {})
            if isinstance(attendances, dict):
                for shift_id, att in attendances.items():
                    if not isinstance(att, dict):
                        continue
                    db.execute("""
                        INSERT OR REPLACE INTO child_attendances VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        doc_id,  # child_id (doc ID = child ID in this collection)
                        shift_id,
                        tenant,
                        att.get("didAttend"),
                        safe_get(att, "amountPaid", "euro"),
                        safe_get(att, "amountPaid", "cents"),
                        att.get("ageGroupName"),
                        att.get("bubbleName"),
                        att.get("enrolled"),
                        att.get("arrived"),
                        att.get("left"),
                        json.dumps(att.get("discounts"), default=str) if att.get("discounts") else None,
                    ))
                    stats["child_attendance_rows"] += 1

        elif collection == "child-attendances-by-shift":
            tenant = data.get("tenant")
            attendances = data.get("attendances", {})
            if isinstance(attendances, dict):
                for child_id, att in attendances.items():
                    if not isinstance(att, dict):
                        continue
                    db.execute("""
                        INSERT OR REPLACE INTO child_attendances_by_shift VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        doc_id,  # shift_id (doc ID = shift ID in this collection)
                        child_id,
                        tenant,
                        att.get("didAttend"),
                        safe_get(att, "amountPaid", "euro"),
                        safe_get(att, "amountPaid", "cents"),
                        att.get("ageGroupName"),
                        att.get("bubbleName"),
                        att.get("enrolled"),
                        att.get("arrived"),
                        att.get("left"),
                        json.dumps(att.get("discounts"), default=str) if att.get("discounts") else None,
                    ))
                    stats["child_att_by_shift_rows"] += 1

        elif collection == "crew-attendances-by-crew":
            tenant = data.get("tenant")
            attendances = data.get("attendances", {})
            if isinstance(attendances, dict):
                for shift_id, att in attendances.items():
                    if not isinstance(att, dict):
                        continue
                    db.execute("""
                        INSERT OR REPLACE INTO crew_attendances VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        doc_id,  # crew_id
                        shift_id,
                        tenant,
                        att.get("didAttend"),
                        att.get("ageGroupName"),
                        att.get("enrolled"),
                    ))
                    stats["crew_attendance_rows"] += 1

        elif collection == "crew-attendances-by-shift":
            tenant = data.get("tenant")
            attendances = data.get("attendances", {})
            if isinstance(attendances, dict):
                for crew_id, att in attendances.items():
                    if not isinstance(att, dict):
                        continue
                    db.execute("""
                        INSERT OR REPLACE INTO crew_attendances_by_shift VALUES (?, ?, ?, ?, ?, ?)
                    """, (
                        doc_id,  # shift_id
                        crew_id,
                        tenant,
                        att.get("didAttend"),
                        att.get("ageGroupName"),
                        att.get("enrolled"),
                    ))
                    stats["crew_att_by_shift_rows"] += 1

        elif collection == "reports":
            db.execute("""
                INSERT OR REPLACE INTO reports VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_id,
                data.get("tenant"),
                data.get("type"),
                data.get("format"),
                data.get("description"),
                data.get("refPath"),
                str(data.get("created", "")) or None,
                str(data.get("expires", "")) or None,
                data.get("createdBy"),
                data.get("createdByUid"),
                data.get("childId"),
                data.get("year"),
                json.dumps(data.get("fillInParameters"), default=str) if data.get("fillInParameters") else None,
            ))

        elif collection == "templates":
            db.execute("""
                INSERT OR REPLACE INTO templates VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_id,
                data.get("tenant"),
                data.get("fileName"),
                data.get("displayName"),
                data.get("type"),
                str(data.get("created", "")) or None,
                data.get("createdBy"),
            ))

        elif collection == "child-attendance-intention":
            db.execute("""
                INSERT OR REPLACE INTO child_attendance_intentions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                doc_id,
                data.get("tenant"),
                data.get("childId"),
                data.get("year"),
                data.get("weekNumber"),
                data.get("status"),
                data.get("preferredBubbleName"),
                json.dumps(data.get("shifts"), default=str) if data.get("shifts") else None,
                data.get("created"),
                data.get("edited"),
            ))

        elif collection == "child-registration-waiting-list":
            db.execute("""
                INSERT OR REPLACE INTO child_registration_waiting_list VALUES (?, ?, ?)
            """, (
                doc_id,
                data.get("tenant"),
                json.dumps(data.get("newChild"), default=str) if data.get("newChild") else None,
            ))

        elif collection == "age-groups":
            db.execute("""
                INSERT OR REPLACE INTO age_groups VALUES (?, ?, ?)
            """, (
                doc_id,  # tenant id
                json.dumps(data.get("ageGroups"), default=str),
                data.get("switchOverOn"),
            ))

        elif collection == "bubbles":
            db.execute("""
                INSERT OR REPLACE INTO bubbles VALUES (?, ?)
            """, (
                doc_id,
                json.dumps(data.get("bubbles"), default=str),
            ))

        elif collection == "consumables":
            db.execute("""
                INSERT OR REPLACE INTO consumables VALUES (?, ?)
            """, (
                doc_id,
                json.dumps(data.get("consumables"), default=str),
            ))

        elif collection == "discounts":
            db.execute("""
                INSERT OR REPLACE INTO discounts VALUES (?, ?)
            """, (
                doc_id,
                json.dumps(data.get("discounts"), default=str),
            ))

        elif collection == "shift-presets":
            db.execute("""
                INSERT OR REPLACE INTO shift_presets VALUES (?, ?)
            """, (
                doc_id,
                json.dumps(data.get("shiftPresets"), default=str),
            ))

        elif collection in ("events", "firestore-events"):
            # Skip for now — massive collections, can be added later
            stats["skipped_events"] += 1
            return

        else:
            stats["unknown_collections"].add(collection)
            return

        stats["collections"][collection] += 1
        stats["total"] += 1

    except Exception as e:
        stats["errors"] += 1
        if stats["errors"] <= 20:
            print(f"  ERROR {collection}/{doc_id}: {e}")
        if stats["errors"] == 21:
            print(f"  (suppressing further errors...)")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backup-dir", default="backup/")
    parser.add_argument("--output", default="hoepel.sqlite")
    args = parser.parse_args()

    output_files = sorted(glob.glob(os.path.join(args.backup_dir, "output-*")))
    if not output_files:
        print(f"No output-* files in {args.backup_dir}")
        sys.exit(1)
    print(f"Found {len(output_files)} backup files")

    if os.path.exists(args.output):
        os.remove(args.output)

    db = sqlite3.connect(args.output)
    db.execute("PRAGMA journal_mode=WAL")
    db.execute("PRAGMA synchronous=NORMAL")
    # FK enforcement OFF during import (data comes in arbitrary order)
    db.execute("PRAGMA foreign_keys=OFF")

    create_schema(db)

    stats = {
        "total": 0,
        "errors": 0,
        "collections": defaultdict(int),
        "unknown_collections": set(),
        "child_attendance_rows": 0,
        "child_att_by_shift_rows": 0,
        "crew_attendance_rows": 0,
        "crew_att_by_shift_rows": 0,
        "skipped_events": 0,
    }

    for i, filepath in enumerate(output_files):
        try:
            docs = list(parse_leveldb_documents(filepath))
        except Exception as e:
            print(f"  ERROR parsing {os.path.basename(filepath)}: {e}")
            stats["errors"] += 1
            continue

        for doc in docs:
            process_doc(doc, db, stats)

        if (i + 1) % 100 == 0 or i == len(output_files) - 1:
            db.commit()
            print(f"  Processed {i + 1}/{len(output_files)} files ({stats['total']} docs)")

    db.commit()

    # Print summary
    print(f"\n{'='*60}")
    print(f"DONE: {stats['total']} documents processed")
    print(f"Errors: {stats['errors']}")
    print(f"\nFirestore collections -> SQLite rows:")
    for coll in sorted(stats["collections"].keys()):
        print(f"  {coll}: {stats['collections'][coll]}")

    print(f"\nFlattened attendance rows:")
    print(f"  child_attendances: {stats['child_attendance_rows']}")
    print(f"  child_attendances_by_shift: {stats['child_att_by_shift_rows']}")
    print(f"  crew_attendances: {stats['crew_attendance_rows']}")
    print(f"  crew_attendances_by_shift: {stats['crew_att_by_shift_rows']}")

    if stats["skipped_events"]:
        print(f"\nSkipped events/firestore-events: {stats['skipped_events']}")

    if stats["unknown_collections"]:
        print(f"\nUnknown collections (skipped): {stats['unknown_collections']}")

    db.close()
    size_mb = os.path.getsize(args.output) / (1024 * 1024)
    print(f"\nDatabase: {args.output} ({size_mb:.1f} MB)")


if __name__ == "__main__":
    main()
