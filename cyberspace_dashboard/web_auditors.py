import requests
import re
import hashlib
import base64
import time

def test_waf_and_rate_limit(target):
    """
    Tests if a target has WAF or rate-limiting active.
    """
    if not target.startswith("http"):
        target = "http://" + target

    results = {
        "target": target,
        "rate_limit_detected": False,
        "waf_detected": False,
        "waf_indicators": [],
        "rate_limit_indicators": [],
        "fix": {}
    }

    # 1. Rate-limit test — send 15 rapid requests
    status_codes = []
    for _ in range(15):
        try:
            r = requests.get(target, timeout=3)
            status_codes.append(r.status_code)
        except:
            status_codes.append(0)

    if 429 in status_codes:
        results["rate_limit_detected"] = True
        results["rate_limit_indicators"].append("HTTP 429 Too Many Requests triggered.")
    else:
        results["rate_limit_indicators"].append("No HTTP 429 detected after 15 rapid requests.")
        results["fix"]["rate_limit"] = {
            "express": "const rateLimit = require('express-rate-limit');\napp.use(rateLimit({ windowMs: 15*60*1000, max: 100 }));",
            "nginx": "limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;\nlimit_req zone=api burst=20 nodelay;"
        }

    # 2. WAF test — send a benign SQL payload
    try:
        r = requests.get(target + "?q=1'+OR+'1'='1", timeout=3)
        waf_headers = ["x-sucuri-id", "x-firewall", "cf-ray", "x-waf"]
        for h in waf_headers:
            if h in [k.lower() for k in r.headers.keys()]:
                results["waf_detected"] = True
                results["waf_indicators"].append(f"WAF header found: {h}")
        if r.status_code in [403, 406, 429]:
            results["waf_detected"] = True
            results["waf_indicators"].append(f"Payload blocked with HTTP {r.status_code}")
    except Exception as e:
        results["waf_indicators"].append(f"Error during WAF probe: {str(e)}")

    return results


def check_subdomain_takeover(domain):
    """
    Checks subdomains for dangling CNAME records.
    """
    common_subdomains = ["www", "dev", "staging", "api", "blog", "shop", "cdn", "mail", "app", "docs"]
    takeover_signatures = [
        "NoSuchBucket", "There is no app here", "No such app", "herokucdn.com",
        "GitHub Pages not found", "Unregistered", "You're Almost There"
    ]
    results = {"domain": domain, "vulnerable": [], "safe": []}

    for sub in common_subdomains:
        target = f"http://{sub}.{domain}"
        try:
            r = requests.get(target, timeout=3)
            for sig in takeover_signatures:
                if sig.lower() in r.text.lower():
                    results["vulnerable"].append({
                        "subdomain": f"{sub}.{domain}",
                        "reason": f"Signature found: '{sig}'",
                        "fix": f"Delete the CNAME record for {sub}.{domain} in your DNS registrar immediately."
                    })
                    break
            else:
                results["safe"].append(f"{sub}.{domain}")
        except:
            pass  # Subdomain doesn't resolve — that's fine

    return results


def analyze_csp(target):
    """
    Analyzes the Content Security Policy header of a target.
    """
    if not target.startswith("http"):
        target = "http://" + target

    try:
        r = requests.get(target, timeout=5)
        csp = r.headers.get("Content-Security-Policy", "")

        if not csp:
            return {
                "target": target,
                "csp_present": False,
                "grade": "F",
                "issues": ["No Content-Security-Policy header found."],
                "fix": "Add a CSP header. Minimum: Content-Security-Policy: default-src 'self'"
            }

        issues = []
        if "'unsafe-inline'" in csp:
            issues.append("'unsafe-inline' directive found — allows inline XSS attacks.")
        if "'unsafe-eval'" in csp:
            issues.append("'unsafe-eval' directive found — allows eval() code execution.")
        if "script-src *" in csp or "default-src *" in csp:
            issues.append("Wildcard (*) in script-src or default-src — allows scripts from any domain.")
        if "object-src" not in csp:
            issues.append("Missing 'object-src' directive — plugins (Flash, Java) not restricted.")

        grade = "A" if not issues else ("C" if len(issues) <= 2 else "F")

        return {
            "target": target,
            "csp_present": True,
            "csp_header": csp,
            "grade": grade,
            "issues": issues,
            "fix": "Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-{random}'; object-src 'none'; base-uri 'self';"
        }
    except Exception as e:
        return {"error": str(e)}


def audit_cors(target):
    """
    Tests if a target has a dangerously misconfigured CORS policy.
    """
    if not target.startswith("http"):
        target = "http://" + target

    try:
        r = requests.options(target, headers={"Origin": "http://attacker.com"}, timeout=5)
        acao = r.headers.get("Access-Control-Allow-Origin", "")
        acac = r.headers.get("Access-Control-Allow-Credentials", "")

        vulnerable = (acao == "http://attacker.com" or acao == "*") and acac.lower() == "true"

        return {
            "target": target,
            "vulnerable": vulnerable,
            "Access-Control-Allow-Origin": acao,
            "Access-Control-Allow-Credentials": acac,
            "fix": "Restrict Access-Control-Allow-Origin to an explicit whitelist. Never combine wildcard (*) with Allow-Credentials: true."
        }
    except Exception as e:
        return {"error": str(e)}


def audit_cookies(target):
    """
    Checks session cookies for missing security flags.
    """
    if not target.startswith("http"):
        target = "https://" + target

    try:
        r = requests.get(target, timeout=5)
        cookies = r.cookies
        findings = []

        for cookie in cookies:
            flags = []
            if not cookie.has_nonstandard_attr("HttpOnly"):
                flags.append("Missing HttpOnly flag — scripts can steal this cookie.")
            if not cookie.secure:
                flags.append("Missing Secure flag — cookie sent over plain HTTP.")
            if not cookie.has_nonstandard_attr("SameSite"):
                flags.append("Missing SameSite flag — vulnerable to CSRF.")
            if flags:
                findings.append({"name": cookie.name, "issues": flags})

        return {
            "target": target,
            "cookies_found": len(list(cookies)),
            "findings": findings,
            "fix": {
                "express": "app.use(session({ secret: 'x', cookie: { httpOnly: true, secure: true, sameSite: 'strict' } }));",
                "flask": "SESSION_COOKIE_HTTPONLY=True\nSESSION_COOKIE_SECURE=True\nSESSION_COOKIE_SAMESITE='Strict'"
            }
        }
    except Exception as e:
        return {"error": str(e)}


def scan_sri(target):
    """
    Scans a webpage's HTML for external scripts missing SRI integrity attributes.
    """
    if not target.startswith("http"):
        target = "http://" + target

    try:
        r = requests.get(target, timeout=5)
        html = r.text

        # Find all <script src="..."> tags
        scripts = re.findall(r'<script[^>]+src=["\']([^"\']+)["\'][^>]*>', html, re.IGNORECASE)
        findings = []

        for src in scripts:
            if src.startswith("http") and "integrity" not in html[max(0, html.find(src)-100):html.find(src)+200]:
                # Try downloading and computing SRI hash
                try:
                    res = requests.get(src, timeout=5)
                    digest = hashlib.sha384(res.content).digest()
                    sri_hash = "sha384-" + base64.b64encode(digest).decode()
                    findings.append({
                        "src": src,
                        "issue": "Missing integrity attribute",
                        "fix": f'<script src="{src}" integrity="{sri_hash}" crossorigin="anonymous"></script>'
                    })
                except:
                    findings.append({"src": src, "issue": "Missing integrity attribute (could not compute hash)", "fix": "Add integrity hash manually."})

        return {"target": target, "scripts_checked": len(scripts), "findings": findings}
    except Exception as e:
        return {"error": str(e)}
