import React, { useState } from 'react';
import { ShieldCheck, Clock, List, Box, FileSearch } from 'lucide-react';
import MatrixRain from './MatrixRain';
import TimelineViewer from './components/Audit/TimelineViewer';
import SecurityLogs from './components/Audit/SecurityLogs';
import CryptoAudit from './components/Audit/CryptoAudit';
import IncidentInvestigation from './components/Audit/IncidentInvestigation';

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

const AuditCenter = () => {
  const [activeTab, setActiveTab] = useState('timeline');

  const tabs = [
    { id: 'timeline', label: 'Global Timeline', icon: Clock },
    { id: 'logs', label: 'Security Logs', icon: List },
    { id: 'crypto', label: 'Crypto Audit', icon: Box },
    { id: 'incident', label: 'Incident Forensics', icon: FileSearch }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ShieldCheck size={32} color="#10b981" /> Audit & Digital Forensics
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Compliance, event logging, and post-quantum incident investigation.</p>
          </div>
        </div>

        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div style={{ flex: 1 }}>
          {activeTab === 'timeline' && <TimelineViewer />}
          {activeTab === 'logs' && <SecurityLogs />}
          {activeTab === 'crypto' && <CryptoAudit />}
          {activeTab === 'incident' && <IncidentInvestigation />}
        </div>

      </div>
    </div>
  );
};

export default AuditCenter;
