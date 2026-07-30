import json

transcript_path = r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript.jsonl'

# Find all user inputs to identify the compete UI change prompt
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if data.get('type') == 'USER_INPUT':
                content = data.get('content', '')
                step = data.get('step_index', 0)
                # Look for UI-related prompts around the night time (high step numbers)
                if step > 1600:
                    print(f'Step {step}: {content[:300]}')
                    print('---')
        except:
            pass
