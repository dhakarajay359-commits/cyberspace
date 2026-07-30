with open('templates/compete.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()
with open('battleground_extracted.html', 'w', encoding='utf-8') as f:
    for i in range(960, min(1080, len(lines))):
        f.write(lines[i])
