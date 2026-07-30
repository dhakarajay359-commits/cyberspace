import json

transcript_path = r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl'

# Scan all steps for any mention of compete.html, just to get a sense of what we have
compete_steps = []
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            step = data.get('step_index', 0)
            if step > 1900:
                break
            
            # Check tool calls
            for tc in data.get('tool_calls', []):
                fn = tc.get('function', {})
                args_str = fn.get('arguments', '{}')
                if 'compete' in args_str.lower() and 'html' in args_str.lower():
                    compete_steps.append((step, fn.get('name'), args_str[:200]))
            
            # Check tool responses
            content = data.get('content', '')
            if isinstance(content, str) and 'compete.html' in content and step < 1830:
                compete_steps.append((step, 'RESPONSE', content[:200]))
                    
        except:
            pass

for s, n, c in compete_steps[-30:]:
    print(f'Step {s} [{n}]: {c[:150]}')
    print()
