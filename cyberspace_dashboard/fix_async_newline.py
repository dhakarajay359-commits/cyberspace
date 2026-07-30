import sys

try:
    with open('templates/compete.html', 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix the standalone async
    if 'async \n        function deployCustomRule()' in content:
        content = content.replace('async \n        function deployCustomRule()', 'async function deployCustomRule()')
        print("Fixed async newline!")
        
        with open('templates/compete.html', 'w', encoding='utf-8') as f:
            f.write(content)
    else:
        print("Not found, trying flexible replace...")
        import re
        content = re.sub(r'async\s*\n\s*function deployCustomRule\(\)', 'async function deployCustomRule()', content)
        with open('templates/compete.html', 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed using regex!")

except Exception as e:
    print("Error:", e)
