with open('syntax_check8.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

depth = 0
for i, line in enumerate(lines):
    # Ignore comments
    l = line.split('//')[0]
    # Rough heuristic
    depth += l.count('{') - l.count('}')
    
    if depth < 0:
        print(f"Error: depth became negative at line {i+1}: {line.strip()}")
        break

print("Final depth:", depth)
