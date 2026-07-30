with open('static/js/compete.js', 'r', encoding='utf-8') as f:
    text = f.read()

target1 = """const demoDiv = document.getElementById('solo-demo-links');
    if (demoDiv) {
        let buttonsHtml = '';"""
replacement1 = """const demoDiv = document.getElementById('solo-demo-links');
    if (demoDiv) {
        if (!isHost) {
            demoDiv.innerHTML = '';
        } else {
            let buttonsHtml = '';"""

target2 = """            </div>
        </div>\`;
    }

    pollLobbyStatus();"""
replacement2 = """            </div>
        </div>\`;
        }
    }

    pollLobbyStatus();"""

new_text = text.replace(target1, replacement1)
new_text = new_text.replace(target2, replacement2)

with open('static/js/compete.js', 'w', encoding='utf-8') as f:
    f.write(new_text)

print("Patched compete.js for multiplayer.")
