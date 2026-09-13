import React, { useState } from 'react';
import { FileText, TrendingUp, BookOpen, ExternalLink, Clock, Tag, ChevronRight, Search } from 'lucide-react';
import MatrixRain from './MatrixRain';

const ResearchDashboard = () => {
  const [selectedPaper, setSelectedPaper] = useState(null);

  const papers = [
    {
      id: 1,
      title: "CRYSTALS-Kyber: A CCA-Secure Module-Lattice-Based KEM",
      authors: "Bos, J. et al.",
      year: "2023",
      category: "Key Encapsulation",
      color: "#8b5cf6",
      abstract: "Kyber is an IND-CCA2 secure key encapsulation mechanism (KEM) based on the hardness of solving the Learning with Errors (LWE) problem over module lattices.",
      citations: 1284
    },
    {
      id: 2,
      title: "CRYSTALS-Dilithium: A Lattice-Based Digital Signature Scheme",
      authors: "Ducas, L. et al.",
      year: "2023",
      category: "Digital Signatures",
      color: "#10b981",
      abstract: "Dilithium is a digital signature scheme based on the Fiat-Shamir with Aborts paradigm and the hardness of the Module-LWE and Module-SIS problems.",
      citations: 892
    },
    {
      id: 3,
      title: "Post-Quantum TLS Without Handshake Signatures",
      authors: "Schwabe, P., Stebila, D.",
      year: "2022",
      category: "Transport Layer",
      color: "#3b82f6",
      abstract: "This paper investigates the performance implications of integrating post-quantum key exchange mechanisms into the TLS 1.3 handshake protocol.",
      citations: 456
    },
    {
      id: 4,
      title: "SHA-3 Standard: Permutation-Based Hash and Extendable-Output Functions",
      authors: "NIST FIPS 202",
      year: "2015",
      category: "Hash Functions",
      color: "#f59e0b",
      abstract: "This Federal Information Processing Standard specifies the SHA-3 family of hash functions and extendable-output functions based on the Keccak sponge construction.",
      citations: 3210
    }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', position: 'relative' }}>
      <MatrixRain />
      
      {/* Main Content */}
      <div style={{ flex: 1, padding: '32px', zIndex: 10, display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <FileText size={32} color="#6366f1" /> Cryptographic Research Hub
          </h1>
          <p style={{ color: '#94a3b8', margin: 0 }}>Academic papers, NIST standards, and implementation references.</p>
        </div>

        {/* Search */}
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <Search size={20} color="#64748b" />
          <input type="text" placeholder="Search papers, algorithms, standards..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: '15px' }} />
        </div>

        {/* Paper Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {papers.map(paper => (
            <div
              key={paper.id}
              className="glass-card"
              onClick={() => setSelectedPaper(selectedPaper?.id === paper.id ? null : paper)}
              style={{ padding: '24px', cursor: 'pointer', transition: '0.2s', borderLeft: `4px solid ${paper.color}` }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ background: `${paper.color}22`, color: paper.color, padding: '4px 10px', borderRadius: '4px', fontSize: '11px', border: `1px solid ${paper.color}44`, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {paper.category}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={12} /> {paper.year}
                    </span>
                  </div>
                  <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '17px' }}>{paper.title}</h3>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>{paper.authors}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <div style={{ color: '#f59e0b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} /> {paper.citations} citations
                  </div>
                  <ChevronRight size={18} color="#64748b" style={{ transform: selectedPaper?.id === paper.id ? 'rotate(90deg)' : 'rotate(0)', transition: '0.2s' }} />
                </div>
              </div>

              {selectedPaper?.id === paper.id && (
                <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(0,0,0,0.4)', borderRadius: '8px', border: `1px solid ${paper.color}33` }}>
                  <div style={{ color: paper.color, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Abstract</div>
                  <p style={{ color: '#cbd5e1', margin: 0, fontSize: '14px', lineHeight: '1.7' }}>{paper.abstract}</p>
                  <button style={{ marginTop: '16px', background: `${paper.color}22`, border: `1px solid ${paper.color}44`, color: paper.color, padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                    <ExternalLink size={14} /> View Full Paper
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResearchDashboard;
