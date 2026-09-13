import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const UserContext = createContext(null);

export const UserProvider = ({ children }) => {
  const [allUsers, setAllUsers] = useState({});
  const [contactRequests, setContactRequests] = useState([]);
  const [contacts, setContacts] = useState([]);
  const { currentUser } = useAuth(); // We need auth context to fetch user-specific data

  useEffect(() => {
    const token = currentUser?.session_token || (() => {
      try {
        const saved = localStorage.getItem('ll_session_v4');
        return saved ? JSON.parse(saved)?.session_token : null;
      } catch (e) { return null; }
    })();

    if (!currentUser || !token) return;
    
    // Fetch global directory periodically
    const fetchDirectory = async () => {
      try {
        const res = await fetch('/api/user/directory', {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'ngrok-skip-browser-warning': 'true'
          }
        });
        if (res.ok) {
          const data = await res.json();
          const userMap = {};
          data.directory.forEach(u => { userMap[u.username] = u; });
          setAllUsers(userMap);
        }
      } catch (err) {
        console.error("Failed to fetch directory", err);
      }
    };
    
    fetchDirectory();
    const interval = setInterval(fetchDirectory, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !currentUser.username) return;
    
    const fetchUserData = async () => {
      try {
        const authHeader = { 
          'Authorization': `Bearer ${currentUser.session_token}`,
          'ngrok-skip-browser-warning': 'true'
        };
        const [contactsRes, reqsRes] = await Promise.all([
          fetch(`/api/user/contacts/${currentUser.username}`, { headers: authHeader }),
          fetch(`/api/user/contacts/requests/${currentUser.username}`, { headers: authHeader })
        ]);
        
        if (contactsRes.ok) {
          const data = await contactsRes.json();
          setContacts(data.contacts);
        }
        
        if (reqsRes.ok) {
          const data = await reqsRes.json();
          // Transform backend format to expected frontend format
          const formattedReqs = data.requests.map(r => ({
            id: r.requestId,
            sender: r.user.username,
            receiver: currentUser.username,
            status: 'Pending',
            timestamp: r.timestamp,
            user: r.user
          }));
          setContactRequests(formattedReqs);
        }
      } catch (err) {
        console.error("Failed to fetch user data", err);
      }
    };

    fetchUserData();
    const interval = setInterval(fetchUserData, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // AuthContext handles registration now. We provide a stub for backward compatibility if needed, 
  // but it shouldn't be called directly anymore.
  const registerUser = () => { console.warn("Use AuthContext.register instead"); };
  const setOnlineStatus = () => {}; // Status managed by backend

  const getContacts = (currentUsername) => {
    return contacts;
  };

  const getPendingRequests = (username) => {
    return contactRequests;
  };

  const sendContactRequest = async (sender, receiver) => {
    try {
      const res = await fetch('/api/user/contacts/request', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.session_token}`
        },
        body: JSON.stringify({ sender, receiver })
      });
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const acceptContactRequest = async (requestId) => {
    try {
      const res = await fetch('/api/user/contacts/respond', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.session_token}`
        },
        body: JSON.stringify({ requestId, action: 'accept' })
      });
      if (!res.ok) return false;

      // Re-fetch contacts and requests immediately
      if (currentUser?.username) {
        const authHeader = { 'Authorization': `Bearer ${currentUser.session_token}` };
        const [contactsRes, reqsRes] = await Promise.all([
          fetch(`/api/user/contacts/${currentUser.username}`, { headers: authHeader }),
          fetch(`/api/user/contacts/requests/${currentUser.username}`, { headers: authHeader })
        ]);
        if (contactsRes.ok) {
          const data = await contactsRes.json();
          setContacts(data.contacts || []);
        }
        if (reqsRes.ok) {
          const data = await reqsRes.json();
          const formattedReqs = (data.requests || []).map(r => ({
            id: r.requestId,
            sender: r.user.username,
            receiver: currentUser.username,
            status: 'Pending',
            timestamp: r.timestamp,
            user: r.user
          }));
          setContactRequests(formattedReqs);
        }
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const rejectContactRequest = async (requestId) => {
    try {
      const res = await fetch('/api/user/contacts/respond', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.session_token}`
        },
        body: JSON.stringify({ requestId, action: 'reject' })
      });
      if (res.ok) {
        setContactRequests(prev => prev.filter(req => req.id !== requestId));
      }
      return res.ok;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const searchUser = (query) => {
    if (!query) return [];
    const q = query.toLowerCase();
    return Object.values(allUsers).filter(u =>
      (u.username && u.username.toLowerCase().includes(q)) || 
      (u.nodeId && u.nodeId.toLowerCase().includes(q)) || 
      (u.email && u.email.toLowerCase().includes(q))
    );
  };

  return (
    <UserContext.Provider value={{
      allUsers, registerUser, setOnlineStatus, getContacts, searchUser,
      getPendingRequests, sendContactRequest, acceptContactRequest, rejectContactRequest
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
