import re
with open('templates/compete.html', 'r', encoding='utf-8') as f:
    text = f.read()
    onclicks = re.findall(r'onclick="([^"]*)"', text)
    for o in onclicks:
        print(o)
