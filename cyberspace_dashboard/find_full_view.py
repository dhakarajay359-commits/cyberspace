import json

with open(r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
            
        if data.get('step_index', 0) < 1829:
            content = data.get('content', '')
            if type(content) == str and 'Total Lines: 1420' in content:
                print(f"Step {data.get('step_index')} has a view of the file.")
                if 'Showing lines 1 to 1420' in content:
                    print("Found FULL file view!")
                    break
