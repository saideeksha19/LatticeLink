import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, ArrowRight, ShieldCheck, Lock, Key, Hash, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const EncryptionPipeline = () => {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 5);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    { id: 0, label: 'AES Encryption', icon: Lock, color: '#3b82f6' },
    { id: 1, label: 'SHA3 Hash', icon: Hash, color: '#f59e0b' },
    { id: 2, label: 'Dilithium Sign', icon: ShieldCheck, color: '#10b981' },
    { id: 3, label: 'Kyber Encapsulation', icon: Key, color: '#8b5cf6' },
    { id: 4, label: 'Secure Tunnel', icon: Activity, color: '#06b6d4' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%' }}>
      <h3 style={{ color: 'white', margin: '0 0 24px 0' }}>Live Encryption Pipeline</h3>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        
        {/* Connecting Line */}
        <div style={{ position: 'absolute', top: '24px', left: '10%', right: '10%', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 0 }}></div>

        {steps.map((step, idx) => {
          const isActive = activeStep === step.id;
          const isPast = activeStep > step.id;
          
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', zIndex: 1, width: '20%' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '50%', 
                background: isActive ? step.color : (isPast ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.5)'),
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                border: `2px solid ${isActive || isPast ? step.color : 'rgba(255,255,255,0.1)'}`,
                boxShadow: isActive ? `0 0 20px ${step.color}` : 'none',
                transition: 'all 0.5s ease',
                transform: isActive ? 'scale(1.2)' : 'scale(1)'
              }}>
                <step.icon size={20} color={isActive || isPast ? '#fff' : '#64748b'} />
              </div>
              <span style={{ 
                color: isActive ? '#fff' : '#94a3b8', 
                fontSize: '12px', 
                fontWeight: isActive ? '600' : '400',
                textAlign: 'center',
                transition: 'all 0.3s'
              }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ThreatMonitor = () => {
  const threats = [
    { name: 'MITM', status: 'safe' },
    { name: 'Replay', status: 'safe' },
    { name: 'Injection', status: 'safe' },
    { name: 'Shor', status: 'safe' },
    { name: 'Grover', status: 'safe' },
    { name: 'Tampering', status: 'safe' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
         <h3 style={{ color: 'white', margin: 0 }}>Threat Radar</h3>
         <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 12px', borderRadius: '12px' }}>
           <ShieldAlert size={14} /> Network Secure
         </div>
      </div>
      
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {threats.map((threat, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '12px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '8px',
            borderLeft: '3px solid #10b981'
          }}>
            <span style={{ color: '#cbd5e1', fontSize: '13px' }}>{threat.name}</span>
            <CheckCircle2 size={16} color="#10b981" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const SecurityScore = () => (
  <div className="glass-card" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
    <h3 style={{ color: 'white', margin: '0 0 24px 0', alignSelf: 'flex-start' }}>Overall Security</h3>
    
    <div style={{ position: 'relative', width: '150px', height: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '24px' }}>
      <svg width="150" height="150" viewBox="0 0 150 150">
        <circle cx="75" cy="75" r="65" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="10" />
        <circle cx="75" cy="75" r="65" fill="none" stroke="#3b82f6" strokeWidth="10" strokeDasharray="408" strokeDashoffset="8" strokeLinecap="round" transform="rotate(-90 75 75)" style={{ transition: '1s ease-out' }} />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ color: 'white', fontSize: '36px', fontWeight: 'bold' }}>98<span style={{ fontSize: '20px', color: '#94a3b8' }}>%</span></span>
      </div>
    </div>

    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', color: '#cbd5e1', fontSize: '12px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8' }}>Identity</span>
        <span style={{ color: '#10b981', fontWeight: 'bold' }}>99%</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8' }}>Network</span>
        <span style={{ color: '#10b981', fontWeight: 'bold' }}>100%</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <span style={{ color: '#94a3b8' }}>Storage</span>
        <span style={{ color: '#10b981', fontWeight: 'bold' }}>99%</span>
      </div>
    </div>
  </div>
);
