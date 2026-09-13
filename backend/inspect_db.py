import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), 'instance', 'latticelink.db')
conn = sqlite3.connect(db_path)
cur = conn.cursor()

cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = [r[0] for r in cur.fetchall() if not r[0].startswith('sqlite')]

print("Active SQLite Database Tables & Row Counts:")
print("-" * 50)
for t in tables:
    cur.execute(f"SELECT count(*) FROM {t}")
    cnt = cur.fetchone()[0]
    print(f"  {t:25} : {cnt:5} rows")

print("\nSample User Records:")
cur.execute("SELECT id, username, email, role, is_verified, node_id FROM users")
for row in cur.fetchall():
    print(f"  User: id={row[0]}, username={row[1]}, email={row[2]}, role={row[3]}, verified={row[4]}, node_id={row[5]}")

print("\nSample Key Records:")
cur.execute("SELECT id, user_id, key_version, key_type, fingerprint, status FROM keys")
for row in cur.fetchall():
    print(f"  Key: id={row[0]}, user_id={row[1]}, v={row[2]}, type={row[3]}, fp={row[4][:16]}..., status={row[5]}")

print("\nSample Message Records:")
cur.execute("SELECT id, conversation_id, sender, receiver, type, key_version, sha3_hash FROM messages LIMIT 5")
for row in cur.fetchall():
    print(f"  Msg: id={row[0]}, conv={row[1]}, {row[2]}->{row[3]}, type={row[4]}, v={row[5]}")

conn.close()
