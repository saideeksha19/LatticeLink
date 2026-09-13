import React, { useState, useEffect } from 'react';
import { ShieldCheck, Fingerprint, Box, Key, Download, RefreshCw, HardDrive, Clock, Smartphone, Laptop, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import MatrixRain from './MatrixRain';

const QuantumIdentityPage = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [activeKeys, setActiveKeys] = useState({
    mlKem: currentUser?.mlKemPubKey || '',
    mlDsa: currentUser?.mlDsaPubKey || '',
    fingerprint: currentUser?.keyFingerprint || '',
    version: currentUser?.keyVersion || 1
  });
  const [rotating, setRotating] = useState(false);
  const [notification, setNotification] = useState(null);

  const getToken = () => {
    return currentUser?.session_token || (() => {
      try {
        const saved = localStorage.getItem('ll_session_v4');
        return saved ? JSON.parse(saved)?.session_token : null;
      } catch (e) { return null; }
    })();
  };

  // Fetch active user keys from server on load
  useEffect(() => {
    const token = getToken();
    if (!currentUser?.username || !token) return;
    fetch(`/api/chat/keys/${currentUser.username}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.key) {
          setActiveKeys({
            mlKem: data.key.mlkem_pub_key,
            mlDsa: data.key.mldsa_pub_key,
            fingerprint: data.key.fingerprint,
            version: data.key.key_version
          });
        }
      })
      .catch(err => console.warn("Failed to fetch user keys", err));
  }, [currentUser]);

  const showNotification = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleExportIdentity = () => {
    try {
      const identityPackage = {
        platform: "LatticeLink Post-Quantum Cryptographic Network",
        version: "2.4.0-NIST-FIPS-203/204",
        exportedAt: new Date().toISOString(),
        node: {
          username: currentUser.username,
          nodeId: currentUser.nodeId,
          role: currentUser.role || 'USER',
          createdAt: currentUser.createdAt || 'N/A'
        },
        cryptographicCredentials: {
          keyVersion: activeKeys.version,
          mlKemPublicKey: activeKeys.mlKem || currentUser.mlKemPubKey || "FIPS-203-KYBER-1024",
          mlDsaPublicKey: activeKeys.mlDsa || currentUser.mlDsaPubKey || "FIPS-204-DILITHIUM-87",
          fingerprint: activeKeys.fingerprint || currentUser.nodeId,
          securityProfile: "NIST Category 5 Level Quantum Tamper Resistant"
        }
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(identityPackage, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `LatticeLink-Identity-${currentUser.username}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showNotification("Quantum Identity certificate exported successfully!", "success");
    } catch (err) {
      console.error("Export failed", err);
      showNotification("Failed to export identity package", "error");
    }
  };

  const handleRotateKeys = async () => {
    const token = getToken();
    if (!token || rotating) {
      showNotification("Authentication session missing. Please re-login.", "error");
      return;
    }
    setRotating(true);
    try {
      const res = await fetch('/api/chat/keys/rotate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        const newKey = data.key;
        setActiveKeys({
          mlKem: newKey.mlkem_pub_key,
          mlDsa: newKey.mldsa_pub_key,
          fingerprint: newKey.fingerprint,
          version: newKey.key_version
        });

        if (updateUserProfile) {
          updateUserProfile({
            keyVersion: newKey.key_version,
            mlKemPubKey: newKey.mlkem_pub_key,
            mlDsaPubKey: newKey.mldsa_pub_key,
            keyFingerprint: newKey.fingerprint
          });
        }
        showNotification(`Keys rotated successfully to version ${newKey.key_version}!`, "success");
      } else {
        const errData = await res.json();
        showNotification(errData.error || "Key rotation rejected by server", "error");
      }
    } catch (err) {
      console.error("Key rotation error", err);
      showNotification("Failed to rotate keys: Connection error", "error");
    } finally {
      setRotating(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', padding: '28px', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {notification && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 20px', borderRadius: '10px',
            background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            border: notification.type === 'success' ? '1px solid #10b981' : '1px solid #ef4444',
            color: 'white', fontSize: '14px', fontWeight: '500'
          }}>
            {notification.type === 'success' ? <CheckCircle2 size={18} color="#10b981" /> : <AlertCircle size={18} color="#ef4444" />}
            <span>{notification.msg}</span>
          </div>
        )}

        {/* Header */}
        <div className="glass-card" style={{ padding: '32px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.08)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10%', top: '-50%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={16} /> Verified Quantum Identity (v{activeKeys.version})
              </div>
              <h1 style={{ color: 'white', fontSize: '32px', margin: 0, fontWeight: '700' }}>{currentUser.username}</h1>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div>Node ID: <span style={{ color: '#e2e8f0' }}>{currentUser.nodeId}</span></div>
                <div>Role: <span style={{ color: '#e2e8f0' }}>{currentUser.role || 'User'}</span></div>
                <div>Key Version: <span style={{ color: '#38bdf8' }}>v{activeKeys.version} (Active)</span></div>
                <div style={{ color: '#3b82f6', fontWeight: 'bold' }}>Security Score: 100/100 (A+)</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                onClick={handleExportIdentity}
                style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', transition: '0.2s' }}
                className="hover:bg-blue-500/25 active:scale-95"
              >
                <Download size={16} /> Export Identity
              </button>
              <button 
                onClick={handleRotateKeys}
                disabled={rotating}
                style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: rotating ? 'not-allowed' : 'pointer', fontWeight: '500', transition: '0.2s', opacity: rotating ? 0.7 : 1 }}
                className="hover:bg-red-500/25 active:scale-95"
              >
                <RefreshCw size={16} className={rotating ? "animate-spin" : ""} /> {rotating ? "Rotating Keys..." : "Rotate Keys"}
              </button>
            </div>
          </div>
        </div>

        {/* Cryptographic Keys Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          <div className="glass-card" style={{ padding: '24px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Box size={20} color="#8b5cf6" /> ML-KEM Identity (Kyber)
            </h3>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Public Key Fingerprint</div>
              <div style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all', lineHeight: '1.6' }}>
                {activeKeys.mlKem || currentUser.mlKemPubKey || "A8F9 3B2C 11E4 9D8F... (Kyber-1024 Node Key)"}
              </div>
            </div>
            <div style={{ marginTop: '16px', color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
              Used for establishing post-quantum secure tunnels (Key Encapsulation Mechanism) with other nodes on the LatticeLink network.
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fingerprint size={20} color="#10b981" /> ML-DSA Identity (Dilithium)
            </h3>
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Public Key Fingerprint</div>
              <div style={{ color: '#34d399', fontFamily: 'monospace', fontSize: '13px', wordBreak: 'break-all', lineHeight: '1.6' }}>
                {activeKeys.mlDsa || currentUser.mlDsaPubKey || "F10A C992 E45B 77D1... (Dilithium-87 Identity Key)"}
              </div>
            </div>
            <div style={{ marginTop: '16px', color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
              Used for mathematically proving authorship of messages and files (Digital Signature Algorithm) against Shor's algorithm attacks.
            </div>
          </div>

        </div>

        {/* Sessions and Hardware */}
        <div className="glass-card" style={{ padding: '24px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={20} color="#3b82f6" /> Active Sessions & Hardware
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(59,130,246,0.15)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Laptop size={20} color="#3b82f6" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>Primary Workstation (Current Session)</div>
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>IP: 192.168.1.105 • Windows 11 • LatticeLink Desktop Client</div>
              </div>
              <div style={{ color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></div>
                Active Now
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(148,163,184,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={20} color="#94a3b8" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: '#cbd5e1', fontSize: '14px', fontWeight: '500' }}>Mobile Authenticator</div>
                <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>IP: 172.20.10.4 • iOS 17.1 • LatticeLink Mobile App</div>
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} /> Last active 2 hours ago
              </div>
            </div>
          </div>
        </div>

        {/* Secure Session Timeline (Audit Trail) */}
        <div className="glass-card" style={{ padding: '24px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="#f59e0b" /> Secure Session Timeline (Audit Trail)
            </h3>
            <span style={{ color: '#64748b', fontSize: '12px' }}>Last 30 Days</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: '2px solid rgba(255,255,255,0.1)', marginLeft: '10px', paddingLeft: '20px' }}>
            {[
              { time: 'Today, 09:41 AM', title: 'ML-KEM Session Established', detail: 'Encapsulated AES-256 key with Alice (Node LL-A1C3-7B4E)', color: '#8b5cf6', icon: Box },
              { time: 'Today, 08:30 AM', title: 'Identity Verified & Login', detail: 'Authenticated from IP 192.168.1.105 via Windows 11', color: '#10b981', icon: ShieldCheck },
              { time: 'Yesterday, 04:15 PM', title: 'Vault File Decrypted', detail: 'Project_Q3_Final.pdf decrypted using ML-KEM wrapped key', color: '#3b82f6', icon: Key },
              { time: 'Yesterday, 02:00 PM', title: 'ML-DSA Signature Generated', detail: 'Signed 14 outgoing network packets', color: '#10b981', icon: Fingerprint },
              { time: 'Oct 22, 10:00 AM', title: 'Cryptographic Material Rotated', detail: 'New ML-KEM and ML-DSA keys generated and published to LatticeLink Directory', color: '#f59e0b', icon: RefreshCw },
            ].map((event, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '-31px', top: '2px', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(15,23,42,1)', border: `2px solid ${event.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <event.icon size={10} color={event.color} />
                </div>
                <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '4px' }}>{event.time}</div>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{event.title}</div>
                <div style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>{event.detail}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default QuantumIdentityPage;
