"""Full end-to-end scan test: real probes + 1 AI call"""
from dotenv import load_dotenv
load_dotenv()

from nessus_engine import run_nessus_scan

def log(msg):
    print(msg, end="")

print("\nRunning FULL hybrid pentest on testphp.vulnweb.com...\n")
report = run_nessus_scan("testphp.vulnweb.com", log_callback=log)

print(f"\nFINAL REPORT:")
print(f"  Status: {report.get('status')}")
print(f"  Score: {report.get('score')}")
print(f"  Severity: {report.get('severity_counts')}")
print(f"  Total vulns: {len(report.get('vulnerabilities', []))}")
print(f"\nTop 3 findings:")
for v in report.get('vulnerabilities', [])[:3]:
    print(f"  [{v['severity'].upper()}] {v['name']}")
    print(f"     Evidence: {v.get('evidence', '')[:80]}")
    print(f"     Fix: {v.get('remediation', '')[:80]}")
    print()

