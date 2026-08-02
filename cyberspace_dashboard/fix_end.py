lines = []
with open('extracted_lobby.py', 'r', encoding='utf-8') as f:
    for line in f:
        if '<truncated' in line or 'NOTE:' in line or line.startswith('return jsonify({"success": True, "task_id": task_id})'):
            continue
        lines.append(line)

# Let's fix the end of the file
if lines[-1].strip() == 'return render_templ':
    lines[-1] = "    return render_template('crypto.html')\n"

with open('extracted_lobby.py', 'w', encoding='utf-8') as f:
    f.writelines(lines)
