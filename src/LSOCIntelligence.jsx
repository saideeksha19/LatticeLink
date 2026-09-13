import React, { useState, useEffect } from 'react';
import { Bot, Shield, ListTodo, BookOpen, RotateCcw, ToggleLeft, ToggleRight, Info, Smartphone, Laptop, RefreshCw, Lock } from 'lucide-react';

export const AISOCAssistant = () => {
  const [typing, setTyping] = useState('');
  const fullText = "No active attacks detected. One team key rotation due. Three inactive sessions. Two pending connection requests.";
  
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      if (idx <= fullText.length) {
        setTyping(fullText.slice(0, idx));
        idx++;
      } else {
        clearInterval(interval);
      }
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: '16px', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', right: '-20%', top: '-20%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(20px)' }}></div>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Bot size={18} color="#8b5cf6" /> Executive Security Brief
      </h3>
      
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', flex: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Overall Security</div>
           <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>98%</div>
        </div>
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', flex: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
           <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Threat Level</div>
           <div style={{ color: '#10b981', fontSize: '20px', fontWeight: 'bold' }}>LOW</div>
        </div>
      </div>

      <div style={{ color: '#38bdf8', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>Today's Intelligence</div>
      <div style={{ color: 'white', fontSize: '14px', lineHeight: '1.6', minHeight: '60px', marginBottom: '24px' }}>
        {typing}
        <span style={{ display: 'inline-block', width: '2px', height: '14px', background: '#8b5cf6', marginLeft: '4px', animation: 'blink 1s infinite' }}></span>
      </div>

      <div style={{ color: '#f59e0b', fontSize: '12px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: 'bold' }}>Recommended Actions</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '6px' }}>✓ Rotate Research Team Keys</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#cbd5e1', fontSize: '13px', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: '6px' }}>✓ Archive old audit logs</div>
      </div>
    </div>
  );
};

export const SecurityPolicyCenter = () => {
  const [policies, setPolicies] = useState([
    { name: 'AES-256-GCM', enabled: true },
    { name: 'SHA3-512', enabled: true },
    { name: 'ML-KEM (Kyber)', enabled: true },
    { name: 'ML-DSA (Dilithium)', enabled: true },
    { name: 'Forward Secrecy', enabled: true },
  ]);

  const togglePolicy = (idx) => {
    const newPol = [...policies];
    newPol[idx].enabled = !newPol[idx].enabled;
    setPolicies(newPol);
  };

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '16px', height: '100%' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Shield size={18} color="#38bdf8" /> Security Policies
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {policies.map((p, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <span style={{ color: 'white', fontSize: '13px' }}>{p.name}</span>
            <div onClick={() => togglePolicy(idx)} style={{ cursor: 'pointer' }}>
              {p.enabled ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#64748b" />}
            </div>
          </div>
        ))}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '12px 16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
           <span style={{ color: 'white', fontSize: '13px' }}>Auto Delete</span>
           <span style={{ color: '#38bdf8', fontSize: '13px', fontWeight: 'bold' }}>7 Days</span>
        </div>
      </div>
    </div>
  );
};

export const DecisionCenter = () => {
  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '16px', height: '100%' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <ListTodo size={18} color="#f59e0b" /> Decision Center
      </h3>
      <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', marginBottom: '12px' }}>Priority Tasks</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239,68,68,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
           <div style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%' }}></div>
           <span style={{ color: 'white', fontSize: '13px' }}>Rotate Team Keys</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(245,158,11,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(245,158,11,0.2)' }}>
           <div style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%' }}></div>
           <span style={{ color: 'white', fontSize: '13px' }}>Review Pending Users</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(16,185,129,0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
           <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%' }}></div>
           <span style={{ color: 'white', fontSize: '13px' }}>All Servers Healthy</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px' }}>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>4</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Approvals</div>
        </div>
        <div style={{ flex: 1, background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
          <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>2</div>
          <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>New Users</div>
        </div>
      </div>
    </div>
  );
};

export const SecurityKnowledgeCenter = () => {
  const qas = [
    { q: 'What is ML-KEM?', a: 'Module-Lattice-Based Key-Encapsulation Mechanism (formerly Kyber). Used for establishing secure session keys resistant to quantum computers.' },
    { q: 'What is ML-DSA?', a: 'Module-Lattice-Based Digital Signature Algorithm (formerly Dilithium). Used for strongly authenticating sender identities.' },
    { q: 'Why use SHA3-512?', a: 'It belongs to the Keccak family and is immune to length-extension attacks. A 512-bit digest offers immense collision resistance.' },
    { q: 'How does Kyber resist Shor\'s Algorithm?', a: 'Shor\'s solves prime factorization and discrete logarithms. Kyber relies on the Learning With Errors (LWE) problem, involving noisy vectors which Shor\'s cannot effectively solve.' }
  ];
  const [open, setOpen] = useState(null);

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', height: '100%' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={18} color="#10b981" /> Security Knowledge Center
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {qas.map((qa, idx) => (
          <div key={idx} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', overflow: 'hidden' }}>
            <div onClick={() => setOpen(open === idx ? null : idx)} style={{ padding: '12px 16px', color: 'white', fontSize: '13px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: open === idx ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
               <span>{qa.q}</span>
               <Info size={14} color="#94a3b8" />
            </div>
            {open === idx && (
              <div style={{ padding: '12px 16px', color: '#cbd5e1', fontSize: '12px', lineHeight: '1.5', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                {qa.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export const SecurityReplay = () => {
  const [replaying, setReplaying] = useState(false);
  const [step, setStep] = useState(0);
  const flow = ['Replaying MITM (09:42 AM)', 'AES Decryption Attempt', 'SHA3 Hash Verification', 'Integrity Failed', 'Packet Blocked'];

  const handleReplay = () => {
    setReplaying(true);
    setStep(0);
    flow.forEach((_, idx) => {
      setTimeout(() => {
        setStep(idx);
        if (idx === flow.length - 1) {
          setTimeout(() => setReplaying(false), 3000);
        }
      }, (idx + 1) * 1000);
    });
  };

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '16px', height: '100%' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <RotateCcw size={18} color="#ef4444" /> Security Replay
      </h3>
      <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>Instantly replay past threat simulations for analysis or demonstration.</div>
      
      {!replaying ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239,68,68,0.1)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>
          <div>
            <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>MITM Attack</div>
            <div style={{ color: '#94a3b8', fontSize: '12px' }}>09:42 AM • Status: Blocked</div>
          </div>
          <button onClick={handleReplay} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Replay
          </button>
        </div>
      ) : (
        <div style={{ background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '12px', border: '1px solid #ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ color: '#ef4444', fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', animation: 'pulse 1s infinite' }}>LIVE REPLAY</div>
          <div style={{ color: 'white', fontSize: '16px', fontWeight: '500' }}>{flow[step]}</div>
          <div style={{ marginTop: '16px', width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', position: 'relative' }}>
             <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', background: '#ef4444', width: (((step + 1) / flow.length) * 100) + '%', transition: 'width 0.5s' }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export const CrossPlatformSyncCenter = () => {
  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '16px', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10, position: 'relative' }}>
        <RefreshCw size={18} color="#38bdf8" /> Cross-Platform Sync
      </h3>
      
      {/* Background visualization */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', opacity: 0.1, zIndex: 0 }}>
        <div style={{ width: '150px', height: '150px', border: '2px dashed #38bdf8', borderRadius: '50%', animation: 'spin 20s linear infinite' }}></div>
      </div>

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>
          Kyber and AES-256-GCM secure sync active between your authenticated devices.
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0' }}>
          
          {/* Mobile Node */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(16,185,129,0.1)', padding: '16px', borderRadius: '50%', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 0 15px rgba(16,185,129,0.2)' }}>
              <Smartphone size={24} color="#10b981" />
            </div>
            <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>iPhone 15</div>
          </div>

          {/* Sync Connection */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px', position: 'relative' }}>
            <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
              <div style={{ width: '6px', height: '6px', background: '#38bdf8', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
              <div style={{ width: '6px', height: '6px', background: '#38bdf8', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.2s' }}></div>
              <div style={{ width: '6px', height: '6px', background: '#38bdf8', borderRadius: '50%', animation: 'pulse 1.5s infinite 0.4s' }}></div>
            </div>
            <div style={{ background: 'rgba(56,189,248,0.1)', padding: '4px 12px', borderRadius: '12px', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Lock size={12} color="#38bdf8" />
              <span style={{ color: '#38bdf8', fontSize: '10px', fontWeight: 'bold' }}>AES-256-GCM</span>
            </div>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, rgba(16,185,129,0.2), #38bdf8, rgba(139,92,246,0.2))', zIndex: -1 }}></div>
          </div>

          {/* Desktop Node */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{ background: 'rgba(139,92,246,0.1)', padding: '16px', borderRadius: '50%', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 15px rgba(139,92,246,0.2)' }}>
              <Laptop size={24} color="#8b5cf6" />
            </div>
            <div style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>MacBook Pro</div>
          </div>
          
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
          <div>
             <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Last Sync</div>
             <div style={{ color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>Just now</div>
          </div>
          <div style={{ textAlign: 'right' }}>
             <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Key Exchange</div>
             <div style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>Kyber</div>
          </div>
        </div>
      </div>
    </div>
  );
};
