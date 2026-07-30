import re

with open('recovered_compete2.html', 'r', encoding='utf-8') as f:
    text = f.read()
    ids = re.findall(r'id="([^"]+)"', text)
    print(set(ids))
