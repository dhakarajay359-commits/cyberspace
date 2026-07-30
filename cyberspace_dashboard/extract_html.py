with open('recovered_compete2.html', 'r', encoding='utf-8') as f:
    text = f.read()

part1 = text[127:10896 + 14] # The head + style
part2 = text[11739:27336] # The HTML body before the script tag

with open('templates/compete.html', 'w', encoding='utf-8') as out:
    out.write('{% set active_page = "compete" %}\n{% extends "base.html" %}\n\n')
    out.write(part1)
    out.write('\n{% block content %}\n')
    out.write(part2)
    out.write('\n    <script src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/4.0.1/socket.io.js"></script>\n    <script>\n    // Clean logic here\n    </script>\n{% endblock %}')
