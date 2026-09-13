import React, { createContext, useContext, useState, useEffect } from 'react';
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isServerConnected, setIsServerConnected] = useState(true);

  // Monitor server health & auto-reconnect
  useEffect(() => {
    const checkServerHealth = async () => {
      try {
        const res = await fetch('/api/health');
        if (res.ok) {
          setIsServerConnected(true);
        } else {
          setIsServerConnected(false);
        }
      } catch (err) {
        setIsServerConnected(false);
      }
    };

    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('ll_session_v4');
    if (saved) {
      const user = JSON.parse(saved);
      if (!user.nodeId) {
        const generateFakeHash = (str) => {
          let hash = 0;
          for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
          const seed = Math.abs(hash).toString(16).padStart(8, '0');
          let fullHash = '';
          for (let i = 0; i < 16; i++) fullHash += seed;
          return fullHash;
        };
        user.nodeId = `LL-${generateFakeHash(user.username || 'user')}`;
      }
      setCurrentUser(user);

      // Re-fetch fresh user profile from backend server to stay in sync with database
      if (user.username) {
        const authHeader = user.session_token ? { 'Authorization': `Bearer ${user.session_token}` } : {};
        fetch(`/api/user/profile/${user.username}`, { headers: authHeader })
          .then(res => res.ok ? res.json() : null)
          .then(data => {
            if (data && data.user) {
              const freshUser = { ...user, ...data.user, session_token: user.session_token };
              setCurrentUser(freshUser);
              localStorage.setItem('ll_session_v4', JSON.stringify(freshUser));
            }
          })
          .catch(err => console.error("Failed to sync profile from server", err));
      }
    }
  }, []);

  const updateUserProfile = async (updatedFields) => {
    if (!currentUser) return false;
    try {
      const res = await fetch('/api/user/update_profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentUser.id,
          username: currentUser.username,
          ...updatedFields
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          const updated = { ...currentUser, ...data.user, session_token: currentUser.session_token };
          setCurrentUser(updated);
          localStorage.setItem('ll_session_v4', JSON.stringify(updated));
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error("Failed to update user profile on server", err);
      return false;
    }
  };

  const login = (userObj) => {
    // Generate a deterministic fake SHA3-512 hash (128 hex chars) based on username for UI purposes
    const generateFakeHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
      const seed = Math.abs(hash).toString(16).padStart(8, '0');
      let fullHash = '';
      for (let i = 0; i < 16; i++) fullHash += seed;
      return fullHash;
    };
    
    const nodeId = userObj.nodeId || `LL-${generateFakeHash(userObj.username || 'user')}`;
    const updated = { ...userObj, status: 'online', nodeId };
    setCurrentUser(updated);
    localStorage.setItem('ll_session_v4', JSON.stringify(updated));
  };

  const register = (userObj) => {
    const generateFakeHash = (str) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
      const seed = Math.abs(hash).toString(16).padStart(8, '0');
      let fullHash = '';
      for (let i = 0; i < 16; i++) fullHash += seed;
      return fullHash;
    };
    
    const nodeId = userObj.nodeId || `LL-${generateFakeHash(userObj.username || 'user')}`;
    const updated = { ...userObj, status: 'online', nodeId };
    setCurrentUser(updated);
    localStorage.setItem('ll_session_v4', JSON.stringify(updated));
  };

  const logout = async () => {
    const token = currentUser?.session_token;
    setCurrentUser(null);
    localStorage.removeItem('ll_session_v4');
    localStorage.removeItem('ll_active_tab');
    sessionStorage.clear();

    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ session_token: token })
        });
      } catch (err) {
        console.warn("Server logout notification skipped:", err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, isServerConnected, login, logout, register, updateUserProfile, role: currentUser?.role || null }}>
      {children}
    </AuthContext.Provider>
  );
};



export const useAuth = () => useContext(AuthContext);
