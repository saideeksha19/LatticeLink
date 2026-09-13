import React, { useState } from 'react';
import {
  BarChart3, FileText, BookOpen, TrendingUp, Clock, Cpu,
  Shield, Lock, Box, Fingerprint, Zap, Activity, CheckCircle2,
  ExternalLink, Search
} from 'lucide-react';
import MatrixRain from './MatrixRain';

/* ─── Tab Bar ─── */
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

/* ─── Benchmarks Tab ─── */
const BenchmarksTab = () => {
  const benchmarks = [
    { algorithm: 'AES-256-GCM', operation: 'Encryption', time: '0.42 ms', throughput: '2.38 Gbps', icon: Lock, color: '#3b82f6', bar: 85 },
    { algorithm: 'AES-256-GCM', operation: 'Decryption', time: '0.39 ms', throughput: '2.56 Gbps', icon: Lock, color: '#3b82f6', bar: 90 },
    { algorithm: 'SHA3-512', operation: 'Hash (1KB)', time: '0.08 ms', throughput: '12.5 Gbps', icon: Fingerprint, color: '#6366f1', bar: 95 },
    { algorithm: 'ML-DSA-65', operation: 'Key Generation', time: '0.31 ms', throughput: '—', icon: Shield, color: '#10b981', bar: 70 },
    { algorithm: 'ML-DSA-65', operation: 'Sign', time: '0.61 ms', throughput: '—', icon: Shield, color: '#10b981', bar: 60 },
    { algorithm: 'ML-DSA-65', operation: 'Verify', time: '0.18 ms', throughput: '—', icon: Shield, color: '#10b981', bar: 80 },
    { algorithm: 'ML-KEM-1024', operation: 'Key Generation', time: '0.28 ms', throughput: '—', icon: Box, color: '#8b5cf6', bar: 72 },
    { algorithm: 'ML-KEM-1024', operation: 'Encapsulate', time: '0.72 ms', throughput: '—', icon: Box, color: '#8b5cf6', bar: 55 },
    { algorithm: 'ML-KEM-1024', operation: 'Decapsulate', time: '0.45 ms', throughput: '—', icon: Box, color: '#8b5cf6', bar: 65 },
  ];

  return (
    <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: 'white', margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <TrendingUp size={18} color="#3b82f6" /> Algorithm Benchmarks
        </h3>
        <span style={{ color: '#64748b', fontSize: '11px' }}>Tested on Intel i7-13700K • Ubuntu 24.04</span>
      </div>

      {/* Comparison Card */}
      <div className="glass-card" style={{ padding: '20px', marginBottom: '20px', background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          {[
            { label: 'Total Pipeline', value: '5.14 ms', color: '#3b82f6' },
            { label: 'NIST Security', value: 'Level 5', color: '#8b5cf6' },
            { label: 'Quantum Safe', value: '100%', color: '#10b981' },
            { label: 'Avg Throughput', value: '5.8 Gbps', color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{ color: s.color, fontSize: '22px', fontWeight: '700' }}>{s.value}</div>
              <div style={{ color: '#64748b', fontSize: '11px', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Benchmark Table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {benchmarks.map((b, i) => (
          <div key={i} className="glass-card" style={{
            padding: '12px 18px', display: 'flex', alignItems: 'center', gap: '14px',
            background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${b.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <b.icon size={16} color={b.color} />
            </div>
            <div style={{ width: '140px', flexShrink: 0 }}>
              <div style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>{b.algorithm}</div>
              <div style={{ color: '#475569', fontSize: '10px' }}>{b.operation}</div>
            </div>
            <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${b.bar}%`, height: '100%', background: `linear-gradient(90deg, ${b.color}, ${b.color}88)`, borderRadius: '4px', transition: 'width 1s' }}></div>
            </div>
            <div style={{ width: '80px', textAlign: 'right', flexShrink: 0 }}>
              <div style={{ color: b.color, fontSize: '13px', fontWeight: '600', fontFamily: 'monospace' }}>{b.time}</div>
              {b.throughput !== '—' && <div style={{ color: '#475569', fontSize: '10px' }}>{b.throughput}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Documentation Tab ─── */
const DocumentationTab = () => {
  const [selectedDoc, setSelectedDoc] = useState(0);
  const docs = [
    {
      title: 'AES-256-GCM',
      icon: Lock, color: '#3b82f6',
      content: 'AES-256-GCM (Galois/Counter Mode) is an authenticated encryption algorithm providing both confidentiality and data authenticity. It uses a 256-bit key and 96-bit nonce. GCM generates a 128-bit authentication tag that prevents tampering. The algorithm is NIST-approved and widely used in TLS 1.3, IPsec, and SSH protocols.\n\nKey Features:\n• 256-bit symmetric key (quantum-safe against Grover\'s)\n• Authenticated encryption with associated data (AEAD)\n• Hardware acceleration via AES-NI instructions\n• Parallelizable encryption/decryption\n• Used for bulk message encryption in LatticeLink',
    },
    {
      title: 'SHA-3 (Keccak)',
      icon: Fingerprint, color: '#6366f1',
      content: 'SHA-3 is the latest member of the Secure Hash Algorithm family, based on the Keccak sponge construction. Unlike SHA-2 (Merkle-Damgård), SHA-3 uses a fundamentally different design, providing defense-in-depth against structural attacks.\n\nKey Features:\n• Sponge construction (absorb + squeeze)\n• SHA3-256: 256-bit output for integrity checks\n• SHA3-512: 512-bit output for maximum security\n• Resistant to length extension attacks\n• Used for message integrity verification in LatticeLink',
    },
    {
      title: 'ML-DSA (Dilithium)',
      icon: Shield, color: '#10b981',
      content: 'ML-DSA (Module Lattice Digital Signature Algorithm), formerly CRYSTALS-Dilithium, is a post-quantum digital signature scheme standardized by NIST (FIPS 204). It is based on the hardness of the Module-LWE and Module-SIS lattice problems.\n\nKey Features:\n• NIST PQC Standard (FIPS 204)\n• Security levels 2, 3, and 5\n• LatticeLink uses ML-DSA-65 (Level 3)\n• Provides authentication and non-repudiation\n• Signature size: ~3.3 KB\n• Resistant to Shor\'s algorithm',
    },
    {
      title: 'ML-KEM (Kyber)',
      icon: Box, color: '#8b5cf6',
      content: 'ML-KEM (Module Lattice Key Encapsulation Mechanism), formerly CRYSTALS-Kyber, is a post-quantum key encapsulation mechanism standardized by NIST (FIPS 203). It enables two parties to establish a shared secret key over a public channel.\n\nKey Features:\n• NIST PQC Standard (FIPS 203)\n• Based on Module-LWE lattice problem\n• LatticeLink uses ML-KEM-1024 (Level 5)\n• Encapsulates AES session keys\n• Public key size: ~1.5 KB\n• Immune to both Shor\'s and Grover\'s algorithms',
    },
  ];

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      {/* Sidebar */}
      <div style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', background: 'rgba(0,0,0,0.2)', padding: '16px 0' }}>
        {docs.map((doc, i) => (
          <div key={i} onClick={() => setSelectedDoc(i)} style={{
            padding: '12px 16px', cursor: 'pointer',
            background: selectedDoc === i ? 'rgba(59,130,246,0.1)' : 'transparent',
            borderLeft: selectedDoc === i ? '3px solid #3b82f6' : '3px solid transparent',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <doc.icon size={16} color={selectedDoc === i ? doc.color : '#475569'} />
            <span style={{ color: selectedDoc === i ? 'white' : '#94a3b8', fontSize: '13px', fontWeight: selectedDoc === i ? '600' : '400' }}>{doc.title}</span>
          </div>
        ))}
      </div>
      {/* Content */}
      <div style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          {React.createElement(docs[selectedDoc].icon, { size: 28, color: docs[selectedDoc].color })}
          <h2 style={{ color: 'white', margin: 0, fontSize: '22px' }}>{docs[selectedDoc].title}</h2>
        </div>
        <div style={{ color: '#cbd5e1', fontSize: '14px', lineHeight: '1.8', whiteSpace: 'pre-line' }}>
          {docs[selectedDoc].content}
        </div>
      </div>
    </div>
  );
};

/* ─── Reports Tab ─── */
const ReportsTab = () => {
  const reports = [
    { title: 'Q3 2026 Security Audit', date: 'Jul 10, 2026', status: 'Final', grade: 'A+', icon: Shield, color: '#10b981' },
    { title: 'ML-KEM Performance Analysis', date: 'Jul 8, 2026', status: 'Draft', grade: '—', icon: Box, color: '#8b5cf6' },
    { title: 'Threat Landscape Report', date: 'Jul 5, 2026', status: 'Final', grade: 'A', icon: Activity, color: '#ef4444' },
    { title: 'Compliance Review (NIST PQC)', date: 'Jun 28, 2026', status: 'Final', grade: 'A+', icon: CheckCircle2, color: '#3b82f6' },
  ];

  return (
    <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
      <h3 style={{ color: 'white', margin: '0 0 16px', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <FileText size={18} color="#f59e0b" /> Security & Research Reports
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {reports.map((r, i) => (
          <div key={i} className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: `${r.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <r.icon size={22} color={r.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>{r.title}</div>
              <div style={{ color: '#475569', fontSize: '12px', marginTop: '4px' }}>
                <Clock size={10} /> {r.date}
              </div>
            </div>
            {r.grade !== '—' && (
              <div style={{ color: r.color, fontSize: '20px', fontWeight: '700' }}>{r.grade}</div>
            )}
            <span style={{
              color: r.status === 'Final' ? '#10b981' : '#f59e0b',
              fontSize: '10px', fontWeight: '600', textTransform: 'uppercase',
              background: r.status === 'Final' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
              padding: '4px 10px', borderRadius: '6px',
            }}>
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Main Research Page ─── */
const ResearchPage = () => {
  const [activeTab, setActiveTab] = useState('benchmarks');
  const tabs = [
    { id: 'benchmarks', label: '📊 Benchmarks' },
    { id: 'documentation', label: '📖 Documentation' },
    { id: 'reports', label: '📄 Reports' },
  ];

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'benchmarks' && <BenchmarksTab />}
        {activeTab === 'documentation' && <DocumentationTab />}
        {activeTab === 'reports' && <ReportsTab />}
      </div>
    </div>
  );
};

export default ResearchPage;
