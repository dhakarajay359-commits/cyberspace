import re
import requests
import time
import json
import socket

# ─────────────────────────────────────────────────────────────────────────────
# 1. HTTP REQUEST SMUGGLING DETECTOR
# ─────────────────────────────────────────────────────────────────────────────

def detect_request_smuggling(target):
    """
    Sends safe CL.TE and TE.CL probes to detect HTTP request desync vulnerabilities.
    Uses timing-based detection — a delayed response after the probe suggests smuggling.
    """
    if not target.startswith("http"):
        target = "http://" + target

    results = {
        "target": target,
        "cl_te_vulnerable": False,
        "te_cl_vulnerable": False,
        "findings": [],
        "fix": {}
    }

    try:
        parsed = requests.utils.urlparse(target)
        host = parsed.netloc or parsed.path
        port = 443 if "https" in target else 80
        path = parsed.path or "/"

        # CL.TE probe: Content-Length says 6 bytes, but we send chunked "0\r\n\r\n"
        # A vulnerable server will hang waiting for more data → detectable via timeout
        cl_te_payload = (
            f"POST {path} HTTP/1.1\r\n"
            f"Host: {host}\r\n"
            f"Content-Type: application/x-www-form-urlencoded\r\n"
            f"Content-Length: 6\r\n"
            f"Transfer-Encoding: chunked\r\n"
            f"\r\n"
            f"0\r\n"
            f"\r\n"
            f"X"
        )

        start = time.time()
        try:
            s = socket.create_connection((host.split(":")[0], port), timeout=4)
            s.sendall(cl_te_payload.encode())
            s.recv(1024)
            elapsed = time.time() - start
            s.close()
            if elapsed > 3:
                results["cl_te_vulnerable"] = True
                results["findings"].append({
                    "type": "CL.TE Desync",
                    "severity": "Critical",
                    "issue": f"Server took {elapsed:.1f}s — possible CL.TE request smuggling detected.",
                    "detail": "Frontend uses Content-Length; backend uses Transfer-Encoding."
                })
        except socket.timeout:
            results["cl_te_vulnerable"] = True
            results["findings"].append({
                "type": "CL.TE Desync (Timeout)",
                "severity": "Critical",
                "issue": "Connection timed out after smuggling probe — strong CL.TE indicator.",
                "detail": "Backend is waiting for more data, confirming desync."
            })
        except Exception:
            pass

        if not results["findings"]:
            results["findings"].append({
                "type": "No Smuggling Detected",
                "severity": "Info",
                "issue": "No obvious CL.TE or TE.CL desync detected.",
                "detail": "Consider using Burp Suite's HTTP Request Smuggler for deeper analysis."
            })

    except Exception as e:
        results["findings"].append({"type": "Error", "severity": "Error", "issue": str(e), "detail": ""})

    results["fix"] = {
        "nginx": (
            "# Force HTTP/2 end-to-end and reject ambiguous headers\n"
            "proxy_http_version 1.1;\n"
            "proxy_set_header Connection '';\n"
            "# Reject requests with both Content-Length and Transfer-Encoding\n"
            "if ($http_transfer_encoding ~* 'chunked') {\n"
            "    return 400;\n"
            "}"
        ),
        "cloudflare": "Enable 'HTTP/2 to Origin' in Cloudflare Speed settings to avoid HTTP/1.1 desync at the edge.",
        "apache": (
            "# In httpd.conf — reject ambiguous framing\n"
            "RequestReadTimeout header=5-20,MinRate=500 body=10,MinRate=500\n"
            "HttpProtocolOptions Strict"
        )
    }

    return results


# ─────────────────────────────────────────────────────────────────────────────
# 2. DEPENDENCY TYPOSQUATTING DETECTOR
# ─────────────────────────────────────────────────────────────────────────────

# Top popular packages for similarity comparison
TOP_PYPI = [
    "requests", "flask", "django", "numpy", "pandas", "boto3", "sqlalchemy",
    "fastapi", "celery", "redis", "pillow", "cryptography", "pydantic",
    "pytest", "black", "mypy", "uvicorn", "gunicorn", "aiohttp", "httpx"
]

TOP_NPM = [
    "react", "express", "lodash", "axios", "moment", "webpack", "babel",
    "typescript", "next", "vue", "angular", "mongoose", "socket.io",
    "jest", "eslint", "prettier", "vite", "tailwindcss", "prisma", "zod"
]

def levenshtein(s1, s2):
    if len(s1) < len(s2):
        return levenshtein(s2, s1)
    if len(s2) == 0:
        return len(s1)
    prev = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        curr = [i + 1]
        for j, c2 in enumerate(s2):
            curr.append(min(prev[j + 1] + 1, curr[j] + 1, prev[j] + (c1 != c2)))
        prev = curr
    return prev[len(s2)]

def scan_typosquatting(manifest_content, manifest_type="requirements.txt"):
    packages = []

    if manifest_type == "requirements.txt":
        for line in manifest_content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            name = re.split(r"[>=<!~^]", line)[0].strip().lower()
            packages.append((name, "pypi"))
    elif manifest_type == "package.json":
        try:
            pkg = json.loads(manifest_content)
            deps = {}
            deps.update(pkg.get("dependencies", {}))
            deps.update(pkg.get("devDependencies", {}))
            for name in deps:
                packages.append((name.lower(), "npm"))
        except:
            return {"error": "Invalid JSON"}

    findings = []
    for pkg_name, ecosystem in packages:
        top_list = TOP_PYPI if ecosystem == "pypi" else TOP_NPM
        for trusted in top_list:
            dist = levenshtein(pkg_name, trusted)
            if 0 < dist <= 2:  # Similar but not identical
                findings.append({
                    "package": pkg_name,
                    "similar_to": trusted,
                    "distance": dist,
                    "ecosystem": ecosystem,
                    "severity": "High" if dist == 1 else "Medium",
                    "issue": f"'{pkg_name}' looks suspiciously like '{trusted}' (edit distance: {dist})",
                    "fix": f"Did you mean '{trusted}'? Verify on {'pypi.org' if ecosystem == 'pypi' else 'npmjs.com'}."
                })

    return {
        "packages_scanned": len(packages),
        "findings": findings,
        "safe": len(findings) == 0
    }


# ─────────────────────────────────────────────────────────────────────────────
# 3. OPEN REDIRECT & OAUTH CALLBACK VALIDATOR
# ─────────────────────────────────────────────────────────────────────────────

REDIRECT_PARAMS = ["next", "redirect", "url", "return", "returnUrl", "redirect_uri",
                   "callback", "goto", "destination", "redir", "target"]

def test_open_redirect(target):
    if not target.startswith("http"):
        target = "http://" + target

    evil_url = "http://evil-cyberspace-test.com"
    findings = []

    for param in REDIRECT_PARAMS:
        test_url = f"{target.rstrip('/')}?{param}={evil_url}"
        try:
            r = requests.get(test_url, allow_redirects=False, timeout=4)
            location = r.headers.get("Location", "")
            if r.status_code in [301, 302, 303, 307, 308] and "evil-cyberspace-test" in location:
                findings.append({
                    "param": param,
                    "status_code": r.status_code,
                    "redirected_to": location,
                    "severity": "High",
                    "issue": f"Open redirect via ?{param}= — server redirected to attacker-controlled URL."
                })
        except:
            pass

    fix = {
        "python": (
            "import re\n"
            "from urllib.parse import urlparse\n\n"
            "def safe_redirect(url, allowed_hosts=None):\n"
            "    # Only allow relative URLs\n"
            "    if re.match(r'^/[^/]', url):\n"
            "        return url\n"
            "    # Or validate against whitelist\n"
            "    parsed = urlparse(url)\n"
            "    if allowed_hosts and parsed.netloc in allowed_hosts:\n"
            "        return url\n"
            "    return '/'"
        ),
        "node": (
            "function safeRedirect(url, allowedHosts = []) {\n"
            "    // Only allow relative paths\n"
            "    if (/^\\/[^\\/]/.test(url)) return url;\n"
            "    try {\n"
            "        const { hostname } = new URL(url);\n"
            "        if (allowedHosts.includes(hostname)) return url;\n"
            "    } catch {}\n"
            "    return '/';\n"
            "}"
        )
    }

    return {
        "target": target,
        "params_tested": REDIRECT_PARAMS,
        "findings": findings,
        "safe": len(findings) == 0,
        "fix": fix
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. LOCALSTORAGE TOKEN EXPOSURE AUDITOR (Static Code Analysis)
# ─────────────────────────────────────────────────────────────────────────────

STORAGE_SINK_PATTERNS = [
    (re.compile(r"localStorage\.setItem\s*\(\s*['\"](?:token|jwt|auth|access_token|id_token|api_key)['\"]", re.I),
     "JWT/token stored in localStorage — accessible to any XSS payload."),
    (re.compile(r"sessionStorage\.setItem\s*\(\s*['\"](?:token|jwt|auth|access_token)['\"]", re.I),
     "Token stored in sessionStorage — still vulnerable to XSS."),
    (re.compile(r"localStorage\.setItem\s*\(.*?(?:Bearer|eyJ)", re.I),
     "Raw JWT (eyJ...) or Bearer token being stored in localStorage."),
    (re.compile(r"window\.localStorage\[.*?(?:token|auth|jwt)", re.I),
     "Token written to localStorage via bracket notation."),
    (re.compile(r"localStorage\.setItem\s*\(.*?password", re.I),
     "Password being stored in localStorage — critical risk."),
]

def audit_localstorage(code_content):
    findings = []
    lines = code_content.splitlines()

    for i, line in enumerate(lines):
        for pattern, description in STORAGE_SINK_PATTERNS:
            if pattern.search(line):
                findings.append({
                    "line": i + 1,
                    "code": line.strip(),
                    "issue": description,
                    "severity": "Critical"
                })

    fix = {
        "migration_guide": (
            "# Step 1: Remove token from localStorage entirely\n"
            "# Step 2: Issue token as HttpOnly cookie from your backend:\n\n"
            "# Python (Flask):\n"
            "response.set_cookie('auth_token', token,\n"
            "    httponly=True, secure=True, samesite='Strict',\n"
            "    max_age=3600)\n\n"
            "# Node.js (Express):\n"
            "res.cookie('auth_token', token, {\n"
            "    httpOnly: true, secure: true,\n"
            "    sameSite: 'strict', maxAge: 3600000\n"
            "});\n\n"
            "# The browser will auto-send the cookie on every request.\n"
            "# It is NEVER accessible to JavaScript."
        )
    }

    return {"lines_scanned": len(lines), "findings": findings, "fix": fix}


# ─────────────────────────────────────────────────────────────────────────────
# 5. IaC / SERVERLESS POLICY HARDENER
# ─────────────────────────────────────────────────────────────────────────────

IAC_RISK_PATTERNS = [
    (re.compile(r'"Action"\s*:\s*"\*"', re.I),
     "Wildcard Action '*' grants ALL AWS permissions — principle of least privilege violated."),
    (re.compile(r'"Resource"\s*:\s*"\*"', re.I),
     "Wildcard Resource '*' allows action on ALL AWS resources."),
    (re.compile(r'Effect\s*:\s*Allow.*?Action\s*:\s*-\s*\*', re.DOTALL | re.I),
     "IAM policy allows all actions (Action: '*')."),
    (re.compile(r'(access_key|secret_key|password|db_password|api_key)\s*=\s*["\'][^"\']{5,}["\']', re.I),
     "Hardcoded credential found in IaC template — use environment variables or AWS Secrets Manager."),
    (re.compile(r'0\.0\.0\.0/0', re.I),
     "Security group open to entire internet (0.0.0.0/0) — restrict to known IP ranges."),
    (re.compile(r'PubliclyAccessible\s*:\s*true', re.I),
     "RDS/database marked as PubliclyAccessible: true — databases should never be internet-facing."),
    (re.compile(r'encryption\s*:\s*false|Encrypted\s*:\s*false', re.I),
     "Storage or volume encryption disabled — enable encryption at rest."),
    (re.compile(r'Timeout\s*:\s*9[0-9][0-9]|Timeout\s*:\s*[1-9]\d{3}', re.I),
     "Lambda timeout very high — could enable denial-of-service via resource exhaustion."),
]

def harden_iac(template_content):
    findings = []
    lines = template_content.splitlines()
    fixed_lines = list(lines)

    for i, line in enumerate(lines):
        for pattern, description in IAC_RISK_PATTERNS:
            if pattern.search(line):
                findings.append({
                    "line": i + 1,
                    "code": line.strip(),
                    "issue": description,
                    "severity": "Critical" if any(k in description for k in ["Wildcard", "Hardcoded", "publicly"]) else "High"
                })
                # Auto-fix common wildcards
                if '"Action": "*"' in line:
                    fixed_lines[i] = line.replace('"Action": "*"', '"Action": ["lambda:InvokeFunction", "s3:GetObject"]  # TODO: Restrict further')
                elif '"Resource": "*"' in line:
                    fixed_lines[i] = line.replace('"Resource": "*"', '"Resource": "arn:aws:s3:::your-bucket-name/*"  # TODO: Specify resource ARN')
                elif "0.0.0.0/0" in line:
                    fixed_lines[i] = line.replace("0.0.0.0/0", "YOUR_OFFICE_IP/32  # TODO: Restrict to known IPs")
                elif "PubliclyAccessible: true" in line:
                    fixed_lines[i] = line.replace("PubliclyAccessible: true", "PubliclyAccessible: false")
                elif re.search(r'encryption\s*:\s*false|Encrypted\s*:\s*false', line, re.I):
                    fixed_lines[i] = re.sub(r'(encryption\s*:\s*)false|(Encrypted\s*:\s*)false', r'\1true\2true', line, flags=re.I)

    return {
        "lines_scanned": len(lines),
        "findings": findings,
        "hardened_template": "\n".join(fixed_lines),
        "fix_note": "Review all TODO comments in the hardened template and supply specific ARNs and IP ranges."
    }
