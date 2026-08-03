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
import base64
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template, Response, redirect, url_for, session
from flask_socketio import SocketIO, emit, join_room, leave_room
from google import genai
from google.genai import types
import yt_dlp
from docker_manager import spawn_target, teardown_target
from scoring_engine import init_scoring_engine, submit_flag

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
socketio = SocketIO(app, cors_allowed_origins="*")

DB_PATH = os.environ.get("DB_PATH", "users.db")
DOMAIN_OR_IP_REGEX = r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6}$|^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'

# In-memory storage
active_games = {}
scan_tasks = {}

# Initialize scoring engine
init_scoring_engine(active_games, socketio)
active_terminals = {}

GEMINI_MODEL = "gemini-2.0-flash-lite"

# ==========================================
# YT-DLP / VIDEO STREAM CONFIGURATION
# ==========================================
class DummyLogger(object):
    def debug(self, msg): pass
    def warning(self, msg): pass
    def error(self, msg): pass

def get_yt_dlp_options():
    """
    Returns standard yt-dlp options configured with ffmpeg merging support,
    cookie handling, and client impersonation to prevent YouTube bot blocking.
    """
    opts = {
        'quiet': True,
        'no_warnings': True,
        'logger': DummyLogger(),
        'format': 'bestvideo+bestaudio/best',
        'extractor_args': {
            'youtube': {
                'player_client': ['ios', 'android', 'web']
            }
        }
    }
    
    # Pass cookies.txt if present in project directory
    if os.path.exists('cookies.txt'):
        opts['cookiefile'] = 'cookies.txt'
        
    return opts


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
            custom_flag TEXT,
            difficulty_level INTEGER DEFAULT 1
        )
    ''')
    try:
        c.execute('ALTER TABLE lobbies ADD COLUMN target_url TEXT')
    except sqlite3.OperationalError:
        pass
    try:
        c.execute('ALTER TABLE lobbies ADD COLUMN white_invite_code TEXT')
    except sqlite3.OperationalError:
        pass
    
    try:
        c.execute('ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0')
    except sqlite3.OperationalError:
        pass
        
    # Create default admin if it doesn't exist, and ensure it has admin rights
    c.execute("SELECT id FROM users WHERE username = 'admin'")
    if not c.fetchone():
        c.execute("INSERT INTO users (username, password_hash, is_admin) VALUES (?, ?, 1)", ('admin', generate_password_hash('admin123')))
    else:
        c.execute("UPDATE users SET is_admin = 1 WHERE username = 'admin'")

    c.execute('''
        CREATE TABLE IF NOT EXISTS lobby_members (
            lobby_id TEXT NOT NULL,
            username TEXT NOT NULL,
            team TEXT NOT NULL,
            FOREIGN KEY(lobby_id) REFERENCES lobbies(id)
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            return redirect(url_for('login'))
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT is_admin FROM users WHERE username = ?", (session['user'],))
        row = c.fetchone()
        conn.close()
        
        if not row or not row[0]:
            return redirect(url_for('dashboard'))
            
        return f(*args, **kwargs)
    return decorated_function


def run_ai_audit(tool_name, input_data, expected_keys=None):
    api_key = os.environ.get('GEMINI_API_KEY')
    if not api_key:
        return {'findings': [{'issue': 'GEMINI_API_KEY not set', 'detail': 'Add your API key to environment variables.', 'fix': ''}]}
    try:
        client = genai.Client(api_key=api_key)

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
    flags = ["-F", "-sV"] if "Fast" in depth else ["-p-", "-sV"] if "Full" in depth else ["-sn"]
    command = ["nmap"] + flags + ["-oX", "-", target]
    
    try:
        process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        xml_output = []
        for line in process.stdout:
            scan_tasks[task_id]['logs'].append(line)
            xml_output.append(line)
            
        process.wait()
        parsed_results = parse_nmap_xml("".join(xml_output))
        
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
        bandit_res = subprocess.run(["python", "-m", "bandit", "-r", target_path, "-f", "json"], capture_output=True, text=True, timeout=120)
        bandit_data = json.loads(bandit_res.stdout) if bandit_res.stdout else {}

        scan_tasks[task_id]['logs'].append("[+] Starting pip-audit (SCA) scan...\n")
        audit_res = subprocess.run(["python", "-m", "pip_audit", "-r", f"{target_path}/requirements.txt", "-f", "json"], capture_output=True, text=True, timeout=120)
        audit_data = json.loads(audit_res.stdout) if audit_res.stdout else []

        scan_tasks[task_id]["status"] = "completed"
        scan_tasks[task_id]["results"] = {"type": "code", "sast": bandit_data, "sca": audit_data}
    except Exception as e:
        scan_tasks[task_id]["status"] = "error"
        scan_tasks[task_id]["message"] = str(e)


def run_nessus_task(task_id, target):
    try:
        scan_tasks[task_id]['logs'].append(f"[+] Initializing AI Penetration Engine on {target}...\n")
        report = run_nessus_scan(target, log_callback=lambda msg: scan_tasks[task_id]['logs'].append(msg))
        scan_tasks[task_id]["status"] = "completed"
        scan_tasks[task_id]["results"] = {"type": "nessus", "report": report}
    except Exception as e:
        scan_tasks[task_id]["status"] = "error"
        scan_tasks[task_id]["message"] = str(e)


# ==========================================
# YOUTUBE STREAM API ENDPOINT
# ==========================================
@app.route('/api/video/extract', methods=['POST'])
@login_required
def extract_video_stream():
    data = request.json or {}
    url = data.get('url', '').strip()

    if not url:
        return jsonify({"success": False, "error": "URL parameter required"}), 400

    try:
        ydl_opts = get_yt_dlp_options()
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            stream_url = info.get('url') or info.get('manifest_url')
            
            return jsonify({
                "success": True,
                "title": info.get('title'),
                "stream_url": stream_url,
                "duration": info.get('duration')
            })
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/yt_stream/<video_id>', methods=['GET'])
@login_required
def yt_stream(video_id):
    url = f"https://www.youtube.com/watch?v={video_id}"
    try:
        ydl_opts = get_yt_dlp_options()
        ydl_opts['format'] = '18/best[ext=mp4]/best'
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            stream_url = info.get('url') or info.get('manifest_url')
            
            return jsonify({
                "success": True,
                "title": info.get('title'),
                "url": stream_url,
                "duration": info.get('duration')
            })
    except Exception as e:
        import traceback
        tb = traceback.format_exc()
        return jsonify({"success": False, "error": str(e), "traceback": tb})

import requests

def internal_youtube_search(query, max_results=10):
    try:
        ydl_opts = get_yt_dlp_options()
        ydl_opts['extract_flat'] = True
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(f'ytsearch{max_results}:{query}', download=False)
            results = []
            for entry in info.get('entries', []):
                results.append({'id': entry.get('id'), 'title': entry.get('title')})
            return results
    except Exception as e:
        print("Search Error:", e)
        return []

@app.route('/api/yt_search')
@login_required
def yt_search():
    query = request.args.get('q', '')
    if not query:
        return jsonify([])
        
    try:
        results = internal_youtube_search(query, max_results=10)
        return jsonify(results)
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route('/')
def home():
    if 'user' in session:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("SELECT is_admin FROM users WHERE username = ?", (session['user'],))
        row = c.fetchone()
        conn.close()
        
        if row and row[0]:
            return redirect(url_for('admin_dashboard'))
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))


@app.route('/dashboard')
@login_required
def dashboard():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    try:
        c.execute("SELECT is_admin FROM users WHERE username = ?", (session['user'],))
        row = c.fetchone()
        if row and row[0]:
            conn.close()
            return redirect(url_for('admin_dashboard'))
            
        c.execute("SELECT wins, matches_played, total_score FROM users WHERE username = ?", (session['user'],))
        stats = c.fetchone()
    except Exception:
        stats = None
    conn.close()
    
    user_stats = {
        "wins": stats[0] if stats else 0,
        "matches_played": stats[1] if stats else 0,
        "total_score": stats[2] if stats else 0
    }
    return render_template('index.html', user_stats=user_stats)

@app.route('/admin')
@admin_required
def admin_dashboard():
    return render_template('admin.html')

@app.route('/api/admin/lobbies', methods=['GET'])
@admin_required
def get_admin_lobbies():
    lobbies = []
    for lobby_id, game in active_games.items():
        lobbies.append({
            "id": lobby_id,
            "scenario": game.get("scenario"),
            "status": game.get("status"),
            "health": game.get("health")
        })
    return jsonify({"success": True, "lobbies": lobbies})


@app.route('/academy')
@login_required
def academy():
    return render_template('academy.html')

@app.route('/learn')
@login_required
def learn():
    return render_template('learn.html')

@app.route('/favicon.ico')
def favicon():
    return '', 204


@app.route('/practice')
@login_required
def practice():
    terminal_url = os.environ.get('TERMINAL_BACKEND_URL', 'http://localhost:3001')
    return render_template('practice.html', terminal_url=terminal_url)


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
    target_url = data.get('target_url', '')
    difficulty_level = int(data.get('difficulty_level', 1))
    
    lobby_id = str(uuid.uuid4())[:8]
    red_invite_code = 'R-' + str(uuid.uuid4())[:6]
    blue_invite_code = 'B-' + str(uuid.uuid4())[:6]
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("INSERT INTO lobbies (id, host_username, max_players, scenario, red_invite_code, blue_invite_code, custom_desc, custom_flag, target_url, difficulty_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
              (lobby_id, session['user'], max_players, scenario, red_invite_code, blue_invite_code, custom_desc, custom_flag, target_url, difficulty_level))
    c.execute("INSERT INTO lobby_members (lobby_id, username, team) VALUES (?, ?, ?)",
              (lobby_id, session['user'], host_team))
    conn.commit()
    conn.close()
    
    active_games[lobby_id] = {
        'scenario': scenario,
        'custom_desc': custom_desc,
        'custom_flag': custom_flag,
        'difficulty_level': difficulty_level,
        'health': 100,
        'rules': [],
        'logs': [
            f"<span class='text-cyan-400 font-bold'>[{time.strftime('%H:%M:%S')}] [INTEL] SOC initialized. Threat intel suggests attacker may use SQL injection (e.g. ' OR 1=1), UNION-based exfiltration, or destructive DROP commands. Deploy Regex WAF rules to block these patterns!</span>"
        ],
        'real_payloads': [],
        'status': 'waiting',
        'target_state': 'packed',
        'presence': {},
        'winner': None,
        'network_latency': False
    }
    return jsonify({"success": True, "lobby_id": lobby_id, "red_invite_code": red_invite_code, "blue_invite_code": blue_invite_code})


@app.route('/api/game/attack', methods=['POST'])
@login_required
def game_attack():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    payload = data.get('payload', '').strip()
    is_encoded = data.get('is_encoded', False)
    
    if is_encoded:
        try:
            payload = base64.b64decode(payload).decode('utf-8')
        except Exception:
            pass
            
    game = active_games.get(lobby_id)
    if not game or game['status'] != 'active':
        return jsonify({"success": False, "error": "Game not found or inactive"})
        
    if game.get('network_latency'):
        time.sleep(2)
        import random
        if random.random() < 0.2:
            return jsonify({"success": False, "error": "Connection timed out (Network Latency Simulator)"})
        
    blocked = any(re.search(rule, payload, re.IGNORECASE) for rule in game['rules'] if rule)
    timestamp = time.strftime('%H:%M:%S')
    encoded_payload = base64.b64encode(payload.encode('utf-8')).decode('utf-8')
    user = session.get('user', 'Hacker').split('@')[0]
    
    game.setdefault('real_payloads', []).append({"timestamp": timestamp, "payload": payload, "blocked": blocked, "encrypted": encoded_payload})
    game.setdefault('red_terminal_logs', []).append(f"<div class='text-slate-400'>&gt; [{user}] Executing payload: {payload}</div>")
    
    if blocked:
        game.setdefault('red_terminal_logs', []).append(f"<div class='text-red-500 font-bold'>&gt; [{user}] Attack blocked by WAF!</div>")
        game['logs'].append(f"<span class='text-emerald-500 font-bold'>[{timestamp}] [BLOCKED] Malicious Traffic Blocked by WAF</span>")
        return jsonify({"success": False, "error": "Your attack was blocked by the WAF!"})
        
    success = any(kw in payload.upper() for kw in ['OR 1=1', 'UNION SELECT', '<SCRIPT>', ';', '&&', '../'])
    if success:
        game.setdefault('red_terminal_logs', []).append(f"<div class='text-emerald-500 font-bold'>&gt; [{user}] Target exploited successfully!</div>")
        game['target_state'] = 'unpacked'
        game['logs'].append(f"<span class='text-red-500 font-bold'>[{timestamp}] [BREACH] Target exploited successfully! Integrity compromised.</span>")
    else:
        game.setdefault('red_terminal_logs', []).append(f"<div class='text-slate-500'>&gt; [{user}] Payload failed to exploit target.</div>")
        game['logs'].append(f"<span class='text-yellow-400'>[{timestamp}] [TRAFFIC] Suspicious input dropped by application logic: `{payload[:15]}...`</span>")
        
    return jsonify({"success": success, "message": "Payload executed successfully" if success else "Payload failed to exploit target"})


@app.route('/api/game/defend', methods=['POST'])
@login_required
def game_defend():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    rule = data.get('rule', '').strip()
    is_encoded = data.get('is_encoded', False)
    
    if is_encoded:
        try:
            import base64
            rule = base64.b64decode(rule).decode('utf-8')
        except Exception:
            pass

    game = active_games.get(lobby_id)
    if not game or game['status'] != 'active':
        return jsonify({"success": False, "error": "Game inactive"})
        
    if game.get('network_latency'):
        time.sleep(2)
        import random
        if random.random() < 0.2:
            return jsonify({"success": False, "error": "Connection timed out (Network Latency Simulator)"})

    try:
        compiled_rule = re.compile(rule, re.IGNORECASE)
    except re.error:
        user = session.get('user', 'Defender').split('@')[0]
        game['logs'].append(f"<span class='text-red-400 font-bold'>[{time.strftime('%H:%M:%S')}] [WAF ERROR] {user} submitted invalid regex rule!</span>")
        return jsonify({"success": False, "error": "Invalid regex pattern!"})
        
    # Check for False Positives (must not block legitimate traffic)
    benign_strings = ["test_user", "admin123", "aaaaa", "hello world", "123456", "jane_doe"]
    if any(compiled_rule.search(benign) for benign in benign_strings) or len(rule) < 4:
        user = session.get('user', 'Defender').split('@')[0]
        game['logs'].append(f"<span class='text-amber-400 font-bold'>[{time.strftime('%H:%M:%S')}] [WAF REJECTED] Rule `{rule}` by {user} was rejected (Blocks legitimate traffic or is too broad)!</span>")
        return jsonify({"success": False, "error": "Rule rejected! It blocks legitimate user traffic or is too short."})

    user = session.get('user', 'Defender').split('@')[0]
    game['rules'].append(rule)
    game['target_state'] = 'packed'
    game['logs'].append(f"<span class='text-cyan-400 font-bold'>[{time.strftime('%H:%M:%S')}] [WAF UPDATED] Rule added by {user}: `{rule}`</span>")
    
    return jsonify({"success": True, "message": "WAF rule deployed"})


@app.route('/api/scan/start', methods=['POST'])
@login_required
def start_scan():
    data = request.json or {}
    target = data.get('target', '').strip()
    scan_type = data.get('type', 'network')
    depth = data.get('depth', 'Fast')

    task_id = str(uuid.uuid4())[:8]
    scan_tasks[task_id] = {"status": "running", "target": target, "type": scan_type, "logs": [], "results": None}

    if scan_type == 'network':
        threading.Thread(target=run_scan_task, args=(task_id, target, depth), daemon=True).start()
    elif scan_type == 'code':
        threading.Thread(target=run_code_scan_task, args=(task_id, target), daemon=True).start()
    elif scan_type == 'nessus':
        threading.Thread(target=run_nessus_task, args=(task_id, target), daemon=True).start()

    return jsonify({"success": True, "task_id": task_id})


@app.route('/api/scan/status/<task_id>', methods=['GET'])
@login_required
def get_scan_status(task_id):
    task = scan_tasks.get(task_id)
    if not task:
        return jsonify({"success": False, "error": "Task not found"}), 404
    return jsonify({"success": True, "status": task.get("status"), "logs": task.get("logs", []), "results": task.get("results")})


@app.route('/login', methods=['GET'])
def login():
    return render_template('login.html')

@app.route('/auth/login', methods=['POST'])
def auth_login():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT password_hash, is_admin FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    conn.close()

    if user and check_password_hash(user[0], password):
        session['user'] = username
        is_admin = user[1]
        
        redirect_url = url_for('admin_dashboard') if is_admin else url_for('dashboard')
        return jsonify({"success": True, "redirect": redirect_url})

    return jsonify({"success": False, "error": "Invalid username or password"})

@app.route('/auth/register', methods=['POST'])
def auth_register():
    data = request.json or {}
    username = data.get('username', '').strip()
    password = data.get('password', '').strip()

    if not username or not password:
        return jsonify({"success": False, "error": "Username and password required"})

    try:
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, generate_password_hash(password)))
        conn.commit()
        conn.close()
        return jsonify({"success": True})
    except sqlite3.IntegrityError:
        if 'conn' in locals():
            conn.close()
        return jsonify({"success": False, "error": "Username already exists"})

@app.route('/auth/google', methods=['POST'])
def auth_google():
    data = request.json or {}
    email = data.get('email', '').strip()
    
    if not email:
        return jsonify({"success": False, "error": "Email is required"})
        
    username = email.split('@')[0] if '@' in email else email
    
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT username FROM users WHERE username = ?", (username,))
    user = c.fetchone()
    
    if not user:
        dummy_hash = generate_password_hash(uuid.uuid4().hex)
        c.execute("INSERT INTO users (username, password_hash) VALUES (?, ?)", (username, dummy_hash))
        conn.commit()
        
    conn.close()
    
    session['user'] = username
    return jsonify({"success": True, "redirect": url_for('dashboard')})

@app.route('/auth/logout', methods=['GET'])
def auth_logout():
    session.clear()
    return redirect(url_for('login'))


@app.route('/logout')
def logout():
    session.pop('user', None)
    return redirect(url_for('login'))


import time
import os
import uuid
import sqlite3
from flask import jsonify, request, session

# === NEW MULTIPLAYER ROUTES ===

@app.route('/api/lobby/status/<lobby_id>', methods=['GET'])
@login_required
def get_lobby_status(lobby_id):
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT host_username, max_players, status, target_url, red_invite_code, blue_invite_code, scenario, custom_desc FROM lobbies WHERE id = ?", (lobby_id,))
    lobby = c.fetchone()
    if not lobby:
        conn.close()
        return jsonify({"success": False, "error": "Lobby not found"}), 404
        
    c.execute("SELECT username, team FROM lobby_members WHERE lobby_id = ?", (lobby_id,))
    members = c.fetchall()
    conn.close()
    
    red_team = [m[0] for m in members if m[1] == 'red']
    blue_team = [m[0] for m in members if m[1] == 'blue']
    
    leaders = {
        "red": red_team[0] if len(red_team) > 0 else None,
        "blue": blue_team[0] if len(blue_team) > 0 else None
    }
    
    
    connected_users = []
    now = time.time()
    
    presence = lobby_presence.get(lobby_id, {})
    for u, t in presence.items():
        if now - t < 5:
            connected_users.append(u)
            
    red_connected = sum(1 for p in red_team if p in connected_users)
    blue_connected = sum(1 for p in blue_team if p in connected_users)
    
    # Fallback to active_games presence if missing
    game = active_games.get(lobby_id)
    if game:
        game_presence = game.get('presence', {})
        for p in red_team + blue_team:
            if now - game_presence.get(p, 0) < 5 and p not in connected_users:
                connected_users.append(p)
        red_connected = sum(1 for p in red_team if p in connected_users)
        blue_connected = sum(1 for p in blue_team if p in connected_users)
        
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
        "members": {"red": red_team, "blue": blue_team},
        "leaders": leaders,
        "is_leader": session.get('user') in leaders.values(),
        "connected_users": connected_users,
        "presence": {"red": red_present, "blue": blue_present}
    })

@app.route('/api/lobby/demo-join', methods=['POST'])
@login_required
def demo_join_lobby():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    team = data.get('team')
    if not lobby_id or not team:
        return jsonify({"success": False, "error": "Missing parameters"}), 400
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False, "error": "Lobby not found"}), 404
    return jsonify({"success": True, "lobby_id": lobby_id, "team": team, "demo": True})

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
            
        c.execute("SELECT id, max_players, red_invite_code, blue_invite_code, status FROM lobbies WHERE id = ?", (lobby_id,))
        lobby = c.fetchone()
        if not lobby:
            conn.close()
            return jsonify({"success": False, "error": "Invalid Lobby ID"}), 404
            
        max_players = lobby[1]
        red_code = lobby[2]
        blue_code = lobby[3]
        lobby_status = lobby[4]
    else:
        invite_code = data.get('invite_code')
        if not invite_code:
            conn.close()
            return jsonify({"success": False, "error": "Invite code required"}), 400
            
        c.execute("SELECT id, max_players, red_invite_code, blue_invite_code, status FROM lobbies WHERE red_invite_code = ? OR blue_invite_code = ?", (invite_code, invite_code))
        lobby = c.fetchone()
        if not lobby:
            conn.close()
            return jsonify({"success": False, "error": "Invalid invite code"}), 404
            
        lobby_id = lobby[0]
        max_players = lobby[1]
        red_code = lobby[2]
        blue_code = lobby[3]
        lobby_status = lobby[4]
        if invite_code == red_code:
            team = 'red'
        elif invite_code == blue_code:
            team = 'blue'
        else:
            conn.close()
            return jsonify({"success": False, "error": "Invalid invite code"}), 404
        
    team_size = max_players // 2
    
    # For leaders, ensure the team is absolutely empty before joining
    if role == 'leader':
        c.execute("SELECT COUNT(*) FROM lobby_members WHERE lobby_id = ? AND team = ?", (lobby_id, team))
        if c.fetchone()[0] > 0:
            conn.close()
            return jsonify({"success": False, "error": f"{team.title()} Team already has a captain! Please change the team option and try again."}), 400

    # Check if user already in lobby
    c.execute("SELECT team FROM lobby_members WHERE lobby_id = ? AND username = ?", (lobby_id, session['user']))
    existing_member = c.fetchone()
    if existing_member:
        actual_team = existing_member[0]
        conn.close()
        if actual_team != team:
            # For local testing, allow the user to join as the other team (Demo Mode behavior)
            return jsonify({"success": True, "message": "Joined as opposite team for testing", "lobby_id": lobby_id, "team": team, "red_code": red_code, "blue_code": blue_code, "status": lobby_status, "demo": True})
        return jsonify({"success": True, "message": "Already in lobby", "lobby_id": lobby_id, "team": actual_team, "red_code": red_code, "blue_code": blue_code, "status": lobby_status})
        
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
    
    return jsonify({"success": True, "lobby_id": lobby_id, "team": team, "red_code": red_code, "blue_code": blue_code, "status": lobby_status})

@app.route('/api/lobby/start', methods=['POST'])
@login_required
def start_lobby():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    if not lobby_id:
        return jsonify({"success": False, "error": "Missing parameters"}), 400
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT scenario, target_url FROM lobbies WHERE id = ?", (lobby_id,))
    row = c.fetchone()
    scenario = row[0] if row else ''
    target_url = row[1] if row else ''
    
    c.execute("UPDATE lobbies SET status = 'active' WHERE id = ?", (lobby_id,))
    conn.commit()
    conn.close()
    active_games[lobby_id] = {
        'health': 100, 'rules': [], 'logs': [], 'status': 'active', 
        'presence': {}, 'winner': None, 'target_state': 'packed', 'real_payloads': [], 'network_latency': False
    }
    
    target_info = {}
    if scenario == 'real_target' and target_url:
        active_games[lobby_id]['target_ip'] = target_url
        target_info = {"success": True, "ip": target_url, "simulated": False, "is_real_external": True}
    else:
        # Spawn vulnerable target (Docker Phase 2)
        target_info = spawn_target(lobby_id)
        active_games[lobby_id]['target_ip'] = target_info.get('ip', 'N/A')
    
    active_games[lobby_id]['status'] = 'active'
    active_games[lobby_id]['start_time'] = time.time() + 10
    
    socketio.emit('live_event_update', {'message': 'Game started!'}, room=lobby_id)
    return jsonify({"success": True, "target_info": target_info})

@app.route('/api/game/state/<lobby_id>', methods=['GET'])
@login_required
def game_state(lobby_id):
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False, "error": "Game not found"}), 404
        
    now = time.time()
    red_present = False
    blue_present = False
    time_remaining = None
    if 'start_time' in game and game['status'] == 'active':
        elapsed = now - game['start_time']
        if elapsed > 0:
            time_remaining = max(0, 300 - int(elapsed))
        else:
            time_remaining = 300
    
    return jsonify({
        "success": True,
        "health": game.get('health', 100),
        "status": game.get('status', 'waiting'),
        "logs": game.get('logs', [])[-20:],
        "red_terminal_logs": game.get('red_terminal_logs', []),
        "presence": {"red": red_present, "blue": blue_present},
        "winner": game.get('winner'),
        "target_state": game.get('target_state', 'packed'),
        "target_ip": game.get('target_ip', ''),
        "time_remaining": time_remaining
    })

@app.route('/api/game/ping', methods=['POST'])
@login_required
def game_ping():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    if not lobby_id:
        return jsonify({"success": False}), 400
        
    if lobby_id not in lobby_presence:
        lobby_presence[lobby_id] = {}
    lobby_presence[lobby_id][session.get('user')] = time.time()
    
    game = active_games.get(lobby_id)
    if game:
        if 'presence' not in game:
            game['presence'] = {}
        game['presence'][session.get('user')] = time.time()
    return jsonify({"success": True})

@app.route('/api/game/decrypt', methods=['POST'])
@login_required
def game_decrypt():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False}), 404
    game['target_state'] = 'unpacked'
    game['logs'].append(f"<span class='text-purple-400'>[{time.strftime('%H:%M:%S')}] Target service unpacked! Vulnerabilities exposed.</span>")
    return jsonify({"success": True})

@app.route('/api/game/verify', methods=['POST'])
@login_required
def game_verify():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False}), 404
    game['target_state'] = 'packed'
    game['logs'].append(f"<span class='text-cyan-400'>[{time.strftime('%H:%M:%S')}] System verified and repacked. Secure state restored.</span>")
    return jsonify({"success": True})

@app.route('/api/game/investigate', methods=['POST'])
@login_required
def game_investigate():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False}), 404
    game['health'] = min(100, game.get('health', 100) + 10)
    game['logs'].append(f"<span class='text-cyan-400'>[{time.strftime('%H:%M:%S')}] Blue team investigated anomaly. System stability improved. (+10 Health)</span>")
    return jsonify({"success": True})

@app.route('/api/game/surrender', methods=['POST'])
@login_required
def game_surrender():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    team = data.get('team')
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False}), 404
    game['status'] = 'surrendered'
    game['winner'] = 'Blue Team' if team == 'red' else 'Red Team'
    game['logs'].append(f"<span class='text-yellow-400'>[{time.strftime('%H:%M:%S')}] {team.upper()} TEAM SURRENDERED.</span>")
    teardown_target(lobby_id)
    socketio.emit('live_event_update', {'message': f'{team.upper()} team surrendered!'}, room=lobby_id)
    return jsonify({"success": True})

@app.route('/api/game/end_timer', methods=['POST'])
@login_required
def game_end_timer():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False}), 404
    if game.get('target_state') == 'unpacked':
        game['status'] = 'red_wins'
        game['winner'] = 'Red Team'
    else:
        game['status'] = 'blue_wins'
        game['winner'] = 'Blue Team'
    teardown_target(lobby_id)
    socketio.emit('live_event_update', {'message': 'Timer ended!'}, room=lobby_id)
    return jsonify({"success": True})

@app.route('/api/game/flag', methods=['POST'])
@login_required
def game_flag():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    team = data.get('team')
    flag = data.get('flag')
    
    if not lobby_id or not team or not flag:
        return jsonify({"success": False, "error": "Missing parameters"}), 400
        
    return jsonify(submit_flag(lobby_id, team, flag))

# === GAMEMASTER (WHITE TEAM) ENDPOINTS ===

@app.route('/api/game/inject_noise', methods=['POST'])
@admin_required
def inject_noise():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False}), 404
        
    import random
    benign_payloads = [
        "GET /login HTTP/1.1",
        "GET /static/css/style.css HTTP/1.1",
        "POST /api/user/status HTTP/1.1",
        "GET /index.html?ref=google HTTP/1.1",
        "GET /favicon.ico HTTP/1.1"
    ]
    for _ in range(5):
        payload = random.choice(benign_payloads)
        ts = time.strftime('%H:%M:%S')
        game.setdefault('real_payloads', []).append({"timestamp": ts, "payload": payload, "blocked": False, "encrypted": base64.b64encode(payload.encode()).decode()})
        game['logs'].append(f"<span class='text-slate-400'>[{ts}] [BACKGROUND NOISE] Traffic: `{payload}`</span>")
    
    socketio.emit('live_event_update', {'message': 'Background noise injected'}, room=lobby_id)
    return jsonify({"success": True})

@app.route('/api/game/network_degrade', methods=['POST'])
@admin_required
def network_degrade():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    enable = data.get('enable', False)
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False}), 404
        
    game['network_latency'] = enable
    status_str = "ENABLED" if enable else "DISABLED"
    game['logs'].append(f"<span class='text-orange-400 font-bold'>[{time.strftime('%H:%M:%S')}] [NETWORK EVENT] High Latency / Packet Loss {status_str}</span>")
    socketio.emit('live_event_update', {'message': f'Network degradation {status_str}'}, room=lobby_id)
    return jsonify({"success": True})

@app.route('/api/game/hardware_event', methods=['POST'])
@admin_required
def hardware_event():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    game = active_games.get(lobby_id)
    if not game:
        return jsonify({"success": False}), 404
        
    game['target_state'] = 'unpacked'
    game['logs'].append(f"<span class='text-red-600 font-bold'>[{time.strftime('%H:%M:%S')}] [HARDWARE EVENT] Malicious USB Dropped in facility! WAF bypassed. Target compromised.</span>")
    socketio.emit('live_event_update', {'message': 'Critical Hardware Security Event'}, room=lobby_id)
    return jsonify({"success": True})

@app.route('/api/game/pcap/<lobby_id>', methods=['GET'])
@login_required
def get_pcap(lobby_id):
    game = active_games.get(lobby_id)
    if not game:
        return "Game not found", 404
    
    # Generate a dummy PCAP format text containing recent payloads for forensic analysis
    pcap_data = "PCAP DUMP START\n================\n"
    for p in game.get('real_payloads', []):
        pcap_data += f"Time: {p['timestamp']}\nPayload: {p['payload']}\nBlocked: {p['blocked']}\n---\n"
    pcap_data += "================\nPCAP DUMP END"
    
    return Response(pcap_data, mimetype='text/plain', headers={"Content-Disposition": f"attachment;filename=network_capture_{lobby_id}.pcap.txt"})

@app.route('/api/tools/red/<scenario>', methods=['GET'])
@login_required
def get_red_tools(scenario):
    tools = []
    if scenario == 'web_breach':
        tools = [{"id": "nmap", "name": "Nmap Scan", "cost": 10}, {"id": "sqlmap", "name": "SQLMap Injection", "cost": 30}]
    elif scenario == 'ransomware':
        tools = [{"id": "phish", "name": "Spear Phish", "cost": 20}, {"id": "encrypt", "name": "Deploy Ransomware", "cost": 50}]
    else:
        # Default/sqli_login tools
        tools = [
            {"id": "sql_auth_bypass", "name": "Auth Bypass (Classic)", "level": "Basic", "desc": "Bypass login screen by making the username check always true.", "payload": "' OR 1=1 --", "damage": 20},
            {"id": "sql_union", "name": "UNION Select Users", "level": "Intermediate", "desc": "Extract data from the users table using UNION.", "payload": "' UNION SELECT username, password FROM users --", "damage": 35},
            {"id": "sql_drop", "name": "DROP Table", "level": "Advanced", "desc": "Highly destructive payload to drop tables.", "payload": "admin'; DROP TABLE users; --", "damage": 50}
        ]
    return jsonify({"success": True, "tools": tools})

@app.route('/api/tools/blue/<scenario>', methods=['GET'])
@login_required
def get_blue_tools(scenario):
    tools = []
    if scenario == 'web_breach':
        tools = [{"rule": "waf", "label": "Deploy WAF Rule", "cost": 20}, {"rule": "patch", "label": "Patch Vuln", "cost": 30}]
    elif scenario == 'ransomware':
        tools = [{"rule": "isolate", "label": "Isolate Host", "cost": 25}, {"rule": "backup", "label": "Restore Backup", "cost": 40}]
    else:
        # Default/sqli_login tools (WAF Regex Rules)
        tools = [
            {"rule": "OR\\s+1\\s*=\\s*1", "label": "Block Auth Bypass", "level": "Basic", "tip": "Deploy a WAF Regex rule to block basic boolean SQL injections like ' OR 1=1"},
            {"rule": "UNION\\s+SELECT", "label": "Block Data Exfiltration", "level": "Intermediate", "tip": "Deploy a WAF Regex rule to block UNION SELECT statements"},
            {"rule": "DROP\\s+TABLE", "label": "Block Destructive Commands", "level": "Advanced", "tip": "Deploy a WAF Regex rule to block destructive DROP queries"}
        ]
    return jsonify({"success": True, "tools": tools})


@app.route('/settings', methods=['GET'])
@login_required
def settings():
    return render_template('settings.html')

@app.route('/scoreboard', methods=['GET'])
@login_required
def scoreboard():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT username, wins, matches_played, total_score FROM users ORDER BY total_score DESC, wins DESC LIMIT 50")
    leaders = c.fetchall()
    conn.close()
    return render_template('scoreboard.html', leaders=leaders)

@app.route('/crypto', methods=['GET'])
@login_required
def crypto():
    return render_template('crypto.html')


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

# â”€â”€ Batch 2 & 3: Web Auditors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

# â”€â”€ Batch 4: AI & Advanced Auditors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

# â”€â”€ Final 5 Specialized Auditors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

# â”€â”€ IP Port Scanner â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

# â”€â”€ Enterprise 5 Features â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

# â”€â”€ Advanced 5 Features (Quick Auditors) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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

# â”€â”€ Cloud & AppSec Features â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

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


# ---------------------------------------------------------
# WEBSOCKET / REAL-TIME ENGINE (CYBER RANGE PHASE 1)
# ---------------------------------------------------------

@socketio.on('join_game_room')
def on_join(data):
    lobby_id = data.get('lobby_id')
    username = data.get('username')
    if lobby_id and username:
        join_room(lobby_id)
        emit('player_joined', {'username': username, 'message': f'{username} has entered the range.'}, to=lobby_id)

@socketio.on('leave_game_room')
def on_leave(data):
    lobby_id = data.get('lobby_id')
    username = data.get('username')
    if lobby_id and username:
        leave_room(lobby_id)
        emit('player_left', {'username': username, 'message': f'{username} has disconnected.'}, to=lobby_id)

@socketio.on('chat_message')
def on_chat(data):
    lobby_id = data.get('lobby_id')
    if lobby_id:
        emit('new_message', data, to=lobby_id)

@socketio.on('game_event')
def on_game_event(data):
    lobby_id = data.get('lobby_id')
    if lobby_id:
        emit('live_event_update', data, to=lobby_id)


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False, allow_unsafe_werkzeug=True)
