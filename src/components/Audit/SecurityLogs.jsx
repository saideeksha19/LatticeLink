import React, { useState } from 'react';
import { List, Download, Filter, Search } from 'lucide-react';

const SecurityLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const logs = [
    { time: '09:20:14', level: 'INFO', category: 'File', user: 'Alice', desc: 'Encrypted File Uploaded', status: 'Success' },
    { time: '09:18:02', level: 'INFO', category: 'Device', user: 'Alice', desc: 'Desktop Sync', status: 'Success' },
    { time: '09:16:45', level: 'WARNING', category: 'Threat', user: 'System', desc: 'Replay Attack Blocked', status: 'Resolved' },
    { time: '09:15:28', level: 'INFO', category: 'Messaging', user: 'Alice', desc: 'Encrypted Message Sent', status: 'Success' },
    { time: '09:13:05', level: 'INFO', category: 'Crypto', user: 'Alice', desc: 'ML-KEM Handshake', status: 'Success' },
    { time: '09:12:00', level: 'INFO', category: 'Auth', user: 'Alice', desc: 'Successful Login', status: 'Success' },
  ];

  const handleExport = () => {
    const csvData = [
      ['Timestamp', 'Severity', 'Category', 'User', 'Description', 'Status'],
      ...logs.map(log => [log.time, log.level, log.category, log.user, log.desc, log.status])
    ].map(e => e.join(',')).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'LatticeLink_Security_Audit.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getLevelColor = (level) => {
    if (level === 'INFO') return '#3b82f6';
    if (level === 'WARNING') return '#f59e0b';
    if (level === 'CRITICAL') return '#ef4444';
    return '#94a3b8';
  };

  return (
    <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h3 style={{ color: 'white', margin: 0, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <List size={20} color="#10b981"/> Security & Compliance Logs
        </h3>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '10px' }}/>
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '8px 12px 8px 36px', borderRadius: '8px', fontSize: '14px', width: '200px' }}
            />
          </div>
          <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Filter size={16} /> Filter
          </button>
          <button onClick={handleExport} style={{ background: '#10b981', border: 'none', color: '#020617', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Timestamp</th>
              <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Severity</th>
              <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Category</th>
              <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>User</th>
              <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Description</th>
              <th style={{ padding: '12px', color: '#64748b', fontSize: '12px', textTransform: 'uppercase' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {logs.filter(l => l.desc.toLowerCase().includes(searchTerm.toLowerCase())).map((log, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}>
                <td style={{ padding: '16px 12px', color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace' }}>{log.time}</td>
                <td style={{ padding: '16px 12px' }}>
                  <span style={{ color: getLevelColor(log.level), fontSize: '12px', fontWeight: 'bold', background: `${getLevelColor(log.level)}20`, padding: '4px 8px', borderRadius: '4px' }}>
                    {log.level}
                  </span>
                </td>
                <td style={{ padding: '16px 12px', color: '#e2e8f0', fontSize: '13px' }}>{log.category}</td>
                <td style={{ padding: '16px 12px', color: 'white', fontSize: '13px', fontWeight: 'bold' }}>{log.user}</td>
                <td style={{ padding: '16px 12px', color: '#e2e8f0', fontSize: '13px' }}>{log.desc}</td>
                <td style={{ padding: '16px 12px' }}>
                  <span style={{ color: log.status === 'Success' || log.status === 'Resolved' ? '#10b981' : '#ef4444', fontSize: '13px', fontWeight: 'bold' }}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SecurityLogs;
