import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, ShieldAlert, Lock, Box, Fingerprint, Zap, CheckCircle2,
  XCircle, AlertTriangle, Activity, Map, Cpu, Wifi, Bug,
  Crosshair, Terminal, ArrowDown, Play, RotateCcw, User,
  Eye, Clock, Server
} from 'lucide-react';
import MatrixRain from './MatrixRain';
import { useAuth } from './context/AuthContext';
import { useUser } from './context/UserContext';
import { useSecurity } from './context/SecurityContext';
import PacketInspectorModal from './components/PacketInspectorModal';
import SecurityDashboard from './SecurityDashboard';

/* ─── Shared Tab Bar ─── */
const TabBar = ({ tabs, activeTab, onTabChange }) => (
  <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
    {tabs.map(tab => (
      <div key={tab.id} onClick={() => onTabChange(tab.id)} style={{
        flex: 1, padding: '14px 0', textAlign: 'center', cursor: 'pointer',
        color: activeTab === tab.id ? '#3b82f6' : '#64748b',
        borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
        fontWeight: activeTab === tab.id ? '600' : '400', fontSize: '13px', transition: '0.2s',
      }}>
        {tab.label}
      </div>
    ))}
  </div>
);

/* ════════════════════════════════════════════════
   QUANTUM JOURNEY TAB
   ════════════════════════════════════════════════ */
const QuantumJourneyTab = () => {
  const { currentUser } = useAuth();
  const { getContacts } = useUser();
  const contacts = getContacts(currentUser?.username);
  const receiver = contacts.find(c => !c.isGroup) || { username: 'Bob', nodeId: 'LL-91A8-D3F2' };
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { icon: User, title: `${currentUser?.username} composes message`, color: '#94a3b8', description: 'The sender types a plaintext message. Data exists as readable text within the secure client.', detail: 'Client validates UTF-8 encoding and prepares the message payload with metadata (timestamp, sender Node ID, recipient Node ID).' },
    { icon: Lock, title: 'AES-256-GCM Encryption', color: '#3b82f6', description: 'The plaintext is encrypted using AES-256-GCM, a symmetric authenticated encryption algorithm.', detail: 'A 256-bit session key encrypts the payload. GCM mode provides both confidentiality and integrity through a 128-bit authentication tag. A random 96-bit nonce ensures uniqueness.' },
    { icon: Fingerprint, title: 'SHA-3 Integrity Hash', color: '#6366f1', description: 'A SHA-3 (Keccak) hash is computed over the ciphertext to guarantee tamper detection.', detail: 'SHA-3-256 produces a 256-bit digest. Any modification to the ciphertext in transit will be detected by the recipient through hash mismatch verification.' },
    { icon: Shield, title: 'ML-DSA Digital Signature', color: '#10b981', description: `${currentUser?.username} signs the hash using ML-DSA (Dilithium), a post-quantum signature scheme.`, detail: 'ML-DSA-65 (Security Level 3) creates a lattice-based signature proving sender authenticity. Resistant to both classical and quantum forgery attacks.' },
    { icon: Box, title: 'ML-KEM Key Encapsulation', color: '#8b5cf6', description: `The AES session key is encapsulated using ${receiver.username}'s ML-KEM public key.`, detail: `ML-KEM-1024 (Security Level 5) wraps the symmetric key using ${receiver.username}'s public lattice key. Only the matching private key can decapsulate.` },
    { icon: Zap, title: 'Quantum Tunnel Transmission', color: '#f59e0b', description: 'The encrypted bundle is transmitted over the quantum-secured P2P tunnel.', detail: 'WebRTC DataChannels with DTLS-SRTP provide the transport layer. Entire bundle sent as single atomic unit.' },
    { icon: CheckCircle2, title: `${receiver.username} receives & verifies`, color: '#10b981', description: 'The recipient decapsulates the key, verifies the signature, checks the hash, and decrypts.', detail: 'Reverse pipeline: ML-KEM decapsulation → ML-DSA signature verification → SHA-3 hash check → AES-256-GCM decryption. Any failure rejects the message.' },
  ];

  return (
    <div style={{ padding: '28px', overflowY: 'auto', flex: 1 }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: 'white', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' }}>
          <Map size={24} color="#8b5cf6" /> Quantum Cryptographic Journey
        </h2>
        <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>
          End-to-end pipeline: <span style={{ color: '#3b82f6' }}>{currentUser?.username}</span> ({currentUser?.nodeId}) → <span style={{ color: '#10b981' }}>{receiver.username}</span> ({receiver.nodeId})
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {steps.map((step, idx) => (
          <div key={idx} style={{ display: 'flex', gap: '20px', cursor: 'pointer' }} onClick={() => setActiveStep(idx)}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '44px', flexShrink: 0 }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: activeStep === idx ? `${step.color}22` : 'rgba(255,255,255,0.04)',
                border: `2px solid ${activeStep === idx ? step.color : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: '0.3s', boxShadow: activeStep === idx ? `0 0 20px ${step.color}33` : 'none',
              }}>
                <step.icon size={20} color={activeStep === idx ? step.color : '#475569'} />
              </div>
              {idx < steps.length - 1 && <div style={{ width: '2px', flex: 1, minHeight: '16px', background: idx < activeStep ? step.color : 'rgba(255,255,255,0.08)', transition: '0.3s' }}></div>}
            </div>
            <div className="glass-card" style={{
              flex: 1, padding: '16px 20px', marginBottom: '0',
              borderColor: activeStep === idx ? `${step.color}44` : 'rgba(255,255,255,0.04)',
              background: activeStep === idx ? 'rgba(15,23,42,0.9)' : 'rgba(15,23,42,0.3)',
              transition: '0.3s',
            }}>
              <h3 style={{ color: activeStep === idx ? step.color : '#94a3b8', margin: '0 0 6px', fontSize: '14px' }}>{step.title}</h3>
              <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px', lineHeight: '1.5' }}>{step.description}</p>
              {activeStep === idx && (
                <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: `1px solid ${step.color}22` }}>
                  <div style={{ color: step.color, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={10} /> Technical Detail
                  </div>
                  <p style={{ color: '#cbd5e1', margin: 0, fontSize: '12px', lineHeight: '1.6' }}>{step.detail}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════
   SECURITY LAB TAB — THE SIGNATURE FEATURE
   ════════════════════════════════════════════════ */

/* Single animated pipeline step */
const PipelineStep = ({ label, icon: Icon, color, status, timing }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
    background: status === 'active' ? `${color}15` : status === 'done' ? `${color}08` : 'rgba(0,0,0,0.2)',
    border: `1px solid ${status === 'active' ? `${color}55` : status === 'done' ? `${color}22` : 'rgba(255,255,255,0.04)'}`,
    borderRadius: '10px', transition: 'all 0.4s', minWidth: '220px',
  }}>
    <div style={{
      width: '32px', height: '32px', borderRadius: '8px', background: `${color}22`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon size={16} color={color} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>{label}</div>
      <div style={{ color: status === 'done' ? color : '#475569', fontSize: '11px', fontFamily: 'monospace' }}>
        {status === 'waiting' && '—'}
        {status === 'active' && (
          <span style={{ color: '#f59e0b' }}>Processing...</span>
        )}
        {status === 'done' && `✔ ${timing}`}
        {status === 'failed' && (
          <span style={{ color: '#ef4444' }}>✘ FAILED</span>
        )}
      </div>
    </div>
    {status === 'done' && <CheckCircle2 size={14} color="#10b981" />}
    {status === 'failed' && <XCircle size={14} color="#ef4444" />}
  </div>
);

const SecurityLabTab = () => {
  const { currentUser } = useAuth();
  const { getContacts } = useUser();
  const { logThreat } = useSecurity();
  const contacts = getContacts(currentUser?.username);
  const sender = currentUser || { username: 'Rahul', nodeId: 'LL-8F2A-91D3' };
  const receiver = contacts.find(c => !c.isGroup) || { username: 'Alice', nodeId: 'LL-A1C3-7B4E' };

  const [messageText, setMessageText] = useState('Hello Alice! This is a quantum-secure message.');
  const [isRunning, setIsRunning] = useState(false);
  const [pipelineSteps, setPipelineSteps] = useState([]);
  const [activeAttack, setActiveAttack] = useState(null);
  const [attackResult, setAttackResult] = useState(null);
  const [showPopup, setShowPopup] = useState(false);
  const [simulationHistory, setSimulationHistory] = useState([]);
  const [inspectPacket, setInspectPacket] = useState(null);

  /* Normal message pipeline */
  const normalPipeline = [
    { id: 'aes', label: 'AES-256-GCM', sub: 'Encrypting...', icon: Lock, color: '#3b82f6', timing: '0.42 ms' },
    { id: 'sha3', label: 'SHA3-512', sub: 'Generating Hash...', icon: Fingerprint, color: '#6366f1', timing: '0.08 ms' },
    { id: 'mldsa', label: 'ML-DSA (Dilithium)', sub: 'Signing...', icon: Shield, color: '#10b981', timing: '0.61 ms' },
    { id: 'mlkem', label: 'ML-KEM (Kyber)', sub: 'Encapsulating Key...', icon: Box, color: '#8b5cf6', timing: '0.72 ms' },
    { id: 'tunnel', label: 'Quantum Tunnel', sub: 'Transmitting...', icon: Zap, color: '#f59e0b', timing: '3.14 ms' },
  ];

  const runPipeline = useCallback((onComplete, failAt = null) => {
    setIsRunning(true);
    setPipelineSteps(normalPipeline.map(s => ({ ...s, status: 'waiting' })));

    normalPipeline.forEach((step, idx) => {
      /* Set to active */
      setTimeout(() => {
        setPipelineSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'active' } : s));
      }, idx * 600);

      /* Set to done or failed */
      setTimeout(() => {
        if (failAt === step.id) {
          setPipelineSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'failed' } : s));
        } else {
          setPipelineSteps(prev => prev.map((s, i) => i === idx ? { ...s, status: 'done' } : s));
        }
      }, idx * 600 + 500);
    });

    setTimeout(() => {
      setIsRunning(false);
      if (onComplete) onComplete();
    }, normalPipeline.length * 600 + 600);
  }, []);

  /* Send message (no attack) */
  const handleSend = () => {
    setActiveAttack(null);
    setAttackResult(null);
    setShowPopup(false);
    runPipeline(() => {
      setAttackResult({
        success: true,
        title: 'Message Delivered Securely',
        description: `${receiver.username} received and verified the message.`,
        color: '#10b981',
        packet: {
          id: `PKT-${Math.floor(Math.random() * 100000)}`,
          timestamp: new Date().toLocaleTimeString(),
          sender: sender.username,
          receiver: receiver.username,
          encryptedPayload: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
          sha3Hash: 'c420286381ab2ebc0089bd2925b4fa6164f9f7ba30438b4f2c040d8dbf4e56eb',
          signature: '72b0b6916a4c2847fc5f5901dc6ed045d47cf4a30e8c7a6b2ef87fb490f8',
          kyberCipher: '82b98218182b810459c259837a507ab4858f7004f1418b763de62e917d5985b9',
          algorithmTimings: { aes: 0.42, sha3: 0.08, mldsa: 0.61, mlkem: 0.72 }
        }
      });
      setShowPopup(true);
      setSimulationHistory(prev => [{ time: new Date().toLocaleTimeString(), name: 'Normal Delivery', status: 'Success', color: '#10b981', action: handleSend }, ...prev]);
      logThreat(`Secure message from ${sender.username} to ${receiver.username}`, 'verified', 'info');
    });
  };

  /* Attack definitions */
  const attacks = [
    {
      id: 'mitm', label: 'MITM Attack', icon: Wifi, color: '#ef4444',
      description: 'Attacker intercepts and modifies the packet in transit.',
      run: () => {
        setActiveAttack('mitm');
        setShowPopup(false);
        runPipeline(() => {
          setTimeout(() => {
            setAttackResult({
              success: false,
              title: 'MITM Attack — BLOCKED',
              stages: [
                { text: `${sender.username} sends encrypted packet`, color: '#3b82f6', icon: User },
                { text: 'Attacker intercepts packet', color: '#ef4444', icon: Wifi },
                { text: 'Attacker modifies ciphertext', color: '#ef4444', icon: AlertTriangle },
                { text: `${receiver.username} receives modified packet`, color: '#f59e0b', icon: User },
                { text: 'SHA3-512 hash verification', color: '#6366f1', icon: Fingerprint },
                { text: 'HASH MISMATCH — REJECTED', color: '#ef4444', icon: XCircle },
              ],
              reason: `SHA3 integrity hash mismatch detected. ${receiver.username} rejected the tampered packet. Message discarded.`,
              color: '#ef4444',
              packet: {
                id: `PKT-${Math.floor(Math.random() * 100000)}`,
                timestamp: new Date().toLocaleTimeString(),
                sender: sender.username,
                receiver: receiver.username,
                encryptedPayload: 'MODIFIED_PAYLOAD_3f86d081884c7d65...',
                sha3Hash: 'MISMATCH_c420286381ab2ebc...',
                signature: '72b0b6916a4c2847fc5f5901dc6ed045d47cf4a30e8c7a6b2ef87fb490f8',
                kyberCipher: '82b98218182b810459c259837a507ab4858f7004f1418b763de62e917d5985b9',
                algorithmTimings: { aes: 0.42, sha3: 0.08, mldsa: 0.61, mlkem: 0.72 }
              }
            });
            setShowPopup(true);
            setSimulationHistory(prev => [{ time: new Date().toLocaleTimeString(), name: 'MITM Attack', status: 'Blocked', color: '#ef4444', action: attacks.find(a => a.id === 'mitm').run }, ...prev]);
            logThreat(`MITM Attack blocked between ${sender.username} and ${receiver.username}`, 'blocked', 'critical');
          }, 500);
        });
      },
    },
    {
      id: 'replay', label: 'Replay Attack', icon: Bug, color: '#f59e0b',
      description: 'Captured packet is replayed to the receiver.',
      run: () => {
        setActiveAttack('replay');
        setShowPopup(false);
        runPipeline(() => {
          setTimeout(() => {
            setAttackResult({
              success: false,
              title: 'Replay Attack — BLOCKED',
              stages: [
                { text: 'Attacker captures encrypted packet', color: '#f59e0b', icon: Eye },
                { text: 'Packet stored for later replay', color: '#f59e0b', icon: Clock },
                { text: 'Attacker replays packet to receiver', color: '#ef4444', icon: Bug },
                { text: 'AES-256-GCM nonce check', color: '#3b82f6', icon: Lock },
                { text: 'NONCE ALREADY USED — REJECTED', color: '#ef4444', icon: XCircle },
              ],
              reason: 'AES-256-GCM nonce counter + timestamp validation rejected the replayed packet. Each nonce is unique and single-use.',
              color: '#f59e0b',
              packet: {
                id: `PKT-REPLAYED`,
                timestamp: 'PAST_TIMESTAMP',
                sender: sender.username,
                receiver: receiver.username,
                encryptedPayload: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
                sha3Hash: 'c420286381ab2ebc0089bd2925b4fa6164f9f7ba30438b4f2c040d8dbf4e56eb',
                signature: '72b0b6916a4c2847fc5f5901dc6ed045d47cf4a30e8c7a6b2ef87fb490f8',
                kyberCipher: '82b98218182b810459c259837a507ab4858f7004f1418b763de62e917d5985b9',
                algorithmTimings: { aes: 0.42, sha3: 0.08, mldsa: 0.61, mlkem: 0.72 }
              }
            });
            setShowPopup(true);
            setSimulationHistory(prev => [{ time: new Date().toLocaleTimeString(), name: 'Replay Attack', status: 'Blocked', color: '#f59e0b', action: attacks.find(a => a.id === 'replay').run }, ...prev]);
            logThreat(`Replay Attack rejected from ${receiver.username}`, 'blocked', 'high');
          }, 500);
        });
      },
    },
    {
      id: 'fake', label: 'Fake Sender', icon: User, color: '#8b5cf6',
      description: 'Attacker impersonates the sender.',
      run: () => {
        setActiveAttack('fake');
        setShowPopup(false);
        runPipeline(() => {
          setTimeout(() => {
            setAttackResult({
              success: false,
              title: 'Fake Sender Attack — BLOCKED',
              stages: [
                { text: 'Fake user creates message', color: '#8b5cf6', icon: User },
                { text: 'Signs with wrong private key', color: '#ef4444', icon: Shield },
                { text: `${receiver.username} verifies ML-DSA signature`, color: '#10b981', icon: Shield },
                { text: 'SIGNATURE INVALID — REJECTED', color: '#ef4444', icon: XCircle },
              ],
              reason: `ML-DSA (Dilithium) signature verification failed. ${receiver.username} confirmed the sender is not ${sender.username}. Message blocked.`,
              color: '#8b5cf6',
              packet: {
                id: `PKT-${Math.floor(Math.random() * 100000)}`,
                timestamp: new Date().toLocaleTimeString(),
                sender: 'Attacker (Spoofed)',
                receiver: receiver.username,
                encryptedPayload: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
                sha3Hash: 'c420286381ab2ebc0089bd2925b4fa6164f9f7ba30438b4f2c040d8dbf4e56eb',
                signature: 'INVALID_SIGNATURE_8f7b...',
                kyberCipher: '82b98218182b810459c259837a507ab4858f7004f1418b763de62e917d5985b9',
                algorithmTimings: { aes: 0.42, sha3: 0.08, mldsa: 0.61, mlkem: 0.72 }
              }
            });
            setShowPopup(true);
            setSimulationHistory(prev => [{ time: new Date().toLocaleTimeString(), name: 'Fake Sender', status: 'Blocked', color: '#8b5cf6', action: attacks.find(a => a.id === 'fake').run }, ...prev]);
            logThreat(`Fake Sender Attack blocked on ${receiver.username}`, 'blocked', 'high');
          }, 500);
        });
      },
    },
    {
      id: 'harvest', label: 'Harvest Now', icon: Server, color: '#6366f1',
      description: 'Store now, decrypt later with quantum computer.',
      run: () => {
        setActiveAttack('harvest');
        setShowPopup(false);
        runPipeline(() => {
          setTimeout(() => {
            setAttackResult({
              success: false,
              title: 'Harvest Now, Decrypt Later — PROTECTED',
              stages: [
                { text: 'Attacker stores encrypted packet', color: '#6366f1', icon: Server },
                { text: 'Future: quantum computer available', color: '#f59e0b', icon: Cpu },
                { text: 'Attempts ML-KEM (Kyber) decapsulation', color: '#8b5cf6', icon: Box },
                { text: 'LATTICE PROBLEM — STILL SECURE', color: '#10b981', icon: CheckCircle2 },
              ],
              reason: 'ML-KEM (Kyber) is based on Module-LWE, a hard lattice problem. Even a large-scale quantum computer cannot efficiently solve it. Data remains protected.',
              color: '#10b981',
              packet: {
                id: `PKT-${Math.floor(Math.random() * 100000)}`,
                timestamp: new Date().toLocaleTimeString(),
                sender: sender.username,
                receiver: receiver.username,
                encryptedPayload: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
                sha3Hash: 'c420286381ab2ebc0089bd2925b4fa6164f9f7ba30438b4f2c040d8dbf4e56eb',
                signature: '72b0b6916a4c2847fc5f5901dc6ed045d47cf4a30e8c7a6b2ef87fb490f8',
                kyberCipher: 'SECURE_LATTICE_CIPHERTEXT',
                algorithmTimings: { aes: 0.42, sha3: 0.08, mldsa: 0.61, mlkem: 0.72 }
              }
            });
            setShowPopup(true);
            setSimulationHistory(prev => [{ time: new Date().toLocaleTimeString(), name: 'Harvest Now', status: 'Protected', color: '#10b981', action: attacks.find(a => a.id === 'harvest').run }, ...prev]);
          }, 500);
        });
      },
    },
    {
      id: 'shor', label: "Shor's Algorithm", icon: Zap, color: '#ef4444',
      description: "Shor's algorithm against key exchange.",
      run: () => {
        setActiveAttack('shor');
        setShowPopup(false);
        runPipeline(() => {
          setTimeout(() => {
            setAttackResult({
              success: false,
              title: "Shor's Algorithm — NO EFFECT",
              stages: [
                { text: 'RSA / ECC → Broken by Shor\'s', color: '#ef4444', icon: XCircle },
                { text: 'Shor\'s targets integer factoring & ECDLP', color: '#f59e0b', icon: Zap },
                { text: 'ML-KEM uses lattice math, not RSA/ECC', color: '#8b5cf6', icon: Box },
                { text: 'KYBER UNAFFECTED — PROTECTED', color: '#10b981', icon: CheckCircle2 },
              ],
              reason: "Shor's algorithm efficiently factors integers and solves discrete logarithms, breaking RSA and ECC. ML-KEM (Kyber) uses Module-LWE lattice problems which Shor's cannot solve. LatticeLink is quantum-safe.",
              color: '#10b981',
              packet: {
                id: `PKT-${Math.floor(Math.random() * 100000)}`,
                timestamp: new Date().toLocaleTimeString(),
                sender: sender.username,
                receiver: receiver.username,
                encryptedPayload: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
                sha3Hash: 'c420286381ab2ebc0089bd2925b4fa6164f9f7ba30438b4f2c040d8dbf4e56eb',
                signature: '72b0b6916a4c2847fc5f5901dc6ed045d47cf4a30e8c7a6b2ef87fb490f8',
                kyberCipher: 'SHORS_ALGORITHM_INEFFECTIVE',
                algorithmTimings: { aes: 0.42, sha3: 0.08, mldsa: 0.61, mlkem: 0.72 }
              }
            });
            setShowPopup(true);
            setSimulationHistory(prev => [{ time: new Date().toLocaleTimeString(), name: "Shor's Algorithm", status: 'No Effect', color: '#10b981', action: attacks.find(a => a.id === 'shor').run }, ...prev]);
            logThreat(`Shor's Algorithm simulation ran against ML-KEM`, 'resolved', 'info');
          }, 500);
        });
      },
    },
    {
      id: 'grover', label: "Grover's Algorithm", icon: Crosshair, color: '#3b82f6',
      description: 'Quantum brute-force on AES-256.',
      run: () => {
        setActiveAttack('grover');
        setShowPopup(false);
        runPipeline(() => {
          setTimeout(() => {
            setAttackResult({
              success: false,
              title: "Grover's Algorithm — STILL SECURE",
              stages: [
                { text: "Grover's provides √N speedup on search", color: '#3b82f6', icon: Crosshair },
                { text: 'AES-256: key space = 2^256', color: '#3b82f6', icon: Lock },
                { text: "With Grover's: effective = 2^128", color: '#f59e0b', icon: Zap },
                { text: '2^128 STILL COMPUTATIONALLY INFEASIBLE', color: '#10b981', icon: CheckCircle2 },
              ],
              reason: "Grover's algorithm reduces AES-256's effective security to 128-bit. This is still computationally infeasible — would require ~3.4 × 10^38 operations. AES-256 remains secure against quantum adversaries.",
              color: '#10b981',
              packet: {
                id: `PKT-${Math.floor(Math.random() * 100000)}`,
                timestamp: new Date().toLocaleTimeString(),
                sender: sender.username,
                receiver: receiver.username,
                encryptedPayload: 'STILL_SECURE_128BIT_EFFECTIVE',
                sha3Hash: 'c420286381ab2ebc0089bd2925b4fa6164f9f7ba30438b4f2c040d8dbf4e56eb',
                signature: '72b0b6916a4c2847fc5f5901dc6ed045d47cf4a30e8c7a6b2ef87fb490f8',
                kyberCipher: '82b98218182b810459c259837a507ab4858f7004f1418b763de62e917d5985b9',
                algorithmTimings: { aes: 0.42, sha3: 0.08, mldsa: 0.61, mlkem: 0.72 }
              }
            });
            setShowPopup(true);
            setSimulationHistory(prev => [{ time: new Date().toLocaleTimeString(), name: "Grover's Algorithm", status: 'Still Secure', color: '#10b981', action: attacks.find(a => a.id === 'grover').run }, ...prev]);
            logThreat(`Grover's Algorithm simulation ran against AES-256`, 'resolved', 'info');
          }, 500);
        });
      },
    },
  ];

  return (
    <div style={{ padding: '28px', overflowY: 'auto', flex: 1, position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ color: 'white', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' }}>
            <ShieldAlert size={24} color="#ef4444" /> Security Research Lab
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '13px' }}>
            Interactive attack simulation engine — test LatticeLink's defenses in real-time.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '12px', background: 'rgba(16,185,129,0.1)', padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Shield size={14} /> All Systems Secure
        </div>
      </div>

      {/* Two Users Display */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        {/* Sender */}
        <div className="glass-card" style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(59,130,246,0.2)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: '700', fontSize: '18px' }}>
            {sender.username.charAt(0)}
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>👤 {sender.username}</div>
            <div style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: '11px' }}>{sender.nodeId}</div>
            <div style={{ color: '#10b981', fontSize: '10px', marginTop: '2px' }}>🟢 Online • Sender</div>
          </div>
        </div>

        <ArrowDown size={28} color="#3b82f6" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }} />

        {/* Receiver */}
        <div className="glass-card" style={{ flex: 1, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #3b82f6)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: '700', fontSize: '18px' }}>
            {receiver.username.charAt(0)}
          </div>
          <div>
            <div style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>👤 {receiver.username}</div>
            <div style={{ color: '#10b981', fontFamily: 'monospace', fontSize: '11px' }}>{receiver.nodeId}</div>
            <div style={{ color: '#10b981', fontSize: '10px', marginTop: '2px' }}>🟢 Online • Receiver</div>
          </div>
        </div>
      </div>

      {/* Message Input + Send */}
      <div className="glass-card" style={{ padding: '16px 20px', marginBottom: '24px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Message Payload</div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <input
            type="text" value={messageText} onChange={(e) => setMessageText(e.target.value)}
            style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px', borderRadius: '10px', color: 'white', outline: 'none', fontSize: '14px', fontFamily: 'monospace' }}
          />
          <button onClick={handleSend} disabled={isRunning} style={{
            background: isRunning ? '#475569' : '#10b981', border: 'none', color: 'white',
            padding: '10px 20px', borderRadius: '10px', cursor: isRunning ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600',
            boxShadow: isRunning ? 'none' : '0 0 15px rgba(16,185,129,0.3)',
          }}>
            <Play size={14} /> SEND
          </button>
        </div>
      </div>

      {/* Pipeline Visualization */}
      {pipelineSteps.length > 0 && (
        <div className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(15,23,42,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Terminal size={12} /> Cryptographic Pipeline
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pipelineSteps.map((step, i) => (
              <PipelineStep key={step.id} label={step.label} icon={step.icon} color={step.color} status={step.status} timing={step.timing} />
            ))}
          </div>
        </div>
      )}

      {/* Attack Buttons */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <ShieldAlert size={12} /> Attack Simulations
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {attacks.map(attack => (
            <button
              key={attack.id}
              onClick={attack.run}
              disabled={isRunning}
              style={{
                background: activeAttack === attack.id ? `${attack.color}22` : 'rgba(15,23,42,0.7)',
                border: `1px solid ${activeAttack === attack.id ? `${attack.color}55` : 'rgba(255,255,255,0.06)'}`,
                borderRadius: '12px', padding: '14px 16px', cursor: isRunning ? 'not-allowed' : 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
                transition: '0.2s', color: 'white', textAlign: 'center',
                opacity: isRunning ? 0.5 : 1,
              }}
            >
              <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: `${attack.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <attack.icon size={18} color={attack.color} />
              </div>
              <div style={{ fontWeight: '600', fontSize: '12px' }}>{attack.label}</div>
              <div style={{ color: '#64748b', fontSize: '10px', lineHeight: '1.4' }}>{attack.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Attack Result Popup */}
      {showPopup && attackResult && (
        <div className="glass-card" style={{
          padding: '24px', background: 'rgba(15,23,42,0.95)',
          border: `1px solid ${attackResult.color}44`,
          boxShadow: `0 0 40px ${attackResult.color}15`,
          animation: 'fadeIn 0.4s',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ color: attackResult.color, margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {attackResult.success ? <CheckCircle2 size={18} /> : <ShieldAlert size={18} />}
              {attackResult.title}
            </h3>
            <button onClick={() => setShowPopup(false)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '18px' }}>✕</button>
          </div>

          {/* Attack Stages Animation */}
          {attackResult.stages && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' }}>
              {attackResult.stages.map((stage, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px',
                  background: `${stage.color}08`, borderRadius: '8px',
                  border: `1px solid ${stage.color}22`,
                  animation: `fadeIn 0.3s ${i * 0.15}s both`,
                }}>
                  <stage.icon size={14} color={stage.color} />
                  <span style={{ color: stage.color === '#ef4444' ? '#fca5a5' : '#e2e8f0', fontSize: '12px', fontWeight: stage.color === '#ef4444' ? '600' : '400' }}>{stage.text}</span>
                </div>
              ))}
            </div>
          )}

          {/* Reason */}
          <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: '8px', border: `1px solid ${attackResult.color}22`, marginBottom: '16px' }}>
            <div style={{ color: attackResult.color, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Analysis</div>
            <p style={{ color: '#cbd5e1', margin: 0, fontSize: '12px', lineHeight: '1.6' }}>
              {attackResult.reason || attackResult.description}
            </p>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button onClick={() => setInspectPacket(attackResult.packet)} style={{
              background: `${attackResult.color}22`, border: `1px solid ${attackResult.color}55`, color: attackResult.color,
              padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <Fingerprint size={14} /> Inspect Packet
            </button>
          </div>
        </div>
      )}

      <PacketInspectorModal packet={inspectPacket} onClose={() => setInspectPacket(null)} />

      {/* Simulation History */}
      {simulationHistory.length > 0 && (
        <div className="glass-card" style={{ padding: '20px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', marginTop: '24px' }}>
          <div style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={12} /> Simulation History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {simulationHistory.map((hist, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', borderLeft: `3px solid ${hist.color}` }}>
                <div>
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>{hist.name}</div>
                  <div style={{ color: '#64748b', fontSize: '11px', marginTop: '2px' }}>{hist.time} • <span style={{ color: hist.color }}>{hist.status}</span></div>
                </div>
                <button onClick={hist.action} disabled={isRunning} style={{
                  background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px',
                  cursor: isRunning ? 'not-allowed' : 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px',
                  transition: '0.2s', opacity: isRunning ? 0.5 : 1
                }}>
                  <RotateCcw size={12} /> Replay
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════════════════════════
   LSOC TAB (Admin Only)
   ════════════════════════════════════════════════ */
const LSOCTab = () => {
  return (
    <div style={{ flex: 1, overflowY: 'auto' }}>
      <SecurityDashboard />
    </div>
  );
};

/* ════════════════════════════════════════════════
   MAIN SECURITY PAGE
   ════════════════════════════════════════════════ */
const SecurityPage = () => {
  const [activeTab, setActiveTab] = useState('lab');

  const tabs = [
    { id: 'journey', label: '🗺 Quantum Journey' },
    { id: 'lab', label: '🛡 Security Lab' },
    { id: 'lsoc', label: '📡 LSOC' },
  ];

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'journey' && <QuantumJourneyTab />}
        {activeTab === 'lab' && <SecurityLabTab />}
        {activeTab === 'lsoc' && <LSOCTab />}
      </div>
    </div>
  );
};

export default SecurityPage;
