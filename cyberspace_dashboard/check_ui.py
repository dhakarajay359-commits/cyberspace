with open('true_original_compete.html', 'r', encoding='utf-8') as f:
    text = f.read()
    if 'id="lobby-setup"' in text:
        print('Has lobby setup UI')
    if 'id="waiting-room"' in text:
        print('Has waiting room UI')
    if 'id="battle-arena"' in text:
        print('Has battle arena UI')
