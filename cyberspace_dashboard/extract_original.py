import json

transcript_path = r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl'

# We need the compete.html content RIGHT BEFORE step 1829
# Look for the last view_file or write_to_file of compete.html before step 1829
last_compete_content = None
last_step = -1

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            
            if step >= 1829:
                break
            
            # Check tool responses that show file content
            if data.get('type') == 'TOOL_RESPONSE':
                content = data.get('content', '')
                # Look for view_file responses of compete.html
                if 'compete.html' in content and 'Total Lines' in content and 'Showing lines 1 to' in content:
                    # This is a view of compete.html from start - extract content
                    # Format: "Showing lines X to Y\n<content>"
                    idx = content.find('Showing lines 1 to')
                    if idx != -1:
                        # Find the end of that header line
                        content_start = content.find('\n', idx) + 1
                        # Find "The following code has been modified..."
                        marker = 'The following code has been modified to include a line number'
                        marker_idx = content.find(marker)
                        if marker_idx != -1:
                            content_start = content.find('\n', marker_idx) + 1
                        
                        # Extract just the file content lines and strip line numbers
                        raw = content[content_start:]
                        # Strip line numbers like "123: content"
                        lines = []
                        for ln in raw.split('\n'):
                            if ': ' in ln[:10]:
                                colon_idx = ln.find(': ')
                                prefix = ln[:colon_idx]
                                if prefix.strip().isdigit():
                                    lines.append(ln[colon_idx+2:])
                                else:
                                    lines.append(ln)
                            else:
                                lines.append(ln)
                        
                        file_content = '\n'.join(lines)
                        if len(file_content) > 10000:
                            last_compete_content = file_content
                            last_step = step
                            print(f'Found compete.html view at step {step}, len={len(file_content)}')

        except json.JSONDecodeError:
            pass

print(f'\nBest compete.html before step 1829: step={last_step}')
if last_compete_content:
    with open('compete_before_ui_prompt.html', 'w', encoding='utf-8') as f:
        f.write(last_compete_content)
    print(f'Saved to compete_before_ui_prompt.html ({len(last_compete_content)} bytes)')
else:
    print('No content found!')
