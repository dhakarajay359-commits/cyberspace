with open('app.py', 'r', encoding='utf-8') as f:
    text = f.read()

endpoints = """
@app.route('/api/tools/red/<scenario>', methods=['GET'])
@login_required
def get_red_tools(scenario):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT label, payload, tip FROM red_payloads WHERE scenario = ?", (scenario,))
    rows = c.fetchall()
    conn.close()
    tools = [{"label": row[0], "payload": row[1], "tip": row[2]} for row in rows]
    return jsonify({"success": True, "tools": tools})

@app.route('/api/tools/blue/<scenario>', methods=['GET'])
@login_required
def get_blue_tools(scenario):
    conn = sqlite3.connect('users.db')
    c = conn.cursor()
    c.execute("SELECT label, rule, tip FROM blue_defenses WHERE scenario = ?", (scenario,))
    rows = c.fetchall()
    conn.close()
    tools = [{"label": row[0], "rule": row[1], "tip": row[2]} for row in rows]
    return jsonify({"success": True, "tools": tools})
"""

idx = text.find('@app.route(\'/api/game/attack\', methods=[\'POST\'])')
if idx == -1:
    print("Could not find insertion point.")
    exit(1)

new_text = text[:idx] + endpoints + "\n" + text[idx:]

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Added /api/tools/red and /api/tools/blue endpoints to app.py")
