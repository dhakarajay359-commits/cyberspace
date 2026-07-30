import urllib.request
try:
    req = urllib.request.Request('http://localhost:5000/compete')
    response = urllib.request.urlopen(req)
    print('Status:', response.status)
    print('URL:', response.url)
    
    # If redirected to login, that's fine, the template syntax didn't crash.
    content = response.read().decode('utf-8')
    print('blue-controls in output:', 'id="blue-controls"' in content)
except Exception as e:
    print('Error:', e)
