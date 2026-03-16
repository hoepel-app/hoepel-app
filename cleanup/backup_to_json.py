#!/usr/bin/env python3
"""
Convert Firestore backup (LevelDB output files) to JSON files, one per collection.

Usage:
    python scripts/backup_to_json.py [--backup-dir backup/] [--output-dir backup/json/]

Output: one .json file per collection, each containing an array of documents
with an added "_id" field (the Firestore document ID).
"""

import argparse
import glob
import json
import os
import sys
from collections import defaultdict

from leveldb_export import parse_leveldb_documents


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--backup-dir", default="backup/")
    parser.add_argument("--output-dir", default="backup/json/")
    args = parser.parse_args()

    output_files = sorted(glob.glob(os.path.join(args.backup_dir, "output-*")))
    if not output_files:
        print(f"No output-* files in {args.backup_dir}")
        sys.exit(1)

    print(f"Found {len(output_files)} backup files")
    os.makedirs(args.output_dir, exist_ok=True)

    # Collect all docs per collection
    collections = defaultdict(list)
    total = 0
    errors = 0

    for i, filepath in enumerate(output_files):
        try:
            docs = list(parse_leveldb_documents(filepath))
        except Exception as e:
            print(f"  ERROR parsing {os.path.basename(filepath)}: {e}")
            errors += 1
            continue

        for doc in docs:
            key = doc.get("_key", {})
            path = key.get("path", "")
            parts = path.split("/")

            if len(parts) < 2:
                continue

            # Determine collection name and doc ID
            if len(parts) == 2:
                collection = parts[0]
                doc_id = parts[1]
            elif len(parts) == 4:
                # Subcollection like users/{uid}/tenants/{tid}
                collection = f"{parts[0]}__{parts[2]}"  # e.g. "users__tenants"
                doc_id = f"{parts[1]}/{parts[3]}"  # e.g. "uid/tid"
            else:
                collection = "__".join(parts[:-1])
                doc_id = parts[-1]

            # Build clean doc (no _key, add _id and _path)
            data = {k: v for k, v in doc.items() if k != "_key"}
            data["_id"] = doc_id
            data["_path"] = path

            collections[collection].append(data)
            total += 1

        if (i + 1) % 100 == 0:
            print(f"  Processed {i + 1}/{len(output_files)} files ({total} docs)")

    print(f"\nTotal: {total} docs, {errors} file errors")

    # Write each collection to a JSON file
    for collection, docs in sorted(collections.items()):
        out_path = os.path.join(args.output_dir, f"{collection}.json")
        with open(out_path, "w") as f:
            json.dump(docs, f, indent=2, default=str)
        size_kb = os.path.getsize(out_path) / 1024
        print(f"  {collection}: {len(docs)} docs ({size_kb:.0f} KB) -> {out_path}")


if __name__ == "__main__":
    main()
