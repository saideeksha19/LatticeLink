import React from 'react';
import { BookOpen, ShieldCheck, Box, Code } from 'lucide-react';
import MatrixRain from './MatrixRain';

const DocumentationHub = () => {
  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BookOpen size={32} color="#10b981" /> Documentation Hub
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '16px' }}>Technical architecture, cryptographic workflows, and platform guidance.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '32px' }}>
          
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['System Overview', 'Cryptographic Workflow', 'Attack Simulation Guide', 'User Guide', 'Administrator Guide'].map((item, i) => (
              <button key={i} style={{ background: i === 0 ? 'rgba(16, 185, 129, 0.15)' : 'transparent', border: i === 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid transparent', color: i === 0 ? '#10b981' : '#94a3b8', padding: '12px 16px', borderRadius: '8px', textAlign: 'left', cursor: 'pointer', fontWeight: i === 0 ? 'bold' : 'normal', transition: '0.2s' }}>
                {item}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="glass-card" style={{ padding: '40px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <h2 style={{ color: 'white', margin: 0, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>LatticeLink System Overview</h2>
            
            <p style={{ color: '#e2e8f0', lineHeight: '1.8' }}>
              LatticeLink is a comprehensive Post-Quantum Security Operations Center (PQ-SOC) and secure messaging platform. Designed to withstand attacks from cryptographically relevant quantum computers (CRQCs) running Shor's algorithm, the system implements NIST's standardized post-quantum algorithms.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.2)' }}>
                <h3 style={{ color: '#8b5cf6', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><Box size={18}/> ML-KEM (Kyber)</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>Used for Key Encapsulation. Generates the shared secret required to establish the AES-256-GCM symmetric session. Resistant to "Harvest Now, Decrypt Later" attacks.</p>
              </div>
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <h3 style={{ color: '#10b981', margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}><ShieldCheck size={18}/> ML-DSA (Dilithium)</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0, lineHeight: '1.6' }}>Used for Digital Signatures. Guarantees the authenticity and integrity of messages and payloads across the network.</p>
              </div>
            </div>

            <h3 style={{ color: 'white', marginTop: '24px' }}>Platform Capabilities</h3>
            <ul style={{ color: '#e2e8f0', lineHeight: '2', paddingLeft: '20px', margin: 0 }}>
              <li><strong>Interactive Security Lab:</strong> Simulate Man-in-the-Middle and Replay attacks in real-time.</li>
              <li><strong>Cross-Platform Synchronization:</strong> Securely mirror state across Desktop, Mobile, and Web nodes.</li>
              <li><strong>Cryptographic Key Management:</strong> Deep visibility into rotation lifecycles and key fingerprints.</li>
              <li><strong>Digital Forensics:</strong> Comprehensive event timelines, audit logs, and compliance exports.</li>
            </ul>

          </div>
        </div>

      </div>
    </div>
  );
};

export default DocumentationHub;
