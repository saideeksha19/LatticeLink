import React, { useState } from 'react';
import { HardDrive, CloudLightning, ShieldAlert, Settings, RefreshCw, Trash2, CheckCircle } from 'lucide-react';

const SystemConfiguration = () => {
  const [backupStatus, setBackupStatus] = useState('idle'); // idle, processing, success

  const handleBackup = () => {
    setBackupStatus('processing');
    setTimeout(() => {
      setBackupStatus('success');
      setTimeout(() => setBackupStatus('idle'), 3000);
    }, 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Storage Manager */}
        <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={18} color="#06b6d4"/> Storage Manager
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'white', fontWeight: 'bold' }}>Overall Usage (63%)</span>
              <span style={{ color: '#94a3b8' }}>630 GB / 1 TB</span>
            </div>
            
            {/* Progress Bar */}
            <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ width: '40%', background: '#3b82f6' }}></div> {/* Encrypted Files */}
              <div style={{ width: '15%', background: '#10b981' }}></div> {/* DB */}
              <div style={{ width: '8%', background: '#8b5cf6' }}></div> {/* Logs */}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: '#3b82f6', borderRadius: '50%'}}></div> Encrypted Vault Files</span>
                <span style={{ color: 'white' }}>400 GB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%'}}></div> Database Records</span>
                <span style={{ color: 'white' }}>150 GB</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '8px', height: '8px', background: '#8b5cf6', borderRadius: '50%'}}></div> Audit Logs</span>
                <span style={{ color: 'white' }}>80 GB</span>
              </div>
            </div>
          </div>
        </div>

        {/* Backup Center */}
        <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CloudLightning size={18} color="#8b5cf6"/> Backup & Disaster Recovery
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ color: '#94a3b8', fontSize: '12px' }}>Last Successful Backup</div>
              <div style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', marginTop: '4px' }}>Today, 03:00 AM UTC</div>
            </div>

            <button 
              onClick={handleBackup}
              disabled={backupStatus !== 'idle'}
              style={{ 
                background: backupStatus === 'success' ? '#10b981' : (backupStatus === 'processing' ? 'rgba(139, 92, 246, 0.5)' : '#8b5cf6'), 
                border: 'none', color: 'white', padding: '12px', borderRadius: '8px', fontWeight: 'bold', cursor: backupStatus === 'idle' ? 'pointer' : 'not-allowed', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s'
              }}>
              {backupStatus === 'idle' && <><CloudLightning size={18}/> Create Snapshot Backup</>}
              {backupStatus === 'processing' && <><RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }}/> Generating Encrypted Backup...</>}
              {backupStatus === 'success' && <><CheckCircle size={18}/> Backup Complete</>}
            </button>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Restore Backup</button>
              <button style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Schedule</button>
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Security Policies */}
        <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldAlert size={18} color="#ef4444"/> Global Security Policies
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px' }}>
              <div>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>Password Policy</div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>Require uppercase, numbers, and symbols</div>
              </div>
              <div style={{ width: '40px', height: '20px', background: '#10b981', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}>
                <div style={{ position: 'absolute', right: '2px', top: '2px', width: '16px', height: '16px', background: 'white', borderRadius: '50%' }}></div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px' }}>
              <div>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>Session Timeout</div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>Force logout after inactivity</div>
              </div>
              <select style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}>
                <option>15 Minutes</option>
                <option>1 Hour</option>
                <option>24 Hours</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '8px' }}>
              <div>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>Multi-Factor Auth (MFA)</div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>Future enhancement planned</div>
              </div>
              <div style={{ color: '#f59e0b', fontSize: '12px', fontWeight: 'bold', padding: '4px 8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '4px' }}>PLANNED</div>
            </div>
          </div>
        </div>

        {/* Maintenance Center */}
        <div className="glass-card" style={{ padding: '32px', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} color="#94a3b8"/> Maintenance Center
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
              <RefreshCw size={20} color="#3b82f6" />
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Restart Services</span>
            </button>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: '0.2s' }}>
              <Trash2 size={20} color="#ef4444" />
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Clear System Cache</span>
            </button>
            <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', transition: '0.2s', gridColumn: 'span 2' }}>
              <Settings size={20} color="#10b981" />
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>Run Health Check & Optimize Database</span>
            </button>
          </div>
        </div>

      </div>
      
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default SystemConfiguration;
