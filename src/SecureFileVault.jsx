import React from 'react';
import { 
  FolderLock, UploadCloud, File, FileText, Image as ImageIcon, 
  Code, ShieldCheck, HardDrive, Lock, Download, Share2, 
  Trash2, Activity, Zap, Server
} from 'lucide-react';
import MatrixRain from './MatrixRain';
import { motion } from 'framer-motion';

const SecureFileVault = () => {
  const files = [
    { id: 1, name: "Project_Lattice_Architecture.pdf", type: "pdf", size: "4.2 MB", date: "Today, 10:42 AM", status: "Encrypted", hash: "a8f3...9b2c" },
    { id: 2, name: "Quantum_Keys_Backup.enc", type: "enc", size: "128 KB", date: "Yesterday", status: "Secure", hash: "c1e4...7d4f" },
    { id: 3, name: "Threat_Analysis_Q3.docx", type: "doc", size: "1.1 MB", date: "Oct 12", status: "Encrypted", hash: "9a2b...5e1d" },
    { id: 4, name: "Node_Topology_Map.png", type: "img", size: "3.4 MB", date: "Oct 10", status: "Secure", hash: "f3c2...8a9b" },
    { id: 5, name: "kernel_patch_v2.sh", type: "code", size: "14 KB", date: "Oct 08", status: "Encrypted", hash: "b2d4...1c3e" },
    { id: 6, name: "financial_forecast_2027.xlsx", type: "doc", size: "2.8 MB", date: "Oct 05", status: "Encrypted", hash: "e4f1...2d3a" },
    { id: 7, name: "syslog_archive.tar.gz", type: "enc", size: "450 MB", date: "Sep 28", status: "Secure", hash: "d8a1...9f2b" }
  ];

  const getIcon = (type) => {
    switch(type) {
      case 'pdf': case 'doc': return <FileText size={20} color="#3b82f6" />;
      case 'img': return <ImageIcon size={20} color="#10b981" />;
      case 'code': return <Code size={20} color="#f59e0b" />;
      case 'enc': return <Lock size={20} color="#8b5cf6" />;
      default: return <File size={20} color="#94a3b8" />;
    }
  };

  const getStatusColor = (status) => {
    return status === 'Encrypted' ? '#10b981' : '#3b82f6';
  };

  // SVG Ring Chart Configuration
  const radius = 60;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (45 / 100) * circumference;

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowY: 'auto', padding: '24px' }}>
      <MatrixRain />
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', zIndex: 10 }}>
        <div>
          <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '28px' }}>
            <FolderLock size={32} color="#3b82f6" /> Quantum Data Vault
          </h1>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>Zero-knowledge, post-quantum encrypted storage.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', transition: '0.2s' }} className="hover:bg-white/5">
            <FolderLock size={18} color="#94a3b8" /> New Folder
          </button>
          <button className="neon-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px' }}>
            <UploadCloud size={18} /> Secure Upload
          </button>
        </div>
      </div>

      {/* Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', zIndex: 10 }}>
        
        {/* Top Left: Storage Ring */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="glass-card" style={{ gridColumn: 'span 4', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(15, 23, 42, 0.7)' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={18} color="#8b5cf6" /> Storage Capacity
          </h3>
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
              <circle
                stroke="rgba(255,255,255,0.05)"
                fill="transparent"
                strokeWidth={stroke}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="url(#storageGradient)"
                fill="transparent"
                strokeWidth={stroke}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }}
                strokeLinecap="round"
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <defs>
                <linearGradient id="storageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>45%</span>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Used</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '24px', color: '#cbd5e1', fontSize: '13px' }}>
            <div style={{ textAlign: 'center' }}><div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>45 GB</div><div style={{ color: '#64748b', fontSize: '11px' }}>Encrypted</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>100 GB</div><div style={{ color: '#64748b', fontSize: '11px' }}>Total Space</div></div>
          </div>
        </motion.div>

        {/* Top Middle: Distribution Bar */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass-card" style={{ gridColumn: 'span 4', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.7)' }}>
          <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="#3b82f6" /> File Distribution
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
            {/* Custom Stacked Bar */}
            <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
              <div style={{ width: '40%', background: '#3b82f6' }} title="Documents (40%)"></div>
              <div style={{ width: '30%', background: '#10b981' }} title="Media (30%)"></div>
              <div style={{ width: '20%', background: '#f59e0b' }} title="Code (20%)"></div>
              <div style={{ width: '10%', background: '#8b5cf6' }} title="Encrypted Packages (10%)"></div>
            </div>
            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Documents (40%)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Media (30%)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Code (20%)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }}></div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Sys Packages (10%)</span></div>
            </div>
          </div>
        </motion.div>

        {/* Top Right: Metrics */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, delay: 0.2 }} style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="glass-card" style={{ flex: 1, padding: '20px', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <ShieldCheck size={24} color="#10b981" />
             </div>
             <div>
               <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>1,432</div>
               <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Files Encrypted</div>
             </div>
          </div>
          <div className="glass-card" style={{ flex: 1, padding: '20px', background: 'rgba(15, 23, 42, 0.7)', display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Activity size={24} color="#3b82f6" />
             </div>
             <div>
               <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>42 MB/s</div>
               <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Current Tunnel Speed</div>
             </div>
          </div>
        </motion.div>

        {/* Bottom: File List */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.7, delay: 0.3 }} className="glass-card" style={{ gridColumn: 'span 12', padding: '0', background: 'rgba(15, 23, 42, 0.6)', display: 'flex', flexDirection: 'column' }}>
          {/* Table Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 1fr 120px', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(0,0,0,0.2)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
            <div>Filename</div>
            <div>Size</div>
            <div>Modified</div>
            <div>Integrity Hash</div>
            <div>Status</div>
            <div style={{ textAlign: 'center' }}>Actions</div>
          </div>

          {/* File Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
            {files.map(file => (
              <div key={file.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 1fr 120px', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', transition: '0.2s' }} className="hover:bg-white/5 group">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'white', fontWeight: '500', fontSize: '15px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                    {getIcon(file.type)}
                  </div>
                  {file.name}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>{file.size}</div>
                <div style={{ color: '#94a3b8', fontSize: '14px' }}>{file.date}</div>
                <div style={{ color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}>{file.hash}</div>
                <div>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: getStatusColor(file.status), fontSize: '12px', background: `${getStatusColor(file.status)}15`, padding: '4px 10px', borderRadius: '6px', width: 'fit-content', border: `1px solid ${getStatusColor(file.status)}30` }}>
                    <Lock size={12} /> {file.status}
                  </span>
                </div>
                {/* Actions (Hidden until hover) */}
                <div style={{ display: 'flex', justifyContent: 'space-evenly', color: '#94a3b8', opacity: 0.3, transition: 'opacity 0.2s' }} className="group-hover:opacity-100">
                  <button style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }} title="Download" className="hover:scale-110 transition-transform"><Download size={18} /></button>
                  <button style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '4px' }} title="Share" className="hover:scale-110 transition-transform"><Share2 size={18} /></button>
                  <button style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Delete" className="hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default SecureFileVault;
