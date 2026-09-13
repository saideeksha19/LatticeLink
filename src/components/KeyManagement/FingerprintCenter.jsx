import React from 'react';
import { Smartphone, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const FingerprintCenter = () => {
  const { currentUser } = useAuth();
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Smartphone size={24} color="#38bdf8" /> Trust Verification (Safety Numbers)
            </h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>Compare cryptographic fingerprints with contacts to prevent MITM attacks.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '24px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 12px auto' }}>{(currentUser?.username || 'U')[0].toUpperCase()}</div>
            <h3 style={{ color: 'white', margin: '0 0 4px 0' }}>{currentUser?.username || 'You'} (You)</h3>
            <div style={{ color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><CheckCircle2 size={12}/> Verified</div>
            
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', color: 'white', fontFamily: 'monospace', fontSize: '18px' }}>
              <span>05832</span><span>99102</span><span>34812</span><span>00591</span>
              <span>88210</span><span>44921</span><span>76219</span><span>10385</span>
              <span>22910</span><span>94218</span><span>55102</span><span>78129</span>
            </div>
          </div>

          <div style={{ width: '2px', height: '200px', background: 'rgba(255,255,255,0.1)' }}></div>

          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px dashed rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '24px', fontWeight: 'bold', margin: '0 auto 12px auto' }}>B</div>
            <h3 style={{ color: 'white', margin: '0 0 4px 0' }}>Bob</h3>
            <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}><ShieldAlert size={12}/> Pending Verification</div>
            
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', color: '#94a3b8', fontFamily: 'monospace', fontSize: '18px' }}>
              <span>05832</span><span>99102</span><span>34812</span><span>00591</span>
              <span>88210</span><span>44921</span><span>76219</span><span>10385</span>
              <span>22910</span><span>94218</span><span>55102</span><span>78129</span>
            </div>
          </div>

        </div>

        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button style={{ background: '#10b981', color: '#020617', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={18}/> Mark as Verified
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default FingerprintCenter;
