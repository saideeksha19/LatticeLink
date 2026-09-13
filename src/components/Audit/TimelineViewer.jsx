import React from 'react';
import { Clock, ShieldCheck, Box, MessageSquare, AlertTriangle, Smartphone, FileUp } from 'lucide-react';

const TimelineViewer = () => {
  const events = [
    { time: '09:20:14', type: 'file', message: 'Encrypted File Uploaded (SHA3 Verified)', icon: FileUp, color: '#3b82f6' },
    { time: '09:18:02', type: 'device', message: 'Device Synchronization Completed', icon: Smartphone, color: '#10b981' },
    { time: '09:16:45', type: 'alert', message: 'Replay Attack Blocked (Integrity Failure)', icon: AlertTriangle, color: '#ef4444' },
    { time: '09:15:30', type: 'message', message: 'ML-DSA Signature Verified on Message', icon: ShieldCheck, color: '#10b981' },
    { time: '09:15:28', type: 'message', message: 'Encrypted Message Sent', icon: MessageSquare, color: '#8b5cf6' },
    { time: '09:14:12', type: 'session', message: 'AES-256-GCM Session Established', icon: Box, color: '#3b82f6' },
    { time: '09:13:05', type: 'crypto', message: 'ML-KEM Handshake Completed', icon: Box, color: '#8b5cf6' },
    { time: '09:12:00', type: 'auth', message: 'User Login (Alice)', icon: ShieldCheck, color: '#10b981' },
  ];

  return (
    <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Clock size={20} color="#3b82f6"/> Global Activity Timeline
      </h3>

      <div style={{ position: 'relative', paddingLeft: '16px' }}>
        <div style={{ position: 'absolute', left: '27px', top: '24px', bottom: '24px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {events.map((ev, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 2 }}>
              <div style={{ width: '80px', color: '#94a3b8', fontSize: '12px', fontFamily: 'monospace', textAlign: 'right', fontWeight: 'bold' }}>
                {ev.time}
              </div>
              
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0f172a', border: `2px solid ${ev.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ev.icon size={12} color={ev.color} />
              </div>

              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', flex: 1, color: 'white', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ width: '4px', height: '16px', background: ev.color, borderRadius: '2px' }}></span>
                {ev.message}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimelineViewer;
