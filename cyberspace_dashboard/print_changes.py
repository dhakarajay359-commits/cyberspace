import json

out = open('changes.txt', 'w', encoding='utf-8')

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
                    out.write(f"=== STEP {step} ===\n")
                    chunks = args.get('ReplacementChunks', [])
                    if tc.get('name') == 'replace_file_content':
                        chunks = [args]
                    if isinstance(chunks, str):
                        try:
                            chunks = json.loads(chunks, strict=False)
                        except:
                            pass
                    if isinstance(chunks, list):
                        for i, chunk in enumerate(chunks):
                            out.write(f"--- Chunk {i} ---\n")
                            out.write("TARGET:\n")
                            out.write(chunk.get('TargetContent', '') + '\n')
                            out.write("REPLACEMENT:\n")
                            out.write(chunk.get('ReplacementContent', '') + '\n')
out.close()
