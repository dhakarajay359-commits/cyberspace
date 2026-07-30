import sys

try:
    with open('templates/compete.html', 'r', encoding='utf-8') as f:
        content = f.read()

    bad_block = """        function addFeedItem() {

            const feed = document.getElementById('feed-container');

        const targets = ['[HARD] Internal DC', '[EASY] Web App 01', '[INSANE] CEO Laptop', '[MEDIUM] Backup Server', 'SQLi Challenge'];"""

    bad_block2 = """        function addFeedItem() {
            const feed = document.getElementById('feed-container');
        const targets = ['[HARD] Internal DC', '[EASY] Web App 01', '[INSANE] CEO Laptop', '[MEDIUM] Backup Server', 'SQLi Challenge'];"""
        
    bad_block3 = """        function addFeedItem() {
            const feed = document.getElementById('feed-container');

        const targets = ['[HARD] Internal DC', '[EASY] Web App 01', '[INSANE] CEO Laptop', '[MEDIUM] Backup Server', 'SQLi Challenge'];"""

    found = False
    for b in [bad_block, bad_block2, bad_block3]:
        if b in content:
            content = content.replace(b, "")
            found = True
            print("Removed exact match!")
            break

    if not found:
        # manual fallback
        idx = content.find("function addFeedItem()")
        if idx != -1:
            idx2 = content.find("function addFeedItem()", idx + 20)
            if idx2 != -1:
                content = content[:idx] + content[idx2:]
                print("Removed manual block!")

    with open('templates/compete.html', 'w', encoding='utf-8') as f:
        f.write(content)

except Exception as e:
    print("Error:", e)
