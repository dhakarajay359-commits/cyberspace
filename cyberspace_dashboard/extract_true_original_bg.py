with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('id="battleground-ui"')
end = text.find('</main>', start)
if start != -1:
    with open('battleground_true_original.html', 'w', encoding='utf-8') as f:
        f.write(text[start:end])
    print('Extracted true original battleground')
