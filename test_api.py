import urllib.request
import json

endpoints = [
    "/api/districts",
    "/api/station-stats",
    "/api/redzones",
    "/api/network?top_n_suspects=12&max_incidents_per_suspect=8",
    "/api/risk-score",
    "/api/ground-truth-recovery",
    "/api/stations",
    "/api/incidents?limit=10",
]

print("Testing FastAPI endpoints on port 8000...")
all_passed = True
for ep in endpoints:
    url = f"http://localhost:8000{ep}"
    try:
        req = urllib.request.urlopen(url, timeout=10)
        data = json.loads(req.read().decode())
        if "error" in data:
            print(f"[FAIL] {ep}: Error returned -> {data['error']}")
            all_passed = False
        else:
            sample = str(data)[:100].replace("\n", " ")
            print(f"[OK]   {ep} -> {sample}...")
    except Exception as e:
        print(f"[ERR]  {ep}: {e}")
        all_passed = False

if all_passed:
    print("\nALL API ENDPOINTS PASSED WITH MAHARASHTRA DATA!")
else:
    print("\nSOME ENDPOINTS FAILED")
