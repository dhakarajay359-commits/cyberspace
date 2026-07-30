with open('recovered_compete2.html', 'r', encoding='utf-8') as f:
    text = f.read()
    part2 = text[11739:27336]
    with open('part2.html', 'w', encoding='utf-8') as out:
        out.write(part2)
