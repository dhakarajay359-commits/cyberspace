import sqlite3

src = sqlite3.connect(r'C:\Users\ASUS\Downloads\ctf-platform\data\ctf.db')
dst = sqlite3.connect(r'C:\Users\ASUS\OneDrive\Desktop\reseach\cyberspace_dashboard\users.db')

tables = ['categories', 'challenges', 'hints', 'hint_reveals', 'solves', 'wrong_attempts', 'settings', 'campaign_chapters', 'notifications', 'messages']

for table in tables:
    schema = src.execute(f"SELECT sql FROM sqlite_master WHERE type='table' AND name='{table}'").fetchone()[0]
    dst.execute(f'DROP TABLE IF EXISTS {table}')
    dst.execute(schema)
    
    rows = src.execute(f'SELECT * FROM {table}').fetchall()
    if not rows: continue
    placeholders = ','.join(['?']*len(rows[0]))
    dst.executemany(f'INSERT INTO {table} VALUES ({placeholders})', rows)
    
dst.commit()
dst.close()
src.close()
print('Migration complete')
