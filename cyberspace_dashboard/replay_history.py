import json

transcript_path = r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl'

with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    content = f.read()

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        step = data.get('step_index', 0)
        
        if step > 1840:
            break
            
        if data.get('type') == 'PLANNER_RESPONSE' and data.get('tool_calls'):
            for tc in data['tool_calls']:
                if tc['name'] == 'multi_replace_file_content' and 'compete.html' in tc['args'].get('TargetFile', ''):
                    chunks = tc['args'].get('ReplacementChunks', [])
                    for i, chunk in enumerate(chunks):
                        target = chunk.get('TargetContent', '')
                        replacement = chunk.get('ReplacementContent', '')
                        if target and target in content:
                            content = content.replace(target, replacement)
                            print(f'Step {step} Chunk {i} applied successfully.')
                        elif target:
                            print(f'Step {step} Chunk {i} FAILED TO APPLY! Target not found.')
                
                elif tc['name'] == 'replace_file_content' and 'compete.html' in tc['args'].get('TargetFile', ''):
                    target = tc['args'].get('TargetContent', '')
                    replacement = tc['args'].get('ReplacementContent', '')
                    if target and target in content:
                        content = content.replace(target, replacement)
                        print(f'Step {step} replace_file_content applied successfully.')
                    elif target:
                        print(f'Step {step} replace_file_content FAILED TO APPLY! Target not found.')

with open('templates/compete.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("History replay complete.")
