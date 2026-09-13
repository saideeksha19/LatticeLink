import React, { useState } from 'react';
import { Settings, Users, Activity, Sliders, Shield } from 'lucide-react';
import MatrixRain from './MatrixRain';
import SystemHealthDashboard from './components/Admin/SystemHealthDashboard';
import UserManagement from './components/Admin/UserManagement';
import SystemConfiguration from './components/Admin/SystemConfiguration';

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

const EnterpriseAdminCenter = () => {
  const [activeTab, setActiveTab] = useState('health');

  const tabs = [
    { id: 'health', label: 'System Health & Services', icon: Activity },
    { id: 'users', label: 'User Management & RBAC', icon: Users },
    { id: 'config', label: 'System Configuration', icon: Sliders }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Shield size={32} color="#f59e0b" /> Enterprise Administration Console
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Global management of users, policies, system health, and post-quantum infrastructure.</p>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#f59e0b', padding: '8px 16px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18}/> Super Admin Mode
          </div>
        </div>

        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        <div style={{ flex: 1 }}>
          {activeTab === 'health' && <SystemHealthDashboard />}
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'config' && <SystemConfiguration />}
        </div>

      </div>
    </div>
  );
};

export default EnterpriseAdminCenter;
