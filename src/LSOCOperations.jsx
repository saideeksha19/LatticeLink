import React, { useState } from 'react';
import { Key, Clock, Server, Database, Activity, ShieldCheck, CheckCircle2, ListChecks, Zap, Monitor, Smartphone, Laptop, LogOut } from 'lucide-react';

export const KeyRotationCenter = () => {
  const [rotating, setRotating] = useState(null);
  const [rotationStep, setRotationStep] = useState(0);

  const users = [
    { name: 'Alice', role: 'User', kem: 'Active', dsa: 'Active', last: '7 days ago', next: '23 days', status: 'Healthy' },
    { name: 'Bob', role: 'Group Admin', kem: 'Active', dsa: 'Active', last: '12 days ago', next: '18 days', status: 'Healthy' },
    { name: 'Server', role: 'System', kem: 'Active', dsa: 'Active', last: 'Auto', next: 'Auto', status: 'Automatic' }
  ];

  const steps = [
    'Generate New ML-KEM Pair',
    'Generate New ML-DSA Pair',
    'Encrypt Private Keys',
    'Update Public Directory',
    'Notify Contacts',
    'Rotation Successful'
  ];

  const handleRotate = (name) => {
    setRotating(name);
    setRotationStep(0);
    
    // Simulate steps
    steps.forEach((_, i) => {
      setTimeout(() => {
        setRotationStep(i);
        if (i === steps.length - 1) {
          setTimeout(() => setRotating(null), 2000);
        }
      }, (i + 1) * 800);
    });
  };

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '16px' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Key size={18} color="#38bdf8"/> Key Rotation Center</h3>
      
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(56, 189, 248, 0.2)', color: '#94a3b8' }}>
              <th style={{ padding: '12px' }}>User</th>
              <th style={{ padding: '12px' }}>Role</th>
              <th style={{ padding: '12px' }}>ML-KEM</th>
              <th style={{ padding: '12px' }}>ML-DSA</th>
              <th style={{ padding: '12px' }}>Last Rotation</th>
              <th style={{ padding: '12px' }}>Next Rotation</th>
              <th style={{ padding: '12px' }}>Status</th>
              <th style={{ padding: '12px' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: rotating === u.name ? 'rgba(56,189,248,0.1)' : 'transparent' }}>
                <td style={{ padding: '12px', fontWeight: '500' }}>{u.name}</td>
                <td style={{ padding: '12px', color: '#94a3b8' }}>{u.role}</td>
                <td style={{ padding: '12px', color: '#10b981' }}>{u.kem}</td>
                <td style={{ padding: '12px', color: '#10b981' }}>{u.dsa}</td>
                <td style={{ padding: '12px' }}>{u.last}</td>
                <td style={{ padding: '12px' }}>{u.next}</td>
                <td style={{ padding: '12px' }}>
                  <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>{u.status}</span>
                </td>
                <td style={{ padding: '12px' }}>
                  <button onClick={() => handleRotate(u.name)} disabled={rotating !== null} style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)', padding: '6px 12px', borderRadius: '6px', cursor: rotating ? 'not-allowed' : 'pointer' }}>
                    Rotate
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Rotation Animation Panel */}
      {rotating && (
        <div style={{ marginTop: '24px', background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.2)' }}>
           <div style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 'bold', marginBottom: '16px' }}>Rotating Keys for {rotating}...</div>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
             {steps.map((step, idx) => (
                <div key={idx} style={{ 
                  color: idx <= rotationStep ? (idx === steps.length - 1 ? '#10b981' : 'white') : '#475569',
                  background: idx <= rotationStep ? (idx === steps.length - 1 ? 'rgba(16,185,129,0.2)' : 'rgba(56,189,248,0.2)') : 'transparent',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  transition: '0.3s'
                }}>
                  {step}
                </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};

export const AuditTimeline = () => {
  const logs = [
    { time: '09:41', event: 'Alice Logged In', color: '#64748b' },
    { time: '09:43', event: 'Created Research Group', color: '#8b5cf6' },
    { time: '09:45', event: 'Uploaded Project.pdf', color: '#f59e0b' },
    { time: '09:48', event: 'Key Rotation (Alice)', color: '#38bdf8' },
    { time: '09:52', event: 'MITM Simulation Executed', color: '#ef4444' },
    { time: '09:53', event: 'MITM Blocked', color: '#10b981' },
    { time: '09:58', event: 'Admin Exported Report', color: '#64748b' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '16px', height: '100%' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={18} color="#8b5cf6"/> Audit Timeline</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '11px', top: '20px', bottom: '20px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
        {logs.map((l, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: idx === logs.length -1 ? '0' : '16px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: l.color, border: '4px solid #0f172a', zIndex: 1, marginTop: '2px' }}></div>
            <div>
              <div style={{ color: l.color, fontSize: '12px', fontWeight: '600' }}>{l.time}</div>
              <div style={{ color: 'white', fontSize: '13px' }}>{l.event}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ServerHealthCenter = () => {
  const metrics = [
    { name: 'API Gateway', status: 'Healthy', icon: Activity },
    { name: 'Primary Database', status: 'Connected', icon: Database },
    { name: 'Redis Cache', status: 'Running', icon: Server },
    { name: 'WebSocket Node', status: 'Connected', icon: Activity },
    { name: 'WebRTC Relay', status: 'Available', icon: Server }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '16px', height: '100%' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Server size={18} color="#10b981"/> Server Health</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {metrics.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
              <m.icon size={16} color="#94a3b8" /> {m.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>
              <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 8px #10b981', animation: 'pulse 2s infinite' }}></div>
              {m.status}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ComplianceCenter = () => {
  const standards = [
    'NIST Post-Quantum Cryptography',
    'Zero Trust Architecture',
    'End-to-End Encryption',
    'Forward Secrecy',
    'Role-Based Access Control',
    'Secure Session Management'
  ];

  const checks = [
    'AES-256-GCM Enabled',
    'SHA3-512 Enabled',
    'ML-KEM Active',
    'ML-DSA Active',
    'Auto Key Rotation Enabled',
    'Secure WebSocket Enabled'
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '16px' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><ListChecks size={18} color="#10b981"/> Compliance & Security Standards</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div>
          <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>Security Checklist</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {checks.map((chk, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontSize: '13px' }}>
                <CheckCircle2 size={16} color="#10b981" /> {chk}
              </div>
            ))}
          </div>
        </div>

        <div>
           <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>Architecture Standards</div>
           <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
             {standards.map((std, i) => (
                <div key={i} style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8', padding: '6px 12px', borderRadius: '20px', fontSize: '12px' }}>
                  {std}
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export const DeviceManagementCenter = () => {
  const devices = [
    { id: 1, type: 'Desktop', os: 'Windows 11', name: 'Primary Workstation', ip: '192.168.1.42', lastLogin: 'Active Now', session: '4h 12m', icon: Monitor, color: '#38bdf8' },
    { id: 2, type: 'Mobile', os: 'iOS 17', name: 'Alice iPhone 15', ip: '10.0.0.15', lastLogin: '2 mins ago', session: '12h 45m', icon: Smartphone, color: '#10b981' },
    { id: 3, type: 'Laptop', os: 'macOS Sonoma', name: 'Travel MacBook', ip: '172.16.0.5', lastLogin: '2 days ago', session: 'Inactive', icon: Laptop, color: '#94a3b8' },
    { id: 4, type: 'Server', os: 'Linux Ubuntu', name: 'Secure Node Alpha', ip: '45.33.22.11', lastLogin: 'Active Now', session: '14d 2h', icon: Server, color: '#8b5cf6' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '16px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: 'white', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Monitor size={18} color="#8b5cf6"/> Cross-Platform Devices
        </h3>
        <div style={{ color: '#10b981', fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold' }}>
          Kyber Sync Active
        </div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {devices.map((device) => (
          <div key={device.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', transition: 'transform 0.2s', cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.01)'} onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: `rgba(${device.color === '#38bdf8' ? '56,189,248' : device.color === '#10b981' ? '16,185,129' : device.color === '#8b5cf6' ? '139,92,246' : '148,163,184'},0.1)`, padding: '10px', borderRadius: '10px', border: `1px solid ${device.color}40` }}>
                <device.icon size={20} color={device.color} />
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>{device.name} <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'normal' }}>({device.os})</span></div>
                <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', gap: '12px' }}>
                  <span>IP: {device.ip}</span>
                  <span>•</span>
                  <span>Session: {device.session}</span>
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ color: device.lastLogin.includes('Active') ? '#10b981' : '#94a3b8', fontSize: '12px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {device.lastLogin.includes('Active') && <div style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 6px #10b981', animation: 'pulse 2s infinite' }}></div>}
                {device.lastLogin}
              </div>
              <button style={{ background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', transition: 'background 0.2s' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                <LogOut size={14} /> Revoke
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
