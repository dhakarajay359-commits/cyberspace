with open('static/js/compete.js', 'r', encoding='utf-8') as f:
    text = f.read()

lines = text.split('\n')
start_idx = -1
end_idx = -1
brace_count = 0

for i, line in enumerate(lines):
    if 'const SCENARIO_DATA = {' in line:
        start_idx = i
    if start_idx != -1:
        brace_count += line.count('{')
        brace_count -= line.count('}')
        if brace_count == 0 and i > start_idx:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    new_lines = lines[:start_idx] + lines[end_idx+1:]
    new_text = '\n'.join(new_lines)
    with open('static/js/compete.js', 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("Successfully removed SCENARIO_DATA.")
else:
    print("Could not find SCENARIO_DATA bounds.")
