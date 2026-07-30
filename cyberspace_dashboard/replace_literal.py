with open('test.js', 'r', encoding='utf-8') as f:
    text = f.read()
text = text.replace('`/api/lobby/status/${demoLobby}`', "'/api/lobby/status/' + demoLobby")
with open('test.js', 'w', encoding='utf-8') as f:
    f.write(text)
