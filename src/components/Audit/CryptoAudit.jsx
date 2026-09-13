import React from 'react';
import { Box, Lock, ShieldCheck, Activity } from 'lucide-react';

const CryptoAudit = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Box size={20} color="#8b5cf6"/> Cryptographic Operations Audit
        </h3>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={24} color="#8b5cf6" />
            </div>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>Handshake</span>
            <span style={{ color: '#10b981', fontSize: '11px' }}>ML-KEM-768</span>
          </div>

          <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.1)' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={24} color="#3b82f6" />
            </div>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>Session</span>
            <span style={{ color: '#10b981', fontSize: '11px' }}>AES-256-GCM</span>
          </div>

          <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.1)' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={24} color="#10b981" />
            </div>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>Sign & Verify</span>
            <span style={{ color: '#10b981', fontSize: '11px' }}>ML-DSA-65</span>
          </div>

          <div style={{ flex: 1, height: '2px', background: 'rgba(255,255,255,0.1)' }}></div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.2)', border: '1px solid #f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={24} color="#f59e0b" />
            </div>
            <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>Rotation</span>
            <span style={{ color: '#10b981', fontSize: '11px' }}>Completed</span>
          </div>

        </div>

        <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'ML-KEM Operations', val: '1,204' },
            { label: 'ML-DSA Signatures', val: '5,420' },
            { label: 'AES Sessions', val: '3' },
            { label: 'Key Rotations', val: '15' }
          ].map((stat, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>{stat.label}</div>
              <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold', marginTop: '4px' }}>{stat.val}</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default CryptoAudit;
