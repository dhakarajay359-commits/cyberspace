import json
with open(r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    with open('demo_div_content.txt', 'w', encoding='utf-8') as out:
        for line in f:
            data = json.loads(line)
            if data.get('type') == 'VIEW_FILE':
                content = data.get('content', '')
                if 'demoDiv.innerHTML' in content:
                    idx = content.find('demoDiv.innerHTML')
                    out.write(f"Step {data.get('step_index')}:\n")
                    out.write(content[idx-100:idx+400])
                    break
