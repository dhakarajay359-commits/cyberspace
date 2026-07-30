with open('templates/compete.html', 'r', encoding='utf-8') as f:
    text = f.read()
lines = text.split('\n')
start = 0
for i, line in enumerate(lines):
    if 'battleground-ui' in line:
        start = i
        break
for j in range(start, start+150):
    # Only print lines with IDs to see the structure
    if 'id=' in lines[j] and 'controls' in lines[j]:
        print(f'{j+1}: {lines[j].strip().encode("ascii", "ignore").decode("ascii")}')
