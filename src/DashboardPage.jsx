import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, MessageSquare, Plus, Phone, File, Shield, Lock,
  Activity, Users, Calendar, CheckSquare, Bell, Bot, Fingerprint,
  Box, Key, ArrowRight, Clock, FolderLock, Zap, BarChart3, AlertTriangle, Monitor,
  Target, Globe, Cpu, FileText
} from 'lucide-react';
import MatrixRain from './MatrixRain';
import { useAuth } from './context/AuthContext';
import { useUser } from './context/UserContext';
import { useChat } from './context/ChatContext';
import { useVault } from './context/VaultContext';
import { useSecurity } from './context/SecurityContext';
import { useSettings } from './context/SettingsContext';

/* ─── Identity Hero Card ─── */
const IdentityHero = ({ currentUser, onNavigate }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 18) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="glass-card" style={{
      padding: '36px', position: 'relative', overflow: 'hidden',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <div style={{ position: 'absolute', right: '-10%', top: '-50%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)' }}></div>

      <div style={{ position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '16px', marginBottom: '6px' }}>{getGreeting()}</div>
            <h1 style={{ color: 'white', fontSize: '36px', margin: 0, fontWeight: '700' }}>SECURITY OPERATIONS CENTER</h1>
            <div style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '8px' }}>
              Commander: {currentUser.username} <span style={{ color: '#3b82f6' }}>•</span> Quantum Secure LatticeLink Network
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', fontFamily: 'monospace' }}>{formattedTime}</div>
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>{formattedDate}</div>
          </div>
        </div>

        {/* Identity Info Chips */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Node ID</div>
            <div style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>{currentUser.nodeId}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ML-KEM Key</div>
            <div style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>{currentUser.mlKemPubKey?.slice(0, 16)}...</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ML-DSA Key</div>
            <div style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>{currentUser.mlDsaPubKey?.slice(0, 16)}...</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</div>
            <div style={{ color: '#fff', fontSize: '13px', fontWeight: '500' }}>{currentUser.role}</div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 16px', borderRadius: '10px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</div>
            <div style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} /> Quantum Protected
            </div>
          </div>
        </div>

        {/* Quick Actions (SOC Nav) */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {[
            { icon: Target, label: 'Threat Intelligence', color: '#f59e0b', page: 'threat' },
            { icon: BarChart3, label: 'Security Analytics', color: '#3b82f6', page: 'analytics' },
            { icon: Globe, label: 'Network Monitor', color: '#38bdf8', page: 'network' },
            { icon: Cpu, label: 'Quantum Readiness', color: '#8b5cf6', page: 'quantum' },
            { icon: FileText, label: 'Reports Center', color: '#10b981', page: 'reports' },
          ].map((act, i) => (
            <button key={i} onClick={() => onNavigate(act.page)} style={{
              background: act.color ? `${act.color}20` : 'rgba(255,255,255,0.08)',
              color: act.color || 'white', border: act.color ? `1px solid ${act.color}60` : '1px solid rgba(255,255,255,0.1)',
              padding: '10px 18px', borderRadius: '8px', display: 'flex', alignItems: 'center',
              gap: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', transition: '0.2s',
            }}>
              <act.icon size={15} /> {act.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Stats Grid ─── */
const StatsGrid = () => {
  const { messages, calls } = useChat();
  const { getContacts } = useUser();
  const { vaultFiles } = useVault();
  const { lsocThreats } = useSecurity();
  const { currentUser } = useAuth();

  const totalMessages = Object.values(messages).flat().length;
  const activeContacts = getContacts(currentUser?.username || currentUser?.name || 'User').filter(c => c.status === 'online').length;
  const threatScore = lsocThreats.length > 0 ? lsocThreats.length * 10 : 0;

  const stats = [
    { label: 'Kyber Status', value: 'Active', icon: Box, color: '#8b5cf6', change: 'Secured' },
    { label: 'AES-256-GCM', value: 'Active', icon: Lock, color: '#3b82f6', change: 'Encrypted' },
    { label: 'Dilithium', value: 'Verified', icon: ShieldCheck, color: '#10b981', change: 'Signed' },
    { label: 'SHA3 Integrity', value: 'Active', icon: Fingerprint, color: '#f59e0b', change: 'Hashed' },
    { label: 'Cross Platform', value: 'Synced', icon: Activity, color: '#38bdf8', change: '3 Devices' },
    { label: 'Security Score', value: '99%', icon: Shield, color: '#10b981', change: 'Optimal' },
    { label: 'Quantum Ready', value: 'Yes', icon: Zap, color: '#8b5cf6', change: 'Protected' },
    { label: 'Trusted Devices', value: '3', icon: Monitor, color: '#64748b', change: 'Managed' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      {stats.map((s, i) => (
        <div key={i} className="glass-card" style={{
          padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px',
          background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${s.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={20} color={s.color} />
            </div>
            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: '600', background: 'rgba(16,185,129,0.1)', padding: '4px 8px', borderRadius: '6px' }}>{s.change}</span>
          </div>
          <div>
            <div style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>{s.value}</div>
            <div style={{ color: '#64748b', fontSize: '12px', marginTop: '2px' }}>{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

/* ─── Active Contacts ─── */
const ActiveContacts = () => {
  const { currentUser } = useAuth();
  const { getContacts } = useUser();
  const contacts = getContacts(currentUser?.username || currentUser?.name || 'User');

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Users size={18} color="#8b5cf6" /> Active Contacts
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {contacts.map((c, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: c.isGroup ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'linear-gradient(135deg, #3b82f6, #10b981)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              color: 'white', fontWeight: '600', fontSize: '14px',
            }}>
              {c.isGroup ? '👥' : c.username.charAt(0)}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>{c.username}</div>
              <div style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>{c.nodeId}</div>
            </div>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: c.status === 'online' ? '#10b981' : '#64748b',
              boxShadow: c.status === 'online' ? '0 0 8px #10b981' : 'none',
            }}></div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Notifications Feed ─── */
const NotificationsFeed = () => {
  const { globalNotifications } = useSettings();
  
  const notifications = globalNotifications.slice(0, 5);

  const getIcon = (type) => {
    switch (type) {
      case 'success': return ShieldCheck;
      case 'warning': return AlertTriangle;
      case 'error': return Shield;
      default: return Bell;
    }
  };

  const getColor = (type) => {
    switch (type) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#3b82f6';
    }
  };

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Bell size={18} color="#f59e0b" /> Recent Notifications
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {notifications.length > 0 ? notifications.map((n) => {
          const Icon = getIcon(n.type);
          const color = getColor(n.type);
          return (
            <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
              <Icon size={16} color={color} />
              <div style={{ flex: 1 }}>
                <div style={{ color: '#e2e8f0', fontSize: '13px' }}>{n.message}</div>
              </div>
              <div style={{ color: '#64748b', fontSize: '11px', whiteSpace: 'nowrap' }}>{n.timestamp}</div>
            </div>
          );
        }) : (
          <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No recent notifications</div>
        )}
      </div>
    </div>
  );
};

/* ─── Encryption Pipeline Visual ─── */
const EncryptionPipeline = () => {
  const steps = [
    { icon: Lock, label: 'AES-256-GCM', sub: 'Encryption', color: '#3b82f6' },
    { icon: Fingerprint, label: 'SHA-3', sub: 'Integrity', color: '#6366f1' },
    { icon: Shield, label: 'ML-DSA', sub: 'Signature', color: '#10b981' },
    { icon: Box, label: 'ML-KEM', sub: 'Key Exchange', color: '#8b5cf6' },
    { icon: Zap, label: 'Quantum Tunnel', sub: 'Transport', color: '#f59e0b' },
  ];

  return (
    <div className="glass-card" style={{
      padding: '28px', background: 'rgba(15,23,42,0.6)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Activity size={18} color="#3b82f6" /> Live Encryption Pipeline
      </h3>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {steps.map((s, i) => (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: `${s.color}15`, border: `1px solid ${s.color}33`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 20px ${s.color}22`,
              }}>
                <s.icon size={24} color={s.color} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>{s.label}</div>
                <div style={{ color: '#64748b', fontSize: '10px' }}>{s.sub}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <ArrowRight size={18} color="#334155" style={{ flexShrink: 0 }} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

/* ─── AI Assistant Widget ─── */
const AIAssistant = () => {
  const { lsocThreats } = useSecurity();
  const { vaultFiles } = useVault();
  const { messages } = useChat();
  
  const getSummary = () => {
    const threats = lsocThreats.length;
    const files = vaultFiles.length;
    const msgCount = Object.values(messages).flat().length;
    
    if (threats > 0) {
      return (
        <span>
          Your quantum security posture is under review. <span style={{ color: '#f59e0b', fontWeight: '600' }}>{threats} threats</span> were recently blocked by the LSOC. Your {files} vault files and {msgCount} encrypted messages remain secure.
        </span>
      );
    }
    
    return (
      <span>
        Your quantum security posture is <span style={{ color: '#10b981', fontWeight: '600' }}>excellent</span>. 
        All cryptographic keys are active, securing {files} files and {msgCount} messages. No anomalous activity detected.
      </span>
    );
  };

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
      <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Bot size={18} color="#8b5cf6" /> AI Security Assistant
      </h3>
      <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '10px', padding: '16px' }}>
        <div style={{ color: '#e2e8f0', fontSize: '13px', lineHeight: '1.7', marginBottom: '16px' }}>
          "{getSummary()}"
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['Run Security Audit', 'Rotate Keys', 'View Threats'].map((a, i) => (
            <button key={i} style={{
              background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.3)',
              color: '#c4b5fd', padding: '6px 14px', borderRadius: '6px', fontSize: '12px',
              cursor: 'pointer', transition: '0.2s',
            }}>
              {a}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Dashboard Page ─── */
const DashboardPage = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', padding: '28px', position: 'relative' }}>
      <MatrixRain />

      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <IdentityHero currentUser={currentUser} onNavigate={onNavigate} />

        <StatsGrid />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <ActiveContacts />
          <NotificationsFeed />
        </div>

        <EncryptionPipeline />

        <AIAssistant />

      </div>
    </div>
  );
};

export default DashboardPage;
