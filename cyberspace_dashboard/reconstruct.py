import re

with open('compete_step_1815.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

clean_lines = []
in_code = False
for line in lines:
    if line.startswith('1: {% extends'):
        in_code = True
    if line.startswith('The above content shows the entire'):
        in_code = False
        break
    
    if in_code:
        # Match line number at the beginning: "123: "
        match = re.match(r'^\d+:\s(.*)', line)
        if match:
            clean_lines.append(match.group(1) + '\n')
        else:
            clean_lines.append(line)

with open('compete_reverted.html', 'w', encoding='utf-8') as f:
    f.writelines(clean_lines)

print("Saved clean reconstructed HTML to compete_reverted.html")
