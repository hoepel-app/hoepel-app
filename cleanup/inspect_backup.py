#!/usr/bin/env python3
"""Inspect backup files to understand all collections and their field structures."""

import glob
import json
import os
import sys
from collections import defaultdict
from leveldb_export import parse_leveldb_documents


def main():
    backup_dir = sys.argv[1] if len(sys.argv) > 1 else "backup/"
    output_files = sorted(glob.glob(os.path.join(backup_dir, "output-*")))
    print(f"Found {len(output_files)} backup files")

    # Sample first N files to understand structure
    max_files = min(50, len(output_files))

    collections = defaultdict(lambda: {"count": 0, "fields": defaultdict(set), "sample": None})

    for i, filepath in enumerate(output_files[:max_files]):
        try:
            docs = list(parse_leveldb_documents(filepath))
        except Exception as e:
            print(f"  ERROR {filepath}: {e}")
            continue

        for doc in docs:
            key = doc.get("_key", {})
            path = key.get("path", "")
            parts = path.split("/")

            if len(parts) < 2:
                continue

            if len(parts) == 2:
                collection = parts[0]
            else:
                # For subcollections like users/uid/tenants/tid, use the pattern
                # Replace actual IDs with placeholders
                coll_parts = []
                for j, p in enumerate(parts[:-1]):
                    if j % 2 == 0:
                        coll_parts.append(p)
                    else:
                        coll_parts.append("{id}")
                collection = "/".join(coll_parts)

            info = collections[collection]
            info["count"] += 1

            # Track field names and types
            for k, v in doc.items():
                if k == "_key":
                    continue
                if isinstance(v, dict):
                    info["fields"][k].add("map")
                elif isinstance(v, list):
                    info["fields"][k].add("array")
                elif isinstance(v, bool):
                    info["fields"][k].add("bool")
                elif isinstance(v, (int, float)):
                    info["fields"][k].add("number")
                elif isinstance(v, str):
                    info["fields"][k].add("string")
                else:
                    info["fields"][k].add(type(v).__name__)

            if info["sample"] is None:
                info["sample"] = {k: v for k, v in doc.items() if k != "_key"}

    print(f"\nProcessed {max_files} files\n")
    print("=" * 70)

    for coll in sorted(collections.keys()):
        info = collections[coll]
        print(f"\n{coll} ({info['count']} docs in sample)")
        for field, types in sorted(info["fields"].items()):
            print(f"  {field}: {', '.join(types)}")
        if info["sample"]:
            print(f"  --- sample ---")
            sample_str = json.dumps(info["sample"], indent=4, default=str)
            # Truncate long samples
            if len(sample_str) > 800:
                sample_str = sample_str[:800] + "\n    ... (truncated)"
            print(f"  {sample_str}")


if __name__ == "__main__":
    main()
