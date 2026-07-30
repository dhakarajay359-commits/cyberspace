with open('static/js/compete.js', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('demoDiv.innerHTML = `')
end = text.find('`;', start)
if start != -1:
    print(text[start:end].encode('ascii', 'ignore').decode('ascii'))
