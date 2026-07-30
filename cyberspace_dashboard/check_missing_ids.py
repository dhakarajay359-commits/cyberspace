import re

with open('static/js/compete.js', 'r', encoding='utf-8') as f:
    js = f.read()
with open('templates/compete.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find all getElementById calls in JS
ids = re.findall(r"getElementById\(['\"]([^'\"]+)['\"]\)", js)
ids = list(dict.fromkeys(ids))  # unique, preserve order

missing = []
present = []
for elem_id in ids:
    if elem_id in html:
        present.append(elem_id)
    else:
        missing.append(elem_id)

print('MISSING from compete.html:')
for elem_id in missing:
    print(f'  #{elem_id}')

print()
print(f'Total: {len(missing)} missing, {len(present)} present')
