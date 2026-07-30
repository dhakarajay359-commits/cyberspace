import re
import hashlib
import base64

# ─────────────────────────────────────────────────────────────────────────────
# LLM PROMPT INJECTION GUARD
# ─────────────────────────────────────────────────────────────────────────────
PROMPT_INJECTION_PATTERNS = [
    (re.compile(r"ignore\s+(previous|all|prior|above)\s+(instructions?|rules?|prompts?)", re.I), "Ignore override attempt"),
    (re.compile(r"you\s+are\s+now\s+(?:a|an|the)\s+\w+", re.I), "Role override attempt"),
    (re.compile(r"(reveal|show|print|output|display)\s+(your\s+)?(system\s+)?prompt", re.I), "System prompt exfil attempt"),
    (re.compile(r"forget\s+(everything|all)\s+(above|before|prior)", re.I), "Memory wipe attempt"),
    (re.compile(r"(jailbreak|DAN|developer\s+mode|act\s+as)", re.I), "Known jailbreak pattern"),
    (re.compile(r"simulate\s+(being|a|an)\s+", re.I), "Persona simulation attempt"),
    (re.compile(r"bypass\s+(safety|filter|guard|content\s+policy)", re.I), "Safety bypass attempt"),
]

def scan_prompt_injection(text):
    findings = []
    for pattern, name in PROMPT_INJECTION_PATTERNS:
        if pattern.search(text):
            findings.append({
                "type": name,
                "severity": "Critical",
                "recommendation": "Sanitize this input with a classifier before passing to the LLM."
            })

    fix_template = '''# Dual-LLM Guard Pattern (Python)
SYSTEM_DELIMITER = "<<<SYSTEM>>>"
USER_DELIMITER = "<<<USER>>>"

def safe_prompt(system_prompt, user_input):
    """Wraps user input to prevent injection into system context."""
    return f"{SYSTEM_DELIMITER}\\n{system_prompt}\\n{USER_DELIMITER}\\n{user_input}"

# Pre-classifier (using a smaller model to screen inputs)
def classify_input(text):
    # Call a lightweight classifier here (e.g., Perspective API or a fine-tuned model)
    # Returns True if input is safe
    return True
'''

    return {
        "input_length": len(text),
        "findings": findings,
        "safe": len(findings) == 0,
        "fix_template": fix_template
    }


# ─────────────────────────────────────────────────────────────────────────────
# DOM-XSS STATIC AUDITOR
# ─────────────────────────────────────────────────────────────────────────────
DOM_SINKS = [
    (re.compile(r"\.innerHTML\s*=\s*[^\"';]+(?:location|search|hash|referrer|cookie)", re.I), "innerHTML sink with user-controlled source"),
    (re.compile(r"document\.write\s*\(", re.I), "document.write() usage"),
    (re.compile(r"eval\s*\(", re.I), "eval() usage"),
    (re.compile(r"setTimeout\s*\([^,)]*(?:location|search|hash)", re.I), "setTimeout with dynamic code"),
    (re.compile(r"\.src\s*=\s*[^\"';]*(?:location|search|hash)", re.I), "Dynamic src assignment from user input"),
    (re.compile(r"\.outerHTML\s*=", re.I), "outerHTML sink"),
]

def scan_dom_xss(js_content):
    findings = []
    lines = js_content.splitlines()

    for i, line in enumerate(lines):
        for pattern, name in DOM_SINKS:
            if pattern.search(line):
                findings.append({
                    "line": i + 1,
                    "code": line.strip(),
                    "issue": name,
                    "severity": "High",
                    "fix": "Use element.textContent instead of innerHTML. Avoid eval() and document.write()."
                })

    return {
        "lines_scanned": len(lines),
        "findings": findings
    }


# ─────────────────────────────────────────────────────────────────────────────
# GIT PRE-COMMIT HOOK GENERATOR
# ─────────────────────────────────────────────────────────────────────────────
def generate_pre_commit_hook():
    hook = r"""#!/bin/sh
# Cyberspace - Pre-Commit Secret Shield
# Abort commit if secrets are detected

echo "[Cyberspace] Running secret scan on staged files..."

STAGED=$(git diff --cached --name-only)

SECRET_PATTERNS=(
  "AKIA[0-9A-Z]{16}"
  "AIza[0-9A-Za-z\-_]{35}"
  "gh[pousr]_[a-zA-Z0-9]{36}"
  "-----BEGIN (RSA|OPENSSH|EC) PRIVATE KEY-----"
  "(password|secret|token|api_key)\s*[:=]\s*['\"][^'\"]{8,}['\"]"
  "mongodb\+srv://[^:]+:[^@]+@"
)

for FILE in $STAGED; do
  for PATTERN in "${SECRET_PATTERNS[@]}"; do
    if git show ":$FILE" 2>/dev/null | grep -qE "$PATTERN"; then
      echo ""
      echo "  [BLOCKED] Possible secret found in: $FILE"
      echo "  Pattern matched: $PATTERN"
      echo "  Use environment variables or a Secret Manager instead."
      echo ""
      exit 1
    fi
  done
done

echo "[Cyberspace] No secrets detected. Commit approved."
exit 0
"""
    return {
        "filename": ".git/hooks/pre-commit",
        "content": hook,
        "instructions": [
            "Save this file to .git/hooks/pre-commit in your project root.",
            "Run: chmod +x .git/hooks/pre-commit",
            "Now every git commit will be scanned before it leaves your machine!"
        ]
    }


# ─────────────────────────────────────────────────────────────────────────────
# SECURITY.TXT VALIDATOR & GENERATOR
# ─────────────────────────────────────────────────────────────────────────────
def check_security_txt(domain):
    import requests as req
    urls = [f"https://{domain}/.well-known/security.txt", f"http://{domain}/security.txt"]
    for url in urls:
        try:
            r = req.get(url, timeout=4)
            if r.status_code == 200 and "contact:" in r.text.lower():
                return {"found": True, "url": url, "content": r.text[:800]}
        except:
            pass
    return {
        "found": False,
        "fix": "Create a security.txt file at /.well-known/security.txt",
        "template": """Contact: mailto:security@yourdomain.com
Expires: 2026-12-31T23:59:00.000Z
Preferred-Languages: en
Policy: https://yourdomain.com/security-policy
Canonical: https://yourdomain.com/.well-known/security.txt"""
    }


# ─────────────────────────────────────────────────────────────────────────────
# ASVS CHECKLIST GENERATOR
# ─────────────────────────────────────────────────────────────────────────────
ASVS_CHECKS = {
    "ecommerce": [
        {"id": "ASVS-2.1.1", "category": "Authentication", "check": "Passwords must be minimum 12 characters.", "status": "pending"},
        {"id": "ASVS-2.1.7", "category": "Authentication", "check": "Passwords checked against breached password lists (e.g., HaveIBeenPwned).", "status": "pending"},
        {"id": "ASVS-2.7.2", "category": "MFA", "check": "Multi-factor authentication (MFA) is enforced for all admin accounts.", "status": "pending"},
        {"id": "ASVS-3.2.1", "category": "Session", "check": "Session tokens are at least 64 bits of entropy.", "status": "pending"},
        {"id": "ASVS-3.3.1", "category": "Session", "check": "Sessions expire after 30 minutes of inactivity.", "status": "pending"},
        {"id": "ASVS-9.1.1", "category": "Payments", "check": "TLS 1.2+ enforced for all payment communication.", "status": "pending"},
        {"id": "ASVS-13.2.1", "category": "API", "check": "All API endpoints require authorization checks.", "status": "pending"},
    ],
    "api": [
        {"id": "ASVS-13.1.1", "category": "API", "check": "API schema validation is enforced on all inputs.", "status": "pending"},
        {"id": "ASVS-13.2.2", "category": "API", "check": "HTTP methods are restricted (no unused DELETE/PUT).", "status": "pending"},
        {"id": "ASVS-4.1.1", "category": "Authorization", "check": "BOLA/IDOR: Object-level authorization checked on every request.", "status": "pending"},
        {"id": "ASVS-5.2.1", "category": "Input", "check": "All inputs are validated against an allowlist.", "status": "pending"},
    ],
    "general": [
        {"id": "ASVS-1.4.1", "category": "Architecture", "check": "Principle of least privilege applied to all service accounts.", "status": "pending"},
        {"id": "ASVS-7.1.1", "category": "Logging", "check": "Security events (login, failed auth) are logged.", "status": "pending"},
        {"id": "ASVS-8.2.1", "category": "Data", "check": "Sensitive data is not stored in localStorage or session cookies.", "status": "pending"},
        {"id": "ASVS-14.2.1", "category": "Dependencies", "check": "All third-party libraries are pinned to specific versions.", "status": "pending"},
    ]
}

def get_asvs_checklist(arch_type="general"):
    base = ASVS_CHECKS.get("general", [])
    extra = ASVS_CHECKS.get(arch_type, [])
    return {"arch_type": arch_type, "checklist": base + extra}
