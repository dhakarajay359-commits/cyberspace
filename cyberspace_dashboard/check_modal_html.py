with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    text = f.read()
idx = text.find('id="how-to-play-modal"')
print(text[idx:idx+400].encode('ascii','ignore').decode('ascii'))
