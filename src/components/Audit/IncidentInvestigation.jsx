import React from 'react';
import { ShieldAlert, AlertTriangle, FileSearch, ShieldCheck } from 'lucide-react';

const IncidentInvestigation = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldAlert size={24} color="#ef4444" /> Digital Forensics & Incident Response
            </h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>Investigate blocked attacks and simulated threats.</p>
          </div>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <AlertTriangle size={16} /> 1 RECENT INCIDENT
          </div>
        </div>

        {/* Incident Viewer */}
        <div style={{ display: 'flex', gap: '24px' }}>
          
          {/* Incident Flow */}
          <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSearch size={18} color="#f59e0b" /> Attack Vector: MITM
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.05)' }}></div>
              
              {[
                { label: 'Attacker: Mallory', status: 'Intercepted Packet', color: '#ef4444' },
                { label: 'Target: Alice', status: 'Modified Ciphertext', color: '#f59e0b' },
                { label: 'Algorithm: ML-DSA', status: 'Signature Invalid', color: '#3b82f6' },
                { label: 'Resolution', status: 'Attack Blocked & Logged', color: '#10b981', icon: ShieldCheck }
              ].map((step, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 2 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${step.color}22`, border: `2px solid ${step.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {step.icon && <step.icon size={12} color={step.color} />}
                  </div>
                  <div>
                    <div style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}>{step.label}</div>
                    <div style={{ color: step.color, fontSize: '13px', fontWeight: 'bold' }}>{step.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Digital Evidence */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>Digital Evidence Store</h3>
            
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Intercepted Packet Hash (SHA3)</div>
              <div style={{ color: '#ef4444', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                a7f8e9d0c1b2a3f4e5d6c7b8a9f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Failed Signature Verification</div>
              <div style={{ color: '#f59e0b', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                SIGNATURE_MISMATCH_ERROR: Expected Dilithium public key verification failed on block 4.
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>Timestamp</div>
              <div style={{ color: 'white', fontSize: '13px', fontFamily: 'monospace', fontWeight: 'bold' }}>
                2026-07-13 09:16:45.102 UTC
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
};

export default IncidentInvestigation;
