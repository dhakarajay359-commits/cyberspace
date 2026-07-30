import re
import subprocess
import uuid
import threading
import json
import time
import os
import requests
import ssl
import socket
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, Response, session, redirect, url_for
import google.generativeai as genai

load_dotenv()

from parser import parse_nmap_xml
from dns_auditor import audit_dns_security
from infra_linter import lint_dockerfile
from secret_scanner import scan_for_secrets
from web_auditors import (
    test_waf_and_rate_limit, check_subdomain_takeover,
    analyze_csp, audit_cors, audit_cookies, scan_sri
)
from ai_auditors import (
    scan_prompt_injection, scan_dom_xss,
    generate_pre_commit_hook, check_security_txt, get_asvs_checklist
)
from final_auditors import (
    audit_directory_browsing, simulate_input_payloads,
    validate_ssrf_code, lint_bola, generate_sbom
)
from enterprise_auditors import (
    detect_request_smuggling, scan_typosquatting,
    test_open_redirect, audit_localstorage, harden_iac
)
from advanced_auditors import (
    audit_prototype_pollution, audit_graphql_introspection,
    audit_ssti, audit_data_exposure, get_csp_reporting_setup
)
from nessus_engine import run_nessus_scan
from cloud_auditors import (
    audit_xxe, audit_host_header, audit_deserialization,
    audit_clickjacking, audit_cloud_metadata_ssrf
)
from exotic_auditors import (
    audit_cswsh, audit_redos, audit_debug_endpoints,
    audit_css_injection, audit_dns_rebinding
)

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'cyberspace-defsoc-secret-2024')

DOMAIN_OR_IP_REGEX = r"^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$"
scan_tasks = {}

def run_scan_task(task_id, target, depth):
    if "Fast" in depth:
        flags = ["-F", "-sV"]
    elif "Full" in depth:
        flags = ["-p-", "-sV"]
    elif "Passive" in depth:
        flags = ["-sn"]
    else:
        flags = ["-F", "-sV"]
    
    command = ["nmap"] + flags + ["-oX", "-", target]
    
    try:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        xml_output = []
        
        for line in process.stdout:
            scan_tasks[task_id]['logs'].append(line)
            xml_output.append(line)
            
        process.wait()
        full_xml = "".join(xml_output)
        
        parsed_results = parse_nmap_xml(full_xml)
        
        if isinstance(parsed_results, dict) and "error" in parsed_results:
            scan_tasks[task_id]["status"] = "error"
            scan_tasks[task_id]["message"] = parsed_results["error"]
        else:
            scan_tasks[task_id]["status"] = "completed"
            scan_tasks[task_id]["results"] = parsed_results
            
    except Exception as e:
        scan_tasks[task_id]["status"] = "error"
        scan_tasks[task_id]["message"] = str(e)

def run_code_scan_task(task_id, target_path):
    try:
        scan_tasks[task_id]['logs'].append("[+] Starting Bandit (SAST) scan...\n")
        bandit_cmd = ["python", "-m", "bandit", "-r", target_path, "-f", "json"]
        bandit_res = subprocess.run(bandit_cmd, capture_output=True, text=True, timeout=120)
        
        try:
            bandit_data = json.loads(bandit_res.stdout)
            scan_tasks[task_id]['logs'].append(f"[+] Bandit finished. Found {len(bandit_data.get('results', []))} issues.\n")
        except json.JSONDecodeError:
            bandit_data = {"error": "Failed to parse Bandit output", "raw": bandit_res.stdout}

        scan_tasks[task_id]['logs'].append("[+] Starting pip-audit (SCA) scan...\n")
        pip_audit_cmd = ["python", "-m", "pip_audit", "-r", f"{target_path}/requirements.txt", "-f", "json"]
        audit_res = subprocess.run(pip_audit_cmd, capture_output=True, text=True, timeout=120)
        
        try:
            audit_data = json.loads(audit_res.stdout) if audit_res.stdout else []
            scan_tasks[task_id]['logs'].append(f"[+] pip-audit finished.\n")
        except json.JSONDecodeError:
            audit_data = {"error": "Failed to parse pip-audit output", "raw": audit_res.stdout}

        scan_tasks[task_id]["status"] = "completed"
        scan_tasks[task_id]["results"] = {
            "type": "code",
            "sast": bandit_data,
            "sca": audit_data
        }
            
    except subprocess.TimeoutExpired:
        scan_tasks[task_id]["status"] = "error"
        scan_tasks[task_id]["message"] = "Code scan timed out."
    except Exception as e:
        scan_tasks[task_id]["status"] = "error"
        scan_tasks[task_id]["message"] = str(e)

def run_nessus_task(task_id, target):
    try:
        scan_tasks[task_id]['logs'].append(f"[+] Initializing Nessus engine scan on {target}...\n")
        scan_tasks[task_id]['logs'].append(f"[+] Running Nmap Vulnerability Engine (-sV --script vulners)...\n")
        
        # Call backend engine
        report = run_nessus_scan(target)
        
        scan_tasks[task_id]['logs'].append(f"[+] Scan complete. Aggregate CVSS: {report['score']}\n")
        scan_tasks[task_id]["status"] = "completed"
        scan_tasks[task_id]["results"] = {"type": "nessus", "report": report}
    except Exception as e:
        scan_tasks[task_id]["status"] = "error"
        scan_tasks[task_id]["message"] = str(e)
        scan_tasks[task_id]["status"] = "error"
        scan_tasks[task_id]["message"] = str(e)

# ── Dynamic Template Auto-Router ────────────────────────────────────────────
# Automatically serves every .html file in /templates as a route.
# Rule: templates/foo.html  →  /foo
# Special mappings override the default slug.
_ROUTE_OVERRIDES = {
    'index':     '/dashboard',   # index.html  → /dashboard  (handled below with a proper route)
    'login':     '/',            # login.html  → / (root)
    'antigravity': '/antigravity',
}

# Templates that need special handling (skipped from auto-router)
_SKIP_AUTO_ROUTE = {'index'}  # dashboard handled manually below

def _make_view(template_filename):
    """Return a Flask view function that renders the given template."""
    def view():
        return render_template(template_filename)
    # Flask requires each view to have a unique __name__
    view.__name__ = 'auto_' + template_filename.replace('.', '_')
    return view

_templates_dir = os.path.join(os.path.dirname(__file__), 'templates')
for _fname in os.listdir(_templates_dir):
    if not _fname.endswith('.html'):
        continue
    _slug = _fname[:-5]                                  # strip ".html"
    if _slug in _SKIP_AUTO_ROUTE:                        # skip manually-handled routes
        continue
    _url  = _ROUTE_OVERRIDES.get(_slug, '/' + _slug)    # apply override or default
    app.add_url_rule(_url, endpoint='auto_' + _slug, view_func=_make_view(_fname))

# Root catch-all fallback (login page) — only registered if not already handled

# ── Auth Routes ─────────────────────────────────────────────────────────────
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3 as _sqlite3

def _get_db():
    db = _sqlite3.connect(os.path.join(os.path.dirname(__file__), 'users.db'))
    db.row_factory = _sqlite3.Row
    return db

@app.route('/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password required.'}), 400
    db = _get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    db.close()
    if user and check_password_hash(user['password_hash'], password):
        session['user'] = username
        return jsonify({'success': True, 'redirect': '/dashboard'})
    return jsonify({'success': False, 'error': 'Invalid credentials. Access denied.'})

@app.route('/auth/register', methods=['POST'])
def auth_register():
    data = request.get_json() or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()
    if not username or not password:
        return jsonify({'success': False, 'error': 'Username and password required.'}), 400
    if len(password) < 6:
        return jsonify({'success': False, 'error': 'Password must be at least 6 characters.'})
    db = _get_db()
    try:
        db.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)',
                   (username, generate_password_hash(password)))
        db.commit()
        db.close()
        return jsonify({'success': True, 'message': 'Registration successful.'})
    except _sqlite3.IntegrityError:
        db.close()
        return jsonify({'success': False, 'error': 'Username already exists.'})

@app.route('/auth/google', methods=['POST'])
def auth_google():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    if not email:
        return jsonify({'success': False, 'error': 'Email required for Google Auth.'}), 400
    
    db = _get_db()
    user = db.execute('SELECT * FROM users WHERE username = ?', (email,)).fetchone()
    
    if not user:
        try:
            db.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)',
                       (email, generate_password_hash("google_oauth_dummy_pass")))
            db.commit()
        except _sqlite3.IntegrityError:
            pass
            
    db.close()
    session['user'] = email
    return jsonify({'success': True, 'redirect': '/dashboard'})

# ── Dashboard Route (manual – needs session + user_stats) ───────────────────
@app.route('/dashboard')
def dashboard():
    if not session.get('user'):
        return redirect('/')
    db = _get_db()
    user = db.execute(
        'SELECT wins, matches_played, total_score FROM users WHERE username = ?',
        (session['user'],)
    ).fetchone()
    db.close()
    user_stats = {
        'wins':           user['wins']           if user else 0,
        'matches_played': user['matches_played'] if user else 0,
        'total_score':    user['total_score']    if user else 0,
    }
    return render_template('index.html', user_stats=user_stats)

@app.route('/auth/logout')
def logout():
    session.clear()
    return redirect('/')

# ── API Routes ───────────────────────────────────────────────────────────────

@app.route('/api/scan', methods=['POST'])
def handle_scan():
    data = request.get_json()
    target = data.get("target", "").strip()
    depth = data.get("depth", "Fast")

    if not re.match(DOMAIN_OR_IP_REGEX, target):
        return jsonify({"error": "Invalid target format."}), 400

    forbidden_targets = ["localhost", "127.0.0.1", "0.0.0.0"]
    if target in forbidden_targets:
        return jsonify({"error": "Scanning local system addresses is restricted."}), 403

    task_id = str(uuid.uuid4())
    scan_tasks[task_id] = {"status": "running", "logs": []}
    
    thread = threading.Thread(target=run_scan_task, args=(task_id, target, depth))
    thread.start()

    return jsonify({"task_id": task_id, "status": "running"})

@app.route('/api/scan/code', methods=['POST'])
def handle_code_scan():
    data = request.get_json()
    target = data.get("target", "").strip()

    if not target or target == "/":
        return jsonify({"error": "Invalid target path."}), 400

    task_id = str(uuid.uuid4())
    scan_tasks[task_id] = {"status": "running", "logs": []}
    
    thread = threading.Thread(target=run_code_scan_task, args=(task_id, target))
    thread.start()

    return jsonify({"task_id": task_id, "status": "running"})

@app.route('/api/scan/nessus', methods=['POST'])
def start_nessus_scan():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({"error": "No target specified"}), 400

    task_id = str(uuid.uuid4())
    scan_tasks[task_id] = {
        "status": "running",
        "target": target,
        "logs": [],
        "results": None
    }

    thread = threading.Thread(target=run_nessus_task, args=(task_id, target))
    thread.start()

    return jsonify({"task_id": task_id, "status": "running"})

@app.route('/api/scan/<task_id>', methods=['GET'])
def get_scan_status(task_id):
    task = scan_tasks.get(task_id)
    if not task:
        return jsonify({"error": "Task not found"}), 404
    return jsonify(task)

@app.route('/api/stream/<task_id>')
def stream_logs(task_id):
    def generate():
        last_idx = 0
        while True:
            task = scan_tasks.get(task_id)
            if not task:
                break
            logs = task.get('logs', [])
            if last_idx < len(logs):
                for line in logs[last_idx:]:
                    yield f"data: {line}\n\n"
                last_idx = len(logs)
            if task.get('status') in ['completed', 'error']:
                yield "event: end\ndata: \n\n"
                break
            time.sleep(0.5)
    return Response(generate(), mimetype='text/event-stream')

@app.route('/api/audit/headers', methods=['POST'])
def audit_headers():
    target = request.json.get('target', '')
    if not target.startswith('http'):
        target = 'http://' + target
    
    try:
        resp = requests.get(target, timeout=5)
        headers = resp.headers
        
        checks = {
            'Strict-Transport-Security': headers.get('Strict-Transport-Security'),
            'Content-Security-Policy': headers.get('Content-Security-Policy'),
            'X-Frame-Options': headers.get('X-Frame-Options'),
            'X-Content-Type-Options': headers.get('X-Content-Type-Options'),
            'Referrer-Policy': headers.get('Referrer-Policy')
        }
        
        score = 100
        missing = []
        for k, v in checks.items():
            if not v:
                score -= 20
                missing.append(k)
                
        grade = "A+" if score == 100 else "B" if score >= 80 else "C" if score >= 60 else "D" if score >= 40 else "F"
        
        return jsonify({
            "target": target,
            "grade": grade,
            "score": score,
            "checks": checks,
            "missing": missing
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/api/dns-audit', methods=['POST'])
def handle_dns_audit():
    data = request.get_json() or {}
    domain = data.get("domain", "").strip().lower()

    if not domain:
        return jsonify({"error": "Missing domain parameter."}), 400

    forbidden_domains = ["localhost", "local", "invalid", "test"]
    if any(domain.endswith(f".{ext}") or domain == ext for ext in forbidden_domains):
        return jsonify({"error": "Auditing internal or local domains is restricted."}), 403

    try:
        audit_results = audit_dns_security(domain)
        return jsonify(audit_results), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/audit/infra', methods=['POST'])
def audit_infra():
    data = request.get_json() or {}
    content = data.get("content", "")
    if not content:
        return jsonify({"error": "No content provided."}), 400
    return jsonify(lint_dockerfile(content))

@app.route('/api/audit/secrets', methods=['POST'])
def audit_secrets():
    data = request.get_json() or {}
    content = data.get("content", "")
    if not content:
        return jsonify({"error": "No content provided."}), 400
    return jsonify(scan_for_secrets(content))

@app.route('/api/audit/exposed-files', methods=['POST'])
def audit_exposed_files():
    data = request.get_json() or {}
    target = data.get("target", "").strip()
    if not target.startswith("http"):
        target = "http://" + target
    
    files_to_check = [".git/config", ".env", "backup.sql", "wp-config.php.bak"]
    results = {"target": target, "exposed": []}
    
    for f in files_to_check:
        try:
            url = f"{target.rstrip('/')}/{f}"
            r = requests.get(url, timeout=3)
            # If 200 and it looks like config/git or we just assume 200 is bad
            if r.status_code == 200 and ("<html" not in r.text.lower()[:200]):
                results["exposed"].append({"file": f, "status": "Exposed!"})
        except:
            pass
            
    return jsonify(results)

@app.route('/api/audit/ssl', methods=['POST'])
def audit_ssl():
    data = request.get_json() or {}
    domain = data.get("domain", "").strip()
    # Strip protocols
    domain = domain.replace("https://", "").replace("http://", "").split("/")[0]
    
    if not domain:
        return jsonify({"error": "Missing domain parameter."}), 400
        
    try:
        context = ssl.create_default_context()
        with socket.create_connection((domain, 443), timeout=5) as sock:
            with context.wrap_socket(sock, server_hostname=domain) as ssock:
                cipher = ssock.cipher()
                version = ssock.version()
                return jsonify({
                    "domain": domain,
                    "protocol": version,
                    "cipher": cipher[0],
                    "secure": version in ["TLSv1.2", "TLSv1.3"]
                })
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/status/<domain>.svg')
def badge(domain):
    svg = '''<svg xmlns="http://www.w3.org/2000/svg" width="200" height="20">
      <rect width="155" height="20" fill="#1e293b"/>
      <rect x="155" width="45" height="20" fill="#10B981"/>
      <text x="5" y="14" fill="#94a3b8" font-family="sans-serif" font-size="10">Secured by Cyberspace</text>
      <text x="158" y="14" fill="#fff" font-family="sans-serif" font-size="11" font-weight="bold">PASS</text>
    </svg>'''
    return Response(svg, mimetype='image/svg+xml')

# ── Batch 2 & 3: Web Auditors ─────────────────────────────────────────────

@app.route('/api/audit/waf', methods=['POST'])
def audit_waf():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(test_waf_and_rate_limit(target))

@app.route('/api/audit/subdomain-takeover', methods=['POST'])
def audit_subdomain():
    domain = (request.json or {}).get('domain', '').strip()
    if not domain:
        return jsonify({'error': 'Missing domain'}), 400
    return jsonify(check_subdomain_takeover(domain))

@app.route('/api/audit/csp', methods=['POST'])
def audit_csp():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(analyze_csp(target))

@app.route('/api/audit/cors', methods=['POST'])
def audit_cors_route():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_cors(target))

@app.route('/api/audit/cookies', methods=['POST'])
def audit_cookies_route():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_cookies(target))

@app.route('/api/audit/sri', methods=['POST'])
def audit_sri():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(scan_sri(target))

@app.route('/api/audit/security-txt', methods=['POST'])
def audit_security_txt():
    domain = (request.json or {}).get('domain', '').strip()
    if not domain:
        return jsonify({'error': 'Missing domain'}), 400
    return jsonify(check_security_txt(domain))

# ── Batch 4: AI & Advanced Auditors ──────────────────────────────────────

@app.route('/api/audit/prompt-injection', methods=['POST'])
def audit_prompt_injection():
    text = (request.json or {}).get('text', '')
    if not text:
        return jsonify({'error': 'Missing text'}), 400
    return jsonify(scan_prompt_injection(text))

@app.route('/api/audit/dom-xss', methods=['POST'])
def audit_dom_xss():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(scan_dom_xss(content))

@app.route('/api/audit/pre-commit-hook', methods=['GET'])
def get_pre_commit_hook():
    return jsonify(generate_pre_commit_hook())

@app.route('/api/audit/asvs', methods=['POST'])
def audit_asvs():
    arch = (request.json or {}).get('arch', 'general')
    return jsonify(get_asvs_checklist(arch))

# ── Final 5 Specialized Auditors ──────────────────────────────────────────

@app.route('/api/audit/directory', methods=['POST'])
def audit_directory():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_directory_browsing(target))

@app.route('/api/audit/input-validation', methods=['POST'])
def audit_input_validation():
    data = request.json or {}
    target = data.get('target', '')
    param = data.get('param', 'q')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(simulate_input_payloads(target, param))

@app.route('/api/audit/ssrf', methods=['POST'])
def audit_ssrf():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(validate_ssrf_code(content))

@app.route('/api/audit/bola', methods=['POST'])
def audit_bola():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(lint_bola(content))

@app.route('/api/audit/sbom', methods=['POST'])
def audit_sbom():
    data = request.json or {}
    content = data.get('content', '')
    manifest_type = data.get('type', 'requirements.txt')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(generate_sbom(content, manifest_type))

# ── IP Port Scanner ──────────────────────────────────────────────────────

def run_ip_scan_task(task_id, ip, port_range, scan_type):
    """Background task: scan an IP address for open ports using Nmap."""
    # Only allow valid IPv4
    ip_re = re.compile(r'^(\d{1,3}\.){3}\d{1,3}$')
    if not ip_re.match(ip):
        scan_tasks[task_id]['status'] = 'error'
        scan_tasks[task_id]['message'] = 'Invalid IP address format.'
        return

    # Block private/loopback ranges
    import ipaddress as _ipa
    try:
        addr = _ipa.ip_address(ip)
        if addr.is_private or addr.is_loopback or addr.is_link_local:
            scan_tasks[task_id]['status'] = 'error'
            scan_tasks[task_id]['message'] = 'Scanning private/loopback IPs is restricted.'
            return
    except ValueError:
        scan_tasks[task_id]['status'] = 'error'
        scan_tasks[task_id]['message'] = 'Invalid IP address.'
        return

    # Build nmap command
    if scan_type == 'quick':
        flags = ['-F', '--open']
    elif scan_type == 'full':
        flags = ['-p', '1-65535', '--open']
    elif scan_type == 'service':
        flags = ['-sV', '-F', '--open']
    elif scan_type == 'custom' and port_range:
        flags = ['-p', port_range, '--open']
    else:
        flags = ['-F', '--open']

    command = ['nmap'] + flags + ['-oX', '-', ip]

    try:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        xml_output = []
        for line in process.stdout:
            scan_tasks[task_id]['logs'].append(line)
            xml_output.append(line)
        process.wait()
        full_xml = ''.join(xml_output)
        parsed = parse_nmap_xml(full_xml)
        scan_tasks[task_id]['status'] = 'completed'
        scan_tasks[task_id]['results'] = parsed
    except Exception as e:
        scan_tasks[task_id]['status'] = 'error'
        scan_tasks[task_id]['message'] = str(e)

@app.route('/api/scan/ip', methods=['POST'])
def scan_by_ip():
    data = request.json or {}
    ip = data.get('ip', '').strip()
    port_range = data.get('port_range', '').strip()
    scan_type = data.get('scan_type', 'quick')

    if not ip:
        return jsonify({'error': 'Missing IP address.'}), 400

    task_id = str(uuid.uuid4())
    scan_tasks[task_id] = {'status': 'running', 'logs': []}
    thread = threading.Thread(target=run_ip_scan_task, args=(task_id, ip, port_range, scan_type))
    thread.start()
    return jsonify({'task_id': task_id, 'status': 'running'})

# ── Enterprise 5 Features ────────────────────────────────────────────────

@app.route('/api/audit/smuggling', methods=['POST'])
def audit_smuggling():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(detect_request_smuggling(target))

@app.route('/api/audit/typosquatting', methods=['POST'])
def audit_typosquatting():
    data = request.json or {}
    content = data.get('content', '')
    manifest_type = data.get('type', 'requirements.txt')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(scan_typosquatting(content, manifest_type))

@app.route('/api/audit/open-redirect', methods=['POST'])
def audit_open_redirect():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(test_open_redirect(target))

@app.route('/api/audit/localstorage', methods=['POST'])
def audit_localstorage_route():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_localstorage(content))

@app.route('/api/audit/iac', methods=['POST'])
def audit_iac():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(harden_iac(content))

# ── Advanced 5 Features (Quick Auditors) ──────────────────────────────────

@app.route('/api/audit/prototype-pollution', methods=['POST'])
def audit_prototype_pollution_route():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_prototype_pollution(content))

@app.route('/api/audit/graphql', methods=['POST'])
def audit_graphql():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_graphql_introspection(target))

@app.route('/api/audit/ssti', methods=['POST'])
def audit_ssti_route():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_ssti(target))

@app.route('/api/audit/data-exposure', methods=['POST'])
def audit_data_exposure_route():
    content = (request.json or {}).get('content', '')
    if not content:
        return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_data_exposure(content))

@app.route('/api/audit/csp-report-setup', methods=['GET'])
def csp_report_setup():
    return jsonify(get_csp_reporting_setup())

@app.route('/csp-report-ingest', methods=['POST'])
def csp_report_ingest():
    # Dummy ingest endpoint
    return jsonify({"status": "received"}), 200

# ── Cloud & AppSec Features ──────────────────────────────────────────────

@app.route('/api/audit/xxe', methods=['POST'])
def audit_xxe_route():
    content = (request.json or {}).get('content', '')
    if not content: return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_xxe(content))

@app.route('/api/audit/host-header', methods=['POST'])
def audit_host_header_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_host_header(target))

@app.route('/api/audit/deserialization', methods=['POST'])
def audit_deserialization_route():
    content = (request.json or {}).get('content', '')
    if not content: return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_deserialization(content))

@app.route('/api/audit/clickjacking', methods=['POST'])
def audit_clickjacking_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_clickjacking(target))

@app.route('/api/audit/ssrf-cloud', methods=['POST'])
def audit_ssrf_cloud_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_cloud_metadata_ssrf(target))

@app.route('/api/audit/cswsh', methods=['POST'])
def audit_cswsh_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_cswsh(target))

@app.route('/api/audit/redos', methods=['POST'])
def audit_redos_route():
    content = (request.json or {}).get('content', '')
    if not content: return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_redos(content))

@app.route('/api/audit/debug-endpoints', methods=['POST'])
def audit_debug_endpoints_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_debug_endpoints(target))

@app.route('/api/audit/css-injection', methods=['POST'])
def audit_css_injection_route():
    content = (request.json or {}).get('content', '')
    if not content: return jsonify({'error': 'Missing content'}), 400
    return jsonify(audit_css_injection(content))

@app.route('/api/audit/dns-rebinding', methods=['POST'])
def audit_dns_rebinding_route():
    target = (request.json or {}).get('target', '')
    if not target: return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_dns_rebinding(target))

@app.route('/api/antigravity-terminal', methods=['POST'])
def antigravity_terminal():
    data = request.json
    command = data.get('command', '')
    
    # Load API key from environment for security
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return jsonify({
            "output": "Error: GEMINI_API_KEY environment variable not set.\n\n[SYSTEM HALT] Gravity stabilizers failing.\nPlease add your Gemini API key to a .env file or environment variables to enable the Antigravity Terminal."
        })
        
    try:
        genai.configure(api_key=api_key)
        
        system_instruction = """You are a live, interactive Linux-style terminal simulator operating under the laws of "Antigravity mode" (inspired by the Python `import antigravity` easter egg). Your interface must look like a real CLI, but the laws of physics are inverted, floating, or completely warped.

CRITICAL OPERATING RULES:
1. TERMINAL FORMATTING: Respond ONLY within a code block simulating a terminal screen. Use a prompt line like `user@antigravity:~# ` for every input-output loop.
2. NO CHATTY PROSE: Do not say "Sure, here is your terminal" or "Let me know if you need anything else." Act strictly like a command-line interface.
3. THE ANTIGRAVITY EFFECT: Every time a command is executed, describe the visual, physical, or textual distortion caused by zero gravity. Text might float upward, characters might drift apart, or terminal elements might fly off the screen.
4. VALID COMMAND HANDLING: Respond realistically to standard Linux/network security commands (e.g., `ls`, `cd`, `nmap`, `cat`, `python3 -c "import antigravity"`), but apply the zero-g physics engine to the output."""

        model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_instruction)
        response = model.generate_content(command)
        
        return jsonify({"output": response.text})
    except Exception as e:
        return jsonify({"output": f"Antigravity Physics Engine Failure: {str(e)}\n\n[ERROR] Gravity containment breach detected."})

if __name__ == '__main__':
    app.run(port=5000, debug=True)
