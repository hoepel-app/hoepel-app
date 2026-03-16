from leveldb_export import parse_leveldb_documents
import json

docs = list(parse_leveldb_documents("backup/output-0"))
print(f"Parsed {len(docs)} documents from output-0")

d = docs[0]
print(f"Type: {type(d)}")
if hasattr(d, "keys"):
    print(f"Keys: {list(d.keys())}")
print(json.dumps(d, indent=2, default=str)[:2000])
