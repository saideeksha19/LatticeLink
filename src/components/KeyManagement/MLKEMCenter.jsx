import React, { useState } from 'react';
import { Box, Key, RotateCcw, Download, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MLKEMCenter = () => {
  const { currentUser } = useAuth();
  const [rotating, setRotating] = useState(false);
  const [rotationStep, setRotationStep] = useState(0);
  const [activeVersion, setActiveVersion] = useState(1);
  const [lastRotated, setLastRotated] = useState('Today');
  const [keyFingerprint, setKeyFingerprint] = useState('');

  const handleRotate = async () => {
    if (!currentUser?.session_token) return;
    setRotating(true);
    setRotationStep(1); // Generating New Key

    try {
      setRotationStep(2); // Updating Session via API
      const res = await fetch('/api/chat/keys/rotate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.session_token}`
        }
      });
      
      setRotationStep(3); // Notifying Devices
      if (res.ok) {
        const data = await res.json();
        setActiveVersion(data.key?.key_version || (activeVersion + 1));
        setLastRotated('Just now');
        setKeyFingerprint(data.key?.fingerprint || '');
      }
      setRotationStep(4); // Complete
    } catch (err) {
      console.error("Key rotation failed", err);
    } finally {
      setTimeout(() => {
        setRotating(false);
        setRotationStep(0);
      }, 1500);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Key Info Card */}
      <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h2 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Box size={24} color="#8b5cf6" /> ML-KEM-768 (Kyber)
            </h2>
            <p style={{ color: '#94a3b8', margin: 0 }}>Quantum-resistant Key Encapsulation Mechanism (FIPS 203 Standard)</p>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <ShieldCheck size={16} /> ACTIVE v{activeVersion}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Key Length</div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>768-bit</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Active Version</div>
            <div style={{ color: '#38bdf8', fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>Version {activeVersion}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Last Rotated</div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>{lastRotated}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase' }}>Security Level</div>
            <div style={{ color: '#8b5cf6', fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>NIST Level 3</div>
          </div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '8px' }}>SHA3 Key Fingerprint & Identity</div>
          <div style={{ color: '#e2e8f0', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all', lineHeight: '1.5' }}>
            {keyFingerprint || currentUser?.mlKemPubKey || `SHA3-256:${currentUser?.nodeId || 'LL-NODE-ACTIVE'}-v${activeVersion}`}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleRotate} 
            disabled={rotating}
            style={{ flex: 1, background: 'rgba(139, 92, 246, 0.2)', border: '1px solid #8b5cf6', color: 'white', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: rotating ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}
          >
            <RotateCcw size={18} style={{ animation: rotating ? 'spin 1s linear infinite' : 'none' }} /> 
            {rotating ? 'Rotating Keypair via Backend...' : 'Rotate Keys to Next Version'}
          </button>
        </div>

        {/* Rotation Timeline */}
        {rotating && (
          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {['Generate New Key', 'Update Backend Session', 'Notify Devices', 'Complete'].map((step, idx) => {
              const active = rotationStep > idx;
              const current = rotationStep === idx + 1;
              return (
                <React.Fragment key={idx}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', opacity: active || current ? 1 : 0.3 }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: active ? '#10b981' : (current ? '#3b82f6' : 'rgba(255,255,255,0.1)'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {active ? <ShieldCheck size={14} color="white" /> : <Key size={12} color="white" />}
                    </div>
                    <span style={{ color: active || current ? 'white' : '#94a3b8', fontSize: '11px' }}>{step}</span>
                  </div>
                  {idx < 3 && <div style={{ height: '2px', flex: 1, background: active ? '#10b981' : 'rgba(255,255,255,0.1)', margin: '0 16px', alignSelf: 'flex-start', marginTop: '11px' }}></div>}
                </React.Fragment>
              );
            })}
          </div>
        )}
      </div>

      {/* Visualizer */}
      <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '16px' }}>Key Encapsulation Flow (ML-KEM-768)</h3>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(59, 130, 246, 0.2)', border: '1px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)' }}>
              <Key size={32} color="#3b82f6" />
            </div>
            <span style={{ color: 'white', fontWeight: 'bold' }}>{currentUser?.username || 'Local Node'} (Initiator)</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1, padding: '0 20px' }}>
            <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: 1, height: '2px', background: '#8b5cf6' }}></div>
              <Box size={20} color="#8b5cf6" />
              <div style={{ flex: 1, height: '2px', background: '#8b5cf6' }}></div>
            </div>
            <span style={{ color: '#8b5cf6', fontSize: '12px', fontWeight: 'bold' }}>ML-KEM Handshake</span>
            <span style={{ color: '#94a3b8', fontSize: '11px' }}>FIPS 203 Ciphertext</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}>
              <Lock size={32} color="#10b981" />
            </div>
            <span style={{ color: 'white', fontWeight: 'bold' }}>AES-256 Session Established</span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default MLKEMCenter;
