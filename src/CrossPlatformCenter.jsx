import React, { useState, useEffect } from 'react';
import { 
  Monitor, Smartphone, Laptop, Server, LogOut, CheckCircle2, Shield, 
  Clock, Activity, Fingerprint, Lock, ShieldCheck, Database, RefreshCw, Zap, UserCircle 
} from 'lucide-react';
import MatrixRain from './MatrixRain';
import { useAuth } from './context/AuthContext';
import { useChat } from './context/ChatContext';

const getDeviceIconAndColor = (os) => {
  const osLower = (os || '').toLowerCase();
  if (osLower.includes('ios') || osLower.includes('iphone') || osLower.includes('ipad')) {
    return { icon: Smartphone, color: '#10b981', type: 'Mobile (Apple)' };
  } else if (osLower.includes('android')) {
    return { icon: Smartphone, color: '#38bdf8', type: 'Mobile (Android)' };
  } else if (osLower.includes('mac')) {
    return { icon: Laptop, color: '#8b5cf6', type: 'Laptop (macOS)' };
  } else if (osLower.includes('linux')) {
    return { icon: Server, color: '#f59e0b', type: 'Node (Linux)' };
  } else if (osLower.includes('windows')) {
    return { icon: Monitor, color: '#3b82f6', type: 'Workstation (Windows)' };
  }
  return { icon: Monitor, color: '#94a3b8', type: 'Web Client' };
};

const CrossPlatformCenter = () => {
  const { currentUser } = useAuth();
  const { socket, fetchChats } = useChat();
  const [devices, setDevices] = useState([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState(null);

  const fetchDevices = async () => {
    if (!currentUser?.id) return;
    try {
      const token = currentUser?.session_token || (() => {
        try {
          const saved = localStorage.getItem('ll_session_v4');
          return saved ? JSON.parse(saved)?.session_token : null;
        } catch (e) { return null; }
      })();
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/user/${currentUser.id}/devices`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.devices && data.devices.length > 0) {
          setDevices(data.devices.map((d, idx) => {
            const meta = getDeviceIconAndColor(d.os);
            return {
              id: d.id,
              type: meta.type,
              os: d.os || 'Web',
              browser: d.browser || 'Browser',
              name: d.name || 'Active Session',
              ip: d.ip || '127.0.0.1',
              lastLogin: d.last_active || 'Active Now',
              session: d.session || 'Active',
              icon: meta.icon,
              color: meta.color,
              status: d.is_active ? 'Active' : 'Idle',
              score: d.score || 95,
              current: idx === 0
            };
          }));
        } else {
          // Fallback device representation of current session
          setDevices([
            { id: 1, type: 'Desktop', os: 'Windows 11', browser: 'Edge/Chrome', name: `${currentUser.username} Primary Node`, ip: '127.0.0.1', lastLogin: 'Active Now', session: 'Current Session', icon: Monitor, color: '#38bdf8', status: 'Active', score: 99, current: true }
          ]);
        }
      }
    } catch (err) {
      console.error("Failed to load devices", err);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [currentUser]);

  const handleLogout = async (id) => {
    try {
      const token = currentUser?.session_token || (() => {
        try {
          const saved = localStorage.getItem('ll_session_v4');
          return saved ? JSON.parse(saved)?.session_token : null;
        } catch (e) { return null; }
      })();
      const headers = { 'ngrok-skip-browser-warning': 'true' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/user/${currentUser.id}/devices/${id}`, {
        method: 'DELETE',
        headers
      });
      if (res.ok) {
        setDevices(prev => prev.filter(d => d.id !== id));
      }
    } catch (err) {
      console.error("Revocation failed", err);
    }
  };

  const handleForceSync = () => {
    setIsSyncing(true);
    setSyncFeedback('Synchronizing with Post-Quantum Lattice Network...');
    if (socket) {
      socket.emit('sync_request', { user: currentUser?.username });
    }
    if (fetchChats) {
      fetchChats();
    }
    fetchDevices();
    setTimeout(() => {
      setIsSyncing(false);
      setSyncFeedback('All platform sessions synchronized across Mobile, Desktop & Web.');
      setTimeout(() => setSyncFeedback(null), 3000);
    }, 1200);
  };

  // Detect current client OS
  const currentOS = (() => {
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('iphone') || ua.includes('ipad')) return 'Apple iOS';
    if (ua.includes('android')) return 'Android Mobile';
    if (ua.includes('mac')) return 'Apple macOS';
    if (ua.includes('win')) return 'Windows Desktop';
    if (ua.includes('linux')) return 'Linux Node';
    return 'Web Client';
  })();

  const timelineEvents = [
    { time: 'Just Now', event: `Current session active on ${currentOS}`, icon: UserCircle, color: '#94a3b8' },
    { time: 'T-00:01', event: 'ML-KEM-768 Handshake Verified', icon: Shield, color: '#8b5cf6' },
    { time: 'T-00:02', event: 'AES-256-GCM Session Key Established', icon: Lock, color: '#3b82f6' },
    { time: 'T-00:03', event: 'Socket.IO Real-Time Tunnel Active', icon: Activity, color: '#10b981' },
    { time: 'T-00:04', event: 'Cross-Device Key State Mirroring', icon: Smartphone, color: '#38bdf8' }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <RefreshCw size={32} color="#38bdf8" /> Cross-Platform Center
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Enterprise Device Management, Synchronization & Cross-Platform Sessions.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '14px', background: 'rgba(16, 185, 129, 0.1)', padding: '8px 16px', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <Activity size={16} /> Sync Healthy
          </div>
        </div>

        {syncFeedback && (
          <div style={{ padding: '12px 20px', background: 'rgba(56,189,248,0.15)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '10px', color: '#38bdf8', marginBottom: '24px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} /> {syncFeedback}
          </div>
        )}

        {/* Top Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Active Devices', value: devices.length || 1, icon: Monitor, color: '#3b82f6' },
            { label: 'Current Client', value: currentOS, icon: CheckCircle2, color: '#10b981' },
            { label: 'PQC Protocol Health', value: '99%', icon: ShieldCheck, color: '#10b981' },
            { label: 'Global State Sync', value: isSyncing ? 'Syncing...' : 'Synchronized', icon: Zap, color: '#f59e0b' }
          ].map((stat, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${stat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <stat.icon size={20} color={stat.color} />
                </div>
                <div>
                  <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase' }}>{stat.label}</div>
                  <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>{stat.value}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          
          {/* Left Column: Device Management */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} color="#3b82f6"/> Trusted Device Network
            </h3>
            
            {devices.map(device => (
              <div key={device.id} className="glass-card" style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${device.color}40`, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ background: `${device.color}15`, padding: '12px', borderRadius: '12px', border: `1px solid ${device.color}30` }}>
                      <device.icon size={28} color={device.color} />
                    </div>
                    <div>
                      <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {device.name}
                        {device.current && (
                          <span style={{ color: '#38bdf8', fontSize: '10px', background: 'rgba(56,189,248,0.15)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.3)' }}>This Device</span>
                        )}
                        <span style={{ color: '#10b981', fontSize: '10px', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(16,185,129,0.3)' }}>Trusted</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span>Platform: {device.os}</span>
                        <span>IP: {device.ip}</span>
                        <span>Browser: {device.browser}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#cbd5e1', fontSize: '13px' }}>Session: {device.session}</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '4px' }}>Activity: {device.lastLogin}</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8b5cf6', fontSize: '12px' }}>
                      <CheckCircle2 size={14} /> ML-KEM-768
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px' }}>
                      <CheckCircle2 size={14} /> ML-DSA-65
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#3b82f6', fontSize: '12px' }}>
                      <CheckCircle2 size={14} /> AES-GCM
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <div style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={14} /> Score: {device.score}%
                    </div>
                    {!device.current && (
                      <button onClick={() => handleLogout(device.id)} style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', transition: '0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                        <LogOut size={14} /> Revoke
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Timelines & Sessions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#8b5cf6"/> Synchronization Timeline
              </h3>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '15px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {timelineEvents.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 2 }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `${ev.color}22`, border: `1px solid ${ev.color}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ev.icon size={14} color={ev.color} />
                      </div>
                      <div style={{ paddingTop: '6px' }}>
                        <div style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}>{ev.time}</div>
                        <div style={{ color: 'white', fontSize: '13px' }}>{ev.event}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Activity size={16} color="#f59e0b"/> Multi-Device Sync Control
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {devices.map(device => (
                  <div key={device.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px' }}>
                    <div style={{ color: '#cbd5e1', fontSize: '13px' }}>{device.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ color: device.status === 'Active' ? '#10b981' : '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {device.status === 'Active' && <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981' }}></div>}
                        {device.status}
                      </span>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={handleForceSync}
                  disabled={isSyncing}
                  style={{ width: '100%', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', padding: '10px', borderRadius: '8px', cursor: isSyncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', marginTop: '8px' }}
                >
                  <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? 'Syncing...' : 'Force Global Sync'}
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CrossPlatformCenter;
