import re
with open('templates/index.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace document.getElementById(...).addEventListener
# with document.getElementById(...)?.addEventListener
text = re.sub(r'(document\.getElementById\([\'\"][a-zA-Z0-9_-]+[\'\"]\))\.addEventListener', r'\1?.addEventListener', text)

with open('templates/index.html', 'w', encoding='utf-8') as f:
    f.write(text)
