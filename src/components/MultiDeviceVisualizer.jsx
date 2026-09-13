import React, { useState, useEffect } from 'react';
import { Monitor, Server, Smartphone, Laptop, Lock } from 'lucide-react';

const MultiDeviceVisualizer = ({ isActive, onComplete }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isActive) {
      setStep(1);
      const timers = [
        setTimeout(() => setStep(2), 600), // Encrypting
        setTimeout(() => setStep(3), 1200), // Tunnel to Cloud
        setTimeout(() => setStep(4), 1800), // Cloud Processing
        setTimeout(() => setStep(5), 2400), // Sync to devices
        setTimeout(() => {
          setStep(6);
          if (onComplete) onComplete();
        }, 3200)
      ];
      return () => timers.forEach(clearTimeout);
    } else {
      setStep(0);
    }
  }, [isActive, onComplete]);

  if (!isActive) return null;

  return (
    <div style={{ padding: '24px', background: 'rgba(0,0,0,0.6)', borderRadius: '16px', border: '1px solid rgba(56,189,248,0.3)', marginBottom: '16px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Network Lines */}
      <svg style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, pointerEvents: 'none' }}>
        {/* Desktop to Cloud */}
        <path d="M 100,60 L 250,60" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
        <path d="M 100,60 L 250,60" stroke="#3b82f6" strokeWidth="2" fill="none" strokeDasharray="5 5" style={{ opacity: step >= 2 ? 1 : 0, animation: 'dash 1s linear infinite' }} />
        
        {/* Cloud to Phone */}
        <path d="M 330,60 L 450,30" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
        <path d="M 330,60 L 450,30" stroke="#10b981" strokeWidth="2" fill="none" strokeDasharray="5 5" style={{ opacity: step >= 4 ? 1 : 0, animation: 'dash 1s linear infinite' }} />
        
        {/* Cloud to Laptop */}
        <path d="M 330,60 L 450,90" stroke="rgba(255,255,255,0.1)" strokeWidth="2" fill="none" />
        <path d="M 330,60 L 450,90" stroke="#10b981" strokeWidth="2" fill="none" strokeDasharray="5 5" style={{ opacity: step >= 4 ? 1 : 0, animation: 'dash 1s linear infinite' }} />
      </svg>

      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Source Desktop */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2 }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(56,189,248,0.2)', border: '1px solid #38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Monitor size={24} color="#38bdf8" />
          </div>
          <span style={{ color: 'white', fontSize: '12px' }}>Desktop</span>
          {step === 1 && <span style={{ color: '#f59e0b', fontSize: '10px' }}>Encrypting...</span>}
        </div>

        {/* Encrypted Packet */}
        <div style={{ 
          position: 'absolute', left: '120px', top: '15px', 
          width: '30px', height: '30px', borderRadius: '50%', background: '#3b82f6', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.6s linear',
          opacity: step >= 2 && step < 4 ? 1 : 0,
          transform: step === 3 ? 'translateX(110px)' : 'translateX(0px)',
          boxShadow: '0 0 15px #3b82f6'
        }}>
          <Lock size={14} color="white" />
        </div>

        {/* Cloud Relay */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, transform: 'translateX(-20px)' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '50%', 
            background: step >= 4 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', 
            border: `1px solid ${step >= 4 ? '#10b981' : 'rgba(255,255,255,0.2)'}`, 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: step >= 4 ? '0 0 30px rgba(16,185,129,0.4)' : 'none',
            transition: '0.4s'
          }}>
            <Server size={32} color={step >= 4 ? '#10b981' : '#64748b'} />
          </div>
          <span style={{ color: 'white', fontSize: '12px' }}>Cloud Relay</span>
          <span style={{ color: '#94a3b8', fontSize: '10px' }}>Zero Knowledge</span>
        </div>

        {/* Sync Packets */}
        <div style={{ 
          position: 'absolute', left: '340px', top: '0px', 
          width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.6s linear',
          opacity: step >= 4 && step < 5 ? 1 : 0,
          transform: step === 4 ? 'translate(0px, 0px)' : 'translate(90px, -20px)',
          boxShadow: '0 0 10px #10b981'
        }}>
          <Lock size={12} color="white" />
        </div>
        <div style={{ 
          position: 'absolute', left: '340px', top: '30px', 
          width: '24px', height: '24px', borderRadius: '50%', background: '#10b981', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.6s linear',
          opacity: step >= 4 && step < 5 ? 1 : 0,
          transform: step === 4 ? 'translate(0px, 0px)' : 'translate(90px, 20px)',
          boxShadow: '0 0 10px #10b981'
        }}>
          <Lock size={12} color="white" />
        </div>

        {/* Endpoints */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '8px', 
              background: step >= 5 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', 
              border: `1px solid ${step >= 5 ? '#10b981' : 'rgba(255,255,255,0.1)'}`, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: '0.3s'
            }}>
              <Smartphone size={18} color={step >= 5 ? '#10b981' : '#94a3b8'} />
            </div>
            <div>
              <div style={{ color: 'white', fontSize: '12px' }}>iPhone</div>
              {step >= 5 && <div style={{ color: '#10b981', fontSize: '10px' }}>Synced</div>}
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ 
              width: '36px', height: '36px', borderRadius: '8px', 
              background: step >= 5 ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.05)', 
              border: `1px solid ${step >= 5 ? '#10b981' : 'rgba(255,255,255,0.1)'}`, 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: '0.3s'
            }}>
              <Laptop size={18} color={step >= 5 ? '#10b981' : '#94a3b8'} />
            </div>
            <div>
              <div style={{ color: 'white', fontSize: '12px' }}>MacBook</div>
              {step >= 5 && <div style={{ color: '#10b981', fontSize: '10px' }}>Synced</div>}
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes dash {
          to { stroke-dashoffset: -10; }
        }
      `}</style>
    </div>
  );
};

export default MultiDeviceVisualizer;
