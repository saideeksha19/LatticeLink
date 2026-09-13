import React, { useState, useEffect } from 'react';
import { Network, Circle, Activity } from 'lucide-react';

export const QuantumCommunicationCanvas = () => {
  return (
    <div className="glass-card" style={{ 
      padding: '0', 
      height: '400px', 
      position: 'relative', 
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'radial-gradient(circle at center, rgba(30,58,138,0.2) 0%, rgba(2,6,23,0) 70%)'
    }}>
      <div style={{ position: 'absolute', top: '24px', left: '24px', zIndex: 10 }}>
        <h3 style={{ color: 'white', margin: '0 0 4px 0', fontSize: '18px', fontWeight: '500' }}>Quantum Communication Canvas</h3>
        <div style={{ color: '#10b981', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Network size={14} /> Live Encrypted Network
        </div>
      </div>

      {/* Central Node (You) */}
      <div style={{ position: 'absolute', zIndex: 5, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', border: '2px solid rgba(59, 130, 246, 0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)', animation: 'pulse 2s infinite' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>YOU</span>
          </div>
        </div>
        <span style={{ color: 'white', marginTop: '8px', fontSize: '14px', fontWeight: '500' }}>Shamith R</span>
      </div>

      {/* Orbiting Nodes */}
      <div className="orbit-container" style={{ position: 'absolute', width: '300px', height: '300px', animation: 'spin 20s linear infinite' }}>
        
        {/* Node 1: Alice */}
        <div style={{ position: 'absolute', top: '-25px', left: '125px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'spin-reverse 20s linear infinite' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#1e293b', border: '2px solid #10b981', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ color: 'white', fontSize: '12px' }}>Alice</span>
          </div>
        </div>

        {/* Node 2: Project Team */}
        <div style={{ position: 'absolute', bottom: '25px', right: '-10px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'spin-reverse 20s linear infinite' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: '#1e293b', border: '2px dashed #8b5cf6', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ color: 'white', fontSize: '11px', textAlign: 'center' }}>Project<br/>Team</span>
          </div>
        </div>

        {/* Node 3: Bob */}
        <div style={{ position: 'absolute', bottom: '25px', left: '-10px', display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'spin-reverse 20s linear infinite' }}>
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: '#1e293b', border: '2px solid #f59e0b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ color: 'white', fontSize: '12px' }}>Bob</span>
          </div>
        </div>
        
        {/* Connection Lines (SVG) */}
        <svg width="300" height="300" style={{ position: 'absolute', inset: 0, zIndex: -1 }}>
          <circle cx="150" cy="150" r="150" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="5,5" />
          <line x1="150" y1="150" x2="150" y2="0" stroke="rgba(16,185,129,0.3)" strokeWidth="2" />
          <line x1="150" y1="150" x2="280" y2="225" stroke="rgba(139,92,246,0.3)" strokeWidth="2" />
          <line x1="150" y1="150" x2="20" y2="225" stroke="rgba(245,158,11,0.3)" strokeWidth="2" />
        </svg>

      </div>

      <style>{`
        @keyframes pulse { 0% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); } 50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.6); } 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
      `}</style>
    </div>
  );
};
