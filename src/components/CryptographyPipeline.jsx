import React, { useState, useEffect } from 'react';
import { Mail, Fingerprint, Shield, Lock, Box, Zap, User, ArrowRight } from 'lucide-react';

const CryptographyPipeline = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { id: 'msg', label: 'Message', icon: Mail, color: '#94a3b8' },
    { id: 'sha3', label: 'SHA3-512', icon: Fingerprint, color: '#f59e0b', sub: 'Integrity' },
    { id: 'dsa', label: 'ML-DSA', icon: Shield, color: '#10b981', sub: 'Signature' },
    { id: 'aes', label: 'AES-256', icon: Lock, color: '#3b82f6', sub: 'Encryption' },
    { id: 'kem', label: 'ML-KEM', icon: Box, color: '#8b5cf6', sub: 'Key Exchange' },
    { id: 'net', label: 'Network', icon: Zap, color: '#ec4899', sub: 'Transport' },
    { id: 'recv', label: 'Receiver', icon: User, color: '#0ea5e9' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % (steps.length + 2)); // Add delay at the end
    }, 800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
      <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Box size={20} color="#3b82f6" /> Post-Quantum Cryptography Pipeline
      </h3>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', overflowX: 'auto', paddingBottom: '12px' }}>
        {steps.map((step, idx) => {
          const isActive = activeStep === idx;
          const isPast = activeStep > idx;
          
          return (
            <React.Fragment key={step.id}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', minWidth: '80px', transition: 'all 0.3s', opacity: isActive || isPast ? 1 : 0.4, transform: isActive ? 'scale(1.1)' : 'scale(1)' }}>
                <div style={{
                  width: '60px', height: '60px', borderRadius: '16px',
                  background: isActive || isPast ? `${step.color}25` : `${step.color}10`, 
                  border: `1px solid ${isActive || isPast ? step.color : step.color + '44'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isActive ? `0 0 30px ${step.color}66` : isPast ? `0 0 15px ${step.color}22` : 'none',
                  transition: 'all 0.3s'
                }}>
                  <step.icon size={28} color={isActive || isPast ? step.color : '#64748b'} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: isActive ? 'white' : isPast ? '#e2e8f0' : '#64748b', fontSize: '14px', fontWeight: 'bold', transition: 'all 0.3s' }}>{step.label}</div>
                  {step.sub && <div style={{ color: isActive ? step.color : '#64748b', fontSize: '11px', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', transition: 'all 0.3s' }}>{step.sub}</div>}
                </div>
              </div>
              {idx < steps.length - 1 && (
                <div style={{ position: 'relative', width: '40px', flexShrink: 0 }}>
                  <ArrowRight size={24} color={isPast ? step.color : "#334155"} style={{ transition: 'all 0.3s' }} />
                  {activeStep === idx && (
                    <div style={{ position: 'absolute', top: '50%', left: '0', width: '10px', height: '10px', background: step.color, borderRadius: '50%', transform: 'translateY(-50%)', animation: 'moveArrow 0.8s linear forwards', boxShadow: `0 0 10px ${step.color}` }}></div>
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <style>{`
        @keyframes moveArrow {
          from { left: 0px; opacity: 1; }
          to { left: 30px; opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default CryptographyPipeline;
