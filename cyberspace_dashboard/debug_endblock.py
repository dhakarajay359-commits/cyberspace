with open('templates/compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Remove the duplicate endblock at position 43761 (endblock #2)
# The correct structure should be:
# endblock #1 closes extra_head block
# then block content ... endblock closes content block
# then script tag
# The duplicate endblock at 43761 is the one from the original template after the main div
# The one at 43828 is the one we added

# Find the second endblock and remove it
first_end = text.find('{% endblock %}')
second_end = text.find('{% endblock %}', first_end + 14)
third_end = text.find('{% endblock %}', second_end + 14)

print(f'First at {first_end}, second at {second_end}, third at {third_end}')

# The second endblock is the correct one (closes the block content)
# The third endblock is the duplicate we added - remove it
# But we also need to remove the </body></html> that comes between #2 and #3

# Let's look at what's between #2 and #3
between = text[second_end + 14:third_end]
print('Between #2 and #3:', repr(between))
