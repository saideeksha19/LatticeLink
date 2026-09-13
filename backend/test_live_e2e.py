import urllib.request
import urllib.parse
import json
import sqlite3
import os
import sys
import time
import hmac
import hashlib
import socketio

BASE_URL = "http://127.0.0.1:5000"
DB_PATH = os.getenv("LATTICELINK_TEST_DB_PATH", os.path.join(os.path.dirname(__file__), "instance", "latticelink_test.db"))

# HARD SAFETY GUARD: Prevent test_live_e2e from running raw sqlite operations against active development database
from config import Config
os.environ['LATTICELINK_TEST_MODE'] = 'True'
Config.assert_safe_for_destructive_action("test_live_e2e.py startup", uri=f"sqlite:///{DB_PATH.replace(os.sep, '/')}")

class SessionClient:
    def __init__(self):
        self.cookie_jar = urllib.request.HTTPCookieProcessor()
        self.opener = urllib.request.build_opener(self.cookie_jar)
        self.token = None

    def request(self, method, endpoint, data=None, headers=None):
        url = BASE_URL + endpoint
        if headers is None:
            headers = {}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        payload = None
        if data is not None:
            if isinstance(data, dict):
                payload = json.dumps(data).encode("utf-8")
                headers["Content-Type"] = "application/json"
            else:
                payload = data
        req = urllib.request.Request(url, data=payload, headers=headers, method=method)
        try:
            with self.opener.open(req) as resp:
                status = resp.status
                body = resp.read().decode("utf-8")
                try:
                    return status, json.loads(body)
                except Exception:
                    return status, body
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8")
            try:
                return e.code, json.loads(body)
            except Exception:
                return e.code, body

def get_otp_for_user_id(user_id):
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("SELECT salt, token_hash FROM email_verification_tokens WHERE user_id = ? AND used = 0 ORDER BY id DESC LIMIT 1", (user_id,))
    row = cur.fetchone()
    conn.close()
    if not row:
        return None
    salt, token_hash = row
    salt_b = salt.encode('utf-8')
    for num in range(100000, 1000000):
        s = str(num)
        h = hmac.new(salt_b, s.encode('utf-8'), hashlib.sha256).hexdigest()
        if h == token_hash:
            return s
    return None

def run_e2e_tests():
    print("=== STARTING LIVE END-TO-END AUDIT TESTS ===")
    results = {}

    # 1. Health check
    client_a = SessionClient()
    status, body = client_a.request("GET", "/api/health")
    print(f"1. Health Check: {status} -> {body}")
    assert status == 200 and body.get("status") in ("ok", "healthy"), "Health check failed"
    results["health_check"] = "PASS"

    user_a_email = "audit_user_a@example.com"
    user_a_name = "AuditUserA"
    password_a = "P@ssw0rd123!Secure"

    user_b_email = "audit_user_b@example.com"
    user_b_name = "AuditUserB"
    password_b = "P@ssw0rd123!Secure"

    user_c_email = "audit_user_c@example.com"
    user_c_name = "AuditUserC"
    password_c = "P@ssw0rd123!Secure"

    # Clean previous audit test records in test DB
    Config.assert_safe_for_destructive_action("test_live_e2e raw sqlite DELETE", uri=f"sqlite:///{DB_PATH.replace(os.sep, '/')}")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DELETE FROM email_verification_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?, ?))", (user_a_email, user_b_email, user_c_email))
    cur.execute("DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?, ?))", (user_a_email, user_b_email, user_c_email))
    cur.execute("DELETE FROM group_members WHERE username IN (?, ?, ?)", (user_a_name, user_b_name, user_c_name))
    cur.execute("DELETE FROM groups WHERE created_by IN (?, ?, ?)", (user_a_name, user_b_name, user_c_name))
    cur.execute("DELETE FROM messages WHERE sender IN (?, ?, ?) OR receiver IN (?, ?, ?)", (user_a_name, user_b_name, user_c_name, user_a_name, user_b_name, user_c_name))
    cur.execute("DELETE FROM calls WHERE caller IN (?, ?, ?) OR receiver IN (?, ?, ?)", (user_a_name, user_b_name, user_c_name, user_a_name, user_b_name, user_c_name))
    cur.execute("DELETE FROM keys WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?, ?))", (user_a_email, user_b_email, user_c_email))
    cur.execute("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE email IN (?, ?, ?))", (user_a_email, user_b_email, user_c_email))
    cur.execute("DELETE FROM users WHERE email IN (?, ?, ?)", (user_a_email, user_b_email, user_c_email))
    conn.commit()
    conn.close()

    # 2. Register & Verify User A
    status, body = client_a.request("POST", "/api/auth/register", {
        "username": user_a_name,
        "email": user_a_email,
        "password": password_a
    })
    print(f"2. User A Register: {status} -> {body.get('message')}")
    assert status == 201
    user_a_id = body["user"]["id"]
    otp_a = get_otp_for_user_id(user_a_id)
    assert otp_a is not None

    status, body = client_a.request("POST", "/api/auth/verify-email", {
        "email": user_a_email,
        "otp": otp_a
    })
    print(f"3. User A Verify Email: {status}")
    assert status == 200

    status, body = client_a.request("POST", "/api/auth/login", {
        "username": user_a_name,
        "password": password_a
    })
    print(f"4. User A Login: {status}")
    assert status == 200
    token_a = body.get("token") or body.get("session_token")
    client_a.token = token_a
    results["auth_user_a"] = "PASS"

    # 3. Register & Verify User B
    client_b = SessionClient()
    status, body = client_b.request("POST", "/api/auth/register", {
        "username": user_b_name,
        "email": user_b_email,
        "password": password_b
    })
    assert status == 201
    user_b_id = body["user"]["id"]
    otp_b = get_otp_for_user_id(user_b_id)
    status, body = client_b.request("POST", "/api/auth/verify-email", {
        "email": user_b_email,
        "otp": otp_b
    })
    assert status == 200
    status, body = client_b.request("POST", "/api/auth/login", {
        "username": user_b_name,
        "password": password_b
    })
    assert status == 200
    token_b = body.get("token") or body.get("session_token")
    client_b.token = token_b
    print(f"5. User B Registered and Logged in (Token: {token_b[:10]}...)")
    results["auth_user_b"] = "PASS"

    # 4. Register & Verify User C (Unauthorized)
    client_c = SessionClient()
    status, body = client_c.request("POST", "/api/auth/register", {
        "username": user_c_name,
        "email": user_c_email,
        "password": password_c
    })
    assert status == 201
    user_c_id = body["user"]["id"]
    otp_c = get_otp_for_user_id(user_c_id)
    status, body = client_c.request("POST", "/api/auth/verify-email", {
        "email": user_c_email,
        "otp": otp_c
    })
    assert status == 200
    status, body = client_c.request("POST", "/api/auth/login", {
        "username": user_c_name,
        "password": password_c
    })
    assert status == 200
    token_c = body.get("token") or body.get("session_token")
    client_c.token = token_c
    print(f"6. User C Registered and Logged in (Token: {token_c[:10]}...)")
    results["auth_user_c"] = "PASS"

    # 5. Socket.IO Connections & 1-to-1 Messaging
    print("7. Connecting User A & User B via Socket.IO...")
    sio_a = socketio.Client()
    sio_b = socketio.Client()

    received_by_b = []
    received_by_a = []

    @sio_b.on("receive_message")
    def on_b_receive(data):
        print(f"  [Socket B] received message from {data.get('sender')}: {data.get('text')}")
        received_by_b.append(data)

    @sio_a.on("receive_message")
    def on_a_receive(data):
        print(f"  [Socket A] received message from {data.get('sender')}: {data.get('text')}")
        received_by_a.append(data)

    sio_a.connect(BASE_URL, auth={"token": token_a})
    sio_b.connect(BASE_URL, auth={"token": token_b})
    time.sleep(0.5)

    # A sends to B
    msg_text_1 = "Audit Hello B from User A"
    sio_a.emit("send_message", {
        "receiver": user_b_name,
        "text": msg_text_1,
        "type": "text"
    })
    time.sleep(1.0)
    assert len(received_by_b) > 0, "User B did not receive real-time message"
    assert received_by_b[0]["text"] == msg_text_1

    # B sends to A
    msg_text_2 = "Audit Reply from User B to A"
    sio_b.emit("send_message", {
        "receiver": user_a_name,
        "text": msg_text_2,
        "type": "text"
    })
    time.sleep(1.0)
    assert any(m["text"] == msg_text_2 for m in received_by_a), "User A did not receive real-time reply"

    # Verify history persistence via HTTP
    conv_id = "-".join(sorted([user_a_name, user_b_name]))
    status, body = client_a.request("GET", f"/api/chat/history/{conv_id}")
    print(f"8. Conversation History (/api/chat/history/{conv_id}): {status}, count={len(body.get('messages', []))}")
    assert status == 200
    texts = [m["text"] for m in body["messages"]]
    assert msg_text_1 in texts and msg_text_2 in texts
    results["1_to_1_chat"] = "PASS"

    # 6. Group Chat Creation & Isolation
    status, body = client_a.request("POST", "/api/chat/groups/create", {
        "name": "Audit Security Unit",
        "description": "Functional audit test group",
        "members": [user_b_name]
    })
    print(f"9. User A Created Group: {status} -> {body.get('group', {}).get('id')}")
    assert status == 201
    group_id = body["group"]["id"]

    # User B joins socket group room
    sio_a.emit("join_group", {"group_id": group_id})
    sio_b.emit("join_group", {"group_id": group_id})
    time.sleep(0.5)

    group_msgs_received = []
    @sio_b.on("receive_group_message")
    def on_group_msg(data):
        print(f"  [Socket B] Group message received: {data.get('text')}")
        group_msgs_received.append(data)

    group_text = "Audit Test: Group confidential broadcast"
    sio_a.emit("send_message", {
        "receiver": group_id,
        "text": group_text,
        "type": "text",
        "is_group": True
    })
    time.sleep(1.0)
    assert len(group_msgs_received) > 0, "User B did not receive group message"

    # User C (Unauthorized) attempts to access group history
    status, body = client_c.request("GET", f"/api/chat/history/{group_id}")
    print(f"10. Unauthorized User C accessing group history: {status} (Expected 403)")
    assert status == 403
    results["group_chat"] = "PASS"

    # 7. Vault File Upload, Share & Access Control
    boundary = "----WebKitFormBoundaryAudit12345"
    file_bytes = b"%PDF-1.4 Functional Audit Security Report Payload 2026-09-13"
    filename = "audit_report.pdf"

    multipart_body = (
        f"--{boundary}\r\n"
        f'Content-Disposition: form-data; name="file"; filename="{filename}"\r\n'
        f"Content-Type: application/pdf\r\n\r\n"
    ).encode("utf-8") + file_bytes + f"\r\n--{boundary}--\r\n".encode("utf-8")

    status, body = client_a.request(
        "POST",
        "/api/vault/upload",
        data=multipart_body,
        headers={"Content-Type": f"multipart/form-data; boundary={boundary}"}
    )
    print(f"11. User A Upload to Vault: {status} -> {body}")
    assert status == 201
    vault_file_id = body["file"]["id"]

    # Share file with User B
    status, body = client_a.request("POST", f"/api/vault/share/{vault_file_id}", {
        "shared_with_id": user_b_id
    })
    print(f"12. User A Shared Vault File with User B: {status}")
    assert status in (200, 201)

    # User B downloads file
    status, downloaded = client_b.request("GET", f"/api/vault/files/{vault_file_id}/download")
    print(f"13. User B Download Shared File: {status}, len={len(downloaded)}")
    assert status == 200
    assert (downloaded.encode("utf-8") == file_bytes or
            bytes(downloaded, "latin-1") == file_bytes or
            downloaded == file_bytes.decode("latin-1"))

    # User C (unauthorized) attempts download
    status, body = client_c.request("GET", f"/api/vault/files/{vault_file_id}/download")
    print(f"14. User C Unauthorized Download Attempt: {status} (Expected 403)")
    assert status == 403
    results["file_sharing_and_access_control"] = "PASS"

    # 8. WebRTC Audio/Video Call Signaling Roundtrip
    print("15. Testing WebRTC Signaling Cycle...")
    incoming_calls = []
    answered_calls = []
    ended_calls = []

    @sio_b.on("call_incoming")
    def on_call_inc(data):
        print(f"  [Socket B] Received call_incoming from {data.get('caller')}")
        incoming_calls.append(data)

    @sio_a.on("call_answered")
    def on_call_ans(data):
        print(f"  [Socket A] Received call_answered from {data.get('callee')}")
        answered_calls.append(data)

    @sio_b.on("call_ended")
    def on_call_end_b(data):
        print(f"  [Socket B] Received call_ended: {data}")
        ended_calls.append(data)

    # A calls B
    sio_a.emit("call_offer", {
        "callee": user_b_name,
        "offer": {"type": "offer", "sdp": "v=0\r\no=AuditOffer 1234 5678 IN IP4 127.0.0.1"},
        "call_type": "video"
    })
    time.sleep(1.0)
    assert len(incoming_calls) > 0, "Socket B did not receive call_incoming"

    # B answers A
    sio_b.emit("call_answer", {
        "caller": user_a_name,
        "answer": {"type": "answer", "sdp": "v=0\r\no=AuditAnswer 5678 1234 IN IP4 127.0.0.1"}
    })
    time.sleep(1.0)
    assert len(answered_calls) > 0, "Socket A did not receive call_answered"

    # A ends call
    sio_a.emit("call_end", {
        "target": user_b_name,
        "duration": 42,
        "call_type": "video",
        "status": "completed"
    })
    time.sleep(1.0)
    assert len(ended_calls) > 0, "Socket B did not receive call_ended"
    print("16. WebRTC Signaling Complete!")
    results["webrtc_signaling"] = "PASS"

    # 9. Key Rotation API
    status, body = client_a.request("POST", "/api/chat/keys/rotate", {})
    print(f"17. Key Rotation: {status} -> {body}")
    assert status == 200
    assert body.get("new_version") is not None
    assert body.get("fingerprint") is not None
    results["key_rotation"] = "PASS"

    # 10. RBAC Verification
    status, body = client_a.request("GET", "/api/admin/metrics")
    print(f"18. User A accessing /api/admin/metrics: {status} (Expected 403)")
    assert status == 403
    results["admin_rbac"] = "PASS"

    sio_a.disconnect()
    sio_b.disconnect()

    print("\n==================================================")
    print("SUCCESS: ALL LIVE END-TO-END AUDIT TESTS PASSED!")
    print("==================================================")
    for k, v in results.items():
        print(f"  {k}: {v}")

if __name__ == "__main__":
    run_e2e_tests()
