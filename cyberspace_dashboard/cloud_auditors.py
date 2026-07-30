import re
import requests
import json

# ─────────────────────────────────────────────────────────────────────────────
# 1. XML EXTERNAL ENTITY (XXE) INJECTION AUDITOR
# ─────────────────────────────────────────────────────────────────────────────

XXE_PATTERNS = [
    (re.compile(r'resolve_entities\s*=\s*True', re.I), "Python lxml configured to resolve entities."),
    (re.compile(r'xml\.etree\.ElementTree\.parse', re.I), "Standard python ElementTree is vulnerable to XXE if untrusted data is parsed without defusedxml."),
    (re.compile(r'noent\s*:\s*true', re.I), "Node.js libxmljs configured with noent: true (resolves entities)."),
    (re.compile(r'setFeature\("http://apache\.org/xml/features/nonvalidating/load-external-dtd",\s*true\)', re.I), "Java DocumentBuilder loading external DTDs."),
]

def audit_xxe(code_snippet):
    findings = []
    lines = code_snippet.splitlines()

    for i, line in enumerate(lines):
        for pattern, description in XXE_PATTERNS:
            if pattern.search(line):
                findings.append({
                    "line": i + 1,
                    "code": line.strip(),
                    "issue": description,
                    "severity": "Critical"
                })

    fix = (
        "// Node.js (libxmljs) Fix: Disable entity resolution\n"
        "const xmlDoc = libxmljs.parseXmlString(xml, { noent: false, noblanks: true });\n\n"
        "# Python Fix: Use defusedxml instead of standard xml\n"
        "import defusedxml.ElementTree as ET\n"
        "tree = ET.parse('untrusted.xml')"
    )

    return {"lines_scanned": len(lines), "findings": findings, "fix": fix}

# ─────────────────────────────────────────────────────────────────────────────
# 2. HTTP HOST HEADER INJECTION AUDITOR
# ─────────────────────────────────────────────────────────────────────────────

def audit_host_header(target):
    if not target.startswith("http"):
        target = "http://" + target

    findings = []
    malicious_host = "evil-attacker.com"
    headers = {
        "Host": malicious_host,
        "X-Forwarded-Host": malicious_host
    }

    try:
        r = requests.get(target, headers=headers, timeout=5, allow_redirects=False)
        # Check if malicious host is reflected in a redirect or in the body (e.g. password reset link)
        if r.status_code in [301, 302, 307, 308] and malicious_host in r.headers.get("Location", ""):
            findings.append({
                "severity": "High",
                "issue": "Host Header Injection leads to Open Redirect.",
                "detail": f"Server redirected to: {r.headers.get('Location')}"
            })
        elif malicious_host in r.text:
            findings.append({
                "severity": "High",
                "issue": "Host Header reflected in response body.",
                "detail": "Could be used for Password Reset Poisoning if links are generated dynamically."
            })
    except Exception:
        pass

    fix = (
        "# Nginx Fix: Drop requests with unrecognized Host headers\n"
        "server {\n"
        "    listen 80 default_server;\n"
        "    server_name _;\n"
        "    return 444; # Drop connection\n"
        "}\n\n"
        "server {\n"
        "    listen 80;\n"
        "    server_name my-legit-app.com;\n"
        "    # ... legit routing ...\n"
        "}"
    )

    return {"target": target, "findings": findings, "fix": fix}

# ─────────────────────────────────────────────────────────────────────────────
# 3. INSECURE DESERIALIZATION AUDITOR
# ─────────────────────────────────────────────────────────────────────────────

DESERIALIZATION_PATTERNS = [
    (re.compile(r'pickle\.loads?\('), "Python pickle deserialization (RCE risk)."),
    (re.compile(r'yaml\.load\('), "Python PyYAML insecure load() (Use safe_load)."),
    (re.compile(r'unserialize\s*\('), "PHP unserialize() without options (RCE / Object Injection)."),
    (re.compile(r'serialize\.unserialize\('), "Node.js node-serialize package deserialization (RCE)."),
]

def audit_deserialization(code_snippet):
    findings = []
    lines = code_snippet.splitlines()

    for i, line in enumerate(lines):
        for pattern, description in DESERIALIZATION_PATTERNS:
            if pattern.search(line):
                findings.append({
                    "line": i + 1,
                    "code": line.strip(),
                    "issue": description,
                    "severity": "Critical"
                })

    fix = (
        "// Fix: Never deserialize untrusted objects. Use pure data structures like JSON.\n"
        "// Python:\n"
        "import json\n"
        "data = json.loads(user_input)\n\n"
        "// If serialization is strictly required, use cryptographic signing (HMAC)\n"
        "// to ensure the payload was not tampered with by the user."
    )

    return {"lines_scanned": len(lines), "findings": findings, "fix": fix}

# ─────────────────────────────────────────────────────────────────────────────
# 4. CLICKJACKING SIMULATOR (X-FRAME-OPTIONS)
# ─────────────────────────────────────────────────────────────────────────────

def audit_clickjacking(target):
    if not target.startswith("http"):
        target = "http://" + target

    findings = []
    try:
        r = requests.get(target, timeout=5)
        xfo = r.headers.get("X-Frame-Options", "").upper()
        csp = r.headers.get("Content-Security-Policy", "").lower()

        is_protected = False
        if "DENY" in xfo or "SAMEORIGIN" in xfo:
            is_protected = True
        if "frame-ancestors" in csp and ("'none'" in csp or "'self'" in csp):
            is_protected = True

        if not is_protected:
            findings.append({
                "severity": "Medium",
                "issue": "Missing framing protection (Clickjacking Vulnerability).",
                "detail": f"XFO: {xfo or 'Missing'} | CSP frame-ancestors: {'Missing' if 'frame-ancestors' not in csp else 'Present but weak'}"
            })
    except Exception:
        pass

    fix = (
        "# Nginx Fix: Add X-Frame-Options & CSP Headers\n"
        "add_header X-Frame-Options \"SAMEORIGIN\" always;\n"
        "add_header Content-Security-Policy \"frame-ancestors 'self';\" always;"
    )

    return {"target": target, "findings": findings, "fix": fix}

# ─────────────────────────────────────────────────────────────────────────────
# 5. SSRF CLOUD METADATA AUDITOR
# ─────────────────────────────────────────────────────────────────────────────

def audit_cloud_metadata_ssrf(target_endpoint):
    if not target_endpoint.startswith("http"):
        target_endpoint = "http://" + target_endpoint

    findings = []
    # 169.254.169.254 is the standard AWS/GCP/Azure link-local metadata IP
    payload_url = "http://169.254.169.254/latest/meta-data/"
    
    try:
        # We test if passing the metadata IP as a param causes the server to fetch and reflect it.
        # This assumes the endpoint takes a ?url= or similar parameter.
        r = requests.get(f"{target_endpoint}?url={payload_url}&fetch={payload_url}&target={payload_url}", timeout=5)
        
        # Checking if AWS metadata keywords show up in the reflection
        if "ami-id" in r.text or "instance-id" in r.text or "iam/" in r.text:
            findings.append({
                "severity": "Critical",
                "issue": "Cloud Metadata SSRF Detected!",
                "detail": "The server successfully fetched and returned the AWS/Cloud metadata endpoint. IAM credentials could be stolen."
            })
    except Exception:
        pass

    fix = (
        "// Application Level Fix: Block local and private IP ranges in the fetch client\n"
        "const url = new URL(userProvidedUrl);\n"
        "if (url.hostname === '169.254.169.254' || url.hostname.startsWith('10.') || url.hostname.startsWith('192.168.')) {\n"
        "    throw new Error('SSRF Attempt Blocked!');\n"
        "}\n\n"
        "# Infrastructure Level Fix (iptables):\n"
        "# Block the web application user (e.g. www-data) from routing to 169.254.169.254\n"
        "iptables -A OUTPUT -m owner --uid-owner www-data -d 169.254.169.254 -j DROP"
    )

    return {"target": target_endpoint, "findings": findings, "fix": fix}
