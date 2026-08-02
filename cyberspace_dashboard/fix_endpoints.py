import re

with open('extracted_lobby.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

blocks = {}
current_route = None
current_block = []

for line in lines:
    if line.startswith('@app.route'):
        if current_route:
            blocks[current_route] = current_block
        current_route = line.strip()
        current_block = [line]
    elif current_route:
        current_block.append(line)
        
if current_route:
    blocks[current_route] = current_block

with open('clean_endpoints.py', 'w', encoding='utf-8') as f:
    for route, block in blocks.items():
        # filter out lines that obviously belong to start_scan like task_id = ...
        clean_block = []
        for l in block:
            if 'task_id =' in l and 'uuid4' in l and 'lobby' not in route:
                continue
            if 'scan_tasks[task_id]' in l:
                continue
            if 'scan_type ==' in l or 'threading.Thread' in l:
                continue
            if 'return render_templ\n' in l:
                l = "    return render_template('crypto.html')\n"
            clean_block.append(l)
        f.writelines(clean_block)
        f.write("\n")
