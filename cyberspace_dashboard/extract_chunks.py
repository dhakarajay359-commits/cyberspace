import json

transcript_path = r'C:\Users\ASUS\.gemini\antigravity-ide\brain\1c28db6c-3869-42ee-b559-6a748495f7bd\.system_generated\logs\transcript_full.jsonl'

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        if data.get('step_index', 0) >= 1840:
            break
            
        if data.get('type') == 'PLANNER_RESPONSE' and data.get('tool_calls'):
            for tc in data['tool_calls']:
                if tc['name'] in ['multi_replace_file_content', 'replace_file_content'] and 'compete.html' in tc['args'].get('TargetFile', ''):
                    print(f'--- STEP {data.get("step_index")} ---')
                    if tc['name'] == 'multi_replace_file_content':
                        chunks_str = tc['args'].get('ReplacementChunks', '[]')
                        try:
                            chunks = json.loads(chunks_str)
                            for i, chunk in enumerate(chunks):
                                content = chunk.get('ReplacementContent', '')
                                print(f'Chunk {i} Length: {len(content)}')
                                with open(f'chunk_{data.get("step_index")}_{i}.txt', 'w', encoding='utf-8') as out:
                                    out.write(content)
                        except:
                            print("Error parsing chunks")
                    else:
                        content = tc['args'].get('ReplacementContent', '')
                        print(f'Replace Length: {len(content)}')
                        with open(f'chunk_{data.get("step_index")}_replace.txt', 'w', encoding='utf-8') as out:
                            out.write(content)
