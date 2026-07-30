import sys

with open('templates/compete.html', 'r', encoding='utf-8') as f:
    current_html = f.read()

with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    original_html = f.read()

# Find the split point
split_marker = '<!-- LOBBY MODAL -->'

idx_current = current_html.find(split_marker)
idx_original = original_html.find(split_marker)

if idx_current == -1 or idx_original == -1:
    print("Could not find the split marker in one of the files.")
    sys.exit(1)

# Keep the top part of current_html (which has our layout and header fixes)
top_part = current_html[:idx_current]

# Keep the bottom part of original_html (which has the uncorrupted modals and battleground)
bottom_part = original_html[idx_original:]

# Write back to compete.html
with open('templates/compete.html', 'w', encoding='utf-8') as f:
    f.write(top_part + bottom_part)

print("Successfully merged the fixed header/layout with the pristine original modals.")
