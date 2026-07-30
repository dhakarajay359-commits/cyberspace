with open('recovered_compete2.html', 'r', encoding='utf-8') as f:
    text = f.read()

part1 = text[127:10896 + 14]
part2 = text[11739:98629 + 14]

with open('templates/compete.html', 'w', encoding='utf-8') as out:
    out.write('{% set active_page = "compete" %}\n{% extends "base.html" %}\n\n')
    out.write(part1)
    out.write('\n\n')
    out.write(part2)
