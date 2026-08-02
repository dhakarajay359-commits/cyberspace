import re
import ast

with open('clean_endpoints.py', 'r', encoding='utf-8') as f:
    text = f.read()

# We need to fix the indentation in create_lobby, since it was broken at line 4
# Let's just grab the whole text, manually fix create_lobby, and then we're good.
text = text.replace('custom_flag = data.get(\'custom_flag\', \'\')\ndifficulty_level = int(data.get(\'difficulty_level\', 1))',
                    '   custom_flag = data.get(\'custom_flag\', \'\')\n   difficulty_level = int(data.get(\'difficulty_level\', 1))')
text = text.replace('red_invite_code = \'R-\' + str(uuid.uuid4())[:6]\nblue_invite_code = \'B-\' + str(uuid.uuid4())[:6]',
                    '   red_invite_code = \'R-\' + str(uuid.uuid4())[:6]\n   blue_invite_code = \'B-\' + str(uuid.uuid4())[:6]')
text = text.replace('conn = sqlite3.connect(DB_PATH)\nc = conn.cursor()',
                    '   conn = sqlite3.connect(DB_PATH)\n   c = conn.cursor()')
text = text.replace('c.execute("INSERT INTO lobbies (id, host_username, max_players, scenario, red_invite_code, blue_invite_code, custom_desc, custom_flag, difficulty_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", \n(lobby_id, session[\'user\'], max_players, scenario, red_invite_code, blue_invite_code, custom_desc, custom_flag, difficulty_level))',
                    '   c.execute("INSERT INTO lobbies (id, host_username, max_players, scenario, red_invite_code, blue_invite_code, custom_desc, custom_flag, difficulty_level) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", \n             (lobby_id, session[\'user\'], max_players, scenario, red_invite_code, blue_invite_code, custom_desc, custom_flag, difficulty_level))')
text = text.replace('c.execute("INSERT INTO lobby_members (lobby_id, username, team) VALUES (?, ?, ?)",\n(lobby_id, session[\'user\'], host_team))',
                    '   c.execute("INSERT INTO lobby_members (lobby_id, username, team) VALUES (?, ?, ?)",\n             (lobby_id, session[\'user\'], host_team))')
text = text.replace('conn.commit()\nconn.close()',
                    '   conn.commit()\n   conn.close()')

text = text.replace('active_games[lobby_id] = {', '   active_games[lobby_id] = {')
text = text.replace('\'scenario\': scenario,', '       \'scenario\': scenario,')
text = text.replace('\'custom_desc\': custom_desc,', '       \'custom_desc\': custom_desc,')
text = text.replace('\'custom_flag\': custom_flag,', '       \'custom_flag\': custom_flag,')
text = text.replace('\'difficulty_level\': difficulty_level,', '       \'difficulty_level\': difficulty_level,')
text = text.replace('\'health\': 100,', '       \'health\': 100,')
text = text.replace('\'rules\': [],', '       \'rules\': [],')
text = text.replace('\'logs\': [],', '       \'logs\': [],')
text = text.replace('\'real_payloads\': [],', '       \'real_payloads\': [],')
text = text.replace('\'status\': \'waiting\',', '       \'status\': \'waiting\',')
text = text.replace('\'target_state\': \'packed\',', '       \'target_state\': \'packed\',')
text = text.replace('\'presence\': {}', '       \'presence\': {}')
text = text.replace('}', '   }')
text = text.replace('return jsonify({"success": True, "lobby_id": lobby_id, "red_invite_code": red_invite_code, "blue_invite_code": blue_invite_code})',
                    '   return jsonify({"success": True, "lobby_id": lobby_id, "red_invite_code": red_invite_code, "blue_invite_code": blue_invite_code})')

with open('clean_endpoints_fixed.py', 'w', encoding='utf-8') as f:
    f.write(text)
