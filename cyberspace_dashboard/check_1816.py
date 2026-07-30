import json

transcript_path = r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl'

# Step 1816 - look at all records at that step
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            
            if step == 1816:
                t = data.get('type', '')
                content = data.get('content', '')
                print(f'Type: {t}, content len: {len(content)}')
                if 'compete' in content.lower():
                    print('compete found in content!')
                    # Save it
                    with open('step_1816_all.txt', 'w', encoding='utf-8') as f2:
                        f2.write(content)
                    print('Saved to step_1816_all.txt')
                print('---')
                    
        except Exception as e:
            print(f'Error: {e}')
