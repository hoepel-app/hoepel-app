"""Quick verification: count all docs from all 1024 files and find subcollections."""
from leveldb_export import parse_leveldb_documents
from collections import defaultdict
import glob, os

output_files = sorted(glob.glob("backup/output-*"))
print(f"Files: {len(output_files)}")

collections = defaultdict(int)
total = 0
errors = 0

for i, f in enumerate(output_files):
    try:
        docs = list(parse_leveldb_documents(f))
    except Exception as e:
        errors += 1
        continue
    for doc in docs:
        path = doc.get("_key", {}).get("path", "")
        parts = path.split("/")
        # Use full collection path pattern for subcollections
        if len(parts) == 2:
            coll = parts[0]
        elif len(parts) == 4:
            coll = f"{parts[0]}/*/{ parts[2]}"
        else:
            coll = path
        collections[coll] += 1
        total += 1
    if (i + 1) % 200 == 0:
        print(f"  {i+1}/{len(output_files)}... ({total} docs)")

print(f"\nTotal: {total} documents, {errors} file errors")
print(f"\nCollections:")
for c in sorted(collections.keys()):
    print(f"  {c}: {collections[c]}")
