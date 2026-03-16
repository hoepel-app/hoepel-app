from leveldb_export import parse_leveldb_documents
from collections import defaultdict
import json

collections = defaultdict(int)
samples = {}
for f in ["backup/output-500", "backup/output-400", "backup/output-300", "backup/output-200", "backup/output-100"]:
    try:
        docs = list(parse_leveldb_documents(f))
        for doc in docs:
            path = doc.get("_key", {}).get("path", "")
            coll = path.split("/")[0] if "/" in path else path
            collections[coll] += 1
            if coll not in samples:
                data = {k: v for k, v in doc.items() if k != "_key"}
                samples[coll] = data
    except Exception as e:
        print(f"Error reading {f}: {e}")

for coll in sorted(collections.keys()):
    print(f"\n{coll}: {collections[coll]}")
    show = ["children", "crew-members", "crew-attendances-by-crew", "consumables", "discounts", "consumptions"]
    if coll in show:
        s = samples.get(coll, {})
        print(f"  Fields: {list(s.keys())}")
        print(f"  Sample: {json.dumps(s, indent=2, default=str)[:800]}")
