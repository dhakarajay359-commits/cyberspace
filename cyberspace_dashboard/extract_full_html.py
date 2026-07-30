with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

start_script = text.find('<script>')
html_part = text[:start_script]

with open('templates/compete.html', 'w', encoding='utf-8') as out:
    out.write(html_part)
    out.write('<script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>\n<script src="/static/js/compete.js"></script>\n{% endblock %}')
