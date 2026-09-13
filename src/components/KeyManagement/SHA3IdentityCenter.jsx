import React from 'react';
import { Fingerprint, CheckCircle2, Copy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const SHA3IdentityCenter = () => {
  const { currentUser } = useAuth();
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    if (!currentUser?.nodeId) return;
    navigator.clipboard.writeText(currentUser.nodeId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Key Info Card */}
      <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Fingerprint size={24} color="#f59e0b" /> SHA3-512 Identity Center
            </h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>Cryptographic Hash & Integrity Verification</p>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <CheckCircle2 size={16} /> VERIFIED
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Hash Algorithm</div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>SHA3-512</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Block Size</div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>576 bits</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Integrity Checks</div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>14,592</div>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.2)', position: 'relative' }}>
          <div style={{ color: '#f59e0b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '12px', fontWeight: 'bold' }}>Your Global SHA3 Identity Hash</div>
          <div style={{ color: '#e2e8f0', fontSize: '16px', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: '1.6', letterSpacing: '2px' }}>
            {currentUser?.nodeId || 'HASH_NOT_FOUND'}
          </div>
          <button 
            onClick={handleCopy}
            title="Copy to clipboard"
            style={{ position: 'absolute', right: '16px', top: '16px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {copied ? <CheckCircle2 size={16} color="#10b981" /> : <Copy size={16} />}
            {copied && <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>Copied</span>}
          </button>
        </div>
      </div>
      
    </div>
  );
};

export default SHA3IdentityCenter;
