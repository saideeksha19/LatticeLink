import React, { useState } from 'react';
import { FileText, Download, CheckCircle2, ShieldAlert, Cpu, Users, Lock, Activity } from 'lucide-react';
import MatrixRain from './MatrixRain';

const ReportsCenter = () => {
  const [generating, setGenerating] = useState(null);
  
  const reports = [
    { id: 'sec', title: 'Security Overview Report', icon: ShieldAlert, desc: 'High-level summary of overall system security posture.' },
    { id: 'threat', title: 'Threat Intelligence Report', icon: Activity, desc: 'Detailed log of all intercepted threats and attack simulations.' },
    { id: 'device', title: 'Device & Node Report', icon: Users, desc: 'Inventory of all trusted devices and their synchronization status.' },
    { id: 'audit', title: 'Compliance & Audit Log', icon: FileText, desc: 'Immutable record of key rotations, logins, and settings changes.' },
    { id: 'comm', title: 'Communication Analytics', icon: Lock, desc: 'Volume metrics for E2E encrypted messages and secure file transfers.' },
    { id: 'crypto', title: 'Cryptographic Health Report', icon: Cpu, desc: 'Latency and operation metrics for ML-KEM, ML-DSA, and AES-256.' }
  ];

  const handleGenerate = (id) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      // In a real app, this would trigger a download
    }, 2000);
  };

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FileText size={32} color="#10b981" /> Reports Center
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Generate and export compliance and security telemetry.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {reports.map(report => (
            <div key={report.id} className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <report.icon size={24} color="#10b981" />
                </div>
                <div>
                  <h3 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '16px' }}>{report.title}</h3>
                  <p style={{ color: '#94a3b8', margin: 0, fontSize: '13px' }}>{report.desc}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                {generating === report.id ? (
                  <div style={{ color: '#38bdf8', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid #38bdf8', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
                    Generating...
                  </div>
                ) : (
                  <>
                    <button onClick={() => handleGenerate(report.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <Download size={14} /> PDF
                    </button>
                    <button onClick={() => handleGenerate(report.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <Download size={14} /> CSV
                    </button>
                    <button onClick={() => handleGenerate(report.id)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                      <Download size={14} /> JSON
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ReportsCenter;
