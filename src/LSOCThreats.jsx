import React, { useState, useEffect } from 'react';
import { ShieldAlert, Play, XOctagon, CheckCircle, Search, FileCode2, Activity } from 'lucide-react';

const attacks = [
  { 
    id: 'mitm', 
    name: 'MITM', 
    type: 'Blocked',
    steps: ['Alice sends packet', 'Attacker intercepts & modifies', 'Receiver checks SHA3', 'Integrity verification fails', 'Packet Blocked'],
    why: 'The encrypted payload was modified during transmission. SHA3-512 generated a different hash than the original. Integrity verification failed. Message discarded before decryption.' 
  },
  { 
    id: 'fake', 
    name: 'Fake Sender', 
    type: 'Blocked',
    steps: ['Attacker creates fake packet', 'Attacker uses fake signature', 'Receiver applies Dilithium Verify', 'Signature is invalid', 'Authentication Failed'],
    why: 'The message signature could not be verified using the sender\'s ML-DSA public key. Authentication failed. The packet was rejected.' 
  },
  { 
    id: 'replay', 
    name: 'Replay Attack', 
    type: 'Blocked',
    steps: ['Attacker captures packet', 'Attacker replays later', 'Receiver checks Timestamp', 'Timestamp mismatch detected', 'Packet Rejected'],
    why: 'The packet timestamp and nonce were already processed or expired. Replay detection blocked the duplicate packet from being processed.' 
  },
  { 
    id: 'harvest', 
    name: 'Harvest Now', 
    type: 'Protected',
    steps: ['Attacker stores packet', 'Quantum computer analyzes Kyber', 'Key Encapsulation remains secure', 'AES Session Key is protected', 'Data remains encrypted'],
    why: 'ML-KEM (Kyber) is resistant to quantum computing algorithms. Even with future quantum capabilities, the session key cannot be recovered.' 
  },
  { 
    id: 'shor', 
    name: 'Shor\'s Algorithm', 
    type: 'Resistant',
    steps: ['Attacker attempts RSA factor', 'Success', 'Attacker attempts Kyber break', 'Not Applicable (Lattice Math)', 'System Protected'],
    why: 'Shor\'s algorithm easily breaks RSA and ECC, but LatticeLink uses Kyber. The underlying Learning With Errors (LWE) mathematical problem is resistant to Shor\'s.' 
  },
  { 
    id: 'grover', 
    name: 'Grover\'s Algorithm', 
    type: 'Resistant',
    steps: ['Attacker targets AES-256', 'Quantum Search applied', 'Key space reduced to 2^128', 'Computationally Infeasible', 'System Protected'],
    why: 'Grover\'s algorithm halves the effective key length of symmetric ciphers. However, AES-256 is reduced to AES-128 equivalent, which is still completely secure.' 
  }
];

export const InteractiveCyberRange = () => {
  const [counts, setCounts] = useState({ mitm: 0, fake: 0, replay: 0, harvest: 0, shor: 0, grover: 0 });
  const [activeSimulation, setActiveSimulation] = useState(null);
  const [simStep, setSimStep] = useState(0);

  const runSimulation = (attackId) => {
    setActiveSimulation(attacks.find(a => a.id === attackId));
    setSimStep(0);
  };

  useEffect(() => {
    if (activeSimulation && simStep < activeSimulation.steps.length) {
      const timer = setTimeout(() => {
        setSimStep(s => s + 1);
        // If simulation just finished, update counts
        if (simStep === activeSimulation.steps.length - 1) {
          setCounts(prev => ({ ...prev, [activeSimulation.id]: prev[activeSimulation.id] + 1 }));
        }
      }, 1500); // 1.5s per step
      return () => clearTimeout(timer);
    }
  }, [activeSimulation, simStep]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
      
      {/* Live Threat Intelligence (Counters) */}
      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px' }}>
        {attacks.map(attack => (
          <div key={attack.id} style={{ 
            minWidth: '160px', 
            background: 'rgba(15, 23, 42, 0.6)', 
            border: '1px solid rgba(56, 189, 248, 0.1)', 
            borderRadius: '12px', 
            padding: '16px',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '8px' }}>{attack.name}</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div style={{ color: attack.type === 'Blocked' ? '#ef4444' : '#10b981', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>{attack.type}</div>
              <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{counts[attack.id]}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Attack Launcher */}
      <div style={{ gridColumn: 'span 4', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '16px', padding: '24px' }}>
        <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldAlert size={18} color="#ef4444"/> Launch Attack</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {attacks.map(attack => (
            <button key={attack.id} onClick={() => runSimulation(attack.id)} disabled={activeSimulation && simStep < activeSimulation.steps.length}
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: activeSimulation && simStep < activeSimulation.steps.length ? 'not-allowed' : 'pointer',
                opacity: activeSimulation && simStep < activeSimulation.steps.length ? 0.5 : 1,
                transition: '0.2s'
              }}>
              <span style={{ fontWeight: '500' }}>{attack.name}</span>
              <Play size={16} color="#ef4444" />
            </button>
          ))}
        </div>
      </div>

      {/* Simulation Viewer & Explanation */}
      <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Animated Simulator */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)', borderRadius: '16px', padding: '24px', minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} color="#38bdf8"/> Live Simulation Monitor</h3>
          
          {activeSimulation ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
               <h2 style={{ color: '#ef4444', marginBottom: '32px' }}>Testing: {activeSimulation.name}</h2>
               
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 {activeSimulation.steps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <div style={{ 
                        background: idx < simStep ? (idx === activeSimulation.steps.length - 1 ? (activeSimulation.type === 'Blocked' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)') : 'rgba(56,189,248,0.2)') : 'transparent',
                        border: `1px solid ${idx < simStep ? (idx === activeSimulation.steps.length - 1 ? (activeSimulation.type === 'Blocked' ? '#ef4444' : '#10b981') : '#38bdf8') : 'rgba(255,255,255,0.1)'}`,
                        color: idx < simStep ? 'white' : '#94a3b8',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        fontWeight: '500',
                        textAlign: 'center',
                        width: '120px',
                        opacity: idx <= simStep ? 1 : 0.3,
                        transform: idx === simStep ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 0.5s'
                      }}>
                        {step}
                      </div>
                      {idx < activeSimulation.steps.length - 1 && (
                        <div style={{ 
                          width: '40px', 
                          height: '2px', 
                          background: idx < simStep ? '#38bdf8' : 'rgba(255,255,255,0.1)',
                          position: 'relative'
                        }}>
                          {idx === simStep && <div style={{ position: 'absolute', top: -3, left: 0, width: '8px', height: '8px', background: 'white', borderRadius: '50%', animation: 'moveRight 1.5s linear forwards' }}></div>}
                        </div>
                      )}
                    </React.Fragment>
                 ))}
               </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
              Select an attack from the left to begin the simulation.
            </div>
          )}
        </div>

        {/* Explain Why Panel & Packet Inspector */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><CheckCircle size={18} color="#10b981"/> Explain Why</h3>
            {activeSimulation && simStep >= activeSimulation.steps.length ? (
               <div>
                  <div style={{ color: activeSimulation.type === 'Blocked' ? '#ef4444' : '#10b981', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px', textTransform: 'uppercase' }}>Outcome: {activeSimulation.type}</div>
                  <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.6' }}>{activeSimulation.why}</div>
               </div>
            ) : (
               <div style={{ color: '#94a3b8', fontSize: '13px' }}>Awaiting simulation completion...</div>
            )}
          </div>

          <div style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.2)', borderRadius: '16px', padding: '24px' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}><Search size={18} color="#8b5cf6"/> Packet Inspector</h3>
            {activeSimulation && simStep >= activeSimulation.steps.length ? (
               <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Sender</span> <span style={{ color: 'white' }}>Alice</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Receiver</span> <span style={{ color: 'white' }}>Bob</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>AES Payload</span> <span style={{ color: '#10b981' }}>Encrypted</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>SHA3 Hash</span> <span style={{ color: activeSimulation.id === 'mitm' ? '#ef4444' : '#10b981' }}>{activeSimulation.id === 'mitm' ? 'Mismatch' : 'Valid'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>ML-DSA Signature</span> <span style={{ color: activeSimulation.id === 'fake' ? '#ef4444' : '#10b981' }}>{activeSimulation.id === 'fake' ? 'Invalid' : 'Valid'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '8px' }}><span style={{ color: 'white' }}>Final Status</span> <span style={{ color: activeSimulation.type === 'Blocked' ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{activeSimulation.type === 'Blocked' ? 'REJECTED' : 'DELIVERED'}</span></div>
               </div>
            ) : (
               <div style={{ color: '#94a3b8', fontSize: '13px' }}>Inspector offline.</div>
            )}
          </div>

        </div>
      </div>
      
      <style>{`
        @keyframes moveRight {
          0% { left: 0; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};
