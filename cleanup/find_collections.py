"""Scan ALL available backup files to find every collection and count docs."""
from leveldb_export import parse_leveldb_documents
from collections import defaultdict
import glob
import json
import os

backup_dir = "backup/"
output_files = sorted(glob.glob(os.path.join(backup_dir, "output-*")))
print(f"Found {len(output_files)} files")

collections = defaultdict(int)
samples = {}

for i, f in enumerate(output_files):
    try:
        docs = list(parse_leveldb_documents(f))
    except Exception as e:
        continue

    for doc in docs:
        path = doc.get("_key", {}).get("path", "")
        parts = path.split("/")
        if len(parts) >= 2:
            coll = parts[0]
        else:
            coll = path
        collections[coll] += 1
        if coll not in samples:
            data = {k: v for k, v in doc.items() if k != "_key"}
            samples[coll] = (data, path)

    if (i + 1) % 100 == 0:
        print(f"  Scanned {i+1}/{len(output_files)} files...")

print(f"\nAll collections found:")
for coll in sorted(collections.keys()):
    sample_path = samples.get(coll, ({}, ""))[1]
    print(f"  {coll}: {collections[coll]} docs (example path: {sample_path})")
    s = samples.get(coll, ({},))[0]
    print(f"    Fields: {list(s.keys())}")
