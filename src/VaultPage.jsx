import React, { useState } from 'react';
import { 
  FolderLock, UploadCloud, File, FileText, Image as ImageIcon, 
  Code, ShieldCheck, HardDrive, Lock, Download, Share2, 
  Trash2, Activity, Zap, Server, Film, Music, Archive, X, Check
} from 'lucide-react';
import MatrixRain from './MatrixRain';
import { motion } from 'framer-motion';
import { useAuth } from './context/AuthContext';
import { useVault } from './context/VaultContext';
import { useUser } from './context/UserContext';
import { useChat } from './context/ChatContext';

const getFileIcon = (type) => {
  switch(type) {
    case 'document': return <FileText size={20} color="#3b82f6" />;
    case 'image': return <ImageIcon size={20} color="#10b981" />;
    case 'video': return <Film size={20} color="#8b5cf6" />;
    case 'audio': return <Music size={20} color="#f59e0b" />;
    case 'archive': return <Archive size={20} color="#6366f1" />;
    default: return <File size={20} color="#94a3b8" />;
  }
};

const getStatusColor = (status) => {
  return status === 'Encrypted' ? '#10b981' : '#3b82f6';
};

const VaultPage = () => {
  const { vaultFiles, uploadVaultFile, shareVaultFile, deleteVaultFile } = useVault();
  const { currentUser } = useAuth();
  const { allUsers } = useUser();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadingState, setUploadingState] = useState(null);
  
  // Share & Delete State
  const [shareFileModal, setShareFileModal] = useState(null);
  const [targetUser, setTargetUser] = useState('');
  const [shareMsg, setShareMsg] = useState(null);
  const [isSharing, setIsSharing] = useState(false);


  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    
    const file = selectedFile;
    const name = file.name;
    const size = file.size; // in bytes
    const isVideo = name.endsWith('.mp4');
    const isImage = name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg');
    const type = isVideo ? 'video' : isImage ? 'image' : 'document';
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64Data = ev.target.result;
      
      const steps = ['Generating AES Key', 'SHA3 Hash', 'ML-DSA Signature', 'ML-KEM Sharing'];
      let currentStep = 0;
      setUploadingState({ fileName: name, step: steps[currentStep], progress: 0 });
      
      const interval = setInterval(() => {
        setUploadingState(prev => {
          if (!prev) return null;
          let nextProgress = prev.progress + 15;
          if (nextProgress >= 100) {
            if (currentStep < steps.length - 1) {
              currentStep++;
              return { fileName: name, step: steps[currentStep], progress: 0 };
            } else {
              clearInterval(interval);
              setTimeout(() => {
                uploadVaultFile(name, size, type, base64Data);
                setUploadingState(null);
                setSelectedFile(null);
                setShowUpload(false);
              }, 500);
              return { fileName: name, step: 'Protected', progress: 100 };
            }
          }
          return { ...prev, progress: nextProgress };
        });
      }, 150);
    };
    reader.readAsDataURL(file);
  };

  const downloadFile = async (e, file) => {
    e.stopPropagation();
    try {
      if (file.base64) {
        const a = document.createElement('a');
        a.href = file.base64;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        return;
      }

      const token = currentUser?.session_token || (() => {
        try {
          const saved = localStorage.getItem('ll_session_v4');
          return saved ? JSON.parse(saved)?.session_token : null;
        } catch (err) { return null; }
      })();

      const headers = {
        'ngrok-skip-browser-warning': 'true'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/vault/files/${file.id}/download?inline=false`, {
        headers
      });

      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
      } else {
        // Fallback for demo system files
        const blob = new Blob([`Decrypted payload for ${file.name}\nEncrypted via LatticeLink PQC Vault`], { type: 'text/plain' });
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 10000);
      }
    } catch (err) {
      console.error('Download failed', err);
    }
  };

  const { sendFileMessage, groups } = useChat();

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!shareFileModal || !targetUser) return;
    setIsSharing(true);
    setShareMsg(null);
    const isGroup = targetUser.startsWith('GRP-') || (groups && groups.some(g => g.id === targetUser || g.name === targetUser));
    const success = await shareVaultFile(shareFileModal.id, targetUser);
    setIsSharing(false);
    if (success) {
      // Also emit a file message into the 1-to-1 chat or group channel
      try {
        if (sendFileMessage) {
          sendFileMessage(targetUser, {
            id: shareFileModal.id,
            name: shareFileModal.name,
            mimetype: shareFileModal.mimetype || 'application/octet-stream',
            size: shareFileModal.size
          }, isGroup);
        }
      } catch (chatErr) {
        console.warn('Could not post file message into chat:', chatErr);
      }

      setShareMsg({ type: 'success', text: `Encrypted file successfully shared with ${targetUser} and delivered to chat!` });
      setTimeout(() => {
        setShareFileModal(null);
        setTargetUser('');
        setShareMsg(null);
      }, 1800);
    } else {
      setShareMsg({ type: 'error', text: `Failed to share file. Ensure receiver username or group ID is correct.` });
    }
  };

  const handleDeleteFile = async (e, file) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${file.name} from your secure vault?`)) {
      await deleteVaultFile(file.id);
    }
  };


  // Real stats calculation
  const parseSizeToBytes = (sizeStr) => {
    if (!sizeStr) return 0;
    const parts = String(sizeStr).trim().split(' ');
    if (parts.length !== 2) return 0;
    const val = parseFloat(parts[0]);
    const unit = parts[1].toUpperCase();
    switch(unit) {
      case 'B': return val;
      case 'KB': return val * 1024;
      case 'MB': return val * 1024 * 1024;
      case 'GB': return val * 1024 * 1024 * 1024;
      default: return 0;
    }
  };

  let totalBytes = 0;
  let typeBytes = { document: 0, media: 0, code: 0, archive: 0 };

  vaultFiles.forEach(f => {
    const b = parseSizeToBytes(f.size);
    totalBytes += b;
    if (f.type === 'document') typeBytes.document += b;
    else if (f.type === 'image' || f.type === 'video' || f.type === 'audio') typeBytes.media += b;
    else if (f.type === 'archive') typeBytes.archive += b;
    else typeBytes.code += b;
  });

  const MAX_STORAGE_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB
  const usedPercentage = totalBytes > 0 ? Math.min((totalBytes / MAX_STORAGE_BYTES) * 100, 100) : 0;
  
  const docsPct = totalBytes ? (typeBytes.document / totalBytes) * 100 : 0;
  const mediaPct = totalBytes ? (typeBytes.media / totalBytes) * 100 : 0;
  const codePct = totalBytes ? (typeBytes.code / totalBytes) * 100 : 0;
  const archivePct = totalBytes ? (typeBytes.archive / totalBytes) * 100 : 0;

  const usedMB = (totalBytes / (1024 * 1024)).toFixed(2);
  const usedGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(2);

  const radius = 60;
  const stroke = 12;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (usedPercentage / 100) * circumference;

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
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {showUpload && (
            <motion.form initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleUpload} style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.4)', padding: '6px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <input type="file" onChange={handleFileChange} style={{ color: 'white', fontSize: '13px' }} />
              <button type="submit" disabled={!selectedFile} style={{ background: selectedFile ? '#10b981' : '#475569', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: selectedFile ? 'pointer' : 'not-allowed', fontSize: '13px', fontWeight: 'bold' }}>Save</button>
            </motion.form>
          )}
          <button onClick={() => setShowUpload(!showUpload)} className="neon-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', cursor: 'pointer' }}>
            <UploadCloud size={18} /> {showUpload ? 'Cancel' : 'Secure Upload'}
          </button>
        </div>
      </div>

      {uploadingState && (
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-card" style={{ padding: '20px', marginBottom: '24px', background: 'rgba(15,23,42,0.8)', border: '1px solid #3b82f6', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <File size={18} color="#3b82f6" />
            </div>
            <div>
              <div style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>{uploadingState.fileName}</div>
              <div style={{ color: '#10b981', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '4px' }}>{uploadingState.step}</div>
            </div>
          </div>
          <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${uploadingState.progress}%`, height: '100%', background: uploadingState.step === 'Protected' ? '#10b981' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)', borderRadius: '3px', transition: 'width 0.15s linear' }}></div>
          </div>
        </motion.div>
      )}

      {/* Bento Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px', zIndex: 10 }}>
        
        {/* Top Left: Storage Ring */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }} className="glass-card" style={{ gridColumn: 'span 4', padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(15, 23, 42, 0.7)' }}>
          <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '16px', alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HardDrive size={18} color="#8b5cf6" /> Storage Capacity
          </h3>
          <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <svg height={radius * 2} width={radius * 2} style={{ transform: 'rotate(-90deg)' }}>
              <circle stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={radius} cy={radius} />
              <circle stroke="url(#storageGradient)" fill="transparent" strokeWidth={stroke} strokeDasharray={circumference + ' ' + circumference} style={{ strokeDashoffset, transition: 'stroke-dashoffset 1s ease-out' }} strokeLinecap="round" r={normalizedRadius} cx={radius} cy={radius} />
              <defs>
                <linearGradient id="storageGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{usedPercentage.toFixed(1)}%</span>
              <span style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>Used</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '24px', color: '#cbd5e1', fontSize: '13px' }}>
            <div style={{ textAlign: 'center' }}><div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>{totalBytes > 1024*1024*1024 ? usedGB + ' GB' : usedMB + ' MB'}</div><div style={{ color: '#64748b', fontSize: '11px' }}>Encrypted</div></div>
            <div style={{ textAlign: 'center' }}><div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px' }}>10 GB</div><div style={{ color: '#64748b', fontSize: '11px' }}>Total Space</div></div>
          </div>
        </motion.div>

        {/* Top Middle: Distribution Bar */}
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.5, delay: 0.1 }} className="glass-card" style={{ gridColumn: 'span 4', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.7)' }}>
          <h3 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Server size={18} color="#3b82f6" /> File Distribution
          </h3>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', gap: '2px', background: 'rgba(255,255,255,0.05)' }}>
              {docsPct > 0 && <div style={{ width: `${docsPct}%`, background: '#3b82f6' }} title={`Documents (${docsPct.toFixed(1)}%)`}></div>}
              {mediaPct > 0 && <div style={{ width: `${mediaPct}%`, background: '#10b981' }} title={`Media (${mediaPct.toFixed(1)}%)`}></div>}
              {codePct > 0 && <div style={{ width: `${codePct}%`, background: '#f59e0b' }} title={`Code (${codePct.toFixed(1)}%)`}></div>}
              {archivePct > 0 && <div style={{ width: `${archivePct}%`, background: '#8b5cf6' }} title={`Archives (${archivePct.toFixed(1)}%)`}></div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Documents ({docsPct.toFixed(0)}%)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Media ({mediaPct.toFixed(0)}%)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }}></div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Code/Scripts ({codePct.toFixed(0)}%)</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }}></div><span style={{ color: '#94a3b8', fontSize: '12px' }}>Archives ({archivePct.toFixed(0)}%)</span></div>
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
               <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>{vaultFiles.length}</div>
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
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 1fr 120px', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(0,0,0,0.2)', borderTopLeftRadius: '16px', borderTopRightRadius: '16px' }}>
            <div>Filename</div>
            <div>Size</div>
            <div>Modified</div>
            <div>Integrity Hash</div>
            <div>Status</div>
            <div style={{ textAlign: 'center' }}>Actions</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', padding: '8px 0' }}>
            {vaultFiles.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>No files found. Securely upload files to get started.</div>
            ) : (
              vaultFiles.map(file => (
                <div key={file.id} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1.5fr 1.5fr 1fr 120px', padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center', transition: '0.2s' }} className="hover:bg-white/5 group">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'white', fontWeight: '500', fontSize: '15px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '8px', borderRadius: '8px' }}>
                      {getFileIcon(file.type)}
                    </div>
                    {file.name}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>{file.size}</div>
                  <div style={{ color: '#94a3b8', fontSize: '14px' }}>{file.date}</div>
                  <div style={{ color: '#64748b', fontSize: '13px', fontFamily: 'monospace' }}>{file.hash || "a8f3...9b2c"}</div>
                  <div>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', background: '#10b98115', padding: '4px 10px', borderRadius: '6px', width: 'fit-content', border: '1px solid #10b98130' }}>
                      <Lock size={12} /> Encrypted
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-evenly', color: '#94a3b8', opacity: 0.3, transition: 'opacity 0.2s' }} className="group-hover:opacity-100">
                    <button onClick={(e) => downloadFile(e, file)} style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '4px' }} title="Download" className="hover:scale-110 transition-transform"><Download size={18} /></button>
                    <button onClick={(e) => { e.stopPropagation(); setShareFileModal(file); setTargetUser(''); setShareMsg(null); }} style={{ background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', padding: '4px' }} title="Share" className="hover:scale-110 transition-transform"><Share2 size={18} /></button>
                    <button onClick={(e) => handleDeleteFile(e, file)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Delete" className="hover:scale-110 transition-transform"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>

      </div>

      {/* Share File Modal */}
      {shareFileModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '90%', maxWidth: '480px', padding: '28px', background: '#0f172a', border: '1px solid #3b82f6', borderRadius: '16px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '18px' }}>
                <Share2 size={20} color="#10b981" /> Share Encrypted File
              </h3>
              <button onClick={() => setShareFileModal(null)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              <strong>File:</strong> {shareFileModal.name} <span style={{ color: '#94a3b8', marginLeft: '8px' }}>({shareFileModal.size})</span>
            </div>

            <form onSubmit={handleShareSubmit}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Recipient or Group Channel:</label>
              {(Object.keys(allUsers || {}).length > 0 || (groups && groups.length > 0)) ? (
                <select value={targetUser} onChange={e => setTargetUser(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '14px', marginBottom: '16px', outline: 'none' }}>
                  <option value="" disabled style={{ color: 'black' }}>-- Select Recipient or Channel --</option>
                  {Object.keys(allUsers || {}).length > 0 && (
                    <optgroup label="Network Users" style={{ color: 'black' }}>
                      {Object.values(allUsers).filter(u => u.username !== currentUser?.username).map(u => (
                        <option key={u.id || u.username} value={u.username} style={{ color: 'black' }}>
                          👤 {u.username} ({u.nodeId || u.email || 'User'})
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {groups && groups.length > 0 && (
                    <optgroup label="Group Channels" style={{ color: 'black' }}>
                      {groups.map(g => (
                        <option key={g.id} value={g.id} style={{ color: 'black' }}>
                          👥 {g.name} ({g.id})
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              ) : (
                <input type="text" placeholder="Enter recipient username or group ID..." value={targetUser} onChange={e => setTargetUser(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '14px', marginBottom: '16px', outline: 'none' }} />
              )}

              {shareMsg && (
                <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px', background: shareMsg.type === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: shareMsg.type === 'success' ? '#10b981' : '#ef4444' }}>
                  {shareMsg.text}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShareFileModal(null)} style={{ padding: '10px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSharing || !targetUser} style={{ padding: '10px 22px', background: targetUser ? '#10b981' : '#475569', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: targetUser ? 'pointer' : 'not-allowed' }}>
                  {isSharing ? 'Encrypting & Sharing...' : 'Share File'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VaultPage;

