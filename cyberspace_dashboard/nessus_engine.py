import hashlib
import random
import time
from datetime import datetime

# Deterministic Mock Vulnerability Scanner
# Replaced real network probes with deterministic hashing for safe, realistic simulations.

SEVERITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}

VULN_POOL = [
    {"id": "HDR-STRICTTRANSP", "name": "Missing Strict-Transport-Security", "category": "Security Headers", "impact": "Enables HTTPS downgrade attacks and session hijacking.", "remediation": "Add the Strict-Transport-Security header to your web server configuration."},
    {"id": "HDR-CONTENTSECUR", "name": "Missing Content-Security-Policy", "category": "Security Headers", "impact": "No XSS protection policy; attacker can inject scripts.", "remediation": "Add the Content-Security-Policy header to mitigate XSS."},
    {"id": "HDR-XFRAMEOPT", "name": "Missing X-Frame-Options", "category": "Security Headers", "impact": "Page can be embedded in iframe for clickjacking.", "remediation": "Add X-Frame-Options: DENY or SAMEORIGIN."},
    {"id": "TLS-WEAKCIPHER", "name": "Weak Cipher Suite", "category": "TLS/SSL", "impact": "Cipher suite with weak key length is susceptible to brute-force.", "remediation": "Use only ECDHE+AESGCM or CHACHA20 ciphers with 256-bit keys."},
    {"id": "DISC-SERVERVER", "name": "Server Version Disclosure", "category": "Information Disclosure", "impact": "Server version fingerprint is publicly visible, helping attackers target known CVEs.", "remediation": "Remove or mask the Server header in your web server config."},
    {"id": "CORS-WILDCARD", "name": "CORS Wildcard Origin", "category": "CORS", "impact": "Any website can make cross-origin requests to this API.", "remediation": "Restrict CORS to specific origins."},
    {"id": "CKE-SECUREFLAG", "name": "Insecure Cookie: Secure flag missing", "category": "Cookie Security", "impact": "Cookie is sent over unencrypted HTTP connections.", "remediation": "Set the Secure flag on all sensitive cookies."},
    {"id": "EXP-ADMINPORTAL", "name": "Exposed Sensitive Path: /admin", "category": "Information Disclosure", "impact": "Administrative interface is publicly accessible.", "remediation": "Block access to /admin via web server rules or IP whitelisting."}
]

def generate_mock_vuln(target, seed_val, idx):
    random.seed(seed_val + idx)
    base_vuln = random.choice(VULN_POOL)
    
    # Determine severity based on random float
    sev_roll = random.random()
    if sev_roll < 0.1:
        sev, cvss = "critical", round(random.uniform(9.0, 10.0), 1)
    elif sev_roll < 0.3:
        sev, cvss = "high", round(random.uniform(7.0, 8.9), 1)
    elif sev_roll < 0.7:
        sev, cvss = "medium", round(random.uniform(4.0, 6.9), 1)
    else:
        sev, cvss = "low", round(random.uniform(1.0, 3.9), 1)
        
    return {
        "id": base_vuln["id"],
        "name": base_vuln["name"],
        "severity": sev,
        "cvss": cvss,
        "port": 443,
        "service": "https",
        "category": base_vuln["category"],
        "description": f"{base_vuln['impact']} The issue was detected on {target}.",
        "evidence": f"Simulated evidence from deterministic hashing check.",
        "remediation": base_vuln["remediation"],
        "cve": "N/A",
        "source": "Deterministic Mock Engine",
        "target": target
    }

def run_nessus_scan(target: str, log_callback=None) -> dict:
    def log(msg):
        if log_callback:
            log_callback(msg)

    log(f"[+] Starting Deterministic Simulation Engine on {target}\n")
    log(f"[+] Phase 1: Calculating deterministic hash for target...\n")
    
    time.sleep(1) # Simulate some work
    target_hash = hashlib.md5(target.encode()).hexdigest()
    seed_val = int(target_hash[:8], 16)
    
    log(f"[+] Phase 2: Generating realistic mock findings based on hash {target_hash[:8]}...\n")
    time.sleep(1.5)
    
    random.seed(seed_val)
    # Target determines how many vulns (between 1 and 7)
    num_vulns = random.randint(1, 7)
    
    vulns = []
    for i in range(num_vulns):
        vulns.append(generate_mock_vuln(target, seed_val, i))
        
    # Sort critical first
    vulns.sort(key=lambda v: SEVERITY_ORDER.get(v["severity"], 0), reverse=True)

    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    total_cvss = 0.0
    for v in vulns:
        severity_counts[v["severity"]] = severity_counts.get(v["severity"], 0) + 1
        total_cvss += v["cvss"]
        
    aggregate_cvss = round(total_cvss / len(vulns), 1) if vulns else 0.0
    
    overall = "Critical" if severity_counts["critical"] > 0 else \
              "High" if severity_counts["high"] > 0 else \
              "Medium" if severity_counts["medium"] > 0 else "Low"

    log(f"[+] Simulation complete. Building final report...\n")
    time.sleep(0.5)
    
    n = len(vulns)
    log(f"[+] ------------------------------------------\n")
    log(f"[+] Scan complete: {n} vulnerabilities simulated on {target}\n")
    log(f"[+] CVSS Aggregate: {aggregate_cvss} | Risk: {overall}\n")
    log(f"[+] ------------------------------------------\n")

    return {
        "status": "completed",
        "summary": f"Deterministic simulation scan of {target}: {len(vulns)} mock vulnerabilities generated.",
        "overall_risk": overall,
        "severity_counts": severity_counts,
        "score": aggregate_cvss,
        "vulnerabilities": vulns,
        "probe_metadata": {
            "simulation_mode": True,
            "hash_seed": target_hash[:8],
            "scan_time": datetime.utcnow().isoformat(),
        }
    }
