import re

with open('recovered_compete2.html', 'r', encoding='utf-8') as f:
    text = f.read()

# The file starts with:
# {% set active_page = "compete" %}
# {% extends "base.html" %}
# {% set active_page = "compete" %}
# {% extends "base.html" %}

# Find the first {% block extra_head %}
extra_head_start = text.find('{% block extra_head %}')

# Find the second {% block content %}
content_blocks = [m.start() for m in re.finditer(r'{%\s*block content\s*%}', text)]

if len(content_blocks) == 2:
    # The file seems to be duplicated from the start of the first block content
    # Wait, the duplicate might start exactly at the second {% block content %} or earlier.
    # Let's just find the first {% endblock %} that closes the first content block!
    
    # Let's see the structure:
    # {% block extra_head %} ... {% endblock %}
    # {% block content %} ... {% endblock %}
    
    # We want to keep everything from the start up to the first {% endblock %} of the content block.
    # Let's just extract the blocks!
    
    # Fix the top header
    clean_text = '{% set active_page = "compete" %}\n{% extends "base.html" %}\n\n'
    
    # Extract extra_head
    extra_head_match = re.search(r'({%\s*block extra_head\s*%}.*?{%\s*endblock\s*%})', text, re.DOTALL)
    if extra_head_match:
        clean_text += extra_head_match.group(1) + '\n\n'
        
    # Extract content
    # Since there are two content blocks, we want the first one.
    # But wait! Does the first content block have the syntax error, or is it just the duplicate that causes it?
    # Let's just extract the first content block!
    content_match = re.search(r'({%\s*block content\s*%}.*?{%\s*endblock\s*%})', text, re.DOTALL)
    if content_match:
        clean_text += content_match.group(1) + '\n'
        
    with open('templates/compete.html', 'w', encoding='utf-8') as out:
        out.write(clean_text)
        
    print('Deduplicated successfully!')
else:
    print('Unexpected structure.')
