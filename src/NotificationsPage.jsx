import React from 'react';
import { Bell, Shield, MessageSquare, Users, AlertTriangle, CheckCircle2, Clock, Zap } from 'lucide-react';
import MatrixRain from './MatrixRain';

const NotificationsPage = () => {
  const notifications = [
    { id: 1, type: 'security', icon: Shield, color: '#ef4444', title: "Quantum Key Rotation Complete", desc: "ML-KEM session keys rotated successfully for all active tunnels.", time: "2 min ago", read: false },
    { id: 2, type: 'message', icon: MessageSquare, color: '#3b82f6', title: "New Encrypted Message from Neo", desc: "Received a new AES-256-GCM encrypted message in your inbox.", time: "15 min ago", read: false },
    { id: 3, type: 'group', icon: Users, color: '#8b5cf6', title: "Added to 'Project Lattice' Group", desc: "Trinity added you to a new secure enclave.", time: "1 hour ago", read: false },
    { id: 4, type: 'alert', icon: AlertTriangle, color: '#f59e0b', title: "Unusual Login Attempt Blocked", desc: "An authentication attempt from an unrecognized node was automatically rejected.", time: "3 hours ago", read: true },
    { id: 5, type: 'system', icon: Zap, color: '#10b981', title: "System Update Applied", desc: "LatticeLink v2.4.1 patch deployed. ML-DSA signature verification optimized.", time: "Yesterday", read: true },
    { id: 6, type: 'security', icon: Shield, color: '#3b82f6', title: "Monthly Security Audit Passed", desc: "All 5 attack simulations defended. Security grade: A+.", time: "2 days ago", read: true }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bell size={32} color="#f59e0b" /> Notifications
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Encrypted alerts and system events.</p>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            Mark All Read
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map(notif => (
            <div key={notif.id} className="glass-card" style={{
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
              opacity: notif.read ? 0.6 : 1,
              borderLeft: notif.read ? '3px solid transparent' : `3px solid ${notif.color}`,
              transition: '0.2s',
              cursor: 'pointer'
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
                background: `${notif.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <notif.icon size={22} color={notif.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ color: 'white', fontWeight: '600', fontSize: '15px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {notif.title}
                  {!notif.read && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: notif.color }}></div>}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>{notif.desc}</div>
              </div>
              <div style={{ color: '#64748b', fontSize: '12px', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} /> {notif.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
