import React, { useState } from 'react';
import { Search, UserPlus, Phone, Video, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import MatrixRain from './MatrixRain';

const UsersPage = () => {
  const [activeTab, setActiveTab] = useState('online');

  const contacts = [
    { id: 1, name: 'Dr. Aris', node: 'NODE-8A9C3D', status: 'online', secure: true },
    { id: 2, name: 'Quantum Research Group', node: 'GROUP-991', status: 'online', secure: true },
    { id: 3, name: 'Alice (External)', node: 'NODE-2B1A4F', status: 'offline', secure: false },
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', padding: '40px', position: 'relative', overflow: 'hidden' }}>
      <MatrixRain />
      
      <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <h1 style={{ color: 'white', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <UserPlus size={32} color="#3b82f6" /> Identity Directory
        </h1>

        <div className="glass-card" style={{ padding: '24px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
            <div className="input-group" style={{ flex: 1, padding: '12px 20px', borderRadius: '12px' }}>
              <Search size={20} color="#64748b" />
              <input type="text" placeholder="Search Node ID, Public Key, or Username..." style={{ fontSize: '16px' }} />
            </div>
            <button className="neon-button">Find Identity</button>
          </div>

          <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '24px' }}>
            {['online', 'all', 'pending', 'blocked'].map(tab => (
              <div 
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{ 
                  color: activeTab === tab ? '#3b82f6' : '#94a3b8',
                  paddingBottom: '12px',
                  borderBottom: activeTab === tab ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  fontWeight: activeTab === tab ? '600' : '400'
                }}
              >
                {tab} Users
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {contacts.filter(c => activeTab === 'all' || activeTab === 'online' && c.status === 'online').map(contact => (
              <div key={contact.id} style={{ 
                background: 'rgba(0,0,0,0.3)', 
                border: '1px solid rgba(255,255,255,0.05)', 
                padding: '20px', 
                borderRadius: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ 
                    width: '48px', height: '48px', 
                    borderRadius: '50%', 
                    background: 'rgba(59, 130, 246, 0.2)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center',
                    color: '#3b82f6',
                    fontWeight: 'bold',
                    fontSize: '20px'
                  }}>
                    {contact.name.charAt(0)}
                  </div>
                  <div>
                    <div style={{ color: 'white', fontSize: '18px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {contact.name}
                      {contact.secure && <CheckCircle2 size={16} color="#10b981" title="Quantum Secure" />}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>{contact.node}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <button className="neon-button" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #3b82f6' }}>
                    <Phone size={16} style={{ marginRight: '8px' }}/> Call
                  </button>
                  <button className="neon-button" style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #8b5cf6', color: '#8b5cf6', boxShadow: 'none' }}>
                    <Video size={16} style={{ marginRight: '8px' }}/> Video
                  </button>
                  <button className="neon-button" style={{ padding: '8px 16px' }}>
                    Message
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default UsersPage;
