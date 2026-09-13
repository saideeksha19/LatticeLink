import React, { useState, useEffect } from 'react';
import { Type, Fingerprint, Shield, Lock, Box, Globe, ShieldCheck, CheckCheck } from 'lucide-react';

const MessageCryptoPipeline = ({ isVisible }) => {
  const [activeStep, setActiveStep] = useState(-1);

  const steps = [
    { label: 'Typing', icon: Type, color: '#94a3b8' },
    { label: 'SHA3 Hash', icon: Fingerprint, color: '#f59e0b' },
    { label: 'ML-DSA Signature', icon: Shield, color: '#10b981' },
    { label: 'AES-256 Encrypt', icon: Lock, color: '#3b82f6' },
    { label: 'ML-KEM Key', icon: Box, color: '#8b5cf6' },
    { label: 'Network Tunnel', icon: Globe, color: '#38bdf8' },
    { label: 'Receiver Verify', icon: ShieldCheck, color: '#10b981' },
    { label: 'Delivered', icon: CheckCheck, color: '#10b981' }
  ];

  useEffect(() => {
    if (isVisible) {
      setActiveStep(0);
      const interval = setInterval(() => {
        setActiveStep(prev => {
          if (prev >= steps.length - 1) {
            clearInterval(interval);
            return prev + 1;
          }
          return prev + 1;
        });
      }, 300);
      return () => clearInterval(interval);
    } else {
      setActiveStep(-1);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.5)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', animation: 'slideDown 0.3s ease-out' }}>
      <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Message Cryptographic Pipeline</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 1 }}></div>
        
        {steps.map((step, idx) => {
          const isActive = activeStep >= idx;
          const isCurrent = activeStep === idx;
          return (
            <div key={idx} style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: isActive ? 1 : 0.3, transition: '0.3s' }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', 
                background: isActive ? `${step.color}22` : 'rgba(255,255,255,0.05)', 
                border: `1px solid ${isActive ? step.color : 'rgba(255,255,255,0.1)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: isCurrent ? `0 0 15px ${step.color}80` : 'none',
                transform: isCurrent ? 'scale(1.2)' : 'scale(1)',
                transition: '0.3s'
              }}>
                <step.icon size={14} color={isActive ? step.color : '#94a3b8'} />
              </div>
              <span style={{ color: isActive ? 'white' : '#94a3b8', fontSize: '10px', textAlign: 'center', maxWidth: '50px', lineHeight: '1.2' }}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default MessageCryptoPipeline;
