import React, { useState, useEffect } from 'react';
import { User, Server, Globe, ShieldX, CheckCircle, AlertTriangle, Hexagon } from 'lucide-react';

const PacketFlowMonitor = ({ activeAttack, simStep, simulating }) => {
  const [packetPos, setPacketPos] = useState(0); 

  useEffect(() => {
    if (!activeAttack || !simulating) {
      // Normal continuous flow
      const interval = setInterval(() => {
        setPacketPos(prev => (prev >= 100 ? 0 : prev + 2));
      }, 50);
      return () => clearInterval(interval);
    }
  }, [activeAttack, simulating]);

  let packetColor = '#10b981'; // normal (green)
  let glowColor = 'rgba(16,185,129,0.6)';
  if (activeAttack && simulating && (activeAttack.id === 'mitm' || activeAttack.id === 'fake')) {
    if (simStep >= 1) {
      packetColor = '#ef4444'; // modified/fake
      glowColor = 'rgba(239,68,68,0.6)';
    }
  }

  // Determine positions based on attack simulation steps
  let currentPos = packetPos;
  let showMallory = false;
  let rejected = false;

  if (activeAttack) {
    if (activeAttack.id === 'mitm' || activeAttack.id === 'replay' || activeAttack.id === 'fake') {
      showMallory = true;
    }
    
    if (simulating) {
      if (activeAttack.id === 'mitm') {
        if (simStep === 0) currentPos = 25;
        else if (simStep === 1) currentPos = 50;
        else if (simStep === 2) currentPos = 75;
        else if (simStep >= 3) { currentPos = 95; rejected = true; }
      } else if (activeAttack.id === 'replay') {
        if (simStep === 0) currentPos = 50; 
        else if (simStep === 1) currentPos = 75; 
        else if (simStep >= 2) { currentPos = 95; rejected = true; }
      } else if (activeAttack.id === 'fake') {
        if (simStep === 0 || simStep === 1) currentPos = 50;
        else if (simStep === 2) currentPos = 75;
        else if (simStep >= 3) { currentPos = 95; rejected = true; }
      }
    } else if (simStep >= 3) {
      // Keep it in the rejected state after the simulation finishes
      if (activeAttack.id === 'mitm' || activeAttack.id === 'fake' || (activeAttack.id === 'replay' && simStep >= 2)) {
        currentPos = 95;
        rejected = true;
        if (activeAttack.id === 'mitm' || activeAttack.id === 'fake') {
          packetColor = '#ef4444';
          glowColor = 'rgba(239,68,68,0.6)';
        }
      }
    }
  }

  // Map 0-100 to Isometric pixels
  // Left node is at 100px, Right node is at 600px. Distance = 500px.
  // We apply this inside the 3D transformed container.
  const packetX = 100 + (currentPos / 100) * 500;

  return (
    <div className="glass-card" style={{ padding: '24px', background: 'rgba(15, 23, 42, 0.7)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', marginTop: '24px', position: 'relative', overflow: 'hidden' }}>
      <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 10, position: 'relative' }}>
        <Globe size={20} color="#3b82f6" /> 3D Packet Analysis Pipeline
      </h3>

      <div style={{ position: 'relative', height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: '1000px' }}>
        
        {/* 3D Isometric Container */}
        <div style={{
          position: 'absolute',
          width: '700px',
          height: '200px',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(55deg) rotateZ(-10deg)', // slightly different angle for pipeline
          transition: 'transform 0.5s ease',
        }}>

          {/* Glowing Track Base */}
          <div style={{
            position: 'absolute',
            left: '100px', right: '100px', top: '100px',
            height: '20px',
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.3)',
            boxShadow: '0 0 20px rgba(59,130,246,0.2) inset, 0 10px 20px rgba(0,0,0,0.5)',
            transform: 'translateZ(-5px)'
          }}></div>

          {/* Nodes */}
          
          {/* Alice */}
          <div className="pipeline-node" style={{ left: '100px', top: '100px' }}>
            <div className="pipeline-pedestal blue"></div>
            <div className="pipeline-content">
              <User size={24} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 10px #3b82f6)' }} />
              <div className="pipeline-label">Alice</div>
            </div>
          </div>

          {/* Internet Relay */}
          <div className="pipeline-node" style={{ left: '350px', top: '100px' }}>
            <div className="pipeline-pedestal gray"></div>
            <div className="pipeline-content">
              <Server size={24} color="#94a3b8" />
              <div className="pipeline-label" style={{ color: '#94a3b8' }}>Relay</div>
            </div>
          </div>

          {/* Bob (with Shield) */}
          <div className="pipeline-node" style={{ left: '600px', top: '100px' }}>
            <div className="pipeline-pedestal green"></div>
            
            {/* Defensive Shield around Bob */}
            <div style={{
              position: 'absolute',
              width: '80px', height: '80px',
              borderRadius: '50%',
              border: rejected ? '2px solid #ef4444' : '2px dashed #10b981',
              boxShadow: rejected ? '0 0 30px rgba(239,68,68,0.4)' : 'inset 0 0 20px rgba(16,185,129,0.2)',
              top: '-40px', left: '-40px',
              animation: 'spin 10s linear infinite',
              transition: 'border-color 0.3s, box-shadow 0.3s',
              transform: 'translateZ(20px) rotateX(90deg)', // Shield stands upright
              opacity: 0.6
            }}></div>

            <div className="pipeline-content">
              <User size={24} color="#10b981" style={{ filter: 'drop-shadow(0 0 10px #10b981)' }} />
              <div className="pipeline-label">Bob</div>
            </div>
          </div>

          {/* Mallory (Attacker) - Drops from above */}
          <div className="pipeline-node" style={{ 
            left: '350px', top: '100px', 
            opacity: showMallory ? 1 : 0, 
            transform: showMallory ? 'translateZ(80px)' : 'translateZ(200px)',
            transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}>
            <div className="pipeline-pedestal red" style={{ height: '30px' }}></div>
            <div className="pipeline-content">
              <AlertTriangle size={24} color="#ef4444" style={{ filter: 'drop-shadow(0 0 15px #ef4444)' }} />
              <div className="pipeline-label" style={{ color: '#ef4444', border: '1px solid #ef4444' }}>Mallory</div>
            </div>
            
            {/* Laser beam down to pipeline */}
            {showMallory && (
              <div style={{
                position: 'absolute',
                width: '4px',
                height: '80px',
                background: 'linear-gradient(to bottom, #ef4444, transparent)',
                left: '-2px',
                top: '0px',
                transform: 'translateZ(-40px) rotateX(90deg)',
                transformOrigin: 'top',
                boxShadow: '0 0 10px #ef4444'
              }}></div>
            )}
          </div>

          {/* The Data Packet (3D Cube) */}
          <div style={{ 
            position: 'absolute', 
            left: `${packetX}px`, 
            top: '110px',
            transform: 'translateZ(15px)', // floats above the track
            zIndex: 4,
            transition: activeAttack ? 'left 0.5s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}>
            {/* 3D Isometric Packet */}
            <div style={{
              position: 'relative',
              width: '16px', height: '16px',
              background: packetColor,
              boxShadow: `0 0 20px ${glowColor}`,
              transform: 'rotateX(90deg) rotateZ(45deg)', // makes it look like a diamond floating
            }}>
              {/* Fake thickness */}
              <div style={{ position: 'absolute', width: '100%', height: '8px', background: 'rgba(0,0,0,0.3)', bottom: '-8px', left: 0, transform: 'rotateX(-90deg)', transformOrigin: 'top' }}></div>
              <div style={{ position: 'absolute', width: '8px', height: '100%', background: 'rgba(255,255,255,0.3)', right: '-8px', top: 0, transform: 'rotateY(90deg)', transformOrigin: 'left' }}></div>
            </div>
          </div>

          {/* Rejection indicator at Bob's shield */}
          {rejected && (
            <div style={{ position: 'absolute', left: '550px', top: '110px', transform: 'translateZ(40px) rotateX(90deg) rotateY(-45deg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.9)', padding: '6px 12px', borderRadius: '8px', border: '1px solid #ef4444', color: 'white', fontWeight: 'bold', fontSize: '12px', boxShadow: '0 0 20px rgba(239,68,68,0.6)', animation: 'pulse 0.5s infinite' }}>
                <ShieldX size={16} /> REJECTED
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes spin { 100% { transform: translateZ(20px) rotateX(90deg) rotateY(360deg); } }
        
        .pipeline-node {
          position: absolute;
          transform-style: preserve-3d;
        }

        .pipeline-pedestal {
          position: absolute;
          width: 40px; height: 40px;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: rgba(255,255,255,0.05);
          box-shadow: 0 0 20px rgba(255,255,255,0.1) inset;
        }
        .pipeline-pedestal.blue { border: 2px solid #3b82f6; box-shadow: 0 0 15px rgba(59,130,246,0.3) inset; }
        .pipeline-pedestal.gray { border: 2px solid #94a3b8; }
        .pipeline-pedestal.green { border: 2px solid #10b981; box-shadow: 0 0 15px rgba(16,185,129,0.3) inset; }
        .pipeline-pedestal.red { border: 2px solid #ef4444; box-shadow: 0 0 15px rgba(239,68,68,0.3) inset; }

        .pipeline-content {
          position: absolute;
          transform: rotateZ(10deg) rotateX(-55deg) translate(-50%, -100%);
          transform-origin: bottom center;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding-bottom: 20px;
        }

        .pipeline-label {
          color: white;
          font-weight: 600;
          font-size: 11px;
          margin-top: 8px;
          background: rgba(15, 23, 42, 0.8);
          padding: 2px 8px;
          border-radius: 4px;
          border: 1px solid rgba(255,255,255,0.1);
        }
      `}</style>
    </div>
  );
};

export default PacketFlowMonitor;
