with open('templates/compete.html', 'r', encoding='utf-8') as f:
    html = f.read()

idx = html.find('battleground-ui')
print('battleground-ui in current compete.html:', idx)
if idx != -1:
    print(html[idx:idx+3000].encode('ascii','ignore').decode('ascii'))
else:
    print('NOT FOUND')
    # Let's also check what's in the script section
    # The JS generates some content dynamically
    # Let's look at the compete.js battleground section
    with open('static/js/compete.js', 'r', encoding='utf-8') as f:
        js = f.read()
    idx2 = js.find('battleground-ui')
    if idx2 != -1:
        print('In compete.js:')
        print(js[idx2:idx2+500].encode('ascii','ignore').decode('ascii'))
