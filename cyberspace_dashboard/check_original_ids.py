import re

# Extract specific HTML sections from true_original_compete.html
with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    original = f.read()

# Check which of the missing IDs exist in the original
missing_ids = [
    'tab-verify-modal', 'tab-verify-icon', 'tab-verify-title', 'tab-verify-subtitle',
    'tab-verify-confirm', 'tab-verify-input', 'tab-verify-error',
    'blue-controls', 'red-payload', 'blue-scenario-label', 'active-rules-list',
    'blue-threat-level', 'target-input', 'blue-traffic',
    'traffic-analyzer-modal', 'traffic-analyzer-content',
    'threat-intel-modal', 'threat-intel-content'
]

print('Which missing IDs exist in true_original_compete.html:')
for elem_id in missing_ids:
    found = elem_id in original
    print(f'  #{elem_id}: {"FOUND" if found else "MISSING"}')

# Also check what IDs the waiting-room section in original has vs current
with open('templates/compete.html', 'r', encoding='utf-8') as f:
    current = f.read()

print()
print('Waiting room in original has:')
wr_start = original.find('id="waiting-room"')
wr_end = original.find('<!-- BATTLEGROUND', wr_start)
waiting_room_html = original[wr_start:wr_end]

wr_ids = re.findall(r'id="([^"]+)"', waiting_room_html)
print('  IDs in original waiting-room:', wr_ids)

print()
wr_start2 = current.find('id="waiting-room"')
wr_end2 = current.find('<!-- BATTLEGROUND', wr_start2)
if wr_end2 == -1:
    wr_end2 = wr_start2 + 5000
waiting_room_current = current[wr_start2:wr_end2]

wr_ids2 = re.findall(r'id="([^"]+)"', waiting_room_current)
print('  IDs in current waiting-room:', wr_ids2)
