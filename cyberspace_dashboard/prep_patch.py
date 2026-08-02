import re

with open('patch.diff', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Find where @@ starts
start_idx = 0
for i, line in enumerate(lines):
    if line.startswith('@@ '):
        start_idx = i
        break

out_lines = [
    '--- a/app.py\n',
    '+++ b/app.py\n'
]

# The user prompt had some text before @@, we just take everything from @@ onwards
# Wait, the lines before @@ (like imports) don't have + or -, they seem to be just context or preamble.
# Actually, the user snippet has:
# import ssl
# import socket...
# @@ -54,13 +53,44 @@
# So the first @@ is line 18. Let's just process from line 18.

for line in lines[start_idx:]:
    # Ensure it's a valid patch line (starts with space, +, -, or @@)
    if not line.strip():
        out_lines.append(' \n')
        continue
    if line.startswith('@@ ') or line.startswith('+') or line.startswith('-') or line.startswith(' '):
        out_lines.append(line)
    elif line.startswith('<USER_REQUEST>') or line.startswith('</USER_REQUEST>'):
        continue
    else:
        # If it doesn't start with space, +, or -, it might be a context line that lost its space.
        out_lines.append(' ' + line)

with open('clean.patch', 'w', encoding='utf-8') as f:
    f.writelines(out_lines)
