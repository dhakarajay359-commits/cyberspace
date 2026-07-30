with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    original = f.read()

# Extract the full battleground-ui section
idx = original.find('id="battleground-ui"')
start = original.rfind('<div', 0, idx)

# Find closing div for battleground-ui (it's a big section)
depth = 0
pos = start
while pos < len(original):
    if original[pos:pos+4] == '<div':
        depth += 1
    elif original[pos:pos+6] == '</div>':
        depth -= 1
        if depth == 0:
            end = pos + 6
            break
    pos += 1

battleground_html = original[start:end]
print('battleground-ui extracted, length:', len(battleground_html))

# Verify it has all the key IDs
for key_id in ['blue-controls', 'red-payload', 'blue-scenario-label', 'active-rules-list', 
               'blue-threat-level', 'target-input', 'blue-traffic']:
    found = key_id in battleground_html
    print(f'  #{key_id}: {"OK" if found else "MISSING"}')

with open('battleground_section.html', 'w', encoding='utf-8') as f:
    f.write(battleground_html)
print('\nSaved to battleground_section.html, size:', len(battleground_html))
