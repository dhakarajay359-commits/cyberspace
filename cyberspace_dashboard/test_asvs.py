import re
with open('templates/index.html', 'r', encoding='utf-8') as f:
    text = f.read()
matches = list(re.finditer(r'<script>', text))
print('Number of script tags:', len(matches))
for m in matches:
    print('Location:', m.start())
