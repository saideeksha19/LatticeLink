import React, { useState, useEffect } from 'react';
import { Users, Search, Filter, Shield, MoreVertical } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const UserManagement = () => {
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/user/directory')
      .then(res => res.json())
      .then(data => {
        if (data.directory) {
          setUsers(data.directory.map(u => ({
            name: u.username,
            email: u.email,
            role: u.role || 'User',
            status: 'Active', // Assume active for now
            devices: 1, // Assume 1 for now
          })));
        }
      })
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h3 style={{ color: 'white', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Users size={20} color="#3b82f6"/> Enterprise User Management
          </h3>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }}/>
              <input 
                type="text" 
                placeholder="Search users..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px 8px 36px', borderRadius: '8px', fontSize: '14px', width: '250px' }}
              />
            </div>
            <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              <Filter size={16} /> Filter
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Username</th>
                <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Email</th>
                <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Role (RBAC)</th>
                <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Devices</th>
                <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map((user, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                  <td style={{ padding: '16px 12px', color: 'white', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {user.name}
                    {currentUser && (currentUser.username === user.name) && (
                      <span style={{ color: '#10b981', fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', padding: '2px 6px', borderRadius: '4px', fontWeight: 'normal' }}>
                        You
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '16px 12px', color: '#94a3b8', fontSize: '13px' }}>{user.email}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ color: user.role.includes('Admin') ? '#f59e0b' : '#3b82f6', fontSize: '12px', fontWeight: 'bold', background: user.role.includes('Admin') ? 'rgba(245, 158, 11, 0.15)' : 'rgba(59, 130, 246, 0.15)', padding: '4px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Shield size={12}/> {user.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span style={{ color: user.status === 'Active' ? '#10b981' : '#ef4444', fontSize: '12px', fontWeight: 'bold', background: user.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', padding: '4px 8px', borderRadius: '4px' }}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', color: '#e2e8f0', fontSize: '14px' }}>{user.devices}</td>
                  <td style={{ padding: '16px 12px', textAlign: 'right' }}>
                    <button style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px' }}>RBAC Permissions Matrix</h3>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 16px 0' }}>Define access levels for roles.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {['Messaging', 'Security Lab', 'Key Management', 'Audit Logs', 'Administration'].map((perm, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{perm}</span>
                <span style={{ color: i < 4 ? '#10b981' : '#ef4444', fontSize: '12px', fontWeight: 'bold' }}>{i < 4 ? 'GRANTED' : 'RESTRICTED'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default UserManagement;
