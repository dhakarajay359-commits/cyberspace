import sys

def refactor_learn(filepath, active_page_name):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the end of the <style> block
    style_end = content.find('</style>')
    style_start = content.find('<style>')
    
    # In learn.html we can remove everything up to <main class="main-content">
    # because base.html already provides the sidebar.
    main_start = content.find('<main class="main-content">')
    if main_start == -1:
        print(f"Could not find <main> in {filepath}")
        return
        
    style_block = content[style_start:style_end+8]
    
    # Remove .layout-container, .sidebar, .main-content styles since they are in base.html now
    # Or we can just keep it, but it's redundant. Keeping it is safer for now.
    
    new_top = f"""{{% set active_page = "{active_page_name}" %}}
{{% extends "base.html" %}}

{{% block extra_head %}}
    {style_block}
{{% endblock %}}

{{% block content %}}
"""
    
    # Extract content inside <main class="main-content">
    # The end of main is </main>
    main_end = content.rfind('</main>')
    if main_end == -1:
        print(f"Could not find </main> in {filepath}")
        return
        
    main_content_inner = content[main_start + len('<main class="main-content">'):main_end]
    
    # Also extract scripts that are outside main?
    # In learn.html, there are modals and scripts after </main>
    rest_of_file = content[main_end+len('</main>'):]
    
    # Strip out </div> (from layout-container closing), </body>, </html>
    rest_of_file = rest_of_file.replace('</div>\n\n<!-- Modal', '<!-- Modal')
    rest_of_file = rest_of_file.replace('</body>', '')
    rest_of_file = rest_of_file.replace('</html>', '')
    
    final_content = new_top + main_content_inner + "\n" + rest_of_file + "\n{% endblock %}\n"
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print(f"Refactored {filepath}")

refactor_learn('templates/learn.html', 'learn')
