import json

transcript_path = r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl'

# Step 1816 was a view of compete.html just before the UI prompt (step 1829)
# Let's extract that full view
target_step = 1816

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            
            if step == target_step and data.get('type') == 'TOOL_RESPONSE':
                content = data.get('content', '')
                if 'compete.html' in content:
                    print(f'Found at step {step}!')
                    print(f'Length: {len(content)}')
                    # Save raw response
                    with open('step_1816_raw.txt', 'w', encoding='utf-8') as f2:
                        f2.write(content)
                    print('Saved to step_1816_raw.txt')
                    break
                    
        except:
            pass
