import time
with open('endpoints_to_add.py', 'r', encoding='utf-8') as f:
    endpoints = f.read()

with open('app.py', 'r', encoding='utf-8') as f:
    app_text = f.read()

app_text = app_text.replace("if __name__ == '__main__':", endpoints + "\n\nif __name__ == '__main__':")

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(app_text)
