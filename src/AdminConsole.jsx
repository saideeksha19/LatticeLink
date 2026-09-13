import React from 'react';
import { Server, Users, ShieldAlert, Database, Trash2, Power, Globe, Terminal } from 'lucide-react';
import MatrixRain from './MatrixRain';

const AdminConsole = () => {
  const nodes = [
    { id: "us-east-alpha", ip: "192.168.1.104", load: "45%", status: "Online" },
    { id: "eu-west-beta", ip: "10.0.0.52", load: "82%", status: "Online" },
    { id: "ap-south-gamma", ip: "172.16.2.8", load: "0%", status: "Offline" }
  ];

  const activeUsers = [
    { id: 1, name: "Neo", role: "Superadmin", lastActive: "Just now" },
    { id: 2, name: "Trinity", role: "Operator", lastActive: "5m ago" },
    { id: 3, name: "Morpheus", role: "Commander", lastActive: "1h ago" }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Terminal size={32} color="#ef4444" /> System Command Center
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Global network node and user management. Use with caution.</p>
          </div>
          <button className="neon-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444', color: '#ef4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.3)' }}>
            <Power size={18} /> Emergency Shutdown
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', flex: 1 }}>
          
          {/* Node Management */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.8)' }}>
            <h2 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Server size={20} color="#3b82f6" /> Active Network Nodes
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {nodes.map(node => (
                <div key={node.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Globe size={14} color="#64748b" /> {node.id}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '4px', fontFamily: 'monospace' }}>IP: {node.ip}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#64748b', fontSize: '10px', textTransform: 'uppercase' }}>Load</div>
                      <div style={{ color: 'white', fontSize: '14px' }}>{node.load}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: node.status === 'Online' ? '#10b981' : '#ef4444', fontSize: '12px', background: node.status === 'Online' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                       {node.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* User Management */}
          <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.8)' }}>
            <h2 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={20} color="#8b5cf6" /> Registered Operators
            </h2>
            
            <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white', fontSize: '14px' }}>
              <thead>
                <tr style={{ color: '#94a3b8', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ paddingBottom: '12px', fontWeight: 'normal' }}>Alias</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 'normal' }}>Role</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 'normal' }}>Last Active</th>
                  <th style={{ paddingBottom: '12px', fontWeight: 'normal' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px 0', fontWeight: 'bold' }}>{user.name}</td>
                    <td style={{ padding: '16px 0', color: '#8b5cf6' }}>{user.role}</td>
                    <td style={{ padding: '16px 0', color: '#94a3b8' }}>{user.lastActive}</td>
                    <td style={{ padding: '16px 0' }}>
                      <button style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', transition: '0.2s' }} className="revoke-btn">
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
      <style>{`
        .revoke-btn:hover { background: rgba(239, 68, 68, 0.2) !important; color: white !important; }
      `}</style>
    </div>
  );
};

export default AdminConsole;
