with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    original = f.read()

# Extract tab-verify-modal
idx = original.find('id="tab-verify-modal"')
# Go to the opening div
start = original.rfind('<div', 0, idx)
# Find the closing - it's a fixed modal, find </div> that closes it
# Count div depth
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

tab_verify_modal = original[start:end]
print('tab-verify-modal extracted, length:', len(tab_verify_modal))
print(tab_verify_modal[:200].encode('ascii', 'ignore').decode('ascii'))
print('...')
print(tab_verify_modal[-100:].encode('ascii', 'ignore').decode('ascii'))

with open('tab_verify_modal.html', 'w', encoding='utf-8') as f:
    f.write(tab_verify_modal)
print('\nSaved to tab_verify_modal.html')
