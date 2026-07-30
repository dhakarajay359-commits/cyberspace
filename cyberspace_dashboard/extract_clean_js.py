import json, re

lines_dict = {}
with open(r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try: data = json.loads(line)
        except: continue
        if data.get('step_index', 0) > 650: break
        content = data.get('content', '')
        if type(content) == str and 'Total Lines: 1420' in content:
            lines_text = content.split('remove the line number, colon, and leading space.\n')
            if len(lines_text) >= 2:
                for l in lines_text[1].split('\n'):
                    m = re.match(r'^(\d+): (.*)', l)
                    if m:
                        lines_dict[int(m.group(1))] = m.group(2)

# Find where the script tag starts
script_start = 0
for i in range(1, 1421):
    if i in lines_dict and '<script>' in lines_dict[i]:
        script_start = i
        break

if script_start:
    with open('clean_script.js', 'w', encoding='utf-8') as out:
        for i in range(script_start + 1, 1421):
            if i in lines_dict:
                if '</script>' in lines_dict[i]:
                    break
                out.write(lines_dict[i].replace('{{', '/*').replace('}}', '*/').replace('{%', '/*').replace('%}', '*/') + '\n')
    print("Clean script extracted!")
else:
    print("Could not find script tag.")
