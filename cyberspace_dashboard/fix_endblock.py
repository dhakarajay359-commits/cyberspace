with open('templates/compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

first_end = text.find('{% endblock %}')
second_end = text.find('{% endblock %}', first_end + 14)
third_end = text.find('{% endblock %}', second_end + 14)

# We want to keep everything up to the second endblock,
# then add the script tag, and the third endblock is the final one to keep
# Structure should be:
# ...html content...
# {% endblock %}  <- closes block content  (was at second_end)
# <script src="...">  (currently between second and third)
# {% endblock %}  <- this is WRONG - we only need one endblock for block content

# Actually the correct structure is:
# {% block extra_head %}...{% endblock %}  <- first endblock (for CSS)
# {% block content %}
# ...html...
# <script>
# {% endblock %}  <- final endblock (for content)

# So we need to:
# 1. Keep first endblock (closes extra_head)
# 2. Keep second endblock (closes block content)  
# 3. But the script needs to be BEFORE the second endblock, not after
# 4. Remove the third endblock (duplicate)

# Let's restructure: place script before second endblock, remove third
content_up_to_second = text[:second_end]
# Remove the script from between second and third (it's currently there too)
after_third = text[third_end + 14:].strip()

# Build final
final = content_up_to_second
# Add script before the endblock
if '<script src="/static/js/compete.js">' not in content_up_to_second:
    final += '\n\n    <script src="/static/js/compete.js"></script>\n\n'
final += '{% endblock %}\n'
if after_third:
    final += '\n' + after_third

with open('templates/compete.html', 'w', encoding='utf-8') as f:
    f.write(final)

# Verify
endblock_count = final.count('{% endblock %}')
block_content = final.count('{% block content %}')
print(f'Fixed! endblocks={endblock_count}, block content={block_content}')
print(f'Size: {len(final)}')
