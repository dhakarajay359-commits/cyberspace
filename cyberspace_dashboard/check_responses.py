import json

with open(r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') in [1616, 1640, 1678, 1763, 1774, 1819]:
            if data.get('type') == 'CODE_ACTION':
                print(f"Step {data.get('step_index')}: {data.get('content')[:100]}")
