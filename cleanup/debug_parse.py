"""Debug: check what paths are seen in a file with children/shifts."""
from leveldb_export import parse_leveldb_documents
from collections import defaultdict
import glob

# Find a file that should have children
for f in sorted(glob.glob("backup/output-*")):
    docs = list(parse_leveldb_documents(f))
    collections = defaultdict(int)
    for doc in docs:
        path = doc.get("_key", {}).get("path", "")
        parts = path.split("/")
        coll = parts[0] if parts else "?"
        collections[coll] += 1
    if "children" in collections:
        print(f"{f}: {dict(collections)}")
        # Show a sample child path
        for doc in docs:
            path = doc.get("_key", {}).get("path", "")
            if path.startswith("children/"):
                print(f"  Path: {path}")
                print(f"  Parts: {path.split('/')}")
                print(f"  len(parts): {len(path.split('/'))}")
                break
        break
