import requests
session = requests.Session()
res = session.post('http://127.0.0.1:5000/login', data={'username': 'user', 'password': 'password'}) # Usually any works or fails, let's see.
# If there is no real DB, maybe I can just register?
res = session.post('http://127.0.0.1:5000/register', data={'username': 'test1', 'password': 'test1_password'})
res = session.post('http://127.0.0.1:5000/login', data={'username': 'test1', 'password': 'test1_password'})
res = session.get('http://127.0.0.1:5000/compete')
with open('rendered.html', 'w', encoding='utf-8') as f:
    f.write(res.text)
print('Saved rendered.html')
