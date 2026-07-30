with open('recovered_compete6.html', 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('id="battleground-ui"')
end = text.find('</main>', start)
if start != -1:
    with open('battleground_original.html', 'w', encoding='utf-8') as f:
        f.write(text[start:end])
    print("Extracted original battleground to battleground_original.html")
