with open('templates/compete.html', 'r', encoding='utf-8') as f:
    text = f.read()
lines = text.split('\n')
start = 0
for i, line in enumerate(lines):
    if 'battleground-ui' in line:
        start = i
        break
for j in range(start, start+40):
    print(f'{j+1}: {lines[j].strip()}')
