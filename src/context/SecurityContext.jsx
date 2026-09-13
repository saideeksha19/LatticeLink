import React, { createContext, useContext, useState, useEffect } from 'react';

const SecurityContext = createContext(null);

export const SecurityProvider = ({ children }) => {
  const [lsocThreats, setLsocThreats] = useState([]);
  const [attackHistory, setAttackHistory] = useState([]);

  useEffect(() => {
    const fetchThreats = async () => {
      const token = localStorage.getItem('ll_session_v4');
      const currentUser = token ? JSON.parse(token) : null;
      if (!currentUser || !currentUser.session_token) return;

      try {
        const res = await fetch('/api/security/threats', {
          headers: {
            'Authorization': `Bearer ${currentUser.session_token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setLsocThreats(data.threats);
        }
      } catch (err) {
        console.error("Failed to fetch threats", err);
      }
    };
    
    fetchThreats();
    const interval = setInterval(fetchThreats, 5000);
    return () => clearInterval(interval);
  }, []);

  const logThreat = async (type, severity, source, target, status, reason) => {
    try {
      const token = localStorage.getItem('ll_session_v4');
      const currentUser = token ? JSON.parse(token) : null;
      if (!currentUser) return;

      const res = await fetch('/api/security/threats/log', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.session_token}`
        },
        body: JSON.stringify({ type, severity, source, target, status, reason })
      });
      if (res.ok) {
        const data = await res.json();
        setLsocThreats(prev => [data.threat, ...prev]);
      }
    } catch (err) {
      console.error("Failed to log threat", err);
    }
  };

  const recordAttack = async (attackData) => {
    // Currently, attack history is simulated on the frontend, but we can POST to the backend
    try {
      const token = localStorage.getItem('ll_session_v4');
      const currentUser = token ? JSON.parse(token) : null;
      if (!currentUser) return;

      const res = await fetch('/api/security/attacks/record', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.session_token}`
        },
        body: JSON.stringify(attackData)
      });
      if (res.ok) {
        const data = await res.json();
        setAttackHistory(prev => [data.attack, ...prev]);
      }
    } catch (err) {
      console.error("Failed to record attack", err);
    }
  };

  const simulateAttack = async (attackType) => {
    try {
      const token = localStorage.getItem('ll_session_v4');
      const currentUser = token ? JSON.parse(token) : null;
      if (!currentUser) return;

      const res = await fetch('/api/security/simulate', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.session_token}`
        },
        body: JSON.stringify({ type: attackType })
      });
      if (res.ok) {
        const data = await res.json();
        setLsocThreats(prev => [data.threat, ...prev]);
        return data;
      }
    } catch (err) {
      console.error("Failed to simulate attack", err);
    }
    return null;
  };

  return (
    <SecurityContext.Provider value={{ lsocThreats, logThreat, attackHistory, recordAttack, simulateAttack }}>
      {children}
    </SecurityContext.Provider>
  );
};

export const useSecurity = () => useContext(SecurityContext);
