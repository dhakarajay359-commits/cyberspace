with open('syntax_check9.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    for i in range(15, 25):
        print(f'{i+1}: {lines[i].strip().encode("ascii", "ignore").decode("ascii")}')
