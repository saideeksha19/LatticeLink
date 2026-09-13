import React, { useState, useEffect, useRef } from 'react';
import {
  Settings, User, Bell, Monitor, Sliders, Lock, Shield,
  Fingerprint, Box, Key, Mail, Edit3, Save, Eye, EyeOff,
  Smartphone, Laptop, Globe, Clock, Trash2, LogOut,
  Volume2, VolumeX, Moon, Sun, Palette, X
} from 'lucide-react';
import MatrixRain from './MatrixRain';
import { useAuth } from './context/AuthContext';
import { useSettings } from './context/SettingsContext';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

// --- Toggle Component ---
const Toggle = ({ checked, onChange, themeColor }) => (
  <motion.div 
    onClick={onChange} 
    layout
    style={{
      width: '44px', height: '24px', borderRadius: '12px', padding: '2px',
      background: checked ? themeColor : 'rgba(255,255,255,0.1)',
      cursor: 'pointer', position: 'relative',
      boxShadow: checked ? `0 0 12px ${themeColor}66` : 'inset 0 2px 4px rgba(0,0,0,0.3)'
    }}
  >
    <motion.div 
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      style={{
        width: '20px', height: '20px', borderRadius: '50%', background: 'white',
        transform: checked ? 'translateX(20px)' : 'translateX(0)',
        boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
      }}
    />
  </motion.div>
);

// --- 3D Hover Card Component ---
const SettingsSection = ({ title, icon: Icon, themeColor, children }) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const rotateX = useTransform(y, [-100, 100], [5, -5]);
  const rotateY = useTransform(x, [-100, 100], [-5, 5]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set(e.clientX - centerX);
    y.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div 
      style={{
        perspective: 1000,
        rotateX, rotateY,
        transformStyle: "preserve-3d"
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX: 0, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
        borderRadius: '16px',
        overflow: 'hidden',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
        transition: 'border-color 0.3s ease'
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${themeColor}44`; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'; }}
      >
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
          display: 'flex', alignItems: 'center', gap: '12px',
          background: 'rgba(255,255,255,0.02)',
          transform: 'translateZ(20px)' // Inner 3D pop
        }}>
          <div style={{ padding: '8px', background: `${themeColor}15`, borderRadius: '8px' }}>
            <Icon size={18} color={themeColor} />
          </div>
          <h3 style={{ color: 'white', margin: 0, fontSize: '16px', fontWeight: '600', letterSpacing: '0.5px' }}>{title}</h3>
        </div>
        <div style={{ padding: '8px', transform: 'translateZ(10px)' }}>
          {children}
        </div>
      </div>
    </motion.div>
  );
};

const SettingRow = ({ label, sub, checked, onChange, isLast, themeColor }) => (
  <motion.div 
    whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)', x: 4 }}
    style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '16px', 
      borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
      borderRadius: '8px',
      cursor: 'pointer'
    }}
    onClick={onChange}
  >
    <div>
      <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{label}</div>
      <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>{sub}</div>
    </div>
    <Toggle checked={checked} onChange={(e) => { e.stopPropagation(); onChange(); }} themeColor={themeColor} />
  </motion.div>
);

const THEMES = [
  { id: 'cyber-blue', color: '#3b82f6', label: 'Cyber Blue' },
  { id: 'emerald-quantum', color: '#10b981', label: 'Emerald Quantum' },
  { id: 'crimson-threat', color: '#ef4444', label: 'Crimson Threat' },
  { id: 'amethyst-void', color: '#8b5cf6', label: 'Amethyst Void' },
  { id: 'neon-cyberpunk', color: '#f59e0b', label: 'Neon Sun' }
];

const SettingsPage = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const { settings, updateSettings } = useSettings();
  const [devices, setDevices] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const currentThemeColor = settings.appearance?.themeColor || '#3b82f6';

  useEffect(() => {
    if (currentUser?.id) {
      const token = currentUser?.session_token || (() => {
        try {
          const saved = localStorage.getItem('ll_session_v4');
          return saved ? JSON.parse(saved)?.session_token : null;
        } catch (e) { return null; }
      })();
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch(`/api/user/${currentUser.id}/devices`, { headers })
        .then(res => res.json())
        .then(data => {
          if (data.devices) {
            setDevices(data.devices.map((d, i) => ({
              ...d, current: i === 0,
              icon: d.os === 'iOS' || d.os === 'Android' ? Smartphone : (d.os === 'Windows' ? Laptop : Globe)
            })));
          }
        })
        .catch(err => console.error(err));
    }
  }, [currentUser]);

  const handleRevoke = (deviceId) => {
    const token = currentUser?.session_token || (() => {
      try {
        const saved = localStorage.getItem('ll_session_v4');
        return saved ? JSON.parse(saved)?.session_token : null;
      } catch (e) { return null; }
    })();
    const headers = { 'ngrok-skip-browser-warning': 'true' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch(`/api/user/${currentUser.id}/devices/${deviceId}`, { method: 'DELETE', headers })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setDevices(prev => prev.filter(d => d.id !== deviceId));
        }
      })
      .catch(err => console.error(err));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) return;
    setIsSaving(true);
    
    // Save directly to the server database
    await updateUserProfile({
      username: editName,
      email: editEmail
    });
    setIsSaving(false);
    setIsEditing(false);
  };


  if (!currentUser) return null;

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', background: '#020617' }}>
      
      {settings.appearance?.matrixRain !== false && <MatrixRain />}
      
      <div style={{ position: 'relative', zIndex: 10, flex: 1, padding: '40px 60px', overflowY: 'auto' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: '40px' }}>
            <h1 style={{ color: 'white', fontSize: '42px', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '-1px' }}>System Preferences</h1>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '16px' }}>Manage your identity, security, and global theme parameters.</p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Interactive Profile Card */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="glass-card" 
                style={{ 
                  padding: '32px', background: 'rgba(15,23,42,0.6)', 
                  border: `1px solid ${currentThemeColor}44`, 
                  borderRadius: '16px', backdropFilter: 'blur(20px)',
                  boxShadow: `0 10px 40px -10px ${currentThemeColor}33`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: `linear-gradient(135deg, ${currentThemeColor}, #8b5cf6)`,
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    color: 'white', fontWeight: '700', fontSize: '32px',
                    boxShadow: `0 10px 30px ${currentThemeColor}66`,
                  }}>
                    {(currentUser?.username || currentUser?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '26px', fontWeight: '900', letterSpacing: '-0.5px' }}>{currentUser?.username || currentUser?.name || 'User'}</div>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>{currentUser?.email || 'No email provided'}</div>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', marginTop: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <Shield size={12} /> {currentUser?.role || 'User'}
                    </div>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05, backgroundColor: `${currentThemeColor}33` }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setEditName(currentUser?.username || ''); setEditEmail(currentUser?.email || ''); setIsEditing(true); }}
                    style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${currentThemeColor}66`, color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}
                  >
                    <Edit3 size={14} /> Edit
                  </motion.button>
                </div>
              </motion.div>

              {/* Theme & Appearance */}
              <SettingsSection title="Global Theme Engine" icon={Palette} themeColor={currentThemeColor}>
                <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>Select Base Accent</div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    {THEMES.map(theme => (
                      <motion.div
                        key={theme.id}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => updateSettings('appearance', { themeColor: theme.color })}
                        style={{
                          width: '40px', height: '40px', borderRadius: '50%',
                          background: theme.color, cursor: 'pointer',
                          border: currentThemeColor === theme.color ? '2px solid white' : '2px solid transparent',
                          boxShadow: currentThemeColor === theme.color ? `0 0 20px ${theme.color}` : 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        {currentThemeColor === theme.color && <div style={{ width: '8px', height: '8px', background: 'white', borderRadius: '50%' }} />}
                      </motion.div>
                    ))}
                  </div>
                </div>
                {[
                  { key: 'matrixRain', label: 'Matrix Rain Background', sub: 'Animated code rain effect globally', cat: 'appearance' },
                  { key: 'darkMode', label: 'Force Dark Mode', sub: 'Override system theme', cat: 'appearance' }
                ].map((s, i, arr) => (
                  <SettingRow 
                    key={s.key} 
                    label={s.label} 
                    sub={s.sub} 
                    checked={settings[s.cat]?.[s.key] !== false} 
                    onChange={() => updateSettings(s.cat, { [s.key]: settings[s.cat]?.[s.key] === false })}
                    isLast={i === arr.length - 1}
                    themeColor={currentThemeColor}
                  />
                ))}
              </SettingsSection>

              {/* Notifications */}
              <SettingsSection title="System Notifications" icon={Bell} themeColor={currentThemeColor}>
                {[
                  { key: 'msgNotif', label: 'Secure Message Alerts', sub: 'Receive alerts for new messages' },
                  { key: 'callNotif', label: 'Incoming Call Ringtone', sub: 'Ring for incoming secure calls' },
                  { key: 'sounds', label: 'UI Sound Effects', sub: 'Play liquid UI interaction sounds' },
                ].map((s, i, arr) => (
                  <SettingRow 
                    key={s.key} 
                    label={s.label} 
                    sub={s.sub} 
                    checked={settings.notifications?.[s.key] !== false} 
                    onChange={() => updateSettings('notifications', { [s.key]: settings.notifications?.[s.key] === false })}
                    isLast={i === arr.length - 1}
                    themeColor={currentThemeColor}
                  />
                ))}
              </SettingsSection>
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
              
              {/* Crypto Identity */}
              <SettingsSection title="Cryptographic Identity" icon={Key} themeColor={currentThemeColor}>
                <div style={{ padding: '8px' }}>
                  {[
                    { label: 'Node ID', value: currentUser?.nodeId || 'Generating...', icon: Fingerprint, color: currentThemeColor },
                    { label: 'ML-KEM Public Key (Kyber)', value: currentUser?.mlKemPubKey || 'Kyber-1024 Post-Quantum Key Encapsulation Active', icon: Box, color: currentThemeColor },
                    { label: 'ML-DSA Public Key (Dilithium)', value: currentUser?.mlDsaPubKey || 'Dilithium-87 Post-Quantum Signature Key Active', icon: Key, color: currentThemeColor },
                  ].map((item, i) => (
                    <motion.div 
                      whileHover={{ x: 4, backgroundColor: 'rgba(0,0,0,0.6)' }}
                      key={i} 
                      style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.03)' }}
                    >
                      <div style={{ padding: '10px', background: `${item.color}22`, borderRadius: '10px', boxShadow: `inset 0 0 10px ${item.color}44` }}>
                        <item.icon size={20} color={item.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '700', marginBottom: '4px' }}>{item.label}</div>
                        <div style={{ color: item.color, fontSize: '13px', fontFamily: 'monospace', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.value}</div>
                      </div>
                    </motion.div>
                  ))}

                  <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                    <button 
                      onClick={() => {
                        const identityPackage = {
                          platform: "LatticeLink Post-Quantum Cryptographic Network",
                          version: "2.4.0-NIST-FIPS-203/204",
                          exportedAt: new Date().toISOString(),
                          node: {
                            username: currentUser.username,
                            nodeId: currentUser.nodeId,
                            role: currentUser.role || 'USER',
                            email: currentUser.email || 'N/A'
                          },
                          cryptographicCredentials: {
                            mlKemPublicKey: currentUser.mlKemPubKey || "KYBER-1024-STANDARD",
                            mlDsaPublicKey: currentUser.mlDsaPubKey || "DILITHIUM-87-STANDARD",
                            securityProfile: "NIST Category 5 Level Quantum Tamper Resistant"
                          }
                        };
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(identityPackage, null, 2));
                        const a = document.createElement('a');
                        a.href = dataStr;
                        a.download = `LatticeLink-Identity-${currentUser.username}.json`;
                        document.body.appendChild(a);
                        a.click();
                        a.remove();
                      }}
                      style={{ flex: 1, background: 'rgba(59,130,246,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      className="hover:bg-blue-500/20"
                    >
                      Export Identity
                    </button>
                    <button 
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/chat/keys/rotate', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${currentUser.session_token}`
                            }
                          });
                          if (res.ok) {
                            const d = await res.json();
                            if (updateUserProfile) {
                              updateUserProfile({
                                keyVersion: d.key?.key_version,
                                mlKemPubKey: d.key?.mlkem_pub_key,
                                mlDsaPubKey: d.key?.mldsa_pub_key,
                                keyFingerprint: d.key?.fingerprint
                              });
                            }
                            alert(`Cryptographic keys successfully rotated to version ${d.key?.key_version}!`);
                          } else {
                            alert('Key rotation request rejected by server.');
                          }
                        } catch (err) {
                          alert('Failed to rotate keys: Connection error');
                        }
                      }}
                      style={{ flex: 1, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                      className="hover:bg-red-500/20"
                    >
                      Rotate Keys
                    </button>
                  </div>
                </div>
              </SettingsSection>

              {/* Devices */}
              <SettingsSection title="Active Node Sessions" icon={Monitor} themeColor={currentThemeColor}>
                <div style={{ padding: '8px' }}>
                  {devices.map((d, i) => (
                    <motion.div 
                      whileHover={{ scale: 1.01 }}
                      key={i} 
                      style={{
                        padding: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                        background: d.current ? 'rgba(16,185,129,0.05)' : 'transparent',
                        border: d.current ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.04)',
                        borderRadius: '12px', marginBottom: '8px'
                      }}
                    >
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: d.current ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <d.icon size={20} color={d.current ? '#10b981' : '#94a3b8'} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ color: 'white', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {d.name}
                          {d.current && <span style={{ color: '#10b981', fontSize: '9px', background: 'rgba(16,185,129,0.15)', padding: '2px 8px', borderRadius: '100px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current</span>}
                        </div>
                        <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span><Globe size={12} style={{ display: 'inline', verticalAlign: 'text-bottom' }}/> {d.os || 'Unknown OS'}</span>
                        </div>
                      </div>
                      {!d.current && (
                        <motion.button 
                          whileHover={{ backgroundColor: 'rgba(239,68,68,0.2)' }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleRevoke(d.id)} 
                          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <LogOut size={14} /> Revoke
                        </motion.button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </SettingsSection>

            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: 'rgba(15,23,42,0.9)', border: `1px solid ${currentThemeColor}66`, borderRadius: '24px', padding: '40px', width: '400px', boxShadow: `0 20px 60px rgba(0,0,0,0.8), 0 0 40px ${currentThemeColor}33` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <h2 style={{ margin: 0, color: 'white', fontSize: '24px' }}>Edit Profile</h2>
                <button onClick={() => setIsEditing(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={24} /></button>
              </div>
              <form onSubmit={handleSaveProfile}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Operator Alias</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: 'white', fontSize: '16px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = currentThemeColor} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}/>
                </div>
                <div style={{ marginBottom: '32px' }}>
                  <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Secure Email</label>
                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '12px', color: 'white', fontSize: '16px', outline: 'none' }} onFocus={(e) => e.target.style.borderColor = currentThemeColor} onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}/>
                </div>
                <div style={{ display: 'flex', gap: '16px' }}>
                  <button type="button" onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                  <button type="submit" style={{ flex: 1, padding: '14px', background: currentThemeColor, border: 'none', color: 'white', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', boxShadow: `0 4px 15px ${currentThemeColor}66` }}>Save Changes</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
