import re

with open('app.py', 'r', encoding='utf-8') as f:
    text = f.read()

# Add DB_PATH declaration
text = re.sub(r'(import sqlite3\n)', r'\1import os\nDB_PATH = os.environ.get("DB_PATH", "users.db")\n', text)

# Replace all occurrences
text = text.replace("sqlite3.connect('users.db')", "sqlite3.connect(DB_PATH)")
text = text.replace('sqlite3.connect("users.db")', 'sqlite3.connect(DB_PATH)')

with open('app.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('Replaced occurrences.')
