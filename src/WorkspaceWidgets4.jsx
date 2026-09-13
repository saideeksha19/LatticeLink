import React, { useState, useEffect } from 'react';
import { FileText, Image as ImageIcon, Video, FileArchive, Download, Share2, Activity, Server, Database, ShieldCheck, Zap } from 'lucide-react';

export const WorkspaceGallery = () => {
  const files = [
    { name: 'Project_Alpha.pdf', type: 'PDF', icon: FileText, by: 'Alice', time: '10 mins ago', color: '#ef4444' },
    { name: 'Network_Topology.png', type: 'Image', icon: ImageIcon, by: 'Bob', time: 'Yesterday', color: '#3b82f6' },
    { name: 'Meeting_Recording.mp4', type: 'Video', icon: Video, by: 'System', time: '2 days ago', color: '#8b5cf6' },
    { name: 'Quantum_Keys.zip', type: 'ZIP', icon: FileArchive, by: 'Admin', time: '1 week ago', color: '#f59e0b' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '500' }}>Recent Secure Files</h3>
      <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
        {files.map((file, idx) => (
          <div key={idx} style={{ 
            minWidth: '200px', 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ background: `rgba(${file.color === '#ef4444' ? '239,68,68' : file.color === '#3b82f6' ? '59,130,246' : file.color === '#8b5cf6' ? '139,92,246' : '245,158,11'}, 0.2)`, padding: '10px', borderRadius: '10px' }}>
                <file.icon size={24} color={file.color} />
              </div>
              <div style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}>Encrypted</div>
            </div>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: '500', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{file.name}</div>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '12px' }}>Shared by {file.by} • {file.time}</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button style={{ flex: 1, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Download size={14}/></button>
              <button style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Share2 size={14}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const WorkspaceQuote = () => {
  const quotes = [
    "Every secure message begins with trust.",
    "Designed for the Quantum Era.",
    "Future-proof your communication.",
    "Security is invisible when designed correctly.",
    "Post-Quantum Protection for Every Conversation."
  ];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % quotes.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-card" style={{ padding: '32px', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center', background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))' }}>
      <h2 style={{ color: 'white', fontSize: '24px', fontWeight: '300', fontStyle: 'italic', letterSpacing: '1px', transition: 'opacity 1s ease-in-out' }}>
        "{quotes[index]}"
      </h2>
    </div>
  );
};

export const PremiumFooter = () => {
  const metrics = [
    { label: 'Server', val: 'Healthy', icon: Server, color: '#10b981' },
    { label: 'API', val: 'Online', icon: Activity, color: '#10b981' },
    { label: 'Database', val: 'Connected', icon: Database, color: '#10b981' },
    { label: 'Encryption', val: 'Active', icon: ShieldCheck, color: '#3b82f6' },
    { label: 'Version', val: '2.0', icon: Zap, color: '#8b5cf6' }
  ];

  return (
    <div style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', borderTop: '1px solid rgba(255,255,255,0.05)', padding: '24px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '24px' }}>
        {metrics.map((m, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <m.icon size={14} color={m.color} />
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>{m.label}</span>
            <span style={{ color: 'white', fontSize: '12px', fontWeight: '500' }}>{m.val}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '16px' }}>
        <a href="#" style={{ color: '#94a3b8', fontSize: '12px', textDecoration: 'none' }}>Documentation</a>
        <a href="#" style={{ color: '#94a3b8', fontSize: '12px', textDecoration: 'none' }}>Support</a>
      </div>
    </div>
  );
};

export const QuantumJourneyCard = () => {
  const steps = [
    { title: "Message Created", icon: "📝" },
    { title: "AES-256-GCM Encryption", icon: "🔒" },
    { title: "SHA3-512 Hash Generated", icon: "🧬" },
    { title: "ML-DSA (Dilithium) Signature", icon: "✍️" },
    { title: "ML-KEM (Kyber) Encapsulated", icon: "🔑" },
    { title: "Secure WebSocket Tunnel", icon: "🌐" },
    { title: "Message Delivered", icon: "💬" }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%', position: 'relative' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '500' }}>Your Message Journey</h3>
      <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '15px', top: '20px', bottom: '20px', width: '2px', background: 'linear-gradient(to bottom, #3b82f6, #8b5cf6, #10b981)' }}></div>
        {steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: idx === steps.length - 1 ? '0' : '16px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1e293b', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '14px', zIndex: 1 }}>
              {step.icon}
            </div>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: '500', background: 'rgba(255,255,255,0.03)', padding: '8px 12px', borderRadius: '8px', flex: 1, border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: '0.2s' }}
                 onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                 onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
              {step.title}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
