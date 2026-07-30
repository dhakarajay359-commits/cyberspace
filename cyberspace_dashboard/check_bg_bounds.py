with open('templates/compete.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Find battleground-ui section boundaries
bg_start = html.find('id="battleground-ui"')
bg_start = html.rfind('<div', 0, bg_start)

# Find the end - count div depth
depth = 0
pos = bg_start
while pos < len(html):
    if html[pos:pos+4] == '<div':
        depth += 1
    elif html[pos:pos+6] == '</div>':
        depth -= 1
        if depth == 0:
            bg_end = pos + 6
            break
    pos += 1

bg_html = html[bg_start:bg_end]
print(f'battleground-ui section: {len(bg_html)} chars')

import re
ids_in_bg = re.findall(r'id="([^"]+)"', bg_html)
print('IDs in current battleground-ui:', ids_in_bg)

# Check for blue-controls
print()
print('Has blue-controls:', 'blue-controls' in bg_html)
print('Has red-payload:', 'red-payload' in bg_html)

# Where does the battleground end?
print()
print('Last 400 chars of battleground:')
print(bg_html[-400:].encode('ascii','ignore').decode('ascii'))
