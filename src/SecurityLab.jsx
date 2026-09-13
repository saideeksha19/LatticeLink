import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, ShieldAlert, Activity, User, Play, Wifi, 
  UserX, Zap, Bug, Cpu, Crosshair, Skull, CheckCircle2,
  Lock, ArrowRight, ArrowLeft
} from 'lucide-react';
import MatrixRain from './MatrixRain';

export default function SecurityLab() {
  const [activeTest, setActiveTest] = useState(null);
  const [simStep, setSimStep] = useState(0); // 0=idle, 1=transmit, 2=intercept, 3=neutralized
  const [simulating, setSimulating] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { id: 1, sender: 'User_A', text: 'Initializing PQC Secure Channel.', status: 'delivered', time: '12:00' },
    { id: 2, sender: 'User_B', text: 'Channel secure. Awaiting commands.', status: 'delivered', time: '12:01' }
  ]);
  const [inputA, setInputA] = useState('');
  const [inputB, setInputB] = useState('');
  
  const chatScrollARef = useRef(null);
  const chatScrollBRef = useRef(null);

  const attacks = [
    { 
      id: 'mitm', title: "Message Tampering", icon: Wifi, color: "#f59e0b",
      description: "Adversary intercepts message and alters ciphertext payload.",
      protection: "VERIFY SHA3-512 INTEGRITY", reason: "Hash Invalidated"
    },
    { 
      id: 'fake', title: "Spoofing Attack", icon: UserX, color: "#ef4444",
      description: "Unauthorized node masquerades as trusted user.",
      protection: "VERIFY ML-DSA SIGNATURE", reason: "Signature Forgery Blocked"
    },
    { 
      id: 'shor', title: "Shor's Attack", icon: Zap, color: "#8b5cf6",
      description: "Quantum computer attempts to break KEM tunnel.",
      protection: "ACTIVATE LATTICE SHIELD", reason: "LWE Math Impervious"
    },
    { 
      id: 'replay', title: "Replay Attack", icon: Bug, color: "#3b82f6",
      description: "Adversary retransmits captured encrypted packet.",
      protection: "CHECK AES-GCM NONCE", reason: "Stale Session Dropped"
    },
    { 
      id: 'harvest', title: "Harvest & Decrypt", icon: Cpu, color: "#10b981",
      description: "Nation-state recording ciphertexts for future decryption.",
      protection: "ENFORCE FORWARD SECRECY", reason: "Ephemeral Keys Destroyed"
    },
    { 
      id: 'grover', title: "Grover's Search", icon: Crosshair, color: "#06b6d4",
      description: "Quantum search algorithm attacks block cipher.",
      protection: "VERIFY QUANTUM MARGIN", reason: "AES-256 Space Too Large"
    }
  ];

  const activeTestObj = activeTest ? attacks.find(a => a.id === activeTest) : null;

  useEffect(() => {
    chatScrollARef.current?.scrollIntoView({ behavior: 'smooth' });
    chatScrollBRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, simStep]);

  const handleSend = (sender) => {
    if (simulating) return;
    const text = sender === 'User_A' ? inputA : inputB;
    if (!text.trim()) return;

    if (sender === 'User_A') setInputA('');
    else setInputB('');

    const newMsgId = Date.now();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add pending message
    setChatHistory(prev => [...prev, { id: newMsgId, sender, text, status: 'encrypting', time }]);
    
    setSimulating(true);
    setSimStep(1); // Orbiting / Transmitting
    
    // Start transit
    setTimeout(() => {
      setChatHistory(prev => prev.map(m => m.id === newMsgId ? { ...m, status: 'sending' } : m));
      
      // If no attack, deliver successfully
      if (!activeTest) {
        setTimeout(() => {
          setSimStep(0);
          setSimulating(false);
          setChatHistory(prev => prev.map(m => m.id === newMsgId ? { ...m, status: 'delivered' } : m));
        }, 1500);
      } else {
        // Intercepted
        setTimeout(() => {
          setSimStep(2);
          setChatHistory(prev => prev.map(m => m.id === newMsgId ? { ...m, status: 'intercepted' } : m));
        }, 800);
      }
    }, 500);
  };

  const preventAttack = () => {
    setSimStep(3); // Neutralized (Ripple Effect)
    
    // Update message status to dropped because verification failed
    setChatHistory(prev => prev.map(m => m.status === 'intercepted' ? { ...m, status: 'dropped', dropReason: activeTestObj.reason } : m));
    
    setTimeout(() => {
      setSimStep(0);
      setSimulating(false);
    }, 2000);
  };

  // Chat window component generator
  const renderChatWindow = (ownerId, alignLeft) => (
    <div className="chat-window glass-panel">
      <div className="chat-header">
        <div className="avatar">
          <User size={16} />
        </div>
        <div className="chat-info">
          <div className="name">{ownerId === 'User_A' ? 'USER A' : 'USER B'}</div>
          <div className="status"><div className="dot"></div> Secure PQC Session</div>
        </div>
      </div>
      
      <div className="chat-messages">
        {chatHistory.map((msg) => {
          const isMine = msg.sender === ownerId;
          // Hide intercepted/dropped messages from receiver if they never arrived
          if (!isMine && (msg.status === 'encrypting' || msg.status === 'sending' || msg.status === 'intercepted' || msg.status === 'dropped')) return null;

          return (
            <div key={msg.id} className={`message-bubble ${isMine ? 'mine' : 'theirs'} ${msg.status}`}>
              <div className="text">{msg.text}</div>
              <div className="meta">
                <span>{msg.time}</span>
                {isMine && msg.status === 'delivered' && <CheckCircle2 size={12} color="#10b981" />}
                {isMine && msg.status === 'encrypting' && <Lock size={12} className="spin-slow" color="#38bdf8" />}
                {isMine && msg.status === 'sending' && <Activity size={12} className="pulse" color="#8b5cf6" />}
                {isMine && msg.status === 'intercepted' && <ShieldAlert size={12} className="pulse" color="#ef4444" />}
                {isMine && msg.status === 'dropped' && <span style={{color: '#ef4444', fontSize: '9px'}}>{msg.dropReason}</span>}
              </div>
            </div>
          );
        })}
        <div ref={ownerId === 'User_A' ? chatScrollARef : chatScrollBRef} />
      </div>

      <div className="chat-input-area">
        <input 
          type="text" 
          value={ownerId === 'User_A' ? inputA : inputB}
          onChange={e => ownerId === 'User_A' ? setInputA(e.target.value) : setInputB(e.target.value)}
          placeholder="Send encrypted message..."
          onKeyDown={e => e.key === 'Enter' && handleSend(ownerId)}
        />
        <button className="send-btn" onClick={() => handleSend(ownerId)} disabled={simulating}>
          <Play size={14} fill="currentColor" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="quantum-lab">
      <MatrixRain />
      <div className="vignette"></div>

      {/* Header */}
      <header className="lab-header">
        <h1 className="title">
          <ShieldCheck size={24} /> LATTICELINK QUANTUM CHAT UI
        </h1>
        <div className="monitoring-badge">
          <div className="pulse-dot"></div> PQC TUNNEL ACTIVE
        </div>
      </header>

      {/* Main Spatial Area */}
      <main className="spatial-stage">
        
        {/* The Quantum Space Tunnel (Center) */}
        <div className={`quantum-tunnel ${simStep === 2 ? 'glitching' : ''}`}>
          <div className="tunnel-rings">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="ring" style={{ animationDelay: `${i * -0.5}s` }}></div>
            ))}
          </div>
          
          {/* Particles */}
          <div className="particles">
            {[...Array(20)].map((_, i) => (
              <div key={i} className="particle" style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}></div>
            ))}
          </div>

          {/* Active Data Orb (Packet in transit) */}
          {simStep === 1 && (
            <div className={`data-orb ${chatHistory[chatHistory.length-1].sender === 'User_A' ? 'fly-right' : 'fly-left'}`}>
              <div className="orb-core"></div>
              <div className="orb-trail"></div>
            </div>
          )}

          {/* Intercept / Threat Matrix */}
          <div className={`threat-hologram ${simStep >= 2 ? 'active' : ''} ${simStep === 3 ? 'shattering' : ''}`}>
            <div className="hologram-box">
              {simStep === 3 ? <CheckCircle2 size={40} color="#10b981" /> : <Skull size={40} color="#ef4444" className="glitch-shake" />}
            </div>
            {simStep === 2 && activeTestObj && (
              <div className="threat-label">INTERCEPT: {activeTestObj.id.toUpperCase()}</div>
            )}
          </div>

          {/* Defense Ripple */}
          {simStep === 3 && (
            <div className="sonic-ripple"></div>
          )}
        </div>

        {/* Left Chat Window (User A) */}
        <div className="panel-container left">
          {renderChatWindow('User_A', true)}
        </div>

        {/* Right Chat Window (User B) */}
        <div className="panel-container right">
          {renderChatWindow('User_B', false)}
        </div>

        {/* Contextual Alert Panel (Center Overlay) */}
        {simStep >= 2 && activeTestObj && (
          <div className={`alert-overlay glass-panel ${simStep === 3 ? 'neutralized' : ''}`}>
            <h3>
              {simStep === 3 ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />} 
              {simStep === 3 ? 'THREAT NEUTRALIZED' : 'QUANTUM THREAT DETECTED'}
            </h3>
            <p>{simStep === 3 ? activeTestObj.reason : activeTestObj.description}</p>
            {simStep === 2 && (
              <button onClick={preventAttack} className="defense-btn">
                {activeTestObj.protection}
              </button>
            )}
          </div>
        )}

      </main>

      {/* Sleek Bottom Dock */}
      <div className="attack-dock-container">
        <div className="dock-label"><Activity size={12}/> THREAT VECTOR SELECTOR</div>
        <div className="attack-dock glass-panel">
          <button 
            className={`dock-btn ${!activeTest ? 'active' : ''}`}
            onClick={() => { setActiveTest(null); setSimStep(0); }}
            style={{ '--theme': '#10b981' }}
          >
            <ShieldCheck size={18} />
            <span className="tooltip">Safe Channel (No Attack)</span>
          </button>
          <div className="divider"></div>
          {attacks.map(attack => (
            <button 
              key={attack.id}
              onClick={() => { setActiveTest(attack.id); setSimStep(0); }}
              className={`dock-btn ${activeTest === attack.id ? 'active' : ''}`}
              style={{ '--theme': attack.color }}
            >
              <attack.icon size={18} />
              <span className="tooltip">{attack.title}</span>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        /* Global & Layout */
        .quantum-lab {
          min-height: 100vh;
          background: #000;
          color: white;
          font-family: 'Inter', sans-serif;
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .vignette {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 50% 50%, rgba(9,9,11,0.4) 0%, rgba(0,0,0,0.95) 100%);
          pointer-events: none;
          z-index: 1;
        }

        .lab-header {
          position: absolute;
          top: 0; left: 0; right: 0;
          padding: 24px 40px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 10;
        }
        
        .title {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 3px;
          color: #fff;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .title svg { color: #06b6d4; }

        .monitoring-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 11px;
          font-weight: 700;
          color: #10b981;
          letter-spacing: 2px;
          background: rgba(16,185,129,0.1);
          padding: 6px 16px;
          border-radius: 20px;
          border: 1px solid rgba(16,185,129,0.3);
        }

        .pulse-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #10b981;
          animation: pulse 2s infinite;
        }

        .glass-panel {
          background: rgba(9, 9, 11, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
        }

        /* Main Stage */
        .spatial-stage {
          flex: 1;
          position: relative;
          z-index: 5;
          margin-top: 80px;
          margin-bottom: 120px;
        }

        .panel-container {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 320px;
          height: 70vh;
          max-height: 600px;
        }
        .panel-container.left { left: 40px; }
        .panel-container.right { right: 40px; }

        /* Chat Window UI */
        .chat-window {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }
        .chat-header {
          padding: 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(255,255,255,0.02);
        }
        .avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: #1e293b;
          display: flex; justify-content: center; align-items: center;
          color: #06b6d4;
        }
        .name { font-weight: 700; font-size: 13px; color: #f8fafc; letter-spacing: 1px; }
        .status { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #94a3b8; }
        .dot { width: 6px; height: 6px; border-radius: 50%; background: #10b981; }

        .chat-messages {
          flex: 1;
          padding: 16px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-messages::-webkit-scrollbar { width: 4px; }
        .chat-messages::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }

        .message-bubble {
          max-width: 85%;
          padding: 10px 14px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.4;
          position: relative;
          animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .message-bubble.mine {
          align-self: flex-end;
          background: #06b6d4;
          color: #000;
          border-bottom-right-radius: 4px;
        }
        .message-bubble.theirs {
          align-self: flex-start;
          background: #27272a;
          color: #e4e4e7;
          border-bottom-left-radius: 4px;
        }
        .message-bubble.intercepted {
          background: #7f1d1d !important;
          color: #fca5a5 !important;
        }
        
        .meta {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 4px;
          margin-top: 4px;
          font-size: 9px;
          opacity: 0.8;
        }
        .message-bubble.mine .meta { color: rgba(0,0,0,0.6); }

        .chat-input-area {
          padding: 16px;
          display: flex;
          gap: 8px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .chat-input-area input {
          flex: 1;
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 10px 16px;
          color: #fff;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s;
        }
        .chat-input-area input:focus { border-color: #06b6d4; }
        .send-btn {
          width: 36px; height: 36px;
          border-radius: 50%;
          border: none;
          background: #06b6d4;
          color: #000;
          display: flex; justify-content: center; align-items: center;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .send-btn:hover:not(:disabled) { transform: scale(1.1); }
        .send-btn:disabled { background: #3f3f46; color: #71717a; cursor: not-allowed; }

        /* Quantum Space Animations */
        .quantum-tunnel {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          perspective: 1000px;
        }
        .quantum-tunnel.glitching {
          animation: bgGlitch 0.2s infinite alternate;
        }

        .tunnel-rings {
          position: relative;
          width: 300px; height: 300px;
          transform-style: preserve-3d;
          transform: rotateX(70deg);
        }
        .ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1px solid rgba(6, 182, 212, 0.3);
          box-shadow: 0 0 20px rgba(6, 182, 212, 0.1);
          animation: tunnelSpin 4s linear infinite;
        }

        .particles { position: absolute; inset: 0; }
        .particle {
          position: absolute;
          width: 4px; height: 4px;
          background: #06b6d4;
          border-radius: 50%;
          box-shadow: 0 0 10px #06b6d4;
          opacity: 0;
          animation: floatParticle 3s infinite ease-in-out;
        }

        .data-orb {
          position: absolute;
          top: 50%;
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10;
        }
        .data-orb.fly-right { animation: flyOutRight 1.5s linear forwards; }
        .data-orb.fly-left { animation: flyOutLeft 1.5s linear forwards; }
        
        .orb-core {
          width: 16px; height: 16px;
          background: #fff;
          border-radius: 50%;
          box-shadow: 0 0 30px 10px #06b6d4, inset 0 0 10px #06b6d4;
        }

        .threat-hologram {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -150%) scale(0.5);
          opacity: 0;
          display: flex; flex-direction: column; alignItems: center; gap: 12px;
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          z-index: 11;
        }
        .threat-hologram.active {
          transform: translate(-50%, -50%) scale(1);
          opacity: 1;
        }
        .threat-hologram.shattering {
          transform: translate(-50%, -50%) scale(2);
          opacity: 0;
          filter: blur(20px);
        }
        .hologram-box {
          width: 80px; height: 80px;
          border-radius: 20px;
          background: rgba(239,68,68,0.1);
          border: 1px solid #ef4444;
          display: flex; justify-content: center; align-items: center;
          box-shadow: 0 0 50px rgba(239,68,68,0.4);
          backdrop-filter: blur(10px);
        }
        .threat-label {
          color: #ef4444; font-weight: 800; letter-spacing: 2px; font-size: 14px;
          text-shadow: 0 0 10px #ef4444;
        }

        .sonic-ripple {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: 10px; height: 10px;
          border-radius: 50%;
          border: 2px solid #10b981;
          animation: rippleExpand 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 9;
        }

        /* Alert Overlay */
        .alert-overlay {
          position: absolute;
          bottom: 20%;
          left: 50%;
          transform: translateX(-50%);
          padding: 24px 32px;
          border-color: rgba(239,68,68,0.3);
          text-align: center;
          animation: slideUpFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          z-index: 20;
        }
        .alert-overlay.neutralized { border-color: rgba(16,185,129,0.3); }
        .alert-overlay h3 { color: #ef4444; margin: 0 0 8px 0; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 16px; letter-spacing: 1px; }
        .alert-overlay.neutralized h3 { color: #10b981; }
        .alert-overlay p { color: #a1a1aa; font-size: 13px; margin: 0 0 20px 0; }
        
        .defense-btn {
          background: transparent;
          border: 1px solid #ef4444;
          color: #ef4444;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 800;
          letter-spacing: 2px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 0 20px rgba(239,68,68,0.2);
        }
        .defense-btn:hover { background: rgba(239,68,68,0.1); transform: scale(1.05); }

        /* Attack Dock */
        .attack-dock-container {
          position: absolute;
          bottom: 32px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 30;
        }
        .dock-label { font-size: 10px; color: #71717a; letter-spacing: 2px; font-weight: bold; display: flex; align-items: center; gap: 6px; }
        .attack-dock {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 24px;
          border-radius: 40px;
        }
        .divider { width: 1px; height: 30px; background: rgba(255,255,255,0.1); }
        .dock-btn {
          position: relative;
          background: transparent;
          border: none;
          color: #71717a;
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; justify-content: center; align-items: center;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .dock-btn:hover { color: #fff; transform: scale(1.15) translateY(-6px); background: rgba(255,255,255,0.05); }
        .dock-btn.active {
          color: var(--theme);
          background: color-mix(in srgb, var(--theme) 15%, transparent);
          box-shadow: 0 0 20px color-mix(in srgb, var(--theme) 30%, transparent);
        }
        
        .dock-btn .tooltip {
          position: absolute; top: -40px;
          background: #18181b; border: 1px solid rgba(255,255,255,0.1);
          color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: bold;
          white-space: nowrap; pointer-events: none; opacity: 0; transform: translateY(10px);
          transition: all 0.2s; box-shadow: 0 10px 20px rgba(0,0,0,0.5);
        }
        .dock-btn:hover .tooltip { opacity: 1; transform: translateY(0); }

        /* Keyframes */
        @keyframes pulse { 0%, 100% { opacity: 1; box-shadow: 0 0 10px #10b981; } 50% { opacity: 0.4; box-shadow: none; } }
        @keyframes popIn { 0% { opacity: 0; transform: scale(0.9) translateY(10px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        @keyframes spin-slow { 100% { transform: rotate(360deg); } }
        
        @keyframes tunnelSpin {
          0% { transform: translateZ(-200px) scale(0.5); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateZ(200px) scale(1.5); opacity: 0; }
        }
        @keyframes floatParticle {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(-100px) scale(0); opacity: 0; }
        }
        
        @keyframes flyOutRight { 0% { left: 25%; } 100% { left: 75%; } }
        @keyframes flyOutLeft { 0% { left: 75%; } 100% { left: 25%; } }

        @keyframes bgGlitch {
          0% { background-color: rgba(239, 68, 68, 0.05); }
          100% { background-color: transparent; }
        }
        .glitch-shake { animation: gShake 0.1s infinite; }
        @keyframes gShake { 0% { transform: translate(2px, 1px) rotate(0deg); } 100% { transform: translate(-1px, -2px) rotate(-1deg); } }

        @keyframes rippleExpand {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; box-shadow: inset 0 0 50px #10b981, 0 0 50px #10b981; }
          100% { transform: translate(-50%, -50%) scale(30); opacity: 0; box-shadow: inset 0 0 10px #10b981, 0 0 10px #10b981; }
        }
        @keyframes slideUpFade { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
      `}</style>
    </div>
  );
}
