import json

with open(r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        for tc in data.get('tool_calls', []):
            if tc.get('name') == 'write_to_file':
                tf = tc.get('args', {}).get('TargetFile', '')
                if 'original_compete' in tf:
                    print(f"Created at step {data.get('step_index')}")
