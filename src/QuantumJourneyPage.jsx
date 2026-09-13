import React, { useState } from 'react';
import { Map, Shield, Lock, Box, Fingerprint, Zap, ArrowRight, CheckCircle2, Activity } from 'lucide-react';
import MatrixRain from './MatrixRain';

const QuantumJourneyPage = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      icon: Lock,
      title: "1. Plaintext Input",
      color: "#94a3b8",
      description: "The sender composes a message. At this stage, data exists as readable plaintext within the secure client environment.",
      detail: "The client validates input encoding (UTF-8) and prepares the message payload with metadata (timestamp, sender ID, recipient ID)."
    },
    {
      icon: Lock,
      title: "2. AES-256-GCM Encryption",
      color: "#3b82f6",
      description: "The plaintext is encrypted using AES-256-GCM, a symmetric authenticated encryption algorithm.",
      detail: "A 256-bit session key encrypts the payload. GCM mode provides both confidentiality and integrity through a 128-bit authentication tag. A random 96-bit nonce ensures uniqueness."
    },
    {
      icon: Fingerprint,
      title: "3. SHA-3 Integrity Hash",
      color: "#6366f1",
      description: "A SHA-3 (Keccak) hash is computed over the ciphertext to guarantee tamper detection.",
      detail: "SHA-3-256 produces a 256-bit digest. Any modification to the ciphertext in transit will be detected by the recipient through hash mismatch verification."
    },
    {
      icon: Shield,
      title: "4. ML-DSA Digital Signature",
      color: "#10b981",
      description: "The sender signs the hash using ML-DSA (Dilithium), a post-quantum digital signature scheme.",
      detail: "ML-DSA-65 (Security Level 3) creates a lattice-based signature proving sender authenticity. This is resistant to both classical and quantum forgery attacks."
    },
    {
      icon: Box,
      title: "5. ML-KEM Key Encapsulation",
      color: "#8b5cf6",
      description: "The AES session key is encapsulated using ML-KEM (Kyber), a post-quantum key exchange mechanism.",
      detail: "ML-KEM-1024 (Security Level 5) wraps the symmetric key using the recipient's public lattice key. Only the holder of the matching private key can decapsulate and recover the session key."
    },
    {
      icon: Zap,
      title: "6. Quantum Tunnel Transmission",
      color: "#f59e0b",
      description: "The encrypted bundle (ciphertext + hash + signature + encapsulated key) is transmitted over the quantum-secured P2P tunnel.",
      detail: "WebRTC DataChannels with DTLS-SRTP provide the transport layer. The entire bundle is sent as a single atomic unit to prevent partial interception."
    },
    {
      icon: CheckCircle2,
      title: "7. Recipient Verification & Decryption",
      color: "#10b981",
      description: "The recipient decapsulates the key, verifies the signature, checks the hash, and decrypts the message.",
      detail: "The reverse pipeline executes: ML-KEM decapsulation → ML-DSA signature verification → SHA-3 hash check → AES-256-GCM decryption. If any step fails, the message is rejected."
    }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Map size={32} color="#8b5cf6" /> Quantum Cryptographic Journey
          </h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Interactive visualization of the end-to-end secure communication pipeline.</p>
        </div>

        {/* Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', flex: 1 }}>
          {steps.map((step, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '24px', cursor: 'pointer' }} onClick={() => setActiveStep(idx)}>
              
              {/* Timeline Connector */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '48px', flexShrink: 0 }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '50%',
                  background: activeStep === idx ? `${step.color}22` : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${activeStep === idx ? step.color : 'rgba(255,255,255,0.1)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: '0.3s', boxShadow: activeStep === idx ? `0 0 20px ${step.color}44` : 'none'
                }}>
                  <step.icon size={22} color={activeStep === idx ? step.color : '#64748b'} />
                </div>
                {idx < steps.length - 1 && (
                  <div style={{ width: '2px', flex: 1, minHeight: '24px', background: idx < activeStep ? step.color : 'rgba(255,255,255,0.1)', transition: '0.3s' }}></div>
                )}
              </div>

              {/* Step Content */}
              <div className="glass-card" style={{
                flex: 1, padding: '20px 24px', marginBottom: idx < steps.length - 1 ? '0' : '0',
                borderColor: activeStep === idx ? `${step.color}55` : 'rgba(255,255,255,0.05)',
                transition: '0.3s',
                background: activeStep === idx ? 'rgba(15, 23, 42, 0.9)' : 'rgba(15, 23, 42, 0.4)'
              }}>
                <h3 style={{ color: activeStep === idx ? step.color : '#94a3b8', margin: '0 0 8px 0', fontSize: '16px', transition: '0.3s' }}>{step.title}</h3>
                <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px', lineHeight: '1.6' }}>{step.description}</p>
                
                {activeStep === idx && (
                  <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: `1px solid ${step.color}33` }}>
                    <div style={{ color: step.color, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Activity size={12} /> Technical Detail
                    </div>
                    <p style={{ color: '#cbd5e1', margin: 0, fontSize: '13px', lineHeight: '1.7' }}>{step.detail}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default QuantumJourneyPage;
