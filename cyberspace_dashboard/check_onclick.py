with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    text = f.read()
lines = text.split('\n')
for i, line in enumerate(lines):
    if 'onclick="verifyAndOpenTab' in line:
        print(f'{i+1}: {line.strip()}')
