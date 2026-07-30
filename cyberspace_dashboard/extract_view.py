import json

with open(r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') == 1816 and data.get('type') == 'TOOL_RESPONSE':
            # step_index for the response is usually step_index+1 or same?
            pass
            
        if data.get('type') == 'TOOL_RESPONSE' and data.get('name') == 'view_file':
            # Need to find the response corresponding to step 1815
            # Usually step_index is the same for the response as the step that initiated it, OR +1. Let's just track the last view_file response before 1829
            pass

# Better approach:
last_view_content = None
with open(r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl', 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index') > 1829:
            break
        if data.get('type') == 'TOOL_RESPONSE' and data.get('name') == 'view_file':
            content = data.get('content', '')
            if 'compete.html' in content:
                last_view_content = content

if last_view_content:
    with open('found_view.txt', 'w', encoding='utf-8') as f:
        f.write(last_view_content)
    print("Found and saved!")
else:
    print("Not found")
