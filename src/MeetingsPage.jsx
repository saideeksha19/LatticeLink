import React from 'react';
import { Presentation, Video, Users, Clock, ShieldCheck, Activity, Key } from 'lucide-react';
import MatrixRain from './MatrixRain';

const MeetingsPage = () => {
  const activeRooms = [
    { id: 1, name: "Global Threat Intel Sync", participants: 12, duration: "45m", status: "Active" },
    { id: 2, name: "Project Lattice Kickoff", participants: 4, duration: "1h 20m", status: "Active" }
  ];

  const pastRooms = [
    { id: 3, name: "Emergency Node Review", date: "Today", participants: 8 },
    { id: 4, name: "Weekly Operator Sync", date: "Yesterday", participants: 25 }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Presentation size={32} color="#8b5cf6" /> Secure Meeting Workspaces
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Join active quantum-encrypted virtual rooms.</p>
          </div>
          <button className="neon-button" style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(139, 92, 246, 0.1)', borderColor: '#8b5cf6', color: '#8b5cf6', boxShadow: '0 0 15px rgba(139, 92, 246, 0.3)' }}>
            <Video size={18} /> Host New Workspace
          </button>
        </div>

        <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="#10b981" /> Active Tunnels
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '24px', marginBottom: '48px' }}>
          {activeRooms.map(room => (
            <div key={room.id} className="glass-card" style={{ padding: '24px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(15, 23, 42, 0.8)' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                 <h3 style={{ color: 'white', margin: 0, fontSize: '18px' }}>{room.name}</h3>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                   <div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', animation: 'pulse 2s infinite' }}></div> Live
                 </span>
               </div>
               
               <div style={{ display: 'flex', gap: '24px', marginBottom: '24px', color: '#94a3b8', fontSize: '14px' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Users size={16} color="#3b82f6" /> {room.participants} Operators</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Clock size={16} color="#f59e0b" /> {room.duration} elapsed</div>
               </div>

               <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                  <div style={{ color: '#64748b', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={14} /> Session Cipher
                  </div>
                  <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '12px' }}>ML-KEM / AES-GCM</div>
               </div>

               <button className="neon-button" style={{ width: '100%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                 Join Tunnel
               </button>
            </div>
          ))}
        </div>

        <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px' }}>Past Workspaces</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pastRooms.map(room => (
             <div key={room.id} className="glass-card" style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(15, 23, 42, 0.6)' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                   <ShieldCheck size={20} />
                 </div>
                 <div>
                   <div style={{ color: 'white', fontWeight: 'bold', fontSize: '15px' }}>{room.name}</div>
                   <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>{room.date} • {room.participants} Participants</div>
                 </div>
               </div>
               <button style={{ background: 'transparent', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#3b82f6', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', transition: '0.2s' }} className="hover-btn">
                 View Transcript
               </button>
             </div>
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .hover-btn:hover {
          background: rgba(59, 130, 246, 0.1) !important;
        }
      `}</style>
    </div>
  );
};

export default MeetingsPage;
