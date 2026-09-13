import sqlite3
import os

db_path = os.path.join('instance', 'latticelink.db')
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    try:
        conn.execute('ALTER TABLE messages ADD COLUMN plaintext TEXT;')
        conn.commit()
        print('Column added successfully!')
    except sqlite3.OperationalError as e:
        print('Error:', e)
    conn.close()
else:
    print('DB not found at', db_path)
