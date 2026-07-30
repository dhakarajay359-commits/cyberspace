import json

transcript_path = r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl'

# Find all VIEW_FILE records for compete.html before step 1829
# and find the one with the FULL file content (StartLine=1)

best_content = None
best_step = -1
best_lines = 0

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            
            if step >= 1829:
                break
                
            if data.get('type') == 'VIEW_FILE':
                content = data.get('content', '')
                tool_call = data.get('tool_call', {})
                
                # Check if this is compete.html
                if 'compete.html' in content and 'Total Lines' in content:
                    # Check how many lines this view covers
                    import re
                    m = re.search(r'Total Lines: (\d+)', content)
                    total_lines = int(m.group(1)) if m else 0
                    
                    m2 = re.search(r'Showing lines (\d+) to (\d+)', content)
                    if m2:
                        start_ln = int(m2.group(1))
                        end_ln = int(m2.group(2))
                        lines_shown = end_ln - start_ln
                    else:
                        lines_shown = 0
                    
                    print(f'Step {step}: total_lines={total_lines}, shown={lines_shown}, content_len={len(content)}')
                    
                    if lines_shown > best_lines and start_ln == 1:
                        best_lines = lines_shown
                        best_step = step
                        best_content = content
                    
        except Exception as e:
            pass

print(f'\nBest view: step={best_step}, lines={best_lines}')
if best_content:
    with open('step_best_view.txt', 'w', encoding='utf-8') as f:
        f.write(best_content)
    print('Saved to step_best_view.txt')
