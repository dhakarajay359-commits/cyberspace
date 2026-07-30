import re

with open('templates/compete.html', 'r', encoding='utf-8') as f:
    current_html = f.read()

with open('recovered_compete.html', 'r', encoding='utf-8') as f:
    recovered_html = f.read()

# Extract <main> from recovered_compete.html
start_main_rec = recovered_html.find('<main')
end_main_rec = recovered_html.find('</main>') + len('</main>')
recovered_main = recovered_html[start_main_rec:end_main_rec]

# Replace <main> in current_html with recovered_main
start_main_cur = current_html.find('<main')
end_main_cur = current_html.find('</main>') + len('</main>')

final_html = current_html[:start_main_cur] + recovered_main + current_html[end_main_cur:]

with open('templates/compete.html', 'w', encoding='utf-8') as f:
    f.write(final_html)

print("Reverted UI to the recovered 1v1 King of the Hill layout!")
