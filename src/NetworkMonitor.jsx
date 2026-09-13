import React, { useState, useEffect } from 'react';
import { Globe, Monitor, Server, ShieldAlert, CheckCircle2, Terminal, Radio, Cpu, Network, Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import MatrixRain from './MatrixRain';
import { motion, AnimatePresence } from 'framer-motion';

// Pre-defined nodes spread out in a perfect pentagonal ring around the core
const NODES = [
  { id: 'core', type: 'server', label: 'Quantum Core', x: 50, y: 50, color: '#3b82f6', desc: 'Central orchestration engine managing global state and key rotation.', uptime: '99.999%', latency: '2ms' },
  { id: 'n1', type: 'relay', label: 'Relay Alpha', x: 50, y: 15, color: '#10b981', desc: 'Sector A quantum-safe routing hub.', uptime: '99.98%', latency: '12ms' },
  { id: 'n2', type: 'relay', label: 'Relay Beta', x: 83, y: 39, color: '#10b981', desc: 'Sector B high-speed peering node.', uptime: '99.95%', latency: '24ms' },
  { id: 'n3', type: 'relay', label: 'Relay Gamma', x: 71, y: 78, color: '#10b981', desc: 'Sector C low-latency edge node.', uptime: '99.99%', latency: '8ms' },
  { id: 'n4', type: 'client', label: 'Client Terminal', x: 29, y: 78, color: '#8b5cf6', desc: 'Active secure session endpoint.', uptime: 'Online', latency: '35ms' },
  { id: 'n5', type: 'client', label: 'Auth Subsystem', x: 17, y: 39, color: '#8b5cf6', desc: 'Background synchronization process.', uptime: 'Online', latency: '42ms' },
  { id: 'rogue', type: 'threat', label: 'Rogue Interceptor', x: 50, y: 90, color: '#ef4444', desc: 'Unidentified entity attempting man-in-the-middle attack.', uptime: 'UNKNOWN', latency: 'N/A' }, // Only active in attack mode
];

// Pre-defined connections for a clean web
const LINKS = [
  { from: 'n1', to: 'core' },
  { from: 'n2', to: 'core' },
  { from: 'n3', to: 'core' },
  { from: 'n4', to: 'core' },
  { from: 'n5', to: 'core' },
  { from: 'n1', to: 'n2' },
  { from: 'n2', to: 'n3' },
  { from: 'n3', to: 'n4' },
  { from: 'n4', to: 'n5' },
  { from: 'n5', to: 'n1' }
];

const NetworkMonitor = () => {
  const [attackMode, setAttackMode] = useState(false);
  const [logs, setLogs] = useState([]);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);

  // Terminal logging simulator
  useEffect(() => {
    const addLog = () => {
      const messages = attackMode 
        ? [
            "[WARN] Anomalous traffic detected at edge node",
            "[ALERT] Unauthorized ML-KEM encapsulation attempt",
            "[CRITICAL] Rogue interceptor pinging Relays",
            "[DEFENSE] Dilithium signature mismatch - dropping packet",
            "[SYSTEM] Rerouting traffic through secure tunnels...",
            "[GLITCH] q-state superposition collapse detected"
          ]
        : [
            "[INFO] Secure handshake verified via Relay Beta",
            "[SUCCESS] Packet delivered with Zero-Knowledge",
            "[INFO] Quantum entropy pool replenished",
            "[SYSTEM] Node topology stable, latency 12ms",
            "[INFO] Rotating session keys successfully"
          ];
      const newLog = messages[Math.floor(Math.random() * messages.length)];
      setLogs(prev => [...prev.slice(-14), `[${new Date().toISOString().split('T')[1].slice(0,-1)}] ${newLog}`]);
    };
    
    const interval = setInterval(addLog, 1500);
    return () => clearInterval(interval);
  }, [attackMode]);

  const primaryColor = attackMode ? '#ef4444' : '#38bdf8';
  const secondaryColor = attackMode ? '#f59e0b' : '#3b82f6';
  const glowColor = attackMode ? 'rgba(239, 68, 68, 0.5)' : 'rgba(56, 189, 248, 0.5)';

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <MatrixRain />
      
      {/* Background World Map Image */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5,
        backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        opacity: 0.08,
        mixBlendMode: 'screen',
        filter: attackMode ? 'contrast(2) hue-rotate(300deg)' : 'contrast(1.5) hue-rotate(180deg)',
        transition: 'filter 1s ease'
      }}></div>

      {/* Screen Glitch Overlay for Attack Mode */}
      {attackMode && <div className="glitch-overlay"></div>}

      {/* Header controls over map */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '32px', zIndex: 30, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', pointerEvents: 'none' }}>
        <div>
          <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px', textShadow: `0 2px 10px ${glowColor}` }}>
            <Network size={36} color={primaryColor} /> Global Threat Map
          </h1>
          <p style={{ color: '#cbd5e1', margin: 0, textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>Live quantum topology and packet traversal.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', pointerEvents: 'auto' }}>
          <button 
            onClick={() => setAttackMode(false)}
            style={{ background: !attackMode ? 'rgba(16, 185, 129, 0.2)' : 'rgba(0,0,0,0.4)', border: `1px solid ${!attackMode ? '#10b981' : 'rgba(255,255,255,0.2)'}`, color: !attackMode ? '#10b981' : 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s', backdropFilter: 'blur(10px)' }}
          >
            <CheckCircle2 size={18} /> Secure State
          </button>
          <button 
            onClick={() => setAttackMode(true)}
            style={{ background: attackMode ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0,0,0,0.4)', border: `1px solid ${attackMode ? '#ef4444' : 'rgba(255,255,255,0.2)'}`, color: attackMode ? '#ef4444' : 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s', backdropFilter: 'blur(10px)' }}
          >
            <ShieldAlert size={18} /> Simulate Attack
          </button>
        </div>
      </div>

      {/* Right Side Panel - Cyber Metrics */}
      <AnimatePresence>
        {rightPanelOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 20 }}
            style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '320px', background: 'rgba(10, 15, 30, 0.9)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.1)', zIndex: 40, padding: '32px 24px', display: 'flex', flexDirection: 'column', gap: '32px' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
              <span style={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={18} color={primaryColor} /> SYSTEM TELEMETRY</span>
              <button onClick={() => setRightPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><ChevronRight size={24} /></button>
            </div>
            <div className="cyber-metric">
              <div className="metric-label">ENTANGLEMENT RATIO</div>
              <div className="metric-value" style={{ color: primaryColor }}>{attackMode ? '42.1%' : '99.9%'}</div>
              <div className="metric-bar"><div style={{ width: attackMode ? '42%' : '99%', background: primaryColor }}></div></div>
            </div>
            <div className="cyber-metric">
              <div className="metric-label">CORE TEMPERATURE</div>
              <div className="metric-value" style={{ color: secondaryColor }}>{attackMode ? '4,502 K' : '2.1 K'}</div>
              <div className="metric-bar"><div style={{ width: attackMode ? '85%' : '15%', background: secondaryColor }}></div></div>
            </div>
            <div className="cyber-metric">
              <div className="metric-label">LATTICE INTEGRITY</div>
              <div className="metric-value" style={{ color: attackMode ? '#ef4444' : '#10b981' }}>{attackMode ? 'CRITICAL' : 'OPTIMAL'}</div>
              <div className="metric-bar"><div style={{ width: attackMode ? '12%' : '100%', background: attackMode ? '#ef4444' : '#10b981' }}></div></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left Side Panel - Terminal Stream */}
      <AnimatePresence>
        {leftPanelOpen && (
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 20 }}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '400px', background: 'rgba(10, 15, 30, 0.95)', backdropFilter: 'blur(20px)', borderRight: '1px solid rgba(255,255,255,0.1)', zIndex: 40, padding: '32px 24px', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '16px' }}>
              <span style={{ color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'monospace' }}><Terminal size={18} color={primaryColor} /> LOG STREAM</span>
              <button onClick={() => setLeftPanelOpen(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}><ChevronLeft size={24} /></button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', fontFamily: 'monospace', fontSize: '12px' }}>
              <AnimatePresence>
                {logs.map((log, i) => {
                  const isAlert = log.includes('[WARN]') || log.includes('[CRITICAL]') || log.includes('[ALERT]') || log.includes('[GLITCH]');
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} style={{ color: isAlert ? '#ef4444' : '#10b981', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {log}
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Buttons (Visible when panels are closed) */}
      {!rightPanelOpen && (
        <button onClick={() => setRightPanelOpen(true)} style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 30, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRight: 'none', padding: '16px 8px', borderRadius: '8px 0 0 8px', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
          <Activity size={20} color={primaryColor} />
        </button>
      )}
      {!leftPanelOpen && (
        <button onClick={() => setLeftPanelOpen(true)} style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', zIndex: 30, background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderLeft: 'none', padding: '16px 8px', borderRadius: '0 8px 8px 0', color: 'white', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
          <Terminal size={20} color={primaryColor} />
        </button>
      )}

      {/* Main Map Stage */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {/* Nodes and Links Layer (Responsive coordinate system via percentages) */}
        <div style={{ position: 'relative', width: '90%', height: '80%', maxWidth: '1200px', maxHeight: '800px', zIndex: 20 }}>
          
          {/* SVG for connections and data streams */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', pointerEvents: 'none' }}>
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Render standard links */}
            {LINKS.map((link, i) => {
              const fromNode = NODES.find(n => n.id === link.from);
              const toNode = NODES.find(n => n.id === link.to);
              const color = attackMode ? '#f59e0b' : '#3b82f6';
              return (
                <g key={i}>
                  {/* Background static line */}
                  <line x1={`${fromNode.x}%`} y1={`${fromNode.y}%`} x2={`${toNode.x}%`} y2={`${toNode.y}%`} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  {/* Glowing animated packet line */}
                  <line x1={`${fromNode.x}%`} y1={`${fromNode.y}%`} x2={`${toNode.x}%`} y2={`${toNode.y}%`} 
                        stroke={color} strokeWidth="2" filter="url(#glow)" 
                        strokeDasharray="10 40" strokeLinecap="round" 
                        className="packet-stream" />
                </g>
              );
            })}

            {/* Render Attack Links if in attack mode */}
            {attackMode && (
              <>
                <line x1="35%" y1="80%" x2="50%" y2="50%" stroke="#ef4444" strokeWidth="2" filter="url(#glow)" strokeDasharray="10 30" className="packet-stream attack-stream" />
                <line x1="35%" y1="80%" x2="15%" y2="65%" stroke="#ef4444" strokeWidth="2" filter="url(#glow)" strokeDasharray="10 30" className="packet-stream attack-stream-fast" />
                <line x1="35%" y1="80%" x2="65%" y2="85%" stroke="#ef4444" strokeWidth="2" filter="url(#glow)" strokeDasharray="10 30" className="packet-stream attack-stream" />
              </>
            )}
          </svg>

          {/* Render HTML Nodes */}
          {NODES.map(node => {
            if (node.id === 'rogue' && !attackMode) return null;
            
            let Icon = Monitor;
            if (node.type === 'server') Icon = Server;
            if (node.type === 'relay') Icon = Radio;
            if (node.type === 'threat') Icon = ShieldAlert;
            if (node.id === 'n5') Icon = Cpu;

            return (
              <motion.div 
                key={node.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                className="map-node"
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{
                  position: 'absolute',
                  left: `${node.x}%`,
                  top: `${node.y}%`,
                  transform: 'translate(-50%, -50%)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  cursor: 'crosshair',
                  zIndex: hoveredNode?.id === node.id ? 60 : (node.type === 'server' ? 30 : 20)
                }}
              >
                {/* Node Ring Animation */}
                <div style={{ position: 'absolute', width: '60px', height: '60px', border: `1px solid ${node.color}`, borderRadius: '50%', opacity: 0.3, animation: 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite' }}></div>
                <div style={{ position: 'absolute', width: '40px', height: '40px', border: `1px solid ${node.color}`, borderRadius: '50%', opacity: 0.5, animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite', animationDelay: '1s' }}></div>
                
                {/* Node Core */}
                <div style={{ 
                  width: node.type === 'server' ? '50px' : '36px', 
                  height: node.type === 'server' ? '50px' : '36px', 
                  borderRadius: '50%', 
                  background: `rgba(15,23,42,0.8)`, 
                  border: `2px solid ${node.color}`, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: hoveredNode?.id === node.id ? `0 0 30px ${node.color}` : `0 0 20px ${node.color}66`,
                  backdropFilter: 'blur(5px)',
                  transition: 'box-shadow 0.3s'
                }}>
                  <Icon size={node.type === 'server' ? 24 : 16} color={node.color} />
                </div>

                {/* Node Label */}
                <div style={{ marginTop: '8px', background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: '4px', border: `1px solid ${hoveredNode?.id === node.id ? node.color : 'rgba(255,255,255,0.1)'}`, color: 'white', fontSize: '11px', fontWeight: 'bold', whiteSpace: 'nowrap', backdropFilter: 'blur(4px)', transition: 'border 0.3s' }}>
                  {node.label}
                </div>

                {/* Hover Panel Tooltip */}
                <AnimatePresence>
                  {hoveredNode?.id === node.id && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                      exit={{ opacity: 0, scale: 0.95 }}
                      style={{ 
                        position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', 
                        marginTop: '16px', width: '220px', background: 'rgba(10,15,30,0.95)', 
                        border: `1px solid ${node.color}`, borderRadius: '8px', padding: '12px',
                        boxShadow: `0 10px 30px rgba(0,0,0,0.5), 0 0 20px ${node.color}33`,
                        backdropFilter: 'blur(10px)', zIndex: 100, textAlign: 'left', pointerEvents: 'none'
                      }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                        <Icon size={14} color={node.color} />
                        <span style={{ color: 'white', fontSize: '12px', fontWeight: 'bold' }}>{node.label}</span>
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '11px', marginBottom: '12px', lineHeight: '1.4' }}>
                        {node.desc}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 'bold' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ color: '#64748b' }}>UPTIME</span>
                          <span style={{ color: '#10b981' }}>{node.uptime}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                          <span style={{ color: '#64748b' }}>LATENCY</span>
                          <span style={{ color: '#38bdf8' }}>{node.latency}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Attack Glitch Overlay */}
                {attackMode && node.id === 'core' && (
                   <div style={{ position: 'absolute', bottom: '-25px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '900', letterSpacing: '1px', border: '1px solid #ef4444', animation: 'flash 1s infinite' }}>
                     TARGET LOCKED
                   </div>
                )}
                {attackMode && node.type === 'relay' && Math.random() > 0.5 && (
                   <div style={{ position: 'absolute', bottom: '-25px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '9px', fontWeight: '900', letterSpacing: '1px', border: '1px solid #ef4444', animation: 'flash 0.5s infinite' }}>
                     INTERCEPT DETECTED
                   </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      <style>{`
        .packet-stream {
          animation: dashStream 3s linear infinite;
        }
        .attack-stream {
          animation: dashStreamReverse 2s linear infinite;
        }
        .attack-stream-fast {
          animation: dashStreamReverse 1s linear infinite;
        }
        
        @keyframes dashStream {
          from { stroke-dashoffset: 100; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes dashStreamReverse {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 100; }
        }

        @keyframes ping {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }

        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        
        .map-node:hover {
          transform: translate(-50%, -50%) scale(1.1) !important;
          z-index: 50 !important;
        }

        /* Cyber Metrics HUD */
        .cyber-metric {
          background: rgba(10, 15, 30, 0.6);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 12px 16px;
          border-radius: 8px;
          width: 250px;
          backdrop-filter: blur(10px);
        }
        .metric-label {
          color: #94a3b8;
          font-size: 10px;
          font-weight: bold;
          letter-spacing: 2px;
          margin-bottom: 4px;
        }
        .metric-value {
          font-size: 24px;
          font-weight: 900;
          font-family: monospace;
          margin-bottom: 8px;
          text-shadow: 0 0 10px currentColor;
        }
        .metric-bar {
          height: 4px;
          background: rgba(255,255,255,0.1);
          border-radius: 2px;
          overflow: hidden;
        }
        .metric-bar > div {
          height: 100%;
          transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Attack Glitch FX */
        .glitch-overlay {
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(0deg, rgba(239, 68, 68, 0.05) 0px, rgba(239, 68, 68, 0.05) 1px, transparent 1px, transparent 2px);
          pointer-events: none;
          z-index: 50;
          animation: scanline 8s linear infinite;
        }
        @keyframes scanline {
          from { background-position: 0 0; }
          to { background-position: 0 100vh; }
        }
      `}</style>
    </div>
  );
};

export default NetworkMonitor;
