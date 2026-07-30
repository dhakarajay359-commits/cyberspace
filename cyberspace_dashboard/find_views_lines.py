import json

with open(r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') > 1829:
            break
        
        if data.get('type') == 'VIEW_FILE':
            content = data.get('content', '')
            if 'compete.html' in content:
                # Find line that starts with 'Showing lines'
                for l in content.split('\n')[:10]:
                    if l.startswith('Showing lines'):
                        print(f"Step {data.get('step_index')}: {l}")
