import React from 'react';
import { useAuth } from './context/AuthContext';
import {
  LayoutDashboard, MessageSquare, FolderLock, 
  ShieldAlert, Settings, LogOut, Activity, Smartphone, Target, BarChart3, Globe, Fingerprint, Key, FileSearch, Shield, BookOpen, Lock
} from 'lucide-react';

const NAV_ITEMS = [
  // Primary Experience
  { id: 'messages',      icon: MessageSquare,   label: 'Messages' },
  { id: 'files',         icon: FolderLock,      label: 'File Sharing' },
  { id: 'crossplatform', icon: Smartphone,      label: 'Cross-Platform' },
  // Tools / Post-Quantum SOC
  { id: 'separator_1',   type: 'separator',     label: 'Post-Quantum SOC' },
  { id: 'lab',           icon: Activity,        label: 'Security Lab' },
  { id: 'keymanagement', icon: Key,             label: 'Key Management' },
  { id: 'network',       icon: Globe,           label: 'Network Topology' },
  { id: 'analytics',     icon: BarChart3,       label: 'Security Analytics' },
  { id: 'audit',         icon: FileSearch,      label: 'Audit & Forensics' },
  { id: 'admin',         icon: Shield,          label: 'Administration' },
  // System
  { id: 'separator_2',   type: 'separator',     label: 'System' },
  { id: 'howitworks',    icon: BookOpen,        label: 'How It Works' },
  { id: 'settings',      icon: Settings,        label: 'Settings' },
];

const Navbar = ({ currentPage, onNavigate }) => {
  const { currentUser, logout } = useAuth();

  const NavItem = (item) => {
    if (item.type === 'separator') {
      return (
        <div style={{ padding: '16px 20px 8px', color: '#64748b', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {item.label}
        </div>
      );
    }
    const { id, icon: Icon, label } = item;
    const active = currentPage === id;
    return (
      <div
        className={`nav-item ${active ? 'active' : ''}`}
        onClick={() => onNavigate(id)}
        style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '12px 20px', cursor: 'pointer',
          color: active ? 'white' : '#94a3b8',
          background: active ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
          borderLeft: active ? '3px solid #3b82f6' : '3px solid transparent',
          transition: 'all 0.2s ease', borderRadius: '0 8px 8px 0',
          marginRight: '8px',
        }}
      >
        <Icon size={20} color={active ? '#3b82f6' : '#64748b'} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: '14px', fontWeight: active ? '600' : '400', letterSpacing: '0.2px' }}>{label}</span>
      </div>
    );
  };

  const handleLogout = async () => {
    await logout();
    onNavigate('auth');
  };

  return (
    <nav style={{
      width: '260px', height: '100vh', position: 'fixed', left: 0, top: 0,
      background: 'rgba(8, 12, 30, 0.97)', backdropFilter: 'blur(24px)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', flexDirection: 'column', zIndex: 100,
      overflowY: 'auto', overflowX: 'hidden',
    }}>

      {/* Brand */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
          <img src="/latticelink_logo.png" alt="LatticeLink" style={{ width: '30px', height: '30px', borderRadius: '8px' }} />
          <span>Lattice<span style={{ color: '#3b82f6' }}>Link</span></span>
        </div>
        <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px', letterSpacing: '0.5px' }}>Post-Quantum Secure Platform</div>
      </div>

      {/* Identity Card */}
      {currentUser && (
        <div 
          onClick={() => onNavigate('identity')}
          style={{
            padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: currentPage === 'identity' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)',
            cursor: 'pointer', transition: '0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'}
          onMouseLeave={(e) => e.currentTarget.style.background = currentPage === 'identity' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(255,255,255,0.02)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={{
              width: '42px', height: '42px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              display: 'flex', justifyContent: 'center', alignItems: 'center',
              color: 'white', fontWeight: 'bold', fontSize: '18px',
              boxShadow: '0 0 20px rgba(59, 130, 246, 0.3)',
            }}>
              {(currentUser?.username || currentUser?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
                👤 {currentUser?.username || currentUser?.name || 'User'}
              </div>
              <div style={{ color: '#10b981', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }}></div>
                Online
              </div>
            </div>
          </div>

          {/* Node ID */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '8px 12px', background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)',
            marginBottom: '8px',
          }}>
            <Fingerprint size={16} color="#3b82f6" style={{ marginTop: '2px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Identity Hash</div>
              <div style={{ 
                color: '#38bdf8', 
                fontSize: '11px', 
                fontFamily: 'monospace', 
                fontWeight: '600',
                wordBreak: 'break-all',
                lineHeight: '1.4',
                background: 'linear-gradient(90deg, rgba(56, 189, 248, 0.1), transparent)',
                padding: '4px',
                borderRadius: '4px',
                borderLeft: '2px solid #38bdf8'
              }}>
                {(currentUser?.nodeId || 'LL-NODE-ACTIVE').substring(0, 16)}...
              </div>
            </div>
          </div>

          {/* Quantum Verified Badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '8px', color: '#10b981', fontSize: '11px', fontWeight: '600',
          }}>
            <Lock size={10} /> Quantum Verified
          </div>
        </div>
      )}

      <div style={{ flex: 1, paddingTop: '16px', paddingBottom: '16px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {NAV_ITEMS.filter(item => {
          if (currentUser?.role !== 'ADMIN' && ['network', 'analytics', 'audit', 'admin'].includes(item.id)) return false;
          return true;
        }).map(item => (
          <NavItem key={item.id} {...item} />
        ))}
      </div>

      {/* Logout */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '10px 16px', cursor: 'pointer', color: '#ef4444',
            borderRadius: '8px', transition: '0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={18} />
          <span style={{ fontSize: '13px', fontWeight: '500' }}>Disconnect & Logout</span>
        </div>
      </div>

      <style>{`
        .nav-item:hover {
          background: rgba(255,255,255,0.04) !important;
        }
        .nav-item.active:hover {
          background: rgba(59, 130, 246, 0.12) !important;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
