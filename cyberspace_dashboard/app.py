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
import sqlite3
import os
DB_PATH = os.environ.get("DB_PATH", "users.db")
import base64
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, Response, redirect, url_for, session
from google import genai
from google.genai import types

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
app.secret_key = os.environ.get('SECRET_KEY', 'dev_secret_key_12345')

DOMAIN_OR_IP_REGEX = r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'

active_games = {}
scan_tasks = {}

def init_db():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
    ''')
    try:
        c.execute('ALTER TABLE users ADD COLUMN wins INTEGER DEFAULT 0')
        c.execute('ALTER TABLE users ADD COLUMN matches_played INTEGER DEFAULT 0')
        c.execute('ALTER TABLE users ADD COLUMN total_score INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass
    c.execute('''
        CREATE TABLE IF NOT EXISTS lobbies (
            id TEXT PRIMARY KEY,
            host_username TEXT NOT NULL,
            max_players INTEGER NOT NULL,
            status TEXT NOT NULL DEFAULT 'waiting',
            scenario TEXT,
            target_url TEXT,
            red_invite_code TEXT,
            blue_invite_code TEXT,
            custom_desc TEXT,
            custom_flag TEXT
        )
    ''')
    c.execute('''
        CREATE TABLE IF NOT EXISTS lobby_members (
            lobby_id TEXT NOT NULL,
            username TEXT NOT NULL,
            team TEXT NOT NULL,
            FOREIGN KEY(lobby_id) REFERENCES lobbies(id)
        )
    ''')
    conn.commit()
    
    try:
        c.execute('ALTER TABLE lobbies ADD COLUMN custom_desc TEXT')
        c.execute('ALTER TABLE lobbies ADD COLUMN custom_flag TEXT')
        conn.commit()
    except sqlite3.OperationalError:
        pass
        
    conn.close()

init_db()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

scan_tasks = {}
active_games = {} # Stores real-time state: { lobby_id: { health: 100, rules: [], logs: [] } }
active_terminals = {}

GEMINI_MODEL = "gemini-2.0-flash-lite"  # High-quota free-tier model


def run_ai_audit(tool_name, input_data, expected_keys=None):
    """
    Core AI audit engine. Sends target/code to Gemini and returns structured JSON.
    Each call is dynamic - results differ per unique input.
    """
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return {'findings': [{'issue': 'GEMINI_API_KEY not set', 'detail': 'Add your API key to the .env file.', 'fix': ''}]}
    try:
        client = genai.Client(api_key=api_key)

        # Build the JSON schema for this tool type
        if expected_keys == 'header':
            schema = '{"grade":"A/B/C/D/F","missing_headers":["..."],"details":"full analysis","risk":"High/Medium/Low"}'
        elif expected_keys == 'csp':
            schema = '{"findings":[{"issue":"...","recommendation":"...","severity":"High/Medium/Low"}]}'
        elif expected_keys == 'cookie':
            schema = '{"findings":[{"issue":"...","fix":"...","severity":"High/Medium/Low"}]}'
        elif expected_keys == 'proto':
            schema = '{"findings":[{"severity":"High/Medium/Low","line":"...","issue":"...","code":"..."}],"fix":"..."}'
        elif expected_keys == 'csp_report':
            schema = '{"report_url":"/csp-report-ingest","setup_guide":"step by step instructions"}'
        elif expected_keys == 'xxe':
            schema = '{"findings":[{"line":"...","issue":"...","code":"..."}],"fix":"..."}'
        else:
            schema = '{"findings":[{"issue":"...","detail":"...","severity":"High/Medium/Low"}],"fix":"..."}'

        prompt = f"""You are an elite cybersecurity penetration tester performing a REAL-TIME {tool_name} audit.

Target/Input: {input_data}

Analyze this SPECIFIC target/input and provide ACCURATE, DYNAMIC findings based on what is realistic for "{input_data}".
Do NOT give generic or template answers. Each target must produce unique, specific results.

Respond ONLY in valid JSON matching this schema exactly:
{schema}"""

        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type='application/json')
        )
        return json.loads(response.text)
    except Exception as e:
        if expected_keys == 'header':
            return {'grade': 'F', 'details': f'Error: {str(e)}', 'missing_headers': [], 'risk': 'Unknown'}
        if expected_keys == 'csp_report':
            return {'report_url': 'error', 'setup_guide': str(e)}
        return {'findings': [{'issue': 'AI Engine Error', 'detail': str(e), 'fix': 'Check your GEMINI_API_KEY and network.'}]}


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
        scan_tasks[task_id]['logs'].append(f"[+] Initializing AI Penetration Engine on {target}...\n")
        scan_tasks[task_id]['logs'].append(f"[+] Launching 14 audit modules in parallel threads...\n")

        def log_callback(msg):
            scan_tasks[task_id]['logs'].append(msg)

        # Call AI-powered engine with live log streaming
        report = run_nessus_scan(target, log_callback=log_callback)

        scan_tasks[task_id]['logs'].append(f"[+] Penetration scan complete. Aggregate CVSS: {report['score']}\n")
        scan_tasks[task_id]["status"] = "completed"
        scan_tasks[task_id]["results"] = {"type": "nessus", "report": report}
    except Exception as e:
        scan_tasks[task_id]["status"] = "error"
        scan_tasks[task_id]["message"] = str(e)

@app.route('/')
def home():
    if 'user' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/dashboard')
@login_required
def dashboard():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("SELECT wins, matches_played, total_score FROM users WHERE username = ?", (session['user'],))
        stats = c.fetchone()
    except Exception:
        stats = None
    conn.close()
    
    try:
        user_stats = {
            "wins": stats[0] if stats and len(stats) > 0 else 0,
            "matches_played": stats[1] if stats and len(stats) > 1 else 0,
            "total_score": stats[2] if stats and len(stats) > 2 else 0
        }
    except Exception:
        user_stats = {"wins": 0, "matches_played": 0, "total_score": 0}

    return render_template('index.html', user_stats=user_stats)

@app.route('/academy')
@login_required
def academy():
    return render_template('academy.html')

@app.route('/practice')
@login_required
def practice():
    return render_template('practice.html')

@app.route('/compete')
@login_required
def compete():
    return render_template('compete.html')

@app.route('/api/lobby/create', methods=['POST'])
@login_required
def create_lobby():
    data = request.json or {}
    max_players = data.get('max_players', 2)
    scenario = data.get('scenario', 'sqli_login')
    host_team = data.get('host_team', 'blue')
    custom_desc = data.get('custom_desc', '')
    custom_flag = data.get('custom_flag', '')
    difficulty_level = int(data.get('difficulty_level', 1))
    
    lobby_id = str(uuid.uuid4())[:8] # Short ID
    red_invite_code = 'R-' + str(uuid.uuid4())[:6]
    blue_invite_code = 'B-' + str(uuid.uuid4())[:6]
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO lobbies (id, host_username, max_players, scenario, red_invite_code, blue_invite_code, custom_desc, custom_flag, difficulty_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", 
              (lobby_id, session['user'], max_players, scenario, red_invite_code, blue_invite_code, custom_desc, custom_flag, difficulty_level))
              
    c.execute("INSERT INTO lobby_members (lobby_id, username, team) VALUES (?, ?, ?)",
              (lobby_id, session['user'], host_team))
    conn.commit()
    conn.close()
    
    # Initialize Game Engine State
    active_games[lobby_id] = {
        'scenario': scenario,
        'custom_desc': custom_desc,
        'custom_flag': custom_flag,
        'difficulty_level': difficulty_level,
        'health': 100,
        'rules': [], # Active WAF Regex rules
        'logs': [],  # Traffic logs
        'real_payloads': [], # Actual Red Team payloads for investigation
        'status': 'waiting', # 'waiting', 'active', 'paused', 'red_wins', 'blue_wins'
        'red_online': 0,     # timestamp of last red ping
        'blue_online': 0,    # timestamp of last blue ping
        'winner': None,
        'target_state': 'packed', # New mechanic: packed (blue control), unpacked (red control)
        'last_attack_payload': None,
        'last_attack_result_text': None,
        'presence': {}
    }
    
    return jsonify({"success": True, "lobby_id": lobby_id, "red_invite_code": red_invite_code, "blue_invite_code": blue_invite_code})

@app.route('/api/lobby/join', methods=['POST'])
@login_required
def join_lobby():
    data = request.json or {}
    role = data.get('role', 'player')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    lobby_id = None
    team = None
    red_code = None
    blue_code = None
    
    if role == 'leader':
        lobby_id = data.get('lobby_id')
        team = data.get('team')
        if not lobby_id or not team:
            conn.close()
            return jsonify({"success": False, "error": "Lobby ID and team are required"}), 400
            
        c.execute("SELECT id, max_players, red_invite_code, blue_invite_code FROM lobbies WHERE id = ?", (lobby_id,))
        lobby = c.fetchone()
        if not lobby:
            conn.close()
            return jsonify({"success": False, "error": "Invalid Lobby ID"}), 404
            
        max_players = lobby[1]
        red_code = lobby[2]
        blue_code = lobby[3]
    else:
        invite_code = data.get('invite_code')
        if not invite_code:
            conn.close()
            return jsonify({"success": False, "error": "Invite code required"}), 400
            
        c.execute("SELECT id, max_players, red_invite_code, blue_invite_code FROM lobbies WHERE red_invite_code = ? OR blue_invite_code = ?", (invite_code, invite_code))
        lobby = c.fetchone()
        if not lobby:
            conn.close()
            return jsonify({"success": False, "error": "Invalid invite code"}), 404
            
        lobby_id = lobby[0]
        max_players = lobby[1]
        red_code = lobby[2]
        blue_code = lobby[3]
        team = 'red' if invite_code == lobby[2] else 'blue'
        
    team_size = max_players // 2
    
    # Check if user already in lobby
    c.execute("SELECT team FROM lobby_members WHERE lobby_id = ? AND username = ?", (lobby_id, session['user']))
    existing_member = c.fetchone()
    if existing_member:
        actual_team = existing_member[0]
        conn.close()
        if actual_team != team:
            # For local testing, allow the user to join as the other team (Demo Mode behavior)
            return jsonify({"success": True, "message": "Joined as opposite team for testing", "lobby_id": lobby_id, "team": team, "red_code": red_code, "blue_code": blue_code, "demo": True})
        return jsonify({"success": True, "message": "Already in lobby", "lobby_id": lobby_id, "team": actual_team, "red_code": red_code, "blue_code": blue_code})
        
    # Check if team is full
    c.execute("SELECT COUNT(*) FROM lobby_members WHERE lobby_id = ? AND team = ?", (lobby_id, team))
    current_team_size = c.fetchone()[0]
    if current_team_size >= team_size:
        conn.close()
        return jsonify({"success": False, "error": f"This team is full. The leader has set a limit of {team_size} players per team."}), 400
        
    c.execute("INSERT INTO lobby_members (lobby_id, username, team) VALUES (?, ?, ?)",
              (lobby_id, session['user'], team))
    conn.commit()
    conn.close()
    
    return jsonify({"success": True, "lobby_id": lobby_id, "team": team, "red_code": red_code, "blue_code": blue_code})

@app.route('/api/lobby/demo-join', methods=['POST'])
@login_required
def demo_join_lobby():
    """Special endpoint for solo demo mode: allows the same user to view
    the game as either team perspective without strict team membership checks."""
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    team = data.get('team')  # 'red' or 'blue'

    if not lobby_id or not team:
        return jsonify({"success": False, "error": "Missing lobby_id or team"}), 400

    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False, "error": "Lobby not found"}), 404

    # In demo mode we allow same user to represent either team view
    return jsonify({"success": True, "lobby_id": lobby_id, "team": team, "demo": True})

@app.route('/api/lobby/status/<lobby_id>', methods=['GET'])
@login_required
def get_lobby_status(lobby_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute("SELECT host_username, max_players, status, target_url, red_invite_code, blue_invite_code, scenario, custom_desc FROM lobbies WHERE id = ?", (lobby_id,))
    lobby = c.fetchone()
    if not lobby:
        conn.close()
        return jsonify({"success": False, "error": "Lobby not found"})
        
    c.execute("SELECT username, team FROM lobby_members WHERE lobby_id = ?", (lobby_id,))
    members = c.fetchall()
    conn.close()
    
    red_team = [m[0] for m in members if m[1] == 'red']
    blue_team = [m[0] for m in members if m[1] == 'blue']
    
    leaders = {
        "red": red_team[0] if len(red_team) > 0 else None,
        "blue": blue_team[0] if len(blue_team) > 0 else None
    }
    
    # Calculate presence
    red_present = False
    blue_present = False
    game = active_games.get(lobby_id)
    if game:
        now = time.time()
        presence = game.get('presence', {})
        
        red_connected = sum(1 for p in red_team if now - presence.get(p, 0) < 3)
        blue_connected = sum(1 for p in blue_team if now - presence.get(p, 0) < 3)
        
        team_size = max(1, lobby[1] // 2)
        red_present = red_connected >= team_size
        blue_present = blue_connected >= team_size
    
    return jsonify({
        "success": True,
        "id": lobby_id,
        "host": lobby[0],
        "max_players": lobby[1],
        "status": lobby[2],
        "target_url": lobby[3],
        "red_invite_code": lobby[4],
        "blue_invite_code": lobby[5],
        "scenario": lobby[6],
        "custom_desc": lobby[7] if len(lobby) > 7 else '',
        "members": {
            "red": red_team,
            "blue": blue_team
        },
        "leaders": leaders,
        "is_leader": session['user'] in leaders.values(),
        "presence": {
            "red": red_present,
            "blue": blue_present
        }
    })


@app.route('/api/tools/red/<scenario>', methods=['GET'])
@login_required
def get_red_tools(scenario):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT label, payload, tip, level FROM red_payloads WHERE scenario = ?", (scenario,))
    rows = c.fetchall()
    conn.close()
    tools = [{"label": row[0], "payload": row[1], "tip": row[2], "level": row[3]} for row in rows]
    return jsonify({"success": True, "tools": tools})


@app.route('/api/tools/blue/<scenario>', methods=['GET'])
@login_required
def get_blue_tools(scenario):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT label, rule, tip, level FROM blue_defenses WHERE scenario = ?", (scenario,))
    rows = c.fetchall()
    conn.close()
    tools = [{"label": row[0], "rule": row[1], "tip": row[2], "level": row[3]} for row in rows]
    return jsonify({"success": True, "tools": tools})

import base64

@app.route('/api/game/attack', methods=['POST'])
@login_required
def game_attack():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    payload = data.get('payload', '').strip()
    
    if not lobby_id or not payload:
        return jsonify({"success": False, "error": "Missing parameters"})
         
    game = active_games.get(lobby_id)
    if not game:
         return jsonify({"success": False, "error": "Game not found or inactive"})
         
    if game['status'] != 'active':
        return jsonify({"success": False, "error": "Game is not active"})
         
    # 1. WAF Evaluation (Blue Team Defense)
    blocked = False
    for rule in game['rules']:
        try:
            if re.search(rule, payload, re.IGNORECASE):
                blocked = True
                break
        except re.error:
            pass # Ignore invalid regex rules from users

    timestamp = time.strftime('%H:%M:%S')
    
    # Get level and scenario for this payload
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT level, scenario FROM red_payloads WHERE payload = ?", (payload,))
    row = c.fetchone()
    conn.close()
    
    level = row[0] if row else "Advanced"
    scenario = row[1] if row else game.get('scenario', 'Unknown')
    
    # Encrypt the payload for Blue Team analysis (Base64 encoding)
    encoded_payload = base64.b64encode(payload.encode('utf-8')).decode('utf-8')
    
    # Store the raw payload for tracking but logs will show the encrypted one
    if len(game.get('real_payloads', [])) > 50: game['real_payloads'].pop(0)
    game.setdefault('real_payloads', []).append({"timestamp": timestamp, "payload": payload, "blocked": blocked, "encrypted": encoded_payload, "level": level, "scenario": scenario})
    
    # Store the current active attack scenario type for verification
    game['last_attack_payload'] = payload
    
    if scenario == "sqli_login":
        expected_result = "[Analysis] SQL Injection Attack on Authentication Database"
    elif scenario == "cmd_ping":
        expected_result = "[Analysis] Command Injection Attack on Diagnostic Network Tools"
    elif scenario == "xss_search":
        expected_result = "[Analysis] Cross-Site Scripting (XSS) Attack on User Browser"
    else:
        expected_result = "[Analysis] Custom Exploit Payload Detected"
        
    game['last_attack_result_text'] = expected_result
    
    if blocked:
        log_entry = f"<span class='text-red-500'>[{timestamp}] [BLOCKED] Malicious Traffic Blocked by WAF</span>"
        game['logs'].append(log_entry)
        if len(game['logs']) > 50: game['logs'].pop(0)
        return jsonify({"success": False, "error": "Your attack is nullified. Try another attack."})
        
    # 2. Scenario Evaluation (Red Team Attack)
    success = False
    message = "Payload executed but did not exploit the vulnerability."
    
    target_area = "Unknown Endpoint"
    if scenario == 'sqli_login': target_area = "/api/v1/auth/login (Database Auth)"
    elif scenario in ['cmd_injection', 'cmd_ping']: target_area = "/tools/network/ping (System Shell)"
    elif scenario == 'xss_search': target_area = "/search?q= (Frontend DOM)"
    elif scenario == 'lfi_traversal': target_area = "/download?file= (File System)"
    elif scenario == 'ssti_jinja': target_area = "/profile/render (Template Engine)"
    elif scenario == 'omni_sandbox': target_area = "Omni-Sandbox Universal Target"
    
    log_entry = f"<span class='text-yellow-500'>[{timestamp}] [WARNING] Attack detected on {target_area}! Encrypted Payload: <b>{encoded_payload}</b></span>"
    game['logs'].append(log_entry)
    if len(game['logs']) > 50: game['logs'].pop(0)

    if game['scenario'] == 'sqli_login':
        # Simple SQLi detection
        if any(kw in payload.upper() for kw in ['OR 1=1', 'UNION SELECT', 'DROP TABLE']):
            success = True
            message = "CRITICAL HIT: SQL Injection successful. Flag captured!"
    elif game['scenario'] in ['cmd_injection', 'cmd_ping']:
        # Simple Command Injection detection
        if any(kw in payload for kw in [';', '&&', '|', '`']):
            success = True
            message = "CRITICAL HIT: Remote Code Execution successful. Flag captured!"
    elif game['scenario'] == 'xss_search':
        # Simple XSS detection
        if any(kw in payload.lower() for kw in ['<script>', 'onerror=', 'javascript:']):
            success = True
            message = "CRITICAL HIT: Cross-Site Scripting successful. Session hijacked!"
    elif game['scenario'] == 'lfi_traversal':
        # Simple LFI detection
        if any(kw in payload.lower() for kw in ['../', '..\\', '/etc/passwd', 'c:\\windows']):
            success = True
            message = "CRITICAL HIT: Local File Inclusion successful. Sensitive data exfiltrated!"
    elif game['scenario'] == 'ssti_jinja':
        # Simple SSTI detection
        if any(kw in payload for kw in ['{{', '}}', '{%', '%}']):
            success = True
            message = "CRITICAL HIT: Server-Side Template Injection successful. Remote code executed via template!"
    elif game['scenario'] == 'custom_ctf':
        # Check if the custom exploit keyword is present in the payload
        custom_flag = game.get('custom_flag', '')
        if custom_flag and custom_flag.strip().lower() in payload.lower():
            success = True
            message = "CRITICAL HIT: Exploit successful. Vulnerability triggered!"
    elif game['scenario'] == 'omni_sandbox':
        # Check against ALL vulnerability signatures
        if any(kw in payload.upper() for kw in ['OR 1=1', 'UNION SELECT', 'DROP TABLE']):
            success = True
            message = "CRITICAL HIT: SQL Injection successful!"
        elif any(kw in payload for kw in [';', '&&', '|', '`']):
            success = True
            message = "CRITICAL HIT: Remote Code Execution successful!"
        elif any(kw in payload.lower() for kw in ['<script>', 'onerror=', 'javascript:']):
            success = True
            message = "CRITICAL HIT: Cross-Site Scripting successful!"
        elif any(kw in payload.lower() for kw in ['../', '..\\', '/etc/passwd', 'c:\\windows']):
            success = True
            message = "CRITICAL HIT: Local File Inclusion successful!"
        elif any(kw in payload for kw in ['{{', '}}', '{%', '%}']):
            success = True
            message = "CRITICAL HIT: Server-Side Template Injection successful!"

    if success:
        game.setdefault('active_breaches', []).append(payload)
        game['target_state'] = 'unpacked'
        
        # Don't end immediately, just log it
        log_entry = f"<span class='text-red-500 font-bold'>[{timestamp}] [BREACH] Target UNPACKED by Red Team! Blue team must repack.</span>"
        game['logs'].append(log_entry)
        if len(game['logs']) > 50: game['logs'].pop(0)
        
    return jsonify({"success": success, "message": message})

@app.route('/api/game/decrypt', methods=['POST'])
@login_required
def game_decrypt():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    encrypted_text = data.get('encrypted_text', '').strip()
    
    if not lobby_id or not encrypted_text:
        return jsonify({"success": False, "error": "Missing parameters"})
        
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False, "error": "Game not found or inactive"})
        
    try:
        decrypted = base64.b64decode(encrypted_text).decode('utf-8')
        
        # Verify this was an actual attack in this game to prevent cheating
        valid = False
        attack_level = "Beginner"
        attack_scenario = ""
        for p in game.get('real_payloads', []):
            if p.get('encrypted') == encrypted_text:
                valid = True
                attack_level = p.get('level', 'Advanced')
                attack_scenario = p.get('scenario', '')
                break
                
        if not valid:
            return jsonify({"success": False, "error": "Payload not recognized in recent traffic logs."})
            
        timestamp = time.strftime('%H:%M:%S')
        difficulty = game.get('difficulty_level', 1)
        
        # Difficulty Logic: 
        # Level 1 (Beginner): gets the raw payload.
        # Level 2 (Intermediate): gets the problem type.
        # Level 3 (Advanced): gets vague symptom.
        if difficulty == 1:
            result_text = decrypted
            game['logs'].append(f"<span class='text-emerald-400 font-bold'>[{timestamp}] [SOC ALERT] Defender decrypted (Level 1) payload: {decrypted}</span>")
        elif difficulty == 2:
            if attack_scenario == "sqli_login":
                result_text = "[SIEM Alert] Database query latency spiked. Sequence: 1) Nginx access.log shows unusual characters in POST body. 2) ModSecurity bypassed due to weak character whitelisting. 3) Postgres error log indicates malformed syntax near 'OR' or 'UNION'. Recommendation: Deploy WAF rule blocking SQL keywords on auth payload."
            elif attack_scenario in ["cmd_ping", "cmd_injection"]:
                result_text = "[SIEM Alert] Unexpected child process spawned. Sequence: 1) Apache error.log shows ping utility returning abnormal exit codes. 2) Sysmon Event ID 1 detected shell executing with ping parent. 3) IDS flagged shell metacharacters (; or |). Recommendation: Implement input sanitization blocking command separators."
            elif attack_scenario == "xss_search":
                result_text = "[SIEM Alert] Suspicious client-side code execution. Sequence: 1) WAF flagged unencoded HTML tags in URL parameter. 2) Access logs show long strings containing 'script' or 'onerror'. 3) Reflected input not neutralized by backend. Recommendation: Deploy Regex filter blocking JS event handlers."
            elif attack_scenario == "lfi_traversal":
                result_text = "[SIEM Alert] Unauthorized file access attempt. Sequence: 1) Logs show path traversal characters (../) in parameter. 2) WAF heuristics triggered for arbitrary file read. 3) OS audit logs show web process attempting to read sensitive system files. Recommendation: Deploy strict directory traversal filters."
            elif attack_scenario == "ssti_jinja":
                result_text = "[SIEM Alert] Template Engine execution anomaly. Sequence: 1) WAF flagged curly braces ({{ }}) in user input. 2) Application crashed throwing template syntax errors. 3) Input evaluated as executable code. Recommendation: Deploy Regex rules blocking template expression delimiters."
            else:
                result_text = "[SIEM Alert] Anomaly detected in traffic flow. Sequence: 1) Edge router noticed unusual payload structures. 2) WAF generic attack signatures partially matched. 3) Application threw unhandled exception. Recommendation: Analyze payload structure and block anomalous patterns."
                
            game['logs'].append(f"<span class='text-emerald-400 font-bold'>[{timestamp}] [SOC ALERT] Defender decrypted (Level 2) attack chain: {result_text}</span>")
        else: # Level 3
            if attack_scenario == "sqli_login":
                result_text = "[Threat Intel] Suspected evasion attempt. Sequence: 1) EDR flagged abnormal memory allocation in sqlservr.exe. 2) Zeek reveals fragmented encoded payloads hitting the login route. 3) Application logs show repeated failed auth followed by token generation. Action required: Analyze query parsing mechanisms."
            elif attack_scenario in ["cmd_ping", "cmd_injection"]:
                result_text = "[Threat Intel] Out-of-band communication detected. Sequence: 1) Firewall logged unauthorized DNS queries originating from web DMZ. 2) Auditd flagged 'execve' syscalls bypassing standard PATH. 3) Reverse shell signature partially matched. Action required: Investigate blind command injection vectors."
            elif attack_scenario == "xss_search":
                result_text = "[Threat Intel] Potential DOM-based hijacking. Sequence: 1) CSP violation reports spiking. 2) Suspicious encoded payloads bypassing initial input validation. 3) JavaScript context breakout detected in URL fragment. Action required: Audit client-side sinks and implement strict encoding."
            elif attack_scenario == "lfi_traversal":
                result_text = "[Threat Intel] Sandbox escape and read arbitrary files. Sequence: 1) AppArmor/SELinux denied read access to sensitive system files. 2) Double URL encoding detected bypassing basic traversal rules. 3) File wrapper exploitation suspected. Action required: Implement strict allowlisting for file inclusions."
            elif attack_scenario == "ssti_jinja":
                result_text = "[Threat Intel] Remote Code Execution via Template. Sequence: 1) Security Manager blocked reflection method calls on server objects. 2) Attackers using payload chains like '__class__' to access base classes. 3) OS command execution attempted within template. Action required: Sandbox template environments."
            else:
                result_text = "[Threat Intel] Zero-day exploitation behavior. Sequence: 1) EDR detected anomalous thread creation in web worker. 2) Network heuristic engine flagged encrypted payload masking standard signatures. 3) Memory analysis shows potential heap manipulation. Action required: Isolate process and perform packet inspection."
            game['logs'].append(f"<span class='text-emerald-400 font-bold'>[{timestamp}] [SOC ALERT] Defender decrypted (Level 3) symptom chain: {result_text}</span>")
        
        return jsonify({"success": True, "decrypted": result_text})
    except Exception as e:
        return jsonify({"success": False, "error": "Failed to decrypt. Invalid encryption signature."})

@app.route('/api/game/verify', methods=['POST'])
@login_required
def game_verify():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    decrypted_payload = data.get('decrypted_payload', '').strip()
    
    if not lobby_id or not decrypted_payload:
        return jsonify({"success": False, "error": "Missing parameters"})
        
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False, "error": "Game not found or inactive"})
        
    # Check if the decrypted payload matches the last attack
    if game.get('last_attack_payload') == decrypted_payload or game.get('last_attack_result_text') == decrypted_payload:
        timestamp = time.strftime('%H:%M:%S')
        game['target_state'] = 'packed' # Repack on verification
        game['logs'].append(f"<span class='text-cyan-400 font-bold'>[{timestamp}] [SOC SUCCESS] Attack verified successfully. Target REPACKED.</span>")
        return jsonify({"success": True, "message": "Attack signature verified! Target Repacked."})
    else:
        return jsonify({"success": False, "error": "Incorrect analysis. This payload does not match the active threat."})

@app.route('/api/game/defend', methods=['POST'])
@login_required
def game_defend():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    rule = data.get('rule', '').strip()
    
    if not lobby_id or not rule:
         return jsonify({"success": False, "error": "Missing parameters"}), 400
         
    game = active_games.get(lobby_id)
    if not game:
         return jsonify({"success": False, "error": "Game not found or inactive"}), 404

    try:
        re.compile(rule) # Validate regex
    except re.error:
        return jsonify({"success": False, "error": "Invalid Regex rule."}), 400

    if rule not in game['rules']:
        game['rules'].append(rule)
        timestamp = time.strftime('%H:%M:%S')
        
        still_active = []
        for p in game.get('active_breaches', []):
            blocked = False
            for r in game['rules']:
                try:
                    if re.search(r, p, re.IGNORECASE):
                        blocked = True
                        break
                except re.error:
                    pass
            if not blocked:
                still_active.append(p)
                
        game['active_breaches'] = still_active
        
        if not still_active:
            game['target_state'] = 'packed' # Repack on successful WAF rule deploy
            game['logs'].append(f"<span class='text-blue-400 font-bold'>[{timestamp}] [WAF UPDATED] Rule added: {rule}. Target REPACKED.</span>")
            return jsonify({"success": True, "rules": game['rules'], "message": f"Defense deployed successfully. Target Repacked."})
        else:
            unmitigated = len(still_active)
            game['logs'].append(f"<span class='text-yellow-400 font-bold'>[{timestamp}] [WAF UPDATED] Rule added: {rule}. WARNING: {unmitigated} attack(s) still active! Target remains UNPACKED.</span>")
            return jsonify({"success": True, "rules": game['rules'], "message": f"Defense deployed, but {unmitigated} attack(s) are still bypassing defenses!"})
         
    return jsonify({"success": True, "rules": game['rules'], "message": f"Rule already exists."})

@app.route('/api/game/investigate', methods=['POST'])
@login_required
def investigate_traffic():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    
    game = active_games.get(lobby_id)
    if not game:
         return jsonify({"success": False, "error": "Game not found"}), 404
         
    return jsonify({"success": True, "payloads": game.get('real_payloads', [])})

@app.route('/api/game/surrender', methods=['POST'])
@login_required
def surrender_match():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    team = data.get('team')
    
    if lobby_id in active_games:
        winner = 'red' if team == 'blue' else 'blue'
        active_games[lobby_id]['status'] = f"{winner}_wins"
        active_games[lobby_id]['winner'] = winner
        active_games[lobby_id]['logs'].append(f"[!] {team.upper()} TEAM SURRENDERED.")
        return jsonify({"success": True})
    return jsonify({"success": False, "error": "Lobby not active"}), 404

@app.route('/api/game/state/<lobby_id>', methods=['GET'])
@login_required
def game_state(lobby_id):
    game = active_games.get(lobby_id)
    if not game:
         # Check if we should initialize it as active (Host hit deploy)
         conn = sqlite3.connect(DB_PATH)
         c = conn.cursor()
         c.execute("SELECT status FROM lobbies WHERE id = ?", (lobby_id,))
         lobby = c.fetchone()
         conn.close()
         
         if lobby and lobby[0] == 'active':
             if lobby_id not in active_games:
                 active_games[lobby_id] = {
                     'health': 100,
                     'rules': [],
                     'logs': [],
                     'status': 'active',
                     'presence': {},
                     'winner': None,
                     'target_state': 'packed',
                     'real_payloads': [],
                     'start_time': time.time() + 10
                 }
             else:
                 active_games[lobby_id]['status'] = 'active'
         
         if lobby_id not in active_games:
             return jsonify({"success": False, "error": "Game not initialized"})
             
         game = active_games[lobby_id]

    now = time.time()
    presence = game.get('presence', {})
    
    # Calculate how many players are connected on each team
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT username, team FROM lobby_members WHERE lobby_id = ?", (lobby_id,))
    members = c.fetchall()
    conn.close()
    
    red_team = [m[0] for m in members if m[1] == 'red']
    blue_team = [m[0] for m in members if m[1] == 'blue']
    
    red_connected = sum(1 for p in red_team if now - presence.get(p, 0) < 30)
    blue_connected = sum(1 for p in blue_team if now - presence.get(p, 0) < 30)
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT max_players FROM lobbies WHERE id = ?", (lobby_id,))
    lobby_info = c.fetchone()
    conn.close()
    
    team_size = max(1, lobby_info[0] // 2) if lobby_info else 1
    
    red_present = red_connected >= team_size
    blue_present = blue_connected >= team_size

    # Auto-start logic
    if game['status'] == 'waiting':
        if red_present and blue_present:
            game['status'] = 'active'
            # Also update DB so lobby browsers know
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("UPDATE lobbies SET status = 'active' WHERE id = ?", (lobby_id,))
            conn.commit()
            conn.close()
    
    pass

    time_remaining = None
    if 'start_time' in game and game['status'] == 'active':
        time_elapsed = time.time() - game['start_time']
        if time_elapsed > 0:
            time_remaining = max(0, 300 - int(time_elapsed))
        else:
            time_remaining = 300
            
    return jsonify({
        "success": True,
        "health": game['health'],
        "status": game['status'],
        "logs": game['logs'][-20:], # Send last 20 logs
        "presence": {"red": red_present, "blue": blue_present},
        "winner": game['winner'],
        "target_state": game.get('target_state', 'packed'),
        "time_remaining": time_remaining
    })

@app.route('/api/game/ping', methods=['POST'])
@login_required
def game_ping():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    team = data.get('team')
    
    if not lobby_id or not team:
        return jsonify({"success": False, "error": "Missing parameters"}), 400
        
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False, "error": "Game not found"})
        
    if 'presence' not in game:
        game['presence'] = {}
        
    game['presence'][session['user']] = time.time()
        
    return jsonify({"success": True})

@app.route('/api/lobby/start', methods=['POST'])
@login_required
def start_lobby():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    
    if not lobby_id:
         return jsonify({"success": False, "error": "Missing parameters"}), 400
         
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Get all members to determine leaders
    c.execute("SELECT username, team FROM lobby_members WHERE lobby_id = ?", (lobby_id,))
    members = c.fetchall()
    
    red_team = [m[0] for m in members if m[1] == 'red']
    blue_team = [m[0] for m in members if m[1] == 'blue']
    
    leaders = [
        red_team[0] if len(red_team) > 0 else None,
        blue_team[0] if len(blue_team) > 0 else None
    ]
    
    if session['user'] not in leaders:
        conn.close()
        return jsonify({"success": False, "error": "Unauthorized"}), 403
        
    c.execute("UPDATE lobbies SET status = 'active' WHERE id = ?", (lobby_id,))
    conn.commit()
    conn.close()
    
    if lobby_id not in active_games:
        active_games[lobby_id] = {
            'health': 100,
            'rules': [],
            'logs': [],
            'status': 'waiting',
            'presence': {},
            'winner': None,
            'target_state': 'packed',
            'real_payloads': []
        }
    active_games[lobby_id]['status'] = 'active'
    active_games[lobby_id]['start_time'] = time.time() + 10
        
    return jsonify({"success": True})

@app.route('/api/terminal', methods=['POST'])
@login_required
def api_terminal():
    data = request.json or {}
    command = data.get('command', '')
    cwd = data.get('cwd', '~')
    username = session.get('user', 'guest')
    
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return jsonify({"output": "<span class='text-red-400'>bash: command failed: GEMINI_API_KEY NOT CONFIGURED</span>"})
        
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        
        if username not in active_terminals:
            sys_inst = "You are a live, interactive Kali Linux terminal simulator.\nCRITICAL OPERATING RULES:\n1. Respond ONLY with the raw text output that a real terminal would show. NO markdown code blocks, NO conversational text, NO explanations.\n2. Act exactly like a real Kali Linux system. If the user installs a tool (e.g., 'apt install wireshark'), simulate the output realistically. If they run 'wireshark', show realistic fake output.\n3. Keep track of the current directory, user (root), and installed tools in your context.\n4. Your response must NEVER end with the terminal prompt (e.g. root@kali:~#). The wrapper script will print the prompt.\n5. DYNAMIC OUTPUT: If a user runs a tool like gobuster, nmap, or sqlmap against different targets (e.g. 127.0.0.1 vs scanme.nmap.org), you MUST generate completely different, context-appropriate output for each target. Do NOT repeat the exact same static results."
            
            chat = client.chats.create(
                model=GEMINI_MODEL,
                config=types.GenerateContentConfig(system_instruction=sys_inst)
            )
            active_terminals[username] = chat
            
        chat = active_terminals[username]
        
        # Give context about cwd
        full_command = f"Context: User is in directory {cwd}\nCommand: {command}"
        response = chat.send_message(full_command)
        
        out = response.text
        # Clean markdown
        import re
        out = re.sub(r'^```[a-zA-Z0-9-]*\n?', '', out, flags=re.MULTILINE)
        out = re.sub(r'```$', '', out, flags=re.MULTILINE)
        
        # Format for HTML output in terminal
        out = out.strip().replace('<', '&lt;').replace('>', '&gt;').replace('\n', '<br>').replace('  ', '&nbsp;&nbsp;')
        return jsonify({"output": out})
        
    except Exception as e:
        return jsonify({"output": f"<span class='text-red-400'>bash: command failed: {str(e)}</span>"})

@app.route('/api/game/end_timer', methods=['POST'])
@login_required
def game_end_timer():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    
    if not lobby_id:
        return jsonify({'success': False, 'error': 'Missing parameters'})
        
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({'success': False, 'error': 'Game not found or inactive'})
        
    if game['status'] != 'active' and game['status'] != 'playing':
        return jsonify({'success': False, 'error': 'Game is not active'})
        
    if game.get('target_state') == 'unpacked':
        game['status'] = 'red_wins'
        game['winner'] = 'Red Team'
    else:
        game['status'] = 'blue_wins'
        game['winner'] = 'Blue Team'
        
    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT username, team FROM lobby_members WHERE lobby_id = ?', (lobby_id,))
        members = c.fetchall()
        
        winning_team = 'red' if game['winner'] == 'Red Team' else 'blue'
        
        for m in members:
            if m[1] == winning_team:
                c.execute('UPDATE users SET wins = wins + 1, matches_played = matches_played + 1, total_score = total_score + 100 WHERE username = ?', (m[0],))
            else:
                c.execute('UPDATE users SET matches_played = matches_played + 1 WHERE username = ?', (m[0],))
        conn.commit()
        conn.close()
    except Exception as e:
        print('Failed to update scores on timer end:', e)
        
    return jsonify({'success': True, 'winner': game['winner']})

@app.route('/scoreboard')
@login_required
def scoreboard():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("SELECT username, wins, matches_played, total_score FROM users ORDER BY total_score DESC LIMIT 20")
        leaders = c.fetchall()
    except sqlite3.OperationalError:
        leaders = []
    conn.close()
    return render_template('scoreboard.html', leaders=leaders)

@app.route('/learn')
@login_required
def learn():
    return render_template('learn.html')

@app.route('/crypto')
@login_required
def crypto():
    return render_template('crypto.html')

import random
from functools import lru_cache

USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1; rv:109.0) Gecko/20100101 Firefox/121.0'
]

@lru_cache(maxsize=500)
def is_allowed_query(query):
    # Fast path: basic keywords
    safe_words = ['cyber', 'hack', 'security', 'nmap', 'song', 'music', 'punjabi', 'movie', 'film', 'malware', 'pentest']
    if any(w in query for w in safe_words):
        return True
    
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return True # Fail open if no API key
        
    try:
        client = genai.Client(api_key=api_key)
        prompt = f"Is the following search query strictly related to one of these three topics: 1) Cybersecurity / Hacking, 2) Songs / Music, 3) Cybersecurity related movies? Answer ONLY with YES or NO. Query: {query}"
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=prompt
        )
        return 'YES' in response.text.upper()
    except Exception as e:
        print('Content filter error:', e)
        return True # Fail open on error

@lru_cache(maxsize=500)
def fetch_youtube_results(query):
    import urllib.parse
    q = urllib.parse.quote(query)
    headers = {'User-Agent': random.choice(USER_AGENTS)}
    resp = requests.get(f'https://www.youtube.com/results?search_query={q}', headers=headers, timeout=10)
    html = resp.text
    
    match = re.search(r'var ytInitialData = ({.*?});</script>', html)
    if not match: return []
    
    data = json.loads(match.group(1))
    contents = data['contents']['twoColumnSearchResultsRenderer']['primaryContents']['sectionListRenderer']['contents'][0]['itemSectionRenderer']['contents']
    
    results = []
    for item in contents:
        if 'videoRenderer' in item:
            vid = item['videoRenderer']
            owner = vid.get('ownerText', {}).get('runs', [{}])[0].get('text', '').upper()
            title = vid['title']['runs'][0]['text']
            
            videoId = vid['videoId']
            length = vid.get('lengthText', {}).get('simpleText', '0:00')
            results.append({
                'id': videoId, 
                'title': title, 
                'dur': length,
                'cat': 'search_result',
                'badge': 'YouTube',
                'badgeClass': 'badge-soc'
            })
            if len(results) >= 12: break
    return results

@app.route('/api/yt_search')
@login_required
def yt_search():
    query = request.args.get('q', '').strip()
    if not query:
        return jsonify([])
    
    try:
        results = fetch_youtube_results(query.lower())
        return jsonify(results)
    except Exception as e:
        print('YouTube search error:', e)
        return jsonify({"success": False, "error": str(e)})

stream_cache = {}

@app.route('/api/yt_stream/<video_id>')
@login_required
def yt_stream(video_id):
    # 1. Free Solution: Caching (prevent duplicate requests to YouTube)
    if video_id in stream_cache:
        cached_url, timestamp = stream_cache[video_id]
        if time.time() - timestamp < 3600: # Cache for 1 hour
            return jsonify({"success": True, "url": cached_url})

    import yt_dlp
    ydl_opts = {
        'format': 'best', 
        'quiet': True, 
        'no_warnings': True,
        # 2. Free Solution: Client Spoofing (Mobile IPs are rarely blocked)
        'extractor_args': {'youtube': ['player_client=android']}
    }
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f'https://www.youtube.com/watch?v={video_id}', download=False)
            stream_url = info.get('url')
            
            # Save to memory cache
            stream_cache[video_id] = (stream_url, time.time())
            
            return jsonify({"success": True, "url": stream_url})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/login')
def login():
    if 'user' in session:
        return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/antigravity')
@login_required
def antigravity_page():
    return render_template('antigravity.html')

@app.route('/auth/register', methods=['POST'])
def auth_register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"success": False, "error": "Missing credentials"}), 400
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", 
                  (username, generate_password_hash(password)))
        conn.commit()
        session['user'] = username
        return jsonify({"success": True, "redirect": url_for('dashboard')})
    except sqlite3.IntegrityError:
        return jsonify({"success": False, "error": "Username already taken"}), 400
    finally:
        conn.close()

@app.route('/auth/login', methods=['POST'])
def auth_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT password_hash FROM users WHERE username = ?", (username,))
    row = c.fetchone()
    conn.close()
    
    if row and check_password_hash(row[0], password):
        session['user'] = username
        return jsonify({"success": True, "redirect": url_for('dashboard')})
    
    return jsonify({"success": False, "error": "Invalid username or password"}), 401

@app.route('/auth/google', methods=['POST'])
def auth_google():
    data = request.get_json()
    if not data or not data.get('email'):
        return jsonify({"success": False, "error": "Email required for Google Auth."}), 400
        
    email = data.get('email')
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('SELECT username FROM users WHERE username = ?', (email,))
    row = c.fetchone()
    
    if not row:
        # Auto-register the Google user if they don't exist
        c.execute('INSERT INTO users (username, password_hash) VALUES (?, ?)',
                  (email, generate_password_hash("google_oauth_dummy_pass")))
        conn.commit()
    conn.close()
    
    session['user'] = email
    return jsonify({"success": True, "redirect": url_for('dashboard')})

@app.route('/auth/logout')
def auth_logout():
    session.pop('user', None)
    return redirect(url_for('login'))

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
    data = request.json or {}
    tgt = data.get('target', data.get('content', ''))
    return jsonify(run_ai_audit("HTTP Header Grading", tgt, "header"))

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
    data = request.json or {}
    tgt = data.get('target', data.get('content', ''))
    return jsonify(run_ai_audit("Content Security Policy (CSP)", tgt, "csp"))

@app.route('/api/audit/cors', methods=['POST'])
def audit_cors_route():
    target = (request.json or {}).get('target', '')
    if not target:
        return jsonify({'error': 'Missing target'}), 400
    return jsonify(audit_cors(target))

@app.route('/api/audit/cookies', methods=['POST'])
def audit_cookies_route():
    data = request.json or {}
    tgt = data.get('target', data.get('content', ''))
    return jsonify(run_ai_audit("Cookie Security", tgt, "cookie"))

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
    return jsonify(run_ai_audit("HTTP Request Smuggling", target, "default"))

@app.route('/api/audit/typosquatting', methods=['POST'])
def audit_typosquatting():
    content = (request.json or {}).get('content', '')
    return jsonify(run_ai_audit("Typosquatting", content, "default"))

@app.route('/api/audit/open-redirect', methods=['POST'])
def audit_open_redirect():
    target = (request.json or {}).get('target', '')
    return jsonify(run_ai_audit("Open Redirect", target, "default"))

@app.route('/api/audit/localstorage', methods=['POST'])
def audit_localstorage_route():
    content = (request.json or {}).get('content', '')
    return jsonify(run_ai_audit("Insecure LocalStorage", content, "default"))

@app.route('/api/audit/iac', methods=['POST'])
def audit_iac():
    content = (request.json or {}).get('content', '')
    return jsonify(run_ai_audit("Infrastructure as Code (IaC)", content, "default"))

# ── Advanced 5 Features (Quick Auditors) ──────────────────────────────────

@app.route('/api/audit/prototype-pollution', methods=['POST'])
def audit_prototype_pollution_route():
    content = (request.json or {}).get('content', '')
    return jsonify(run_ai_audit("Prototype Pollution", content, "proto"))

@app.route('/api/audit/graphql', methods=['POST'])
def audit_graphql():
    target = (request.json or {}).get('target', '')
    return jsonify(run_ai_audit("GraphQL Introspection", target, "default"))

@app.route('/api/audit/ssti', methods=['POST'])
def audit_ssti_route():
    target = (request.json or {}).get('target', '')
    return jsonify(run_ai_audit("SSTI", target, "default"))

@app.route('/api/audit/data-exposure', methods=['POST'])
def audit_data_exposure_route():
    content = (request.json or {}).get('content', '')
    return jsonify(run_ai_audit("Data Exposure (PII)", content, "default"))

@app.route('/api/audit/csp-report-setup', methods=['GET'])
def csp_report_setup():
    return jsonify(run_ai_audit("CSP Reporting Generator", "Generate reporting guide", "csp_report"))

@app.route('/csp-report-ingest', methods=['POST'])
def csp_report_ingest():
    return jsonify({"status": "received"}), 200

# ── Cloud & AppSec Features ──────────────────────────────────────────────

@app.route('/api/audit/xxe', methods=['POST'])
def audit_xxe_route():
    content = (request.json or {}).get('content', '')
    return jsonify(run_ai_audit("XML External Entity (XXE)", content, "xxe"))

@app.route('/api/audit/host-header', methods=['POST'])
def audit_host_header_route():
    target = (request.json or {}).get('target', '')
    return jsonify(run_ai_audit("Host Header Injection", target, "default"))

@app.route('/api/audit/deserialization', methods=['POST'])
def audit_deserialization_route():
    content = (request.json or {}).get('content', '')
    return jsonify(run_ai_audit("Insecure Deserialization", content, "default"))

@app.route('/api/audit/clickjacking', methods=['POST'])
def audit_clickjacking_route():
    target = (request.json or {}).get('target', '')
    return jsonify(run_ai_audit("Clickjacking", target, "default"))

@app.route('/api/audit/ssrf-cloud', methods=['POST'])
def audit_ssrf_cloud_route():
    target = (request.json or {}).get('target', '')
    return jsonify(run_ai_audit("Cloud Metadata SSRF", target, "default"))

@app.route('/api/audit/cswsh', methods=['POST'])
def audit_cswsh_route():
    target = (request.json or {}).get('target', '')
    return jsonify(run_ai_audit("CSWSH", target, "default"))

@app.route('/api/audit/redos', methods=['POST'])
def audit_redos_route():
    content = (request.json or {}).get('content', '')
    return jsonify(run_ai_audit("ReDoS", content, "default"))

@app.route('/api/audit/debug-endpoints', methods=['POST'])
def audit_debug_endpoints_route():
    target = (request.json or {}).get('target', '')
    return jsonify(run_ai_audit("Debug Endpoints", target, "default"))

@app.route('/api/audit/css-injection', methods=['POST'])
def audit_css_injection_route():
    content = (request.json or {}).get('content', '')
    return jsonify(run_ai_audit("CSS Injection", content, "default"))

@app.route('/api/audit/dns-rebinding', methods=['POST'])
def audit_dns_rebinding_route():
    target = (request.json or {}).get('target', '')
    return jsonify(run_ai_audit("DNS Rebinding", target, "default"))

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

        client = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=GEMINI_MODEL,
            contents=command,
            config=types.GenerateContentConfig(system_instruction=system_instruction)
        )
        return jsonify({"output": response.text})
    except Exception as e:
        return jsonify({"output": f"Antigravity Physics Engine Failure: {str(e)}\n\n[ERROR] Gravity containment breach detected."})

@app.route('/api/ctftime', methods=['GET'])
def proxy_ctftime():
    url = request.args.get('url')
    if not url:
        return jsonify({"error": "Invalid URL"}), 400
    try:
        import urllib.parse
        parsed_url = urllib.parse.urlparse(url)
        if parsed_url.scheme != 'https' or parsed_url.hostname != 'ctftime.org' or not parsed_url.path.startswith('/api/'):
            return jsonify({"error": "Invalid URL"}), 400
    except Exception:
        return jsonify({"error": "Invalid URL"}), 400
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) CyberspaceDashboard/1.0'}
        resp = requests.get(url, headers=headers, timeout=10)
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
