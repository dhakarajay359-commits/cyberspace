import requests

s = requests.Session()

# First check login page
r = s.get('http://127.0.0.1:5000/login')
print('Login page status:', r.status_code)

# Find form action
import re
form_action = re.search('action="([^"]+)"', r.text)
print('Form action:', form_action.group(1) if form_action else 'not found')

# Try posting to the login page URL itself
r2 = s.post('http://127.0.0.1:5000/login', data={'username': 'testuser', 'password': 'password'}, allow_redirects=True)
print('Login POST status:', r2.status_code, 'URL:', r2.url)

# Now try compete
r3 = s.get('http://127.0.0.1:5000/compete')
print('Compete status:', r3.status_code, 'URL:', r3.url)
if 'GLOBAL BATTLEGROUND' in r3.text:
    print('SUCCESS: GLOBAL BATTLEGROUND found!')
elif 'HOW IT WORKS' in r3.text:
    print('SUCCESS: HOW IT WORKS found!')
elif 'compete' in r3.url.lower():
    print('On compete page. Checking for errors...')
    if 'TemplateSyntaxError' in r3.text:
        print('JINJA TEMPLATE ERROR found!')
    else:
        print('No obvious errors. Length:', len(r3.text))
