"""
Hybrid Penetration Engine
=========================
Strategy:
  1. Real HTTP probes  → Collect actual data from the target (headers, cookies, TLS, etc.)
  2. Single AI call    → Gemini analyses ALL collected real data in one prompt
  3. Structured report → Findings + fixes returned as Nessus-style vulnerability report

This approach:
  - Uses 1 Gemini API call per scan  (free tier = ~1500 scans/day)
  - Returns real, target-specific data (not static guesses)
  - Is fast (probes run in parallel)
"""

import json
import os
import ssl
import socket
import threading
import time
import requests
import urllib3
from dotenv import load_dotenv
from datetime import datetime
from google import genai
from google.genai import types

load_dotenv()

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

MODEL_NAME = "gemini-2.0-flash-lite"  # 1500 req/day on free tier
SEVERITY_ORDER = {"critical": 4, "high": 3, "medium": 2, "low": 1, "info": 0}

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1: Real HTTP Probes (no AI, no quota)
# ─────────────────────────────────────────────────────────────────────────────

def _probe_http_headers(base_url: str) -> dict:
    """Fetch real HTTP response headers from target."""
    try:
        r = requests.get(base_url, timeout=8, verify=False,
                         allow_redirects=True,
                         headers={"User-Agent": "Mozilla/5.0 (Security Audit)"})
        headers = dict(r.headers)
        cookies = [{"name": c.name, "httponly": c.has_nonstandard_attr("httponly"),
                    "secure": c.secure, "samesite": c.get_nonstandard_attr("samesite", "not set")}
                   for c in r.cookies]
        return {
            "status_code": r.status_code,
            "final_url": r.url,
            "headers": headers,
            "cookies": cookies,
            "server": headers.get("Server", ""),
            "x_powered_by": headers.get("X-Powered-By", ""),
            "content_type": headers.get("Content-Type", ""),
            "body_snippet": r.text[:500] if r.text else "",
        }
    except Exception as e:
        return {"error": str(e)}


def _probe_security_headers(headers: dict) -> dict:
    """Check which security headers are present or missing."""
    security_headers = {
        "Strict-Transport-Security": headers.get("Strict-Transport-Security"),
        "Content-Security-Policy": headers.get("Content-Security-Policy"),
        "X-Frame-Options": headers.get("X-Frame-Options"),
        "X-Content-Type-Options": headers.get("X-Content-Type-Options"),
        "Referrer-Policy": headers.get("Referrer-Policy"),
        "Permissions-Policy": headers.get("Permissions-Policy"),
        "X-XSS-Protection": headers.get("X-XSS-Protection"),
        "Cross-Origin-Opener-Policy": headers.get("Cross-Origin-Opener-Policy"),
        "Cross-Origin-Resource-Policy": headers.get("Cross-Origin-Resource-Policy"),
    }
    missing = [h for h, v in security_headers.items() if not v]
    present = {h: v for h, v in security_headers.items() if v}
    return {"present": present, "missing": missing}


def _probe_ssl_tls(hostname: str) -> dict:
    """Check TLS certificate and protocol version."""
    try:
        ctx = ssl.create_default_context()
        with ctx.wrap_socket(socket.socket(), server_hostname=hostname) as s:
            s.settimeout(6)
            s.connect((hostname, 443))
            cert = s.getpeercert()
            protocol = s.version()
            cipher = s.cipher()
            not_after = cert.get("notAfter", "")
            return {
                "protocol": protocol,
                "cipher": cipher[0] if cipher else "",
                "cipher_bits": cipher[2] if cipher else 0,
                "cert_expires": not_after,
                "subject": dict(x[0] for x in cert.get("subject", [])),
                "issuer": dict(x[0] for x in cert.get("issuer", [])),
            }
    except ssl.SSLError as e:
        return {"error": f"SSL Error: {e}"}
    except Exception as e:
        return {"error": str(e)}


def _probe_exposed_paths(base_url: str) -> dict:
    """Check for commonly exposed sensitive paths."""
    paths = [
        "/.env", "/.git/config", "/admin", "/debug", "/phpinfo.php",
        "/wp-admin", "/server-status", "/actuator", "/actuator/health",
        "/api/swagger.json", "/swagger-ui.html", "/graphql",
        "/robots.txt", "/sitemap.xml", "/.well-known/security.txt",
    ]
    found = []
    errors = []

    def check_path(path):
        try:
            url = base_url.rstrip("/") + path
            r = requests.get(url, timeout=5, verify=False, allow_redirects=False,
                             headers={"User-Agent": "Mozilla/5.0"})
            if r.status_code in (200, 301, 302, 403):
                found.append({"path": path, "status": r.status_code,
                               "size": len(r.content)})
        except Exception:
            pass

    threads = [threading.Thread(target=check_path, args=(p,)) for p in paths]
    for t in threads:
        t.start()
    for t in threads:
        t.join(timeout=8)

    return {"found_paths": found}


def _probe_cors(base_url: str, headers: dict) -> dict:
    """Check CORS configuration."""
    cors_header = headers.get("Access-Control-Allow-Origin", "")
    cors_creds = headers.get("Access-Control-Allow-Credentials", "")
    return {
        "allow_origin": cors_header,
        "allow_credentials": cors_creds,
        "wildcard": cors_header == "*",
        "credentials_with_wildcard": cors_header == "*" and cors_creds.lower() == "true",
    }


def _probe_clickjacking(headers: dict) -> dict:
    """Check X-Frame-Options and CSP frame-ancestors."""
    xfo = headers.get("X-Frame-Options", "")
    csp = headers.get("Content-Security-Policy", "")
    frame_ancestors = "frame-ancestors" in csp
    return {
        "x_frame_options": xfo,
        "csp_frame_ancestors": frame_ancestors,
        "vulnerable": not xfo and not frame_ancestors,
    }


def _probe_host_header(base_url: str) -> dict:
    """Test if the target reflects an injected Host header."""
    try:
        fake_host = "evil-attacker.com"
        r = requests.get(base_url, timeout=6, verify=False,
                         headers={"Host": fake_host, "User-Agent": "Mozilla/5.0"},
                         allow_redirects=False)
        reflected = fake_host in r.text or fake_host in r.headers.get("Location", "")
        return {
            "injected_host": fake_host,
            "reflected_in_response": reflected,
            "location_header": r.headers.get("Location", ""),
        }
    except Exception as e:
        return {"error": str(e)}


def _probe_graphql(base_url: str) -> dict:
    """Test if GraphQL introspection is enabled."""
    endpoints = ["/graphql", "/api/graphql", "/v1/graphql"]
    for ep in endpoints:
        try:
            url = base_url.rstrip("/") + ep
            payload = {"query": "{ __schema { queryType { name } } }"}
            r = requests.post(url, json=payload, timeout=5, verify=False,
                              headers={"Content-Type": "application/json"})
            if r.status_code == 200 and "__schema" in r.text:
                return {"endpoint": ep, "introspection_enabled": True, "response_snippet": r.text[:200]}
        except Exception:
            pass
    return {"introspection_enabled": False}


# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2: Single AI Analysis Call
# ─────────────────────────────────────────────────────────────────────────────

AI_ANALYSIS_SCHEMA = """
{
  "summary": "2-3 sentence executive summary for this specific target",
  "overall_risk": "Critical/High/Medium/Low",
  "vulnerabilities": [
    {
      "id": "VULN-001",
      "name": "Vulnerability name",
      "severity": "Critical/High/Medium/Low/Info",
      "cvss": 7.5,
      "category": "Security Header/Cookie/TLS/Injection/Exposure/CORS/Clickjacking/etc",
      "description": "Detailed, target-specific description of the exact issue found",
      "evidence": "The exact header value / response data that proves the issue",
      "remediation": "Specific, actionable fix for this exact issue",
      "cve": "CVE-XXXX-XXXXX or N/A"
    }
  ]
}
"""


def _analyze_with_ai(target: str, probe_data: dict) -> dict | None:
    """
    Send all real probe data to Gemini in ONE call.
    Returns structured vulnerability findings.
    """
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return None

    try:
        client = genai.Client(api_key=api_key)

        prompt = f"""You are an expert penetration tester analyzing REAL security scan data collected from a live target.

TARGET: {target}
SCAN TIME: {datetime.utcnow().isoformat()}

=== REAL PROBE DATA COLLECTED FROM TARGET ===
{json.dumps(probe_data, indent=2, default=str)}

=== YOUR TASK ===
Analyze the above REAL data collected from {target} and identify ALL security vulnerabilities.

Rules:
1. Base ALL findings on the ACTUAL data provided above - not assumptions
2. For each missing security header, create a specific finding
3. For each insecure cookie, create a specific finding  
4. If TLS is weak, create a finding with the real cipher/protocol detected
5. For each exposed path found (status 200/403), create a finding
6. If Host header was reflected, create a Host Header Injection finding
7. If GraphQL introspection is enabled, create a finding
8. Check CORS for wildcard origins
9. Check for server/version disclosure in Server or X-Powered-By headers
10. Be SPECIFIC - reference the exact header values, paths, and data from the scan

Respond ONLY in this exact JSON schema:
{AI_ANALYSIS_SCHEMA}"""

        response = client.models.generate_content(
            model=MODEL_NAME,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)

    except Exception as e:
        return {"error": str(e), "vulnerabilities": []}


# ─────────────────────────────────────────────────────────────────────────────
# PHASE 3: Assemble Final Report
# ─────────────────────────────────────────────────────────────────────────────

def _build_report(target: str, ai_result: dict, probe_data: dict) -> dict:
    """Convert AI analysis into a standardized Nessus-style report."""
    vulns_raw = ai_result.get("vulnerabilities", [])

    # Normalize and enrich each vulnerability
    vulns = []
    for v in vulns_raw:
        sev = str(v.get("severity", "medium")).lower()
        if sev not in SEVERITY_ORDER:
            sev = "medium"
        vulns.append({
            "id": v.get("id", "VULN"),
            "name": v.get("name", "Unknown"),
            "severity": sev,
            "cvss": float(v.get("cvss", 5.0)),
            "port": 443,
            "service": "https",
            "category": v.get("category", "General"),
            "description": v.get("description", ""),
            "evidence": v.get("evidence", ""),
            "remediation": v.get("remediation", ""),
            "cve": v.get("cve", "N/A"),
            "source": "Hybrid Pentest Engine (Real Data + AI Analysis)",
            "target": target,
        })

    # Sort critical first
    vulns.sort(key=lambda v: SEVERITY_ORDER.get(v["severity"], 0), reverse=True)

    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    total_cvss = 0.0
    for v in vulns:
        severity_counts[v["severity"]] = severity_counts.get(v["severity"], 0) + 1
        total_cvss += v["cvss"]
    aggregate_cvss = round(total_cvss / len(vulns), 1) if vulns else 0.0

    return {
        "status": "completed",
        "summary": ai_result.get("summary", f"Security scan completed for {target}"),
        "overall_risk": ai_result.get("overall_risk", "Unknown"),
        "severity_counts": severity_counts,
        "score": aggregate_cvss,
        "vulnerabilities": vulns,
        "probe_metadata": {
            "headers_checked": len(probe_data.get("security_headers", {}).get("missing", [])),
            "paths_probed": len(probe_data.get("exposed_paths", {}).get("found_paths", [])),
            "tls_checked": "error" not in probe_data.get("tls", {}),
            "scan_time": datetime.utcnow().isoformat(),
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENGINE ENTRY POINT
# ─────────────────────────────────────────────────────────────────────────────

def run_nessus_scan(target: str, log_callback=None) -> dict:
    """
    Hybrid penetration scan:
      - Phase 1: Real HTTP probes (parallel, no API quota)
      - Phase 2: Single AI analysis call (1 call per scan = ~1500/day free)
      - Phase 3: Structured Nessus-style vulnerability report
    """
    def log(msg):
        if log_callback:
            log_callback(msg)

    # Normalize target to URL
    if target.startswith("http://") or target.startswith("https://"):
        base_url = target
        hostname = target.split("//")[1].split("/")[0].split(":")[0]
    else:
        base_url = f"https://{target}"
        hostname = target.split(":")[0]

    log(f"[+] Starting Hybrid Penetration Engine on {target}\n")
    log(f"[+] Phase 1: Running real network probes in parallel...\n")

    # Run all real probes in parallel
    probe_data = {}
    probe_results = {}
    probe_lock = threading.Lock()

    def run_probe(name, fn, *args):
        try:
            result = fn(*args)
            with probe_lock:
                probe_results[name] = result
        except Exception as e:
            with probe_lock:
                probe_results[name] = {"error": str(e)}

    probe_threads = [
        threading.Thread(target=run_probe, args=("http", _probe_http_headers, base_url)),
        threading.Thread(target=run_probe, args=("tls", _probe_ssl_tls, hostname)),
        threading.Thread(target=run_probe, args=("exposed_paths", _probe_exposed_paths, base_url)),
        threading.Thread(target=run_probe, args=("graphql", _probe_graphql, base_url)),
        threading.Thread(target=run_probe, args=("host_header", _probe_host_header, base_url)),
    ]

    for t in probe_threads:
        t.start()
    for t in probe_threads:
        t.join(timeout=15)

    # Build probe_data from results
    http_data = probe_results.get("http", {})
    headers = http_data.get("headers", {})

    probe_data = {
        "target": target,
        "http_response": {
            "status_code": http_data.get("status_code"),
            "final_url": http_data.get("final_url"),
            "server": http_data.get("server", ""),
            "x_powered_by": http_data.get("x_powered_by", ""),
            "body_snippet": http_data.get("body_snippet", ""),
        },
        "security_headers": _probe_security_headers(headers),
        "cookies": http_data.get("cookies", []),
        "cors": _probe_cors(base_url, headers),
        "clickjacking": _probe_clickjacking(headers),
        "tls": probe_results.get("tls", {}),
        "exposed_paths": probe_results.get("exposed_paths", {}),
        "graphql": probe_results.get("graphql", {}),
        "host_header_test": probe_results.get("host_header", {}),
        "raw_headers": {k: v for k, v in headers.items()},
    }

    missing_count = len(probe_data["security_headers"].get("missing", []))
    found_paths = len(probe_data["exposed_paths"].get("found_paths", []))
    log(f"[+] Probes complete: {missing_count} missing security headers, {found_paths} exposed paths found\n")
    log(f"[+] Phase 2: Sending real data to AI engine for analysis (1 API call)...\n")

    # Single AI call with all real data
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        log("[!] ERROR: GEMINI_API_KEY not set. Returning probe data without AI analysis.\n")
        return {
            "status": "partial",
            "severity_counts": {"critical": 0, "high": missing_count, "medium": 0, "low": 0, "info": found_paths},
            "score": 5.0 if missing_count > 0 else 0.0,
            "vulnerabilities": [],
            "error": "GEMINI_API_KEY not set",
        }

    ai_result = _analyze_with_ai(target, probe_data)

    if not ai_result or "error" in ai_result:
        err = (ai_result or {}).get("error", "Unknown AI error")
        log(f"[!] AI analysis failed: {err[:100]}\n")
        log(f"[+] Falling back to probe-only deep analysis...\n")

        basic_vulns = []
        http_resp = probe_data.get("http_response", {})
        tls = probe_data.get("tls", {})
        cors = probe_data.get("cors", {})
        clickjack = probe_data.get("clickjacking", {})
        gql = probe_data.get("graphql", {})
        hh = probe_data.get("host_header_test", {})
        cookies = probe_data.get("cookies", [])

        # ── Security Headers ──────────────────────────────────────────
        header_severity = {
            "Strict-Transport-Security": ("high", 7.4, "Enables HTTPS downgrade attacks and session hijacking"),
            "Content-Security-Policy": ("high", 6.1, "No XSS protection policy; attacker can inject scripts"),
            "X-Frame-Options": ("medium", 4.3, "Page can be embedded in iframe for clickjacking"),
            "X-Content-Type-Options": ("medium", 4.3, "Browser may MIME-sniff responses causing XSS"),
            "Referrer-Policy": ("low", 3.1, "Sensitive URL data may leak to third-party sites"),
            "Permissions-Policy": ("low", 2.7, "No control over browser feature access (camera, mic, etc.)"),
            "X-XSS-Protection": ("low", 2.7, "Legacy browsers have no XSS filter enabled"),
            "Cross-Origin-Opener-Policy": ("medium", 4.3, "Cross-origin attacks like Spectre possible"),
            "Cross-Origin-Resource-Policy": ("medium", 4.3, "Resources can be embedded cross-origin"),
        }
        for h in probe_data["security_headers"].get("missing", []):
            sev, cvss, impact = header_severity.get(h, ("medium", 5.0, "Security header missing"))
            basic_vulns.append({
                "id": f"HDR-{h.replace('-', '')[:12]}",
                "name": f"Missing {h}",
                "severity": sev,
                "cvss": cvss,
                "port": 443, "service": "https", "category": "Security Headers",
                "description": f"{impact}. The {h} response header is absent on {target}.",
                "evidence": f"HTTP response from {target} does not include the '{h}' header.",
                "remediation": f"Add the {h} header to your web server configuration to mitigate this issue.",
                "cve": "N/A", "source": "Real HTTP Probe", "target": target,
            })

        # ── Clickjacking ──────────────────────────────────────────────
        if clickjack.get("vulnerable"):
            basic_vulns.append({
                "id": "CLICK-001", "name": "Clickjacking Attack Surface",
                "severity": "medium", "cvss": 4.3, "port": 443, "service": "https",
                "category": "Clickjacking",
                "description": f"{target} does not protect against being embedded in an iframe, enabling UI redressing attacks.",
                "evidence": "X-Frame-Options: absent | CSP frame-ancestors: not set",
                "remediation": "Add: X-Frame-Options: DENY  or  Content-Security-Policy: frame-ancestors 'none'",
                "cve": "N/A", "source": "Real HTTP Probe", "target": target,
            })

        # ── Server Version Disclosure ─────────────────────────────────
        server = http_resp.get("server", "")
        powered = http_resp.get("x_powered_by", "")
        if server and any(c.isdigit() for c in server):
            basic_vulns.append({
                "id": "DISC-001", "name": "Server Version Disclosure",
                "severity": "low", "cvss": 2.7, "port": 443, "service": "https",
                "category": "Information Disclosure",
                "description": f"Server version fingerprint is publicly visible, helping attackers target known CVEs.",
                "evidence": f"Server: {server}",
                "remediation": "Remove or mask the Server header in your web server config (e.g., nginx: server_tokens off;)",
                "cve": "N/A", "source": "Real HTTP Probe", "target": target,
            })
        if powered:
            basic_vulns.append({
                "id": "DISC-002", "name": "Technology Stack Disclosure (X-Powered-By)",
                "severity": "low", "cvss": 2.7, "port": 443, "service": "https",
                "category": "Information Disclosure",
                "description": "Backend technology is publicly exposed, revealing attack surface.",
                "evidence": f"X-Powered-By: {powered}",
                "remediation": "Remove X-Powered-By header (PHP: expose_php=Off, Express: app.disable('x-powered-by'))",
                "cve": "N/A", "source": "Real HTTP Probe", "target": target,
            })

        # ── TLS / SSL ─────────────────────────────────────────────────
        if tls and "error" not in tls:
            proto = tls.get("protocol", "")
            cipher = tls.get("cipher", "")
            bits = tls.get("cipher_bits", 0)
            if proto in ("TLSv1", "TLSv1.1", "SSLv3", "SSLv2"):
                basic_vulns.append({
                    "id": "TLS-001", "name": f"Weak TLS Protocol ({proto})",
                    "severity": "high", "cvss": 7.5, "port": 443, "service": "https/tls",
                    "category": "TLS/SSL",
                    "description": f"{proto} is deprecated and vulnerable to POODLE, BEAST, and other downgrade attacks.",
                    "evidence": f"TLS handshake used {proto} with cipher {cipher}",
                    "remediation": "Disable TLSv1.0 and TLSv1.1. Enable only TLSv1.2 and TLSv1.3.",
                    "cve": "CVE-2014-3566", "source": "Real TLS Probe", "target": target,
                })
            if bits and int(bits) < 128:
                basic_vulns.append({
                    "id": "TLS-002", "name": "Weak Cipher Suite",
                    "severity": "high", "cvss": 6.8, "port": 443, "service": "https/tls",
                    "category": "TLS/SSL",
                    "description": f"Cipher suite with only {bits}-bit key length is susceptible to brute-force.",
                    "evidence": f"Cipher: {cipher} ({bits} bits)",
                    "remediation": "Use only ECDHE+AESGCM or CHACHA20 ciphers with 256-bit keys.",
                    "cve": "N/A", "source": "Real TLS Probe", "target": target,
                })
        elif tls and "error" in tls:
            basic_vulns.append({
                "id": "TLS-003", "name": "HTTPS / TLS Not Available",
                "severity": "high", "cvss": 7.5, "port": 80, "service": "http",
                "category": "TLS/SSL",
                "description": f"The target is not serving HTTPS or has an invalid certificate. All traffic is unencrypted.",
                "evidence": f"TLS probe error: {tls['error']}",
                "remediation": "Install a valid TLS certificate (use Let's Encrypt for free). Force HTTPS via redirect.",
                "cve": "N/A", "source": "Real TLS Probe", "target": target,
            })

        # ── CORS Misconfiguration ─────────────────────────────────────
        if cors.get("wildcard"):
            severity = "critical" if cors.get("credentials_with_wildcard") else "medium"
            cvss = 8.8 if cors.get("credentials_with_wildcard") else 5.0
            basic_vulns.append({
                "id": "CORS-001", "name": "CORS Wildcard Origin",
                "severity": severity, "cvss": cvss, "port": 443, "service": "https",
                "category": "CORS",
                "description": "Any website can make cross-origin requests to this API" + (
                    " WITH cookies/credentials, enabling full account takeover."
                    if cors.get("credentials_with_wildcard") else "."
                ),
                "evidence": f"Access-Control-Allow-Origin: * | Allow-Credentials: {cors.get('allow_credentials', 'false')}",
                "remediation": "Restrict CORS to specific origins. Never use '*' with credentials.",
                "cve": "N/A", "source": "Real HTTP Probe", "target": target,
            })

        # ── GraphQL Introspection ─────────────────────────────────────
        if gql.get("introspection_enabled"):
            basic_vulns.append({
                "id": "GQL-001", "name": "GraphQL Introspection Enabled",
                "severity": "medium", "cvss": 5.3, "port": 443, "service": "https",
                "category": "GraphQL",
                "description": f"GraphQL introspection is enabled at {gql.get('endpoint')}. Attackers can enumerate the full schema.",
                "evidence": f"POST {gql.get('endpoint')} → __schema returned. Types: {', '.join(gql.get('exposed_types', [])[:5])}",
                "remediation": "Disable introspection in production. Set introspection=False in your GraphQL server config.",
                "cve": "N/A", "source": "Real GraphQL Probe", "target": target,
            })

        # ── Host Header Injection ─────────────────────────────────────
        if hh.get("reflected_in_response"):
            basic_vulns.append({
                "id": "HHI-001", "name": "Host Header Injection",
                "severity": "high", "cvss": 6.5, "port": 443, "service": "https",
                "category": "Injection",
                "description": f"The server reflects the attacker-controlled Host header in its response, enabling password reset poisoning and cache poisoning.",
                "evidence": f"Injected Host: evil-attacker.com → Reflected in response body or Location header.",
                "remediation": "Validate the Host header against a strict whitelist of allowed domain names.",
                "cve": "N/A", "source": "Real Injection Probe", "target": target,
            })

        # ── Cookie Issues ─────────────────────────────────────────────
        for c in cookies:
            issues = []
            if not c.get("httponly"):
                issues.append("HttpOnly flag missing (XSS can steal this cookie)")
            if not c.get("secure"):
                issues.append("Secure flag missing (cookie sent over HTTP)")
            if str(c.get("samesite", "")).lower() in ("not set", "", "none"):
                issues.append("SameSite not set (CSRF possible)")
            if issues:
                basic_vulns.append({
                    "id": f"CKE-{c['name'][:8]}",
                    "name": f"Insecure Cookie: {c['name']}",
                    "severity": "medium", "cvss": 5.4, "port": 443, "service": "https",
                    "category": "Cookie Security",
                    "description": f"Cookie '{c['name']}' has security issues: {'; '.join(issues)}",
                    "evidence": f"Set-Cookie: {c['name']}; HttpOnly={c['httponly']}; Secure={c['secure']}; SameSite={c['samesite']}",
                    "remediation": f"Set cookie with: {c['name']}=value; HttpOnly; Secure; SameSite=Strict",
                    "cve": "N/A", "source": "Real Cookie Probe", "target": target,
                })

        # ── Exposed Sensitive Paths ───────────────────────────────────
        critical_paths = {"/.env", "/.git/config", "/.git/HEAD"}
        high_paths = {"/phpinfo.php", "/server-status", "/actuator", "/.htpasswd"}
        for path_info in probe_data["exposed_paths"].get("found_paths", []):
            path = path_info["path"]
            if path in critical_paths:
                sev, cvss = "critical", 9.8
            elif path in high_paths:
                sev, cvss = "high", 7.5
            else:
                sev, cvss = "medium", 5.0
            basic_vulns.append({
                "id": f"EXP-{path.replace('/', '-').strip('-')[:12]}",
                "name": f"Exposed Sensitive Path: {path}",
                "severity": sev, "cvss": cvss, "port": 443, "service": "https",
                "category": "Information Disclosure",
                "description": f"Sensitive resource at {path} is publicly accessible on {target}.",
                "evidence": f"GET {path} → HTTP {path_info['status']} ({path_info['size']} bytes)",
                "remediation": f"Block access to {path} via web server rules or remove the file from the public directory.",
                "cve": "N/A", "source": "Real Path Probe", "target": target,
            })
        # Sort and score
        basic_vulns.sort(key=lambda v: SEVERITY_ORDER.get(v["severity"], 0), reverse=True)
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for v in basic_vulns:
            severity_counts[v["severity"]] = severity_counts.get(v["severity"], 0) + 1
        score = round(sum(v["cvss"] for v in basic_vulns) / len(basic_vulns), 1) if basic_vulns else 0.0
        overall = "Critical" if severity_counts["critical"] > 0 else \
                  "High" if severity_counts["high"] > 0 else \
                  "Medium" if severity_counts["medium"] > 0 else "Low"
        return {
            "status": "completed",
            "summary": f"Real probe scan of {target}: {len(basic_vulns)} vulnerabilities found across {len(set(v['category'] for v in basic_vulns))} categories.",
            "overall_risk": overall,
            "severity_counts": severity_counts,
            "score": score,
            "vulnerabilities": basic_vulns,
        }

    log(f"[+] AI analysis complete. Building final report...\n")

    # Build and return final report
    report = _build_report(target, ai_result, probe_data)
    n = len(report["vulnerabilities"])
    log(f"[+] ══════════════════════════════════════════\n")
    log(f"[+] Scan complete: {n} vulnerabilities found on {target}\n")
    log(f"[+] CVSS Aggregate: {report['score']} | Risk: {report.get('overall_risk', 'N/A')}\n")
    log(f"[+] ══════════════════════════════════════════\n")

    return report
