import requests
import time

BASE_URL = "/api/user"

def run_tests():
    print("--- Starting Contacts Flow Test ---")
    
    # 1. Register User A
    user_a = {"username": "testuser_a", "email": "a@example.com", "password": "password", "nodeId": "nodeA123"}
    r = requests.post(f"{BASE_URL}/register", json=user_a)
    print("Register User A:", r.json())
    
    # 2. Register User B
    user_b = {"username": "testuser_b", "email": "b@example.com", "password": "password", "nodeId": "nodeB123"}
    r = requests.post(f"{BASE_URL}/register", json=user_b)
    print("Register User B:", r.json())
    
    # 3. User A searches for User B (via directory)
    r = requests.get(f"{BASE_URL}/directory")
    directory = r.json().get('directory', [])
    found = any(u['username'] == 'testuser_b' for u in directory)
    print("User A found User B in directory:", found)
    
    # 4. User A sends contact request to User B
    req_data = {"sender": "testuser_a", "receiver": "testuser_b"}
    r = requests.post(f"{BASE_URL}/contacts/request", json=req_data)
    print("User A sent request to B:", r.json())
    
    # 5. User B checks pending requests
    r = requests.get(f"{BASE_URL}/contacts/requests/testuser_b")
    requests_b = r.json().get('requests', [])
    print("User B pending requests:", requests_b)
    
    if requests_b:
        req_id = requests_b[0]['requestId']
        # 6. User B accepts request
        r = requests.post(f"{BASE_URL}/contacts/request/accept", json={"requestId": req_id})
        print("User B accepted request:", r.json())
        
        # 7. Check contacts for A and B
        r_a = requests.get(f"{BASE_URL}/contacts/testuser_a")
        print("User A contacts:", [c['username'] for c in r_a.json().get('contacts', [])])
        
        r_b = requests.get(f"{BASE_URL}/contacts/testuser_b")
        print("User B contacts:", [c['username'] for c in r_b.json().get('contacts', [])])

if __name__ == "__main__":
    try:
        run_tests()
    except Exception as e:
        print("Error:", e)
