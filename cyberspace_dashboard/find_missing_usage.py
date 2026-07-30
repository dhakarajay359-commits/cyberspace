with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    original = f.read()

# In the true original, these IDs are NOT there either.
# The compete.js uses these IDs - they were added AFTER the original.
# So the compete.js was enhanced by the night agent with new IDs
# but the HTML never got updated.
# Let's check what compete.js expects specifically

with open('static/js/compete.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re

# Find all getElementById usages and what they do
for missing_id in ['blue-controls', 'red-payload', 'blue-scenario-label', 
                   'active-rules-list', 'blue-threat-level', 'blue-traffic',
                   'tab-verify-modal', 'tab-verify-icon', 'tab-verify-title',
                   'tab-verify-subtitle', 'tab-verify-confirm', 'tab-verify-input',
                   'tab-verify-error']:
    idx = js.find(f'"{missing_id}"')
    if idx != -1:
        # Get context
        context_start = max(0, idx - 100)
        print(f'\n#{missing_id}:')
        print(js[context_start:idx+len(missing_id)+100].encode('ascii','ignore').decode('ascii'))
