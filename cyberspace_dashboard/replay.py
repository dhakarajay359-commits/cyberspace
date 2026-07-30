import json
import ast

with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    content = f.read().replace('\r\n', '\n')

def apply_replacements(content, chunks, step_index):
    for chunk in chunks:
        target = chunk.get('TargetContent', '').replace('\r\n', '\n')
        replacement = chunk.get('ReplacementContent', '').replace('\r\n', '\n')
        
        if target in content:
            content = content.replace(target, replacement)
        else:
            # Try to match without leading/trailing whitespace
            target_strip = target.strip()
            if target_strip in content:
                # Find exactly where it is
                idx = content.find(target_strip)
                if content.count(target_strip) == 1:
                    # We can replace the exact match!
                    # But wait, what about the surrounding whitespace in the replacement?
                    # Let's just do a simple replace of the stripped version with the stripped replacement.
                    # This might lose some indentation, but it's HTML/JS so it usually doesn't break functionality.
                    content = content.replace(target_strip, replacement.strip())
                else:
                    print(f"Warning: Multiple matches for stripped target in step {step_index}")
            else:
                print(f"FAILED to match chunk in step {step_index}")
                try:
                    print(f"Target was: {target_strip.encode('utf-8')[:100]}...")
                except:
                    pass

    return content

with open(r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        step = data.get('step_index')
        if step <= 1552:
            continue
        if step >= 1829:
            break
        
        for tc in data.get('tool_calls', []):
            if tc.get('name') in ['replace_file_content', 'multi_replace_file_content']:
                args = tc.get('args', {})
                tf = args.get('TargetFile', '')
                if 'compete.html' in tf:
                    print(f"Applying step {step}")
                    chunks = args.get('ReplacementChunks', [])
                    if tc.get('name') == 'replace_file_content':
                        chunks = [args]
                    if isinstance(chunks, str):
                        try:
                            chunks = json.loads(chunks, strict=False)
                        except:
                            try:
                                chunks = ast.literal_eval(chunks)
                            except Exception as e:
                                print(f"Error parsing chunks: {e}")
                                continue
                    content = apply_replacements(content, chunks, step)

with open('templates/compete.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Reconstructed templates/compete.html up to step 1828!")
