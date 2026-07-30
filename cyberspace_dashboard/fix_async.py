import sys
import re

try:
    with open('templates/compete.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the startMatch function definition
    # Some parts might be 'function startMatch() {' or similar.
    # But wait, let's just make it async if it isn't.
    
    if 'function startMatch()' in content and 'async function startMatch()' not in content:
        content = content.replace('function startMatch() {', 'async function startMatch() {')
        
        with open('templates/compete.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Made startMatch async!")
    else:
        print("startMatch is already async or not found.")

except Exception as e:
    print("Error:", e)
