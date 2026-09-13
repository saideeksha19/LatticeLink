import React, { useState, useEffect } from 'react';
import { Target, Activity, ShieldAlert, Cpu, AlertTriangle, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import MatrixRain from './MatrixRain';

// Live Packet Feed Component
const LiveSecurityMonitor = () => {
  const [packets, setPackets] = useState([
    { id: 1, time: '09:42:15', status: 'Delivered', color: '#10b981', details: 'Encrypted • Verified' },
    { id: 2, time: '09:42:14', status: 'Delivered', color: '#10b981', details: 'Encrypted • Signed' },
    { id: 3, time: '09:42:12', status: 'Rejected', color: '#ef4444', details: 'Replay Detected' },
    { id: 4, time: '09:42:10', status: 'Delivered', color: '#10b981', details: 'Encrypted • Verified' }
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newPacket = {
        id: Date.now(),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
        status: Math.random() > 0.8 ? 'Rejected' : 'Delivered',
        color: '',
        details: ''
      };
      
      if (newPacket.status === 'Rejected') {
        newPacket.color = '#ef4444';
        newPacket.details = Math.random() > 0.5 ? 'Tampering Detected' : 'Invalid Signature';
      } else {
        newPacket.color = '#10b981';
        newPacket.details = 'Encrypted • Verified';
      }

      setPackets(prev => [newPacket, ...prev].slice(0, 8));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {packets.map(p => (
        <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px', borderLeft: `3px solid ${p.color}`, animation: 'slideIn 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}>{p.time}</span>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>Packet</span>
            <span style={{ color: '#cbd5e1', fontSize: '12px' }}>{p.details}</span>
          </div>
          <div style={{ color: p.color, fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {p.status === 'Delivered' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>} {p.status}
          </div>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-10px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

// Threat Heatmap
const ThreatHeatmap = () => {
  const threats = [
    { name: 'Replay', blocks: 4, color: '#f59e0b' },
    { name: 'Tampering', blocks: 2, color: '#ef4444' },
    { name: 'Spoofing', blocks: 3, color: '#ec4899' },
    { name: 'Harvest', blocks: 1, color: '#8b5cf6' },
    { name: 'Quantum', blocks: 1, color: '#3b82f6' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {threats.map(t => (
        <div key={t.name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ color: '#cbd5e1', fontSize: '13px', width: '80px' }}>{t.name}</div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ 
                width: '16px', height: '16px', borderRadius: '4px',
                background: i < t.blocks ? t.color : 'rgba(255,255,255,0.05)',
                boxShadow: i < t.blocks ? `0 0 8px ${t.color}40` : 'none'
              }}></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ThreatIntelligence = () => {
  const timelineEvents = [
    { time: '09:20', event: 'Alice Login', color: '#64748b' },
    { time: '09:21', event: 'ML-KEM Handshake', color: '#8b5cf6' },
    { time: '09:22', event: 'AES Session Active', color: '#3b82f6' },
    { time: '09:23', event: 'Replay Attack Attempted', color: '#f59e0b' },
    { time: '09:23', event: 'Attack Blocked (Nonce)', color: '#10b981' },
    { time: '09:25', event: 'Device Sync Complete', color: '#38bdf8' }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Target size={32} color="#f59e0b" /> Threat Intelligence Center
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Live monitoring and visualization of active threats.</p>
          </div>
        </div>

        {/* Top Indicators */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {[
            { label: 'Current Threat Level', value: 'LOW', color: '#10b981', icon: ShieldCheck },
            { label: 'Latest Attack', value: 'Replay Blocked', color: '#f59e0b', icon: AlertTriangle },
            { label: 'Attack Source', value: 'Simulation Lab', color: '#3b82f6', icon: Activity },
            { label: 'Risk Score', value: '12%', color: '#10b981', icon: Target },
            { label: 'Quantum Status', value: 'Protected', color: '#8b5cf6', icon: Cpu }
          ].map((stat, i) => (
            <div key={i} className="glass-card" style={{ padding: '20px', background: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${stat.color}40`, display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={24} color={stat.color} />
              </div>
              <div>
                <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>{stat.label}</div>
                <div style={{ color: stat.color, fontSize: '18px', fontWeight: 'bold', marginTop: '2px' }}>{stat.value}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
          
          {/* Live Security Monitor */}
          <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={18} color="#3b82f6"/> Live Security Monitor
            </h3>
            <div style={{ flex: 1 }}>
              <LiveSecurityMonitor />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Threat Heatmap */}
            <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={18} color="#ef4444"/> Threat Heatmap
              </h3>
              <ThreatHeatmap />
            </div>

            {/* Threat Timeline */}
            <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Target size={18} color="#f59e0b"/> Live Threat Timeline
              </h3>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.05)' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {timelineEvents.map((ev, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 2 }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${ev.color}22`, border: `2px solid ${ev.color}`, marginTop: '2px', flexShrink: 0 }}></div>
                      <div>
                        <div style={{ color: ev.color, fontSize: '11px', fontWeight: 'bold' }}>{ev.time}</div>
                        <div style={{ color: 'white', fontSize: '13px' }}>{ev.event}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default ThreatIntelligence;
