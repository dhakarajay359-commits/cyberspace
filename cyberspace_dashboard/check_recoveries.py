for fname in ['recovered_compete6.html', 'recovered_compete5.html', 'recovered_compete3.html', 'recovered_compete2.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        text = f.read()
    has_extends = '{% extends' in text
    has_global = 'GLOBAL BATTLEGROUND' in text
    has_lobby = 'lobby-modal' in text
    has_waiting = 'waiting-room' in text
    has_bg = 'battleground-ui' in text
    has_auto = 'autoJoinFromUrl' in text
    has_block = '{% block content %}' in text
    print(f'{fname}: size={len(text)}')
    print(f'  extends base: {has_extends}')
    print(f'  block content: {has_block}')
    print(f'  GLOBAL BATTLEGROUND: {has_global}')
    print(f'  lobby-modal: {has_lobby}')
    print(f'  waiting-room: {has_waiting}')
    print(f'  battleground-ui: {has_bg}')
    print(f'  autoJoinFromUrl: {has_auto}')
    print()
