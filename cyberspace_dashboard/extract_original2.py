import json

transcript_path = r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl'

# Look for write_to_file tool calls for compete.html before step 1829
last_step = -1
last_content = None

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            
            if step >= 1829:
                break
            
            tool_calls = data.get('tool_calls', [])
            for tc in tool_calls:
                fn = tc.get('function', {})
                name = fn.get('name', '')
                if name in ['write_to_file', 'replace_file_content']:
                    args_str = fn.get('arguments', '{}')
                    try:
                        args = json.loads(args_str)
                        target = args.get('TargetFile', '') or args.get('target_file', '')
                        if 'compete.html' in str(target) and 'templates' in str(target):
                            code = args.get('CodeContent', '') or args.get('code_content', '')
                            if len(code) > 5000:
                                last_step = step
                                last_content = code
                                print(f'Found write to compete.html at step {step}, len={len(code)}')
                    except Exception as e:
                        pass
        except json.JSONDecodeError:
            pass

print(f'\nLast write to compete.html before step 1829: step={last_step}')
if last_content:
    with open('compete_before_ui.html', 'w', encoding='utf-8') as f:
        f.write(last_content)
    print(f'Saved to compete_before_ui.html ({len(last_content)} bytes)')
    print('First 500 chars:')
    print(last_content[:500])
else:
    print('No write found!')
