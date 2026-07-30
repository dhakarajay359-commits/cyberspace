import json

last_content = None
with open(r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') > 1829:
            break
        
        if data.get('type') == 'VIEW_FILE':
            out = data.get('content', '')
            if 'compete.html' in out:
                last_content = out

if last_content:
    with open('compete_step_1815.html', 'w', encoding='utf-8') as f:
        f.write(last_content)
    print("Saved to compete_step_1815.html")
else:
    print("Not found")
