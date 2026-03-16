# hoepel.app monorepo

Multi-tenant platform for managing Belgian childcare centers ("speelpleinen"). Firebase project: `hoepel-app`, region `europe-west1`.

## Status: sunsetting

This project is being sunset. The two remaining active tenants (**demicroob** and **travottertje**) have been notified that support ends at the end of 2025. All other tenants have been deactivated and their data cleaned up.

A full Firestore backup was taken on 2026-03-15 before any deletions. The backup is stored in `gs://hoepel-app-backups` and locally in `backup/`. A SQLite export of the complete pre-cleanup database exists as `2026-03-15 backup hoepel-app.sqlite`.

## Development environment

```bash
# Enter the Nix dev shell (requires Nix with flakes)
nix develop
# Or with direnv: direnv allow

# Install Node dependencies
yarn
```

The `flake.nix` provides Node 18, yarn, firebase-tools, gcloud, and Python 3 with pip.

## Firestore backup to SQLite

The most important artifact of the sunset effort is the SQLite export. It converts the entire Firestore database into a relational schema that can be queried locally.

### Pipeline

The conversion is a two-step pipeline:

```
Firestore backup (LevelDB) --> JSON files (per collection) --> SQLite database
        backup/output-*          backup/json/*.json            hoepel.sqlite
```

**Step 1: LevelDB to JSON** (one-time, already done)

```bash
pip install leveldb-export  # in the nix shell, installs to .pip/
python cleanup/backup_to_json.py --backup-dir backup/ --output-dir backup/json/
```

This reads the 1024 `output-*` files from the Firestore native export and produces one `.json` file per Firestore collection in `backup/json/`. Each JSON file contains an array of documents with an added `_id` field.

Requires the [leveldb-export](https://github.com/gynzy/leveldb-export) Python package.

**Step 2: JSON to SQLite** (fast, re-runnable)

```bash
python cleanup/json_to_sqlite.py --json-dir backup/json/ --output hoepel.sqlite
```

This reads the JSON files and creates a SQLite database with a proper relational schema. Key transformations:

- Firestore's nested attendance maps (`{shiftId: attendanceData}`) are flattened into rows (one per child/crew per shift)
- Nested fields (address, contact person) are either flattened into columns or stored as JSON
- Two Firestore storage patterns are handled: "indexed by tenant" (most tables) and "doc per tenant" (age_groups, bubbles, etc.)
- A `_readme` table contains free-text documentation about the schema

The script is designed for fast iteration: edit the schema, re-run, inspect the output. It takes ~30 seconds to produce the full database.

### Schema overview

Core tables: `tenants`, `users`, `children`, `crew_members`, `contact_people`, `shifts`, `child_attendances`, `crew_attendances`, `reports`, `templates`

See the `_readme` table in the SQLite database (`SELECT content FROM _readme`) for full documentation including table relationships and example queries.

## Cleanup scripts

All cleanup scripts live in `cleanup/`. They use the Firestore REST API with `gcloud auth` tokens. Every script is **dry-run by default** and requires `--execute` to actually delete.

Run scripts with: `nix develop -c node cleanup/<script>.mjs`

### Firestore backup processing

| Script | Description |
|--------|-------------|
| `backup_to_json.py` | Converts Firestore LevelDB backup files to per-collection JSON files. One-time step. |
| `json_to_sqlite.py` | Converts JSON files to a SQLite database with a relational schema. Re-runnable. |
| `backup_to_sqlite.py` | Earlier version that read LevelDB directly (superseded by the JSON pipeline). |
| `verify_backup.py` | Verifies all 1024 backup files are present and counts docs per collection. |
| `find_collections.py` | Lists all Firestore collections and subcollections found in the backup. |
| `inspect_backup.py` | Inspects individual backup files for debugging. |
| `inspect_later.py` | Additional backup inspection helper. |
| `debug_parse.py` | Debug helper for checking document paths in backup files. |
| `test_parse.py` | Test helper for the LevelDB parser. |

### Data cleanup (Firestore)

All deletion scripts query live Firestore and support `--dry-run` (default) / `--execute`.

| Script | Description |
|--------|-------------|
| `cleanup-dry-run.mjs` | Comprehensive dry-run showing what would be deleted across all collections, respecting dependencies. |
| `cleanup-expired-reports.mjs` | Deletes expired reports (GCS files + Firestore docs). Batched GCS and Firestore deletes. |
| `delete-firestore-events.mjs` | Deletes all docs in the `firestore-events` collection (low-level change log). Uses batch commits (500/request). |
| `delete-old-child-attendances.mjs` | Removes child attendance entries from 2024 and before. Uses PATCH with `updateMask` to atomically delete nested fields from both `child-attendances-by-child` and `child-attendances-by-shift` collections, avoiding race conditions. |
| `delete-old-crew-attendances.mjs` | Same as above but for crew attendances (`crew-attendances-by-crew` and `crew-attendances-by-shift`). |
| `delete-empty-attendance-docs.mjs` | Scans `child-attendances-by-child` and `child-attendances-by-shift`, deletes docs with empty attendance maps. Run after `delete-old-child-attendances.mjs`. |
| `delete-empty-crew-attendance-docs.mjs` | Same as above but for crew attendance collections. Run after `delete-old-crew-attendances.mjs`. |
| `delete-old-shifts.mjs` | Deletes shifts from 2024 and before. Safe to run after attendance cleanup. |
| `delete-inactive-children-crew.mjs` | Deletes children and crew members from non-active tenants that have no remaining attendances in Firestore. Checks live Firestore state before deleting. |
| `delete-inactive-intentions.mjs` | Deletes `child-attendance-intention` docs from non-active tenants, plus docs from active tenants from 2024 or older. |
| `delete-inactive-waiting-list.mjs` | Deletes `child-registration-waiting-list` docs from non-active tenants. |
| `delete-inactive-contact-people.mjs` | Deletes `contact-people` docs from non-active tenants. |

### Recommended execution order

The cleanup scripts have dependencies and should be run in this order:

1. `cleanup-expired-reports.mjs` -- reports with expired timestamps
2. `delete-firestore-events.mjs` -- entire firestore-events collection
3. `delete-old-child-attendances.mjs` -- child attendance entries <= 2024
4. `delete-old-crew-attendances.mjs` -- crew attendance entries <= 2024
5. `delete-empty-attendance-docs.mjs` -- empty child attendance docs
6. `delete-empty-crew-attendance-docs.mjs` -- empty crew attendance docs
7. `delete-old-shifts.mjs` -- shifts <= 2024 (after attendances are gone)
8. `delete-inactive-children-crew.mjs` -- children/crew with no attendances
9. `delete-inactive-intentions.mjs` -- old attendance intentions
10. `delete-inactive-waiting-list.mjs` -- waiting list for inactive tenants
11. `delete-inactive-contact-people.mjs` -- contact people for inactive tenants

## Old deployment

```
$ yarn run publish
```

CI handles the rest.
