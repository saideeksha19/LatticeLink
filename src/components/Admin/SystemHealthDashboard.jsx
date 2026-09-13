import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Network, ShieldCheck, HeartPulse, Zap } from 'lucide-react';

const SystemHealthDashboard = () => {
  const [stats, setStats] = useState({ users: 0, devices: 0, messages: 0, files: 0, sessions: 0, threats: 0 });

  useEffect(() => {
    fetch('/api/user/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '16px' }}>
        {[
          { label: 'Users', val: stats.users, icon: Activity, color: '#3b82f6' },
          { label: 'Devices', val: stats.devices, icon: Server, color: '#8b5cf6' },
          { label: 'Messages', val: stats.messages, icon: Network, color: '#f59e0b' },
          { label: 'Files Secured', val: stats.files, icon: HeartPulse, color: '#10b981' },
          { label: 'Active Sessions', val: stats.sessions, icon: ShieldCheck, color: '#ef4444' },
          { label: 'Threats Blocked', val: stats.threats, icon: Zap, color: '#06b6d4' }
        ].map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: '16px', background: 'rgba(15, 23, 42, 0.6)', border: `1px solid ${stat.color}30`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>{stat.label}</span>
              <stat.icon size={14} color={stat.color} />
            </div>
            <div style={{ color: 'white', fontSize: '20px', fontWeight: 'bold' }}>{stat.val}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Service Monitor */}
        <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="#3b82f6"/> Service Monitor
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Flask API', status: 'Running', color: '#10b981' },
              { label: 'Socket.IO Relay', status: 'Running', color: '#10b981' },
              { label: 'SQLite Database', status: 'Connected', color: '#10b981' },
              { label: 'Crypto Engine (PQ)', status: 'Active', color: '#10b981' },
              { label: 'Storage Controller', status: 'Online', color: '#10b981' }
            ].map((srv, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{srv.label}</span>
                <span style={{ color: srv.color, fontSize: '12px', fontWeight: 'bold', background: `${srv.color}20`, padding: '4px 8px', borderRadius: '4px' }}>{srv.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Database Monitor */}
        <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="#8b5cf6"/> Database Metrics
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Table Size', val: '4.2 GB' },
              { label: 'Query Time', val: '12 ms' },
              { label: 'Active Connections', val: '34' },
              { label: 'Growth (30d)', val: '+8.4%' }
            ].map((metric, i) => (
              <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>{metric.label}</div>
                <div style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>{metric.val}</div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* API & Performance Monitor Placeholder */}
      <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Network size={18} color="#f59e0b"/> API & Performance Telemetry
        </h3>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '24px' }}>
          
          <div style={{ flex: 1, height: '120px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ color: '#3b82f6', fontSize: '24px', fontWeight: 'bold' }}>24 ms</span>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Avg API Latency</span>
          </div>
          
          <div style={{ flex: 1, height: '120px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>4,102</span>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Requests / min</span>
          </div>
          
          <div style={{ flex: 1, height: '120px', background: 'rgba(0,0,0,0.3)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
            <span style={{ color: '#8b5cf6', fontSize: '24px', fontWeight: 'bold' }}>0.01%</span>
            <span style={{ color: '#94a3b8', fontSize: '12px' }}>Error Rate</span>
          </div>

        </div>
      </div>

    </div>
  );
};

export default SystemHealthDashboard;
