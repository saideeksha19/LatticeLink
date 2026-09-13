import React, { useState } from 'react';
import { Key, ShieldCheck, Box, Lock, Fingerprint, Activity, Clock, ShieldAlert } from 'lucide-react';
import MatrixRain from './MatrixRain';
import MLKEMCenter from './components/KeyManagement/MLKEMCenter';
import MLDSACenter from './components/KeyManagement/MLDSACenter';
import AESSessionManager from './components/KeyManagement/AESSessionManager';
import SHA3IdentityCenter from './components/KeyManagement/SHA3IdentityCenter';

/* ─── Tab Header ─── */
const TabBar = ({ tabs, activeTab, onTabChange }) => (
  <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px', marginBottom: '24px', overflowX: 'auto' }}>
    {tabs.map((tab) => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            background: isActive ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
            border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
            color: isActive ? '#3b82f6' : '#94a3b8',
            padding: '10px 20px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: isActive ? 'bold' : 'normal',
            transition: '0.2s',
            whiteSpace: 'nowrap'
          }}
        >
          <tab.icon size={16} /> {tab.label}
        </button>
      );
    })}
  </div>
);

// Overview Dashboard Tab
const KeyDashboardOverview = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[
          { label: 'ML-KEM-768', status: 'ACTIVE', color: '#8b5cf6', icon: Box },
          { label: 'ML-DSA-65', status: 'VERIFIED', color: '#10b981', icon: ShieldCheck },
          { label: 'AES-256-GCM', status: 'ACTIVE', color: '#3b82f6', icon: Lock },
          { label: 'SHA3-512', status: 'ACTIVE', color: '#f59e0b', icon: Fingerprint }
        ].map((algo, i) => (
          <div key={i} className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${algo.color}30`, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${algo.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <algo.icon size={20} color={algo.color} />
              </div>
              <span style={{ color: algo.color, fontSize: '11px', fontWeight: 'bold', background: `${algo.color}15`, padding: '4px 8px', borderRadius: '4px' }}>{algo.status}</span>
            </div>
            <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginTop: '8px' }}>{algo.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Crypto History */}
        <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Clock size={18} color="#3b82f6"/> Cryptographic History
          </h3>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: '11px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.05)' }}></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { time: '09:10', event: 'ML-KEM Keypair Generated', color: '#8b5cf6' },
                { time: '09:11', event: 'ML-DSA Keypair Generated', color: '#10b981' },
                { time: '09:15', event: 'AES-256 Session Established (Alice -> Bob)', color: '#3b82f6' },
                { time: '09:18', event: 'Key Rotation Executed', color: '#f59e0b' }
              ].map((ev, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', zIndex: 2 }}>
                  <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${ev.color}22`, border: `2px solid ${ev.color}`, marginTop: '2px', flexShrink: 0 }}></div>
                  <div>
                    <div style={{ color: ev.color, fontSize: '11px', fontWeight: 'bold' }}>{ev.time}</div>
                    <div style={{ color: 'white', fontSize: '13px' }}>{ev.event}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Security Policies */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#ef4444"/> Security Policies
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Auto Rotate</span>
                <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>ON</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Session Lifetime</span>
                <span style={{ color: 'white', fontSize: '13px', fontWeight: 'bold' }}>24 Hours</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Key Backup</span>
                <span style={{ color: '#10b981', fontSize: '13px', fontWeight: 'bold' }}>Enabled</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '13px' }}>Verification</span>
                <span style={{ color: '#f59e0b', fontSize: '13px', fontWeight: 'bold' }}>Required</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};


const KeyManagementCenter = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'Key Dashboard', icon: Activity },
    { id: 'mlkem', label: 'ML-KEM Center', icon: Box },
    { id: 'mldsa', label: 'ML-DSA Center', icon: ShieldCheck },
    { id: 'aes', label: 'AES Sessions', icon: Lock },
    { id: 'sha3', label: 'SHA3 Identity', icon: Fingerprint }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Key size={32} color="#8b5cf6" /> Cryptographic Key Management
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Inspect, manage, and rotate all post-quantum cryptographic material.</p>
          </div>
        </div>

        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div style={{ flex: 1 }}>
          {activeTab === 'overview' && <KeyDashboardOverview />}
          {activeTab === 'mlkem' && <MLKEMCenter />}
          {activeTab === 'mldsa' && <MLDSACenter />}
          {activeTab === 'aes' && <AESSessionManager />}
          {activeTab === 'sha3' && <SHA3IdentityCenter />}
        </div>

      </div>
    </div>
  );
};

export default KeyManagementCenter;
