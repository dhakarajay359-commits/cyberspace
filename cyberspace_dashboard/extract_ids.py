with open('recovered_compete2.html', 'r', encoding='utf-8') as f:
    text = f.read()
    part2 = text[11739:27336]
    for line in part2.split('\n'):
        if 'id=' in line:
            print(line.strip())
