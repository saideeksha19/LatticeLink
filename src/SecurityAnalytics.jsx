import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, ShieldCheck, Database, FolderLock, BarChart3, TrendingUp, Cpu, Server, Smartphone, Monitor } from 'lucide-react';
import MatrixRain from './MatrixRain';
import { NativeLineChart, NativeBarChart } from './components/AnalyticsCharts';

const SecurityAnalytics = () => {
  const [threatData, setThreatData] = useState([]);
  const [deviceData, setDeviceData] = useState([]);
  const [cryptoHealth, setCryptoHealth] = useState([]);
  const [fileSecurity, setFileSecurity] = useState({ files_protected: 0, encrypted_status: '100%', verified_signatures: '100%', tampered_detected: 0 });

  useEffect(() => {
    fetch('/api/security/analytics')
      .then(res => res.json())
      .then(data => {
        setThreatData(data.threat_data || []);
        setDeviceData(data.device_data || []);
        setCryptoHealth(data.crypto_health || []);
        if (data.file_security) setFileSecurity(data.file_security);
      })
      .catch(err => console.error("Error fetching analytics:", err));
  }, []);

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BarChart3 size={32} color="#3b82f6" /> Security Analytics
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Deep operational visibility and attack telemetry.</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Attack Analytics */}
          <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={18} color="#ef4444"/> Attack Trend (7 Days)
            </h3>
            <NativeLineChart data={threatData} dataKey="attacks" color="#ef4444" height={220} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              {threatData.map(d => <div key={d.name} style={{ color: '#94a3b8', fontSize: '11px' }}>{d.name}</div>)}
            </div>
          </div>

          {/* Device Analytics */}
          <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Monitor size={18} color="#38bdf8"/> Active Devices by OS
            </h3>
            <NativeBarChart data={deviceData} dataKey="count" nameKey="name" color="#38bdf8" height={220} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Cryptographic Health Dashboard */}
          <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} color="#10b981"/> Cryptographic Health
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cryptoHealth.map((crypto, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', border: `1px solid ${crypto.color}40` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: `${crypto.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Activity size={20} color={crypto.color} />
                    </div>
                    <div>
                      <div style={{ color: 'white', fontSize: '15px', fontWeight: 'bold' }}>{crypto.algo}</div>
                      <div style={{ color: '#10b981', fontSize: '12px', marginTop: '4px' }}>{crypto.status}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '32px', textAlign: 'right' }}>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Latency</div>
                      <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{crypto.latency}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Operations</div>
                      <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{crypto.ops}</div>
                    </div>
                    <div>
                      <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase' }}>Errors</div>
                      <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold', marginTop: '2px' }}>{crypto.errors}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* File Security Analytics */}
          <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
            <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FolderLock size={18} color="#f59e0b"/> File Security Analytics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Files Protected</span>
                <span style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>{fileSecurity.files_protected.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Encrypted Status</span>
                <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>{fileSecurity.encrypted_status}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Verified Signatures</span>
                <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>{fileSecurity.verified_signatures}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: '14px' }}>Tampered Detected</span>
                <span style={{ color: '#10b981', fontSize: '16px', fontWeight: 'bold' }}>{fileSecurity.tampered_detected}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SecurityAnalytics;
