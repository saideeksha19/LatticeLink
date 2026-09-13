import React from 'react';
import { ShieldAlert, Activity, Globe, RefreshCcw, Network } from 'lucide-react';

export const LSOCHero = () => {
  return (
    <div style={{ 
      padding: '32px', 
      background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(2, 6, 23, 0.95) 100%)',
      border: '1px solid rgba(56, 189, 248, 0.2)',
      borderRadius: '16px',
      boxShadow: '0 0 40px rgba(15, 23, 42, 0.8)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'linear-gradient(90deg, transparent, #38bdf8, transparent)' }}></div>
      <div style={{ position: 'absolute', right: '-5%', top: '-50%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.1) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(30px)', zIndex: 0 }}></div>

      <div style={{ zIndex: 10 }}>
        <div style={{ color: '#38bdf8', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px', fontWeight: '600' }}>Quantum Security Operations Center</div>
        <h1 style={{ color: 'white', fontSize: '36px', margin: '0 0 8px 0', fontWeight: 'bold' }}>Global Security Overview</h1>
        <div style={{ color: '#94a3b8', fontSize: '15px' }}>Administrator: <span style={{ color: 'white' }}>System Admin</span></div>
      </div>

      <div style={{ display: 'flex', gap: '16px', zIndex: 10 }}>
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(56, 189, 248, 0.1)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><RefreshCcw size={14}/> Last Refresh</div>
          <div style={{ color: '#10b981', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><div style={{ width: '8px', height: '8px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981', animation: 'pulse 2s infinite' }}></div> LIVE</div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(56, 189, 248, 0.1)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Network size={14}/> Connected Nodes</div>
          <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>42</div>
        </div>

        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(56, 189, 248, 0.1)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
          <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Activity size={14}/> Secure Tunnels</div>
          <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>128</div>
        </div>

        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '16px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '140px' }}>
          <div style={{ color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}><ShieldAlert size={14}/> Threat Level</div>
          <div style={{ color: '#10b981', fontSize: '24px', fontWeight: 'bold' }}>LOW</div>
        </div>
      </div>
    </div>
  );
};

export const GlobalQuantumGlobe = () => {
  return (
    <div style={{ 
      padding: '24px', 
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(56, 189, 248, 0.1)',
      borderRadius: '16px',
      height: '500px',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '500', zIndex: 10, display: 'flex', alignItems: 'center', gap: '8px' }}><Globe size={18} color="#38bdf8"/> Global Network Topography</h3>
      
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
         {/* Placeholder for 3D Globe - we'll simulate a 2D network map for now */}
         <div style={{ width: '350px', height: '350px', borderRadius: '50%', border: '1px solid rgba(56, 189, 248, 0.2)', background: 'radial-gradient(circle, rgba(15,23,42,0) 0%, rgba(2,6,23,1) 100%)', position: 'relative', animation: 'spin 60s linear infinite' }}>
            
            {/* Grid overlay */}
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'repeating-linear-gradient(0deg, transparent, transparent 19px, rgba(56,189,248,0.05) 20px), repeating-linear-gradient(90deg, transparent, transparent 19px, rgba(56,189,248,0.05) 20px)' }}></div>
            
            {/* Nodes */}
            <div style={{ position: 'absolute', top: '20%', left: '30%', width: '8px', height: '8px', background: '#38bdf8', borderRadius: '50%', boxShadow: '0 0 15px #38bdf8' }}></div>
            <div style={{ position: 'absolute', top: '60%', left: '20%', width: '6px', height: '6px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }}></div>
            <div style={{ position: 'absolute', top: '40%', right: '25%', width: '10px', height: '10px', background: '#8b5cf6', borderRadius: '50%', boxShadow: '0 0 20px #8b5cf6' }}></div>
            <div style={{ position: 'absolute', bottom: '25%', right: '40%', width: '6px', height: '6px', background: '#f59e0b', borderRadius: '50%', boxShadow: '0 0 10px #f59e0b' }}></div>

            {/* Connecting Lines */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
              <path d="M105,70 Q150,150 262,140" fill="none" stroke="rgba(56, 189, 248, 0.3)" strokeWidth="1" strokeDasharray="4 4" />
              <path d="M70,210 Q150,150 262,140" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
              <path d="M210,262 Q180,180 105,70" fill="none" stroke="rgba(139, 92, 246, 0.3)" strokeWidth="1" />
            </svg>
         </div>
      </div>
      
      {/* Node Info Overlay */}
      <div style={{ position: 'absolute', bottom: '24px', left: '24px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', border: '1px solid rgba(56,189,248,0.2)', padding: '16px', borderRadius: '12px', zIndex: 10, minWidth: '200px' }}>
         <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Targeting Node: Alice</div>
         <div style={{ color: 'white', fontSize: '14px', fontWeight: '600', marginBottom: '12px' }}>India (NODE-82B)</div>
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}><span style={{ color: '#94a3b8' }}>Latency</span> <span style={{ color: '#10b981' }}>12 ms</span></div>
         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}><span style={{ color: '#94a3b8' }}>Status</span> <span style={{ color: '#38bdf8' }}>Secure Tunnel</span></div>
      </div>
    </div>
  );
};
