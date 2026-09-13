import React from 'react';
import { Bot, Clock, MessageSquare, Phone, File, Users, HardDrive, Zap, CheckCircle2 } from 'lucide-react';

export const AIAssistant = () => {
  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px', zIndex: 1 }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '2px solid rgba(255,255,255,0.1)' }}>
          <Bot size={24} color="#fff" />
        </div>
        <div>
          <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>Hello Shamith</h3>
          <div style={{ color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><CheckCircle2 size={12}/> Everything is secure.</div>
        </div>
      </div>

      <div style={{ zIndex: 1, flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Today's Activity</div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ color: 'white', fontSize: '13px' }}><strong>8</strong> messages</span>
            <span style={{ color: 'white', fontSize: '13px' }}><strong>2</strong> calls</span>
            <span style={{ color: 'white', fontSize: '13px' }}><strong>1</strong> file</span>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Upcoming</div>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>Research Meeting</div>
          <div style={{ color: '#cbd5e1', fontSize: '12px' }}>12:00 PM (in 40 mins)</div>
        </div>

        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '12px', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div style={{ color: '#3b82f6', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600' }}>Suggestion</div>
          <div style={{ color: 'white', fontSize: '14px' }}>Reply to Alice</div>
          <div style={{ color: '#94a3b8', fontSize: '12px' }}>Estimated time: 2 mins</div>
        </div>
      </div>
    </div>
  );
};

export const LiveTimeline = () => {
  const events = [
    { time: '09:41', title: 'Logged In', desc: 'Windows 11 Device', icon: Clock, color: '#64748b' },
    { time: '09:43', title: 'Alice Sent File', desc: 'Research.pdf', icon: File, color: '#3b82f6' },
    { time: '09:44', title: 'AES Encrypted', desc: 'Session Key Generated', icon: Zap, color: '#f59e0b' },
    { time: '09:44', title: 'Dilithium Verified', desc: 'Signature Authentic', icon: CheckCircle2, color: '#10b981' },
    { time: '09:45', title: 'Message Delivered', desc: 'Secure Tunnel', icon: MessageSquare, color: '#8b5cf6' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '500' }}>Live Timeline</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '11px', top: '20px', bottom: '20px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
        
        {events.map((ev, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: idx === events.length -1 ? '0' : '20px' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: ev.color, border: '4px solid #0f172a', zIndex: 1, marginTop: '2px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            </div>
            <div>
              <div style={{ color: ev.color, fontSize: '12px', fontWeight: '600', marginBottom: '2px' }}>{ev.time}</div>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{ev.title}</div>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>{ev.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WorkspaceAnalytics = () => {
  const stats = [
    { label: 'Messages', val: '182', icon: MessageSquare },
    { label: 'Calls', val: '12', icon: Phone },
    { label: 'Files', val: '28', icon: File },
    { label: 'Groups', val: '6', icon: Users },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '500' }}>This Week</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
        {stats.map((s, i) => (
           <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px' }}>
                 <s.icon size={14}/> {s.label}
              </div>
              <span style={{ color: 'white', fontWeight: 'bold' }}>{s.val}</span>
           </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Most Active Contact</span>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>Alice</span>
         </div>
         <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Average Response</span>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>4 mins</span>
         </div>
         <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Encryption Latency</span>
            <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '500' }}>0.72 ms</span>
         </div>
      </div>
    </div>
  );
};
