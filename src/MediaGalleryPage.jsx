import React, { useState } from 'react';
import { Image as ImageIcon, Film, Mic, Search, Grid, List, Lock, Download, Eye, Calendar } from 'lucide-react';
import MatrixRain from './MatrixRain';

const MediaGalleryPage = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('images');

  const mediaItems = {
    images: [
      { id: 1, name: "Node_Topology_Scan.png", size: "3.2 MB", date: "Today", from: "Neo", color: "#3b82f6" },
      { id: 2, name: "Quantum_Key_Graph.png", size: "1.8 MB", date: "Yesterday", from: "Trinity", color: "#8b5cf6" },
      { id: 3, name: "Lattice_Architecture.jpg", size: "4.1 MB", date: "Oct 12", from: "Morpheus", color: "#10b981" },
      { id: 4, name: "Server_Room_Photo.png", size: "2.9 MB", date: "Oct 10", from: "Neo", color: "#f59e0b" },
      { id: 5, name: "Encryption_Benchmark.png", size: "1.2 MB", date: "Oct 08", from: "Trinity", color: "#ef4444" },
      { id: 6, name: "PQC_Whitepaper_Chart.jpg", size: "890 KB", date: "Oct 05", from: "Morpheus", color: "#6366f1" }
    ],
    videos: [
      { id: 7, name: "Secure_Call_Recording_01.webm", size: "45 MB", date: "Today", from: "Neo", duration: "12:34" },
      { id: 8, name: "Training_Session_PQC.mp4", size: "120 MB", date: "Yesterday", from: "Trinity", duration: "45:00" }
    ],
    audio: [
      { id: 9, name: "Voice_Note_Mission_Brief.ogg", size: "2.1 MB", date: "Today", from: "Morpheus", duration: "3:22" },
      { id: 10, name: "Encrypted_Audio_Log.ogg", size: "5.4 MB", date: "Oct 11", from: "Neo", duration: "8:15" }
    ]
  };

  const tabs = [
    { key: 'images', label: 'Images', icon: ImageIcon, count: mediaItems.images.length },
    { key: 'videos', label: 'Videos', icon: Film, count: mediaItems.videos.length },
    { key: 'audio', label: 'Audio', icon: Mic, count: mediaItems.audio.length }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <ImageIcon size={32} color="#f59e0b" /> Encrypted Media Gallery
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>All shared media files are stored with AES-256-GCM encryption.</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setViewMode('grid')} style={{ background: viewMode === 'grid' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (viewMode === 'grid' ? '#3b82f6' : 'rgba(255,255,255,0.1)'), color: viewMode === 'grid' ? '#3b82f6' : '#94a3b8', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
              <Grid size={18} />
            </button>
            <button onClick={() => setViewMode('list')} style={{ background: viewMode === 'list' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (viewMode === 'list' ? '#3b82f6' : 'rgba(255,255,255,0.1)'), color: viewMode === 'list' ? '#3b82f6' : '#94a3b8', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
              <List size={18} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Search size={20} color="#64748b" />
          <input type="text" placeholder="Search encrypted media files..." style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: '15px' }} />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ background: 'transparent', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #f59e0b' : '2px solid transparent', color: activeTab === tab.key ? '#f59e0b' : '#94a3b8', padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: activeTab === tab.key ? '600' : '400', transition: '0.2s' }}>
              <tab.icon size={16} /> {tab.label} <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'images' && (
          <div style={{ display: 'grid', gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(200px, 1fr))' : '1fr', gap: '16px' }}>
            {mediaItems.images.map(item => (
              <div key={item.id} className="glass-card media-card" style={{ overflow: 'hidden', cursor: 'pointer', transition: '0.2s' }}>
                <div style={{ height: viewMode === 'grid' ? '160px' : '80px', background: `linear-gradient(135deg, ${item.color}22, ${item.color}44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <ImageIcon size={viewMode === 'grid' ? 48 : 32} color={item.color} style={{ opacity: 0.6 }} />
                  <div style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '10px' }}>
                    <Lock size={10} /> Encrypted
                  </div>
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ color: 'white', fontSize: '13px', fontWeight: '500', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</div>
                  <div style={{ color: '#64748b', fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{item.size}</span>
                    <span>{item.from}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'videos' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mediaItems.videos.map(item => (
              <div key={item.id} className="glass-card media-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: '0.2s' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Film size={28} color="#8b5cf6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: '500', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>{item.size} • {item.duration} • From {item.from}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', color: '#8b5cf6', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Eye size={16} /></button>
                  <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Download size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'audio' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {mediaItems.audio.map(item => (
              <div key={item.id} className="glass-card media-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: '0.2s' }}>
                <div style={{ width: '64px', height: '64px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Mic size={28} color="#10b981" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontWeight: '500', marginBottom: '4px' }}>{item.name}</div>
                  <div style={{ color: '#64748b', fontSize: '13px' }}>{item.size} • {item.duration} • From {item.from}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#10b981', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Eye size={16} /></button>
                  <button style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}><Download size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
      <style>{`
        .media-card:hover { border-color: rgba(245, 158, 11, 0.5) !important; transform: translateY(-2px); }
      `}</style>
    </div>
  );
};

export default MediaGalleryPage;
