with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

# Find where the inline JS block starts
start_script = text.find('<script>')

# Get the HTML portion (before the inline script)
html_part = text[:start_script]

# Find the last closing </script> tag and get everything after it
end_script = text.rfind('</script>')
after_script = text[end_script + 9:]  # includes breach modal, victory screen, etc.

# Build the clean compete.html:
# 1. HTML up to start_script
# 2. What comes after the inline script (breach overlay, victory, etc.)
# 3. External JS reference
# 4. Jinja endblock

clean_html = html_part + after_script.rstrip()

# Remove </body></html> if they appear at the end - they'll be after the endblock in Jinja
clean_html = clean_html.rstrip()
if clean_html.endswith('</html>'):
    clean_html = clean_html[:-7].rstrip()
if clean_html.endswith('</body>'):
    clean_html = clean_html[:-7].rstrip()

# Now add Threat Intel and Analyze Traffic Buttons
clean_html = clean_html.replace(
    '<div class="flex items-center gap-2"><span class="pulse-live"></span> OFFENSIVE CONSOLE \u2014 <span id="red-scenario-label" class="text-orange-400 font-bold">Loading...</span></div>',
    '''<div class="flex items-center gap-2">
        <span class="pulse-live"></span> OFFENSIVE CONSOLE \u2014 <span id="red-scenario-label" class="text-orange-400 font-bold">Loading...</span>
        <button onclick="showThreatIntel()" class="ml-4 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-2 py-0.5 rounded transition text-[10px] flex items-center gap-1">
            <span class="mi text-[12px]">science</span> Threat Intel
        </button>
    </div>'''
)

clean_html = clean_html.replace(
    '<div class="text-[10px] text-slate-500 mono uppercase tracking-widest mb-1">Defense Arsenal</div>',
    '''<div class="text-[10px] text-slate-500 mono uppercase tracking-widest mb-1 flex justify-between items-center">
        <span>Defense Arsenal</span>
        <div class="flex gap-2">
            <button onclick="showThreatIntel()" class="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-2 py-1 rounded transition text-[10px] flex items-center gap-1">
                <span class="mi text-[12px]">science</span> Threat Intel
            </button>
            <button onclick="analyzeTraffic()" class="bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 px-2 py-1 rounded transition text-[10px] flex items-center gap-1">
                <span class="mi text-[12px]">search</span> Analyze Traffic
            </button>
        </div>
    </div>'''
)

# Append the external JS reference and close the Jinja template properly
clean_html += '''

    <script src="/static/js/compete.js"></script>

{% endblock %}
'''

with open('templates/compete.html', 'w', encoding='utf-8') as f:
    f.write(clean_html)

print(f'Rebuilt compete.html successfully, size={len(clean_html)}')
print('GLOBAL BATTLEGROUND:', clean_html.find('GLOBAL BATTLEGROUND'))
print('HOW IT WORKS:', clean_html.find('HOW IT WORKS'))
print('endblock count:', clean_html.count('{% endblock %}'))
print('block content:', clean_html.count('{% block content %}'))
