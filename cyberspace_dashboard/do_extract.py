import re

with open('patch.diff', 'r', encoding='utf-8') as f:
    lines = f.readlines()

start_marker = "@app.route('/api/lobby/create'"
start_idx = -1
for i, line in enumerate(lines):
    if start_marker in line:
        start_idx = i
        break

if start_idx != -1:
    extracted = []
    for line in lines[start_idx:]:
        if line.startswith('@@'):
            continue
        if line.startswith('-'):
            continue
        if line.startswith('+'):
            extracted.append(line[1:])
        elif line.startswith(' '):
            extracted.append(line[1:])
        else:
            extracted.append(line)
            
    with open('extracted_lobby.py', 'w', encoding='utf-8') as f:
        f.writelines(extracted)
    print("Extracted lobby section.")
