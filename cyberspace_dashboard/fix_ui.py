with open('templates/compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

aside_start = text.find('<!-- SIDEBAR -->')
main_end = text.find('</main>') + 7

if aside_start != -1 and main_end != -1:
    text = text[:aside_start] + text[main_end:]

# Also remove 'hidden' from lobby-modal
lobby_modal_idx = text.find('id="lobby-modal" class="hidden')
if lobby_modal_idx != -1:
    text = text.replace('id="lobby-modal" class="hidden', 'id="lobby-modal" class="')

with open('templates/compete.html', 'w', encoding='utf-8') as f:
    f.write(text)
print('Deleted aside and main, and made lobby-modal visible by default.')
