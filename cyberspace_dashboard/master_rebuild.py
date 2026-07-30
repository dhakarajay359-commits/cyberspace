import re

with open('templates/compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

text = text.replace('\r\n', '\n').replace('\r', '\n')
text = re.sub(r'\n{3,}', '\n\n', text)

with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    orig = f.read()
orig = orig.replace('\r\n', '\n').replace('\r', '\n')
orig = re.sub(r'\n{3,}', '\n\n', orig)

main_end = text.find('</main>') + len('</main>')
top_part = text[:main_end]

lobby_start = text.find('<!-- LOBBY MODAL -->')
waiting_room_1 = text.find('<!-- WAITING ROOM (Initially Hidden) -->')
lobby_modal = text[lobby_start:waiting_room_1]

waiting_room_2 = text.find('<!-- WAITING ROOM (Initially Hidden) -->', waiting_room_1 + 10)
how_to_play_1 = text.find('<!-- HOW TO PLAY MODAL -->')
battleground_1 = text.find('<!-- BATTLEGROUND UI (Initially Hidden) -->')

waiting_room_modal = text[waiting_room_2:battleground_1]
how_to_play_modal = text[how_to_play_1:waiting_room_2]

script_start = text.find('<script>')
battleground_modal = text[battleground_1:script_start]

breach_start = orig.find('<!-- BREACH ALERT MODAL (Blue Team sees this) -->')
endblock_start = orig.find('{% endblock %}')
bottom_modals = orig[breach_start:endblock_start]

final_html = f"""{top_part}

{lobby_modal}

{waiting_room_modal}

{how_to_play_modal}

{battleground_modal}

{bottom_modals}

<script src="{{{{ url_for('static', filename='js/compete.js') }}}}"></script>

{{% endblock %}}
"""

with open('templates/compete.html', 'w', encoding='utf-8') as f:
    f.write(final_html)

print("Rebuilt compete.html successfully!")
