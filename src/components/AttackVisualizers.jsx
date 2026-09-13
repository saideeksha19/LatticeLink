import React from 'react';
import { Clock, ShieldAlert, Cpu, CheckCircle2, XCircle } from 'lucide-react';

export const ShorsVisualizer = ({ simStep }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
      <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '16px', borderRadius: '8px' }}>
        <h4 style={{ color: '#ef4444', margin: '0 0 12px 0' }}>Legacy RSA-2048</h4>
        <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ opacity: simStep >= 0 ? 1 : 0.3 }}>1. Prime Factorization Attempted</div>
          <div style={{ opacity: simStep >= 1 ? 1 : 0.3 }}>2. Quantum Fourier Transform</div>
          <div style={{ opacity: simStep >= 2 ? 1 : 0.3, color: simStep >= 2 ? '#ef4444' : 'inherit', fontWeight: 'bold' }}>
            {simStep >= 2 ? <><XCircle size={14}/> Broken (Keys Extracted)</> : '3. Period Finding...'}
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px', borderRadius: '8px' }}>
        <h4 style={{ color: '#10b981', margin: '0 0 12px 0' }}>Kyber (ML-KEM)</h4>
        <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ opacity: simStep >= 0 ? 1 : 0.3 }}>1. Lattice Math (LWE) Evaluated</div>
          <div style={{ opacity: simStep >= 1 ? 1 : 0.3 }}>2. Shor's Algorithm Inapplicable</div>
          <div style={{ opacity: simStep >= 2 ? 1 : 0.3, color: simStep >= 2 ? '#10b981' : 'inherit', fontWeight: 'bold' }}>
            {simStep >= 2 ? <><CheckCircle2 size={14}/> Secure (Resistance Confirmed)</> : '3. Mathematical verification...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export const GroversVisualizer = ({ simStep }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '16px' }}>
      <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '16px', borderRadius: '8px' }}>
        <h4 style={{ color: '#f59e0b', margin: '0 0 12px 0' }}>AES-128</h4>
        <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ opacity: simStep >= 0 ? 1 : 0.3 }}>1. Key Space: 2^128</div>
          <div style={{ opacity: simStep >= 1 ? 1 : 0.3 }}>2. Grover Search Applied</div>
          <div style={{ opacity: simStep >= 2 ? 1 : 0.3, color: simStep >= 2 ? '#f59e0b' : 'inherit', fontWeight: 'bold' }}>
            {simStep >= 2 ? 'Reduced to 2^64 (Vulnerable)' : '3. Amplitude Amplification...'}
          </div>
        </div>
      </div>
      <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px', borderRadius: '8px' }}>
        <h4 style={{ color: '#10b981', margin: '0 0 12px 0' }}>AES-256 (LatticeLink)</h4>
        <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ opacity: simStep >= 0 ? 1 : 0.3 }}>1. Key Space: 2^256</div>
          <div style={{ opacity: simStep >= 1 ? 1 : 0.3 }}>2. Grover Search Applied</div>
          <div style={{ opacity: simStep >= 2 ? 1 : 0.3, color: simStep >= 2 ? '#10b981' : 'inherit', fontWeight: 'bold' }}>
            {simStep >= 2 ? 'Reduced to 2^128 (Still Secure)' : '3. Amplitude Amplification...'}
          </div>
        </div>
      </div>
    </div>
  );
};

export const HarvestVisualizer = ({ simStep }) => {
  return (
    <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
        <div style={{ position: 'absolute', top: '50%', left: '0', right: '0', height: '2px', background: 'rgba(255,255,255,0.1)', zIndex: 1 }}></div>
        
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: simStep >= 0 ? 1 : 0.3 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="white" />
          </div>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>2026</span>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Traffic Captured</span>
        </div>
        
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: simStep >= 1 ? 1 : 0.3 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={20} color="white" />
          </div>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>2035</span>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Stored in DB</span>
        </div>
        
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: simStep >= 2 ? 1 : 0.3 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Cpu size={20} color="white" />
          </div>
          <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>2045</span>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Q-Computer Decrypt Attempt</span>
        </div>
        
        <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: simStep >= 3 ? 1 : 0.3 }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle2 size={20} color="white" />
          </div>
          <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>Still Secure</span>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>Kyber Protection</span>
        </div>
      </div>
    </div>
  );
};
