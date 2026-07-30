import os, re

files = ['templates/index.html', 'templates/compete.html', 'templates/login.html', 'templates/scoreboard.html']
emoji_pat = re.compile(r'[\U0001F300-\U0001FAFF\u2600-\u26FF\u2700-\u27BF\u231A-\u231B]+')
for f in files:
    if not os.path.exists(f): continue
    lines = open(f, encoding='utf-8').readlines()
    for i, l in enumerate(lines, 1):
        m = emoji_pat.search(l)
        if m:
            print(f'{f}:{i}: {l.strip()[:90]}')
