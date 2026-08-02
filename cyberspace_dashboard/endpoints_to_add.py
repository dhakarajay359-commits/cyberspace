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
        "members": {"red": red_team, "blue": blue_team},
        "leaders": leaders,
        "is_leader": session.get('user') in leaders.values(),
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
    code = data.get('invite_code', '').strip()
    if not code:
        return jsonify({"success": False, "error": "Missing invite code"}), 400
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT id, max_players, status, red_invite_code, blue_invite_code FROM lobbies WHERE red_invite_code = ? OR blue_invite_code = ?", (code, code))
    lobby = c.fetchone()
    if not lobby:
        conn.close()
        return jsonify({"success": False, "error": "Invalid invite code"}), 404
    lobby_id, max_players, status, red_code, blue_code = lobby
    team = 'red' if code == red_code else 'blue'
    
    c.execute("SELECT COUNT(*) FROM lobby_members WHERE lobby_id = ?", (lobby_id,))
    count = c.fetchone()[0]
    if count >= max_players:
        conn.close()
        return jsonify({"success": False, "error": "Lobby is full"}), 403
        
    c.execute("SELECT team FROM lobby_members WHERE lobby_id = ? AND username = ?", (lobby_id, session['user']))
    existing = c.fetchone()
    if existing:
        if existing[0] != team:
            c.execute("UPDATE lobby_members SET team = ? WHERE lobby_id = ? AND username = ?", (team, lobby_id, session['user']))
            conn.commit()
    else:
        c.execute("INSERT INTO lobby_members (lobby_id, username, team) VALUES (?, ?, ?)", (lobby_id, session['user'], team))
        conn.commit()
    conn.close()
    return jsonify({"success": True, "lobby_id": lobby_id, "team": team})

@app.route('/api/lobby/start', methods=['POST'])
@login_required
def start_lobby():
    data = request.json or {}
    lobby_id = data.get('lobby_id')
    if not lobby_id:
        return jsonify({"success": False, "error": "Missing parameters"}), 400
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("UPDATE lobbies SET status = 'active' WHERE id = ?", (lobby_id,))
    conn.commit()
    conn.close()
    if lobby_id not in active_games:
        active_games[lobby_id] = {
            'health': 100, 'rules': [], 'logs': [], 'status': 'active', 
            'presence': {}, 'winner': None, 'target_state': 'packed', 'real_payloads': []
        }
    active_games[lobby_id]['status'] = 'active'
    active_games[lobby_id]['start_time'] = time.time() + 10
    return jsonify({"success": True})

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
        "health": game['health'],
        "status": game['status'],
        "logs": game['logs'][-20:],
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
    if not lobby_id:
        return jsonify({"success": False}), 400
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
    return jsonify({"success": True})

@app.route('/api/tools/red/<scenario>', methods=['GET'])
@login_required
def get_red_tools(scenario):
    tools = []
    if scenario == 'web_breach':
        tools = [{"id": "nmap", "name": "Nmap Scan", "cost": 10}, {"id": "sqlmap", "name": "SQLMap Injection", "cost": 30}]
    elif scenario == 'ransomware':
        tools = [{"id": "phish", "name": "Spear Phish", "cost": 20}, {"id": "encrypt", "name": "Deploy Ransomware", "cost": 50}]
    return jsonify({"success": True, "tools": tools})

@app.route('/api/tools/blue/<scenario>', methods=['GET'])
@login_required
def get_blue_tools(scenario):
    tools = []
    if scenario == 'web_breach':
        tools = [{"id": "waf", "name": "Deploy WAF Rule", "cost": 20}, {"id": "patch", "name": "Patch Vuln", "cost": 30}]
    elif scenario == 'ransomware':
        tools = [{"id": "isolate", "name": "Isolate Host", "cost": 25}, {"id": "backup", "name": "Restore Backup", "cost": 40}]
    return jsonify({"success": True, "tools": tools})

@app.route('/scoreboard', methods=['GET'])
@login_required
def scoreboard():
    return render_template('scoreboard.html', leaders=[])
