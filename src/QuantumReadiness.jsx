import React from 'react';
import { Cpu, Shield, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import MatrixRain from './MatrixRain';
import { QuantumReadinessBar } from './components/AnalyticsCharts';

const QuantumReadiness = () => {
  const classicalAlgos = [
    { name: 'RSA-2048', type: 'Public Key', status: 'Not Ready', vulnerableTo: "Shor's Algorithm" },
    { name: 'ECC (secp256r1)', type: 'Signatures', status: 'Not Ready', vulnerableTo: "Shor's Algorithm" },
    { name: 'Diffie-Hellman', type: 'Key Exchange', status: 'Not Ready', vulnerableTo: "Shor's Algorithm" }
  ];

  const quantumAlgos = [
    { name: 'ML-KEM (Kyber)', type: 'Key Encapsulation', status: 'Ready', resistantTo: "Shor's Algorithm" },
    { name: 'ML-DSA (Dilithium)', type: 'Digital Signatures', status: 'Ready', resistantTo: "Shor's Algorithm" },
    { name: 'AES-256-GCM', type: 'Symmetric Encryption', status: 'Ready', resistantTo: "Grover's Algorithm" },
    { name: 'SHA3-512', type: 'Hash Function', status: 'Ready', resistantTo: "Grover's Algorithm" }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Cpu size={32} color="#8b5cf6" /> Quantum Readiness Dashboard
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Cryptographic migration status for the post-quantum era.</p>
          </div>
        </div>

        {/* Big Readiness Score */}
        <div className="glass-card" style={{ padding: '40px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '32px', textAlign: 'center' }}>
          <h2 style={{ color: 'white', fontSize: '24px', margin: '0 0 24px 0' }}>Overall Post-Quantum Readiness</h2>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <QuantumReadinessBar label="LatticeLink Network Status" value={99} />
          </div>
          <p style={{ color: '#10b981', marginTop: '16px', fontSize: '14px', fontWeight: 'bold' }}>Your infrastructure is fully protected against current and future quantum computing threats.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          
          {/* Classical Legacy */}
          <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="#ef4444"/> Legacy Cryptography (Vulnerable)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {classicalAlgos.map((algo, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(239, 68, 68, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                  <div>
                    <div style={{ color: 'white', fontSize: '15px', fontWeight: 'bold' }}>{algo.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>{algo.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', color: '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>
                      <XCircle size={14} /> {algo.status}
                    </div>
                    <div style={{ color: '#f59e0b', fontSize: '11px', marginTop: '4px' }}>Broken by {algo.vulnerableTo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quantum Secure */}
          <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="#10b981"/> LatticeLink Cryptography (Secure)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {quantumAlgos.map((algo, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.1)' }}>
                  <div>
                    <div style={{ color: 'white', fontSize: '15px', fontWeight: 'bold' }}>{algo.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px' }}>{algo.type}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>
                      <CheckCircle2 size={14} /> {algo.status}
                    </div>
                    <div style={{ color: '#8b5cf6', fontSize: '11px', marginTop: '4px' }}>Resists {algo.resistantTo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default QuantumReadiness;
