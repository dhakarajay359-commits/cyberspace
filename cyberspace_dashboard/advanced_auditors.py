import re
import requests
import json

# ─────────────────────────────────────────────────────────────────────────────
# 1. PROTOTYPE POLLUTION AUDITOR (Static Code Scan)
# ─────────────────────────────────────────────────────────────────────────────

POLLUTION_PATTERNS = [
    (re.compile(r'\[.*?\]\s*=\s*', re.I), "Possible arbitrary property assignment (check bracket notation)."),
    (re.compile(r'Object\.assign\s*\(\s*\{\}\s*,', re.I), "Object.assign() deep merge — ensure user input is sanitized before merging."),
    (re.compile(r'\.__(proto|defineGetter|defineSetter)__', re.I), "Direct access to __proto__ or legacy prototype methods."),
    (re.compile(r'constructor\.prototype', re.I), "Direct access to constructor.prototype."),
    (re.compile(r'JSON\.parse\s*\(', re.I), "JSON.parse() used without a reviver function to sanitize prototypes."),
]

def audit_prototype_pollution(code_snippet):
    findings = []
    lines = code_snippet.splitlines()

    for i, line in enumerate(lines):
        for pattern, description in POLLUTION_PATTERNS:
            if pattern.search(line):
                findings.append({
                    "line": i + 1,
                    "code": line.strip(),
                    "issue": description,
                    "severity": "High" if "__proto__" in line or "constructor.prototype" in line else "Medium"
                })

    fix = (
        "// Fix 1: Use Object.create(null) for prototype-less objects\n"
        "const safeObj = Object.create(null);\n\n"
        "// Fix 2: Freeze the prototype before merging\n"
        "Object.freeze(Object.prototype);\n\n"
        "// Fix 3: Use a safe merge library like 'lodash' (v4.17.12+) or 'deepmerge' with prototype checks."
    )

    return {"lines_scanned": len(lines), "findings": findings, "fix": fix}


# ─────────────────────────────────────────────────────────────────────────────
# 2. GRAPHQL INTROSPECTION AUDITOR
# ─────────────────────────────────────────────────────────────────────────────

def audit_graphql_introspection(target):
    if not target.startswith("http"):
        target = "http://" + target
    
    findings = []
    
    introspection_query = {
        "query": "\n    query IntrospectionQuery {\n      __schema {\n        queryType { name }\n        mutationType { name }\n        types {\n          ...FullType\n        }\n      }\n    }\n\n    fragment FullType on __Type {\n      kind\n      name\n      fields(includeDeprecated: true) {\n        name\n      }\n    }\n  "
    }

    try:
        r = requests.post(target, json=introspection_query, timeout=5)
        if r.status_code == 200 and "__schema" in r.text:
            findings.append({
                "severity": "High",
                "issue": "GraphQL Introspection is enabled.",
                "detail": "Attackers can download your entire database schema and API map."
            })
    except Exception as e:
        pass

    fix = (
        "// Apollo Server v3/v4: Disable introspection in production\n"
        "const server = new ApolloServer({\n"
        "  typeDefs,\n"
        "  resolvers,\n"
        "  introspection: process.env.NODE_ENV !== 'production'\n"
        "});\n\n"
        "// Also consider using graphql-depth-limit to prevent nested DoS attacks."
    )

    return {"target": target, "findings": findings, "fix": fix}


# ─────────────────────────────────────────────────────────────────────────────
# 3. SERVER-SIDE TEMPLATE INJECTION (SSTI) SCANNER
# ─────────────────────────────────────────────────────────────────────────────

SSTI_PAYLOADS = {
    "Jinja2/Twig": "{{7*7}}",
    "EJS/Pug": "#{7*7}",
    "Spring/Thymeleaf": "${7*7}",
    "Freemarker": "${7*7}"
}

def audit_ssti(target, param="q"):
    if not target.startswith("http"):
        target = "http://" + target

    findings = []

    for engine, payload in SSTI_PAYLOADS.items():
        try:
            r = requests.get(target, params={param: payload}, timeout=5)
            if "49" in r.text:
                findings.append({
                    "severity": "Critical",
                    "issue": f"SSTI Detected! Server evaluated {payload} as 49.",
                    "detail": f"Likely vulnerable engine: {engine}. Attacker can achieve Remote Code Execution (RCE)."
                })
        except:
            pass

    fix = (
        "# Python (Jinja2) Fix: Pass variables in context, NEVER concatenate string templates\n"
        "# BAD:\n"
        "# template = Template('Hello ' + request.args.get('name'))\n"
        "# return template.render()\n\n"
        "# GOOD:\n"
        "# template = Template('Hello {{ name }}')\n"
        "# return template.render(name=request.args.get('name'))"
    )

    return {"target": target, "findings": findings, "fix": fix}


# ─────────────────────────────────────────────────────────────────────────────
# 4. EXCESSIVE DATA EXPOSURE SCANNER
# ─────────────────────────────────────────────────────────────────────────────

EXPOSURE_PATTERNS = [
    (re.compile(r'(\$2[ayb]\$[0-9]{2}\$[A-Za-z0-9\.\/]{53})', re.I), "bcrypt password hash"),
    (re.compile(r'(?i)"?(password|passwd|pwd)"?\s*:\s*"[^"]+"'), "Plaintext password field"),
    (re.compile(r'[0-9]{3}-[0-9]{2}-[0-9]{4}'), "Social Security Number (SSN)"),
    (re.compile(r'(?i)"?(secret|token|api_key|access_token)"?\s*:\s*"[^"]+"'), "Secret API Key or Token"),
    (re.compile(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'), "Email address (check if intended to be public)"),
]

def audit_data_exposure(json_payload):
    findings = []
    
    for pattern, description in EXPOSURE_PATTERNS:
        matches = pattern.findall(json_payload)
        if matches:
            findings.append({
                "severity": "High",
                "issue": f"Exposed Data: {description}",
                "detail": f"Found {len(matches)} occurrence(s). API should not send this to the frontend."
            })

    fix = (
        "// Fix: Use Data Transfer Objects (DTOs) or field selection\n"
        "// BAD (Express.js):\n"
        "// res.json(await User.findById(req.params.id));\n\n"
        "// GOOD (Select only safe fields):\n"
        "// const user = await User.findById(req.params.id).select('username publicProfile -password');\n"
        "// res.json(user);"
    )

    return {"findings": findings, "fix": fix}


# ─────────────────────────────────────────────────────────────────────────────
# 5. CSP REPORTING INTEGRATOR
# ─────────────────────────────────────────────────────────────────────────────

def get_csp_reporting_setup():
    return {
        "status": "Ready",
        "report_url": "https://api.cyberspace.local/csp-report-ingest",
        "setup_guide": (
            "1. Add the following to your CSP Header:\n"
            "   report-uri https://api.cyberspace.local/csp-report-ingest;\n\n"
            "2. Alternatively, for modern browsers (Reporting API):\n"
            "   Report-To: {\"group\":\"default\",\"max_age\":31536000,\"endpoints\":[{\"url\":\"https://api.cyberspace.local/csp-report-ingest\"}]}\n"
            "   Content-Security-Policy: ...; report-to default;\n\n"
            "3. Any violations triggered by users' browsers will be sent here automatically."
        )
    }
