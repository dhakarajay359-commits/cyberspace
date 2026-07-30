import requests

s = requests.Session()

# Login
r = s.post('http://127.0.0.1:5000/login', data={'username': 'testuser', 'password': 'password'})
print('Login status:', r.status_code, 'URL:', r.url)

# Get compete page
r = s.get('http://127.0.0.1:5000/compete')
print('Compete status:', r.status_code, 'URL:', r.url)

if 'TemplateSyntaxError' in r.text or 'Internal Server Error' in r.text:
    idx = r.text.find('TemplateSyntaxError')
    if idx == -1:
        idx = r.text.find('Internal Server Error')
    print('ERROR found:', r.text[idx:idx+300])
elif 'GLOBAL BATTLEGROUND' in r.text:
    print('SUCCESS: The professional GLOBAL BATTLEGROUND UI is restored!')
elif 'HOW IT WORKS' in r.text:
    print('SUCCESS: HOW IT WORKS found in rendered page!')
else:
    print('Unknown. First 1000 chars:')
    print(r.text[:1000])
