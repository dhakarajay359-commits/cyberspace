with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    original = f.read()

# The battleground-ui is a small outer div - the actual content (red+blue consoles) 
# is inside the waiting-room section (after deploy). Let's check.
# Search for all key IDs and their parent context
for key_id in ['blue-controls', 'red-payload', 'blue-scenario-label', 
               'active-rules-list', 'blue-threat-level', 'target-input', 'blue-traffic']:
    idx = original.find(f'id="{key_id}"')
    if idx != -1:
        # Find what section this is in
        parent_start = max(0, idx - 500)
        context = original[parent_start:idx+100]
        # Find the innermost section/div id
        import re
        parent_ids = re.findall(r'id="([^"]+)"', context)
        print(f'#{key_id} -> parent context IDs: {parent_ids[-3:] if len(parent_ids) >= 3 else parent_ids}')
        print(f'  HTML: {original[idx:idx+80].encode("ascii","ignore").decode("ascii")}')
    else:
        print(f'#{key_id}: NOT FOUND in original!')
