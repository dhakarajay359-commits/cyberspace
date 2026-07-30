import json

with open(r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
            
        if data.get('step_index') == 431:
            with open('compete_step_431.txt', 'w', encoding='utf-8') as out:
                out.write(data.get('content', ''))
            print("Wrote compete_step_431.txt")
            break
