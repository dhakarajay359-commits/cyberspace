import requests
import re
import json
import ipaddress

# ─────────────────────────────────────────────────────────────────────────────
# 1. WEB HOSTING MISCONFIGURATION & DIRECTORY BROWSING AUDITOR
# ─────────────────────────────────────────────────────────────────────────────

DIRECTORY_LISTING_SIGNATURES = [
    "Index of /", "Directory listing for", "Parent Directory",
    "<title>Index of", "[To Parent Directory]"
]

SERVER_LEAK_PATHS = [
    "/server-status", "/server-info", "/.htaccess",
    "/web.config", "/crossdomain.xml", "/elmah.axd",
    "/phpinfo.php", "/info.php", "/test.php"
]

def audit_directory_browsing(target):
    if not target.startswith("http"):
        target = "http://" + target

    results = {
        "target": target,
        "directory_listing": [],
        "server_leaks": [],
        "server_header": None,
        "fix": {}
    }

    # Check common directories for listing
    test_dirs = ["/images/", "/uploads/", "/static/", "/assets/", "/files/", "/backup/"]
    for d in test_dirs:
        try:
            r = requests.get(target.rstrip("/") + d, timeout=4, allow_redirects=True)
            for sig in DIRECTORY_LISTING_SIGNATURES:
                if sig in r.text:
                    results["directory_listing"].append({
                        "path": d,
                        "status": "EXPOSED",
                        "issue": f"Directory listing enabled at {d}"
                    })
                    break
        except:
            pass

    # Check server status and info leak pages
    for path in SERVER_LEAK_PATHS:
        try:
            r = requests.get(target.rstrip("/") + path, timeout=4)
            if r.status_code == 200 and len(r.text) > 100:
                results["server_leaks"].append({
                    "path": path,
                    "status": r.status_code,
                    "issue": f"Sensitive page accessible: {path}"
                })
        except:
            pass

    # Check server header for version disclosure
    try:
        r = requests.head(target, timeout=4)
        server = r.headers.get("Server", "")
        if server:
            results["server_header"] = server
    except:
        pass

    results["fix"] = {
        "nginx": "# Disable directory listing globally\nautoindex off;\n\n# Block sensitive files\nlocation ~* /(server-status|phpinfo\\.php|web\\.config) {\n    deny all;\n    return 404;\n}",
        "apache": "# Disable directory browsing\nOptions -Indexes\n\n# Block sensitive paths\n<FilesMatch \"(phpinfo\\.php|web\\.config|\\.htaccess)\">\n    Require all denied\n</FilesMatch>"
    }

    return results


# ─────────────────────────────────────────────────────────────────────────────
# 2. FORM & INPUT VALIDATION PAYLOAD SIMULATOR (XSS / SQLi)
# ─────────────────────────────────────────────────────────────────────────────

XSS_PAYLOADS = [
    "<script>alert(1)</script>",
    "<h1>xss-test-cyberspace</h1>",
    "'\"><img src=x onerror=alert(1)>",
]

SQLI_PAYLOADS = [
    "' OR '1'='1",
    "' OR 1=1 --",
    "1; DROP TABLE users--",
    "' UNION SELECT NULL,NULL,NULL--"
]

DB_ERROR_SIGNATURES = [
    "sql syntax", "mysql_fetch", "ORA-", "sqlite3.OperationalError",
    "pg_query", "unclosed quotation", "syntax error", "SQLSTATE"
]

def simulate_input_payloads(target, param="q"):
    if not target.startswith("http"):
        target = "http://" + target

    results = {
        "target": target,
        "xss_reflected": [],
        "sqli_errors": [],
        "fix": {}
    }

    for payload in XSS_PAYLOADS:
        try:
            r = requests.get(target, params={param: payload}, timeout=4)
            if payload in r.text or "xss-test-cyberspace" in r.text:
                results["xss_reflected"].append({
                    "payload": payload,
                    "issue": "Payload reflected in response — XSS possible",
                    "severity": "Critical"
                })
        except:
            pass

    for payload in SQLI_PAYLOADS:
        try:
            r = requests.get(target, params={param: payload}, timeout=4)
            for sig in DB_ERROR_SIGNATURES:
                if sig.lower() in r.text.lower():
                    results["sqli_errors"].append({
                        "payload": payload,
                        "error_signature": sig,
                        "issue": "DB error leaked — SQL injection likely",
                        "severity": "Critical"
                    })
                    break
        except:
            pass

    results["fix"] = {
        "zod": "import { z } from 'zod';\nconst schema = z.object({ q: z.string().max(200).regex(/^[a-zA-Z0-9 ]+$/) });\nconst parsed = schema.parse(req.body);",
        "marshmallow": "from marshmallow import Schema, fields, validate\nclass InputSchema(Schema):\n    q = fields.Str(required=True, validate=validate.Length(max=200))\nresult = InputSchema().load(request.args)",
        "joi": "const Joi = require('joi');\nconst schema = Joi.object({ q: Joi.string().alphanum().max(200).required() });\nconst { error } = schema.validate(req.query);"
    }

    return results


# ─────────────────────────────────────────────────────────────────────────────
# 3. SSRF WEBHOOK VALIDATOR (Static Code Analysis)
# ─────────────────────────────────────────────────────────────────────────────

SSRF_SINK_PATTERNS = [
    (re.compile(r"requests\.get\s*\(\s*(?:request|user_url|url|webhook|target)", re.I), "requests.get() with user-controlled URL"),
    (re.compile(r"axios\.get\s*\(\s*(?:req\.|body\.|query\.)", re.I), "axios.get() with user-controlled URL"),
    (re.compile(r"fetch\s*\(\s*(?:req\.|body\.|query\.|url)", re.I), "fetch() with user-controlled URL"),
    (re.compile(r"urllib\.request\.urlopen", re.I), "urllib.request.urlopen() — validate URL before calling"),
    (re.compile(r"http\.get\s*\(\s*(?:req\.|body\.|query\.)", re.I), "Node http.get() with user-controlled URL"),
    (re.compile(r"open\s*\(.*http", re.I), "File open with HTTP URL"),
]

PRIVATE_IP_BLOCKS = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
    ipaddress.ip_network("169.254.0.0/16"),
]

def validate_ssrf_code(code_snippet):
    findings = []
    lines = code_snippet.splitlines()

    for i, line in enumerate(lines):
        for pattern, name in SSRF_SINK_PATTERNS:
            if pattern.search(line):
                findings.append({
                    "line": i + 1,
                    "code": line.strip(),
                    "issue": name,
                    "severity": "High",
                })

    fix = {
        "python": """import ipaddress
import socket
from urllib.parse import urlparse

PRIVATE_RANGES = [
    ipaddress.ip_network("10.0.0.0/8"),
    ipaddress.ip_network("172.16.0.0/12"),
    ipaddress.ip_network("192.168.0.0/16"),
    ipaddress.ip_network("127.0.0.0/8"),
]

def is_ssrf_safe(url: str) -> bool:
    host = urlparse(url).hostname
    if not host:
        return False
    ip = ipaddress.ip_address(socket.gethostbyname(host))
    return not any(ip in block for block in PRIVATE_RANGES)

# Usage: only fetch if safe
if is_ssrf_safe(user_url):
    response = requests.get(user_url, timeout=5)""",
        "node": """const dns = require('dns').promises;
const ipRangeCheck = require('ip-range-check');

const BLOCKED = ['10.0.0.0/8','172.16.0.0/12','192.168.0.0/16','127.0.0.0/8'];

async function isSsrfSafe(url) {
  const { hostname } = new URL(url);
  const { address } = await dns.lookup(hostname);
  return !ipRangeCheck(address, BLOCKED);
}"""
    }

    return {"findings": findings, "fix": fix}


# ─────────────────────────────────────────────────────────────────────────────
# 4. BOLA / IDOR STRUCTURAL LINTER
# ─────────────────────────────────────────────────────────────────────────────

BOLA_PATTERNS = [
    (re.compile(r"(?:find|get|select|query).*?(?:id|user_id|record_id)\s*[:=]\s*(?:req|request|params|query|body)\.", re.I),
     "Direct object lookup using request-supplied ID — no session check detected."),
    (re.compile(r"db\.\w+\.find(?:One|ById|All)?\s*\(\s*(?:req|request|params|query|body)\.", re.I),
     "Database query using unvalidated request parameter."),
    (re.compile(r"WHERE\s+id\s*=\s*['\"]?\$?\{?(?:req|params|query|body)", re.I),
     "SQL WHERE clause using raw request ID — no authorization guard."),
    (re.compile(r"Model\.objects\.get\s*\(.*?pk\s*=\s*(?:request|req)\.", re.I),
     "Django ORM get() using request pk — missing ownership check."),
]

def lint_bola(code_snippet):
    findings = []
    lines = code_snippet.splitlines()

    for i, line in enumerate(lines):
        for pattern, description in BOLA_PATTERNS:
            if pattern.search(line):
                findings.append({
                    "line": i + 1,
                    "code": line.strip(),
                    "issue": description,
                    "severity": "Critical"
                })

    fix = {
        "node_express": """// Authorization middleware — bind resource to session owner
async function ownedResource(req, res, next) {
  const resource = await Resource.findById(req.params.id);
  if (!resource || resource.ownerId.toString() !== req.user.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  req.resource = resource;
  next();
}
// Route: GET /api/resource/:id
router.get('/:id', authenticate, ownedResource, (req, res) => {
  res.json(req.resource);
});""",
        "python_django": """# Django — enforce object-level permissions
from django.http import Http404

def get_owned_object(model, pk, user):
    try:
        obj = model.objects.get(pk=pk, owner=user)
    except model.DoesNotExist:
        raise Http404("Resource not found or access denied.")
    return obj

# Usage in view
record = get_owned_object(MyModel, request.GET['id'], request.user)"""
    }

    return {"findings": findings, "fix": fix}


# ─────────────────────────────────────────────────────────────────────────────
# 5. SBOM GENERATOR (CycloneDX-style)
# ─────────────────────────────────────────────────────────────────────────────

def generate_sbom(manifest_content, manifest_type="requirements.txt"):
    """
    Parses a manifest file and generates a CycloneDX-style SBOM JSON.
    """
    components = []

    if manifest_type == "requirements.txt":
        for line in manifest_content.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = re.split(r"[>=<!~^]+", line, maxsplit=1)
            name = parts[0].strip()
            version = parts[1].strip() if len(parts) > 1 else "unspecified"
            components.append({
                "type": "library",
                "name": name,
                "version": version,
                "purl": f"pkg:pypi/{name.lower()}@{version}",
                "licenses": ["Unknown — check PyPI"],
                "ecosystem": "PyPI"
            })

    elif manifest_type == "package.json":
        try:
            pkg = json.loads(manifest_content)
            all_deps = {}
            all_deps.update(pkg.get("dependencies", {}))
            all_deps.update(pkg.get("devDependencies", {}))
            for name, version in all_deps.items():
                clean_version = version.lstrip("^~>=")
                components.append({
                    "type": "library",
                    "name": name,
                    "version": clean_version,
                    "purl": f"pkg:npm/{name}@{clean_version}",
                    "licenses": ["Unknown — check npmjs.com"],
                    "ecosystem": "npm"
                })
        except json.JSONDecodeError:
            return {"error": "Invalid JSON in package.json"}

    sbom = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.4",
        "version": 1,
        "metadata": {
            "timestamp": "2026-07-16T00:00:00Z",
            "tools": [{"vendor": "Cyberspace", "name": "SBOM Generator", "version": "1.0"}]
        },
        "components": components,
        "summary": {
            "total_components": len(components),
            "unspecified_versions": sum(1 for c in components if c["version"] == "unspecified"),
            "ecosystems": list(set(c["ecosystem"] for c in components))
        }
    }

    return sbom
