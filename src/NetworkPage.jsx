import React from 'react';
import { Globe, Activity, Server, Shield } from 'lucide-react';
import MatrixRain from './MatrixRain';

const NetworkPage = () => {
  const nodes = [
    { id: 'LDN-01', location: 'London, UK', status: 'Active', latency: '12ms', type: 'Quantum Gateway' },
    { id: 'TKY-44', location: 'Tokyo, JP', status: 'Active', latency: '45ms', type: 'Relay Node' },
    { id: 'NYC-09', location: 'New York, USA', status: 'Active', latency: '8ms', type: 'Core Server' },
    { id: 'SGP-22', location: 'Singapore', status: 'Syncing', latency: '110ms', type: 'Edge Node' }
  ];

  return (
    <div className="dashboard-container" style={{ position: 'relative', minHeight: '100vh', padding: '40px', display: 'flex', flexDirection: 'column' }}>
      <MatrixRain />
      
      <header className="dashboard-header glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', padding: '16px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Globe size={28} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 10px #3b82f6)' }} />
          <h2 style={{ margin: 0, fontSize: '24px' }}>Network <span style={{ color: '#3b82f6', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '2px' }}>Topology</span></h2>
        </div>
      </header>

      <div className="glass-card neon-container-blue" style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
          {nodes.map(node => (
            <div key={node.id} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '12px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}><Server size={18} /> {node.id}</h3>
                <span style={{ color: node.status === 'Active' ? '#10b981' : '#f59e0b', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Activity size={14} /> {node.status}
                </span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Location: {node.location}</div>
              <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px' }}>Type: {node.type}</div>
              <div style={{ color: '#94a3b8', fontSize: '14px' }}>Latency: <span style={{ color: 'white' }}>{node.latency}</span></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NetworkPage;
