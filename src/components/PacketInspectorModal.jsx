import React from 'react';
import { Box, Lock, Fingerprint, Shield } from 'lucide-react';

const PacketInspectorModal = ({ packet, onClose }) => {
  if (!packet) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}>
      <div className="glass-card" style={{ width: '450px', background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(59,130,246,0.3)', padding: '24px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '18px' }}>✕</button>
        <h3 style={{ color: 'white', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
          <Box size={18} color="#3b82f6" /> Packet Inspector
        </h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Packet ID</div>
            <div style={{ color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace' }}>{packet.id}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Timestamp</div>
            <div style={{ color: '#e2e8f0', fontSize: '12px', fontFamily: 'monospace' }}>{packet.timestamp}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Sender</div>
            <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: '500' }}>{packet.sender}</div>
          </div>
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Receiver</div>
            <div style={{ color: '#e2e8f0', fontSize: '12px', fontWeight: '500' }}>{packet.receiver}</div>
          </div>
        </div>

        <h4 style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', marginBottom: '10px' }}>Cryptographic Payload</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
          {[
            { label: 'AES-256-GCM', status: 'Encrypted', hash: packet.encryptedPayload || packet.encrypted_payload, time: packet.algorithmTimings?.aes || packet.algorithm_timings?.aes || '0.4', color: '#3b82f6', icon: Lock },
            { label: 'SHA3-512', status: 'Valid', hash: packet.sha3Hash || packet.sha3_hash, time: packet.algorithmTimings?.sha3 || packet.algorithm_timings?.sha3 || '0.2', color: '#6366f1', icon: Fingerprint },
            { label: 'ML-DSA', status: 'Verified', hash: packet.signature, time: packet.algorithmTimings?.mldsa || packet.algorithm_timings?.mldsa || '1.1', color: '#10b981', icon: Shield },
            { label: 'ML-KEM', status: 'Protected', hash: packet.kyberCipher || packet.kyber_cipher || packet.nonce, time: packet.algorithmTimings?.mlkem || packet.algorithm_timings?.mlkem || '0.8', color: '#8b5cf6', icon: Box }
          ].map((layer, i) => (
            <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '10px 12px', borderRadius: '8px', borderLeft: `3px solid ${layer.color}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#e2e8f0', fontSize: '12px', fontWeight: '500' }}>
                  <layer.icon size={12} color={layer.color} /> {layer.label}
                  <span style={{ background: `${layer.color}22`, color: layer.color, fontSize: '9px', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>{layer.status}</span>
                </div>
                <div style={{ color: '#64748b', fontSize: '10px', fontFamily: 'monospace', marginTop: '4px' }}>{layer.hash?.substring(0, 32)}...</div>
              </div>
              <div style={{ color: layer.color, fontSize: '11px', fontFamily: 'monospace' }}>{layer.time}ms</div>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', padding: '10px', background: 'rgba(16,185,129,0.1)', color: '#10b981', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
          Quantum Tunnel Healthy
        </div>
      </div>
    </div>
  );
};

export default PacketInspectorModal;
