import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Lock, Shield, Server, Zap, ChevronDown, CheckCircle, Fingerprint, Eye, Activity, Cpu } from 'lucide-react';
import MatrixRain from './MatrixRain';

// Interactive Animated Background Diagram
const QuantumVisualizer = () => {
  return (
    <div style={{ position: 'relative', width: '100%', height: '400px', borderRadius: '24px', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="100%" height="100%" viewBox="0 0 800 400" preserveAspectRatio="xMidYMid slice">
        <defs>
          <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        <path d="M 100 200 Q 400 50 700 200" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="2" strokeDasharray="5,5" />
        <path d="M 100 200 Q 400 350 700 200" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="2" strokeDasharray="5,5" />
        <line x1="100" y1="200" x2="700" y2="200" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="1" />
        
        {/* Animated Packets */}
        <circle cx="100" cy="200" r="6" fill="#38bdf8" filter="url(#glow-blue)">
          <animateMotion path="M 100 200 Q 400 50 700 200" dur="2s" repeatCount="indefinite" />
        </circle>
        
        <circle cx="100" cy="200" r="6" fill="#10b981" filter="url(#glow-blue)">
          <animateMotion path="M 100 200 Q 400 350 700 200" dur="2.5s" repeatCount="indefinite" />
        </circle>
        
        <circle cx="100" cy="200" r="6" fill="#f59e0b" filter="url(#glow-blue)">
          <animateMotion path="M 100 200 L 700 200" dur="1.5s" repeatCount="indefinite" />
        </circle>
        
        {/* Nodes */}
        <circle cx="100" cy="200" r="24" fill="rgba(15, 23, 42, 0.8)" stroke="#38bdf8" strokeWidth="4" filter="url(#glow-blue)" />
        <text x="100" y="200" fill="white" fontSize="12" textAnchor="middle" dy="4" fontWeight="bold">ALICE</text>
        
        <circle cx="700" cy="200" r="24" fill="rgba(15, 23, 42, 0.8)" stroke="#10b981" strokeWidth="4" filter="url(#glow-blue)" />
        <text x="700" y="200" fill="white" fontSize="12" textAnchor="middle" dy="4" fontWeight="bold">BOB</text>

        {/* Central Quantum Core */}
        <circle cx="400" cy="200" r="40" fill="rgba(56, 189, 248, 0.1)" stroke="rgba(56, 189, 248, 0.5)" strokeWidth="2">
          <animate attributeName="r" values="35;45;35" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="400" cy="200" r="20" fill="transparent" stroke="#f59e0b" strokeWidth="4" strokeDasharray="15,10" filter="url(#glow-blue)">
          <animateTransform attributeName="transform" type="rotate" from="0 400 200" to="360 400 200" dur="4s" repeatCount="indefinite" />
        </circle>
      </svg>
    </div>
  );
};

const SectionHeading = ({ children, color = '#38bdf8' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-100px" }}
    transition={{ duration: 0.8, ease: "easeOut" }}
    style={{ textAlign: 'center', marginBottom: '80px' }}
  >
    <div style={{ display: 'inline-block', width: '2px', height: '60px', background: `linear-gradient(to bottom, transparent, ${color})`, marginBottom: '24px' }}></div>
    <h2 style={{ color: 'white', fontSize: '56px', fontWeight: '900', letterSpacing: '-2px', margin: '0 0 24px 0', lineHeight: 1.1 }}>{children}</h2>
  </motion.div>
);

const FeatureCard = ({ icon: Icon, title, desc, color, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.8, delay, ease: "easeOut" }}
    style={{
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: '24px',
      padding: '40px',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}></div>
    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, border: `1px solid ${color}44` }}>
      <Icon size={32} />
    </div>
    <h3 style={{ color: 'white', fontSize: '24px', margin: 0 }}>{title}</h3>
    <p style={{ color: '#94a3b8', fontSize: '16px', lineHeight: 1.6, margin: 0 }}>{desc}</p>
  </motion.div>
);

const Documentation = ({ onNavigate }) => {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 1.2]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  return (
    <div ref={containerRef} style={{ background: '#020617', minHeight: '100vh', overflowX: 'hidden' }}>
      <MatrixRain />
      
      {/* 1. Cinematic Hero Section */}
      <div style={{ height: '100vh', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        <motion.div style={{ position: 'absolute', inset: 0, scale: heroScale, opacity: heroOpacity }}>
          <img src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop" alt="Cyberpunk Server" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, #020617)' }}></div>
        </motion.div>
        
        <div style={{ position: 'relative', zIndex: 10, textAlign: 'center', padding: '0 24px', maxWidth: '1000px' }}>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.2, ease: "easeOut" }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', borderRadius: '30px', border: '1px solid rgba(56, 189, 248, 0.3)', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', fontSize: '14px', fontWeight: 'bold', marginBottom: '32px' }}>
              <Shield size={16} /> LATTICELINK ARCHITECTURE V2
            </div>
            <h1 style={{ color: 'white', fontSize: 'clamp(48px, 8vw, 100px)', fontWeight: '900', letterSpacing: '-4px', lineHeight: 1, marginBottom: '32px', textShadow: '0 10px 30px rgba(0,0,0,0.8)' }}>
              The Post-Quantum<br />Era is Here.
            </h1>
            <p style={{ color: '#94a3b8', fontSize: 'clamp(18px, 2vw, 24px)', maxWidth: '700px', margin: '0 auto', lineHeight: 1.6 }}>
              A cinematic deep dive into the unbreakable, zero-trust infrastructure powering your secure communications.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5, duration: 1 }}
          style={{ position: 'absolute', bottom: '40px', left: '50%', x: '-50%', color: '#64748b', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}
        >
          <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '2px' }}>Scroll to Explore</span>
          <motion.div animate={{ y: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 2 }}><ChevronDown size={24} color="#38bdf8" /></motion.div>
        </motion.div>
      </div>

      {/* 2. Core Philosophy */}
      <div style={{ padding: '120px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
        <SectionHeading color="#f59e0b">Zero-Trust by Default.</SectionHeading>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '32px' }}>
          <FeatureCard 
            icon={Eye} 
            color="#f59e0b" 
            title="Absolute Privacy" 
            desc="LatticeLink servers are entirely blind. We cannot read your messages, we cannot view your contacts, and we do not store your private keys. The server is merely a dumb pipe routing encrypted packets."
            delay={0.1}
          />
          <FeatureCard 
            icon={Fingerprint} 
            color="#10b981" 
            title="Client-Side Identity" 
            desc="Your cryptographic identity is generated directly on your local machine using the Web Crypto API. Your private keys never leave your browser context, ensuring true end-to-end sovereignty."
            delay={0.3}
          />
          <FeatureCard 
            icon={Server} 
            color="#3b82f6" 
            title="Decentralized Storage" 
            desc="All sensitive state—including your contacts list, message history, and Vault files—are stored entirely in your local browser storage. The server only handles real-time WebRTC and Socket signaling."
            delay={0.5}
          />
        </div>
      </div>

      {/* 3. The Cryptographic Engine */}
      <div style={{ padding: '120px 24px', background: 'rgba(15, 23, 42, 0.4)', position: 'relative', zIndex: 10 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <SectionHeading color="#10b981">The Quantum Shield.</SectionHeading>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '80px' }}>
            {/* Visualizer Row */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 1 }}
              style={{ width: '100%' }}
            >
              <QuantumVisualizer />
            </motion.div>

            {/* Tech Specs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
              <div>
                <h3 style={{ color: 'white', fontSize: '32px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}><Lock color="#38bdf8" /> AES-256-GCM</h3>
                <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: 1.7 }}>
                  The gold standard of symmetric encryption. Every message payload, attachment, and Voice/Video stream is encrypted using AES-256 in Galois/Counter Mode. This provides unparalleled confidentiality and built-in tamper detection via authentication tags.
                </p>
              </div>
              
              <div>
                <h3 style={{ color: 'white', fontSize: '32px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}><Cpu color="#10b981" /> ML-KEM-1024</h3>
                <p style={{ color: '#94a3b8', fontSize: '18px', lineHeight: 1.7 }}>
                  Formerly known as CRYSTALS-Kyber, this NIST-standardized algorithm secures the initial handshake. Before AES encryption begins, Alice and Bob use lattice-based cryptography to securely establish a shared secret, rendering "Store Now, Decrypt Later" attacks by quantum computers useless.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Peer to Peer WebRTC */}
      <div style={{ padding: '160px 24px', maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 10 }}>
         <SectionHeading color="#8b5cf6">True P2P Tunnels.</SectionHeading>
         
         <div style={{ display: 'flex', alignItems: 'center', gap: '64px', flexWrap: 'wrap' }}>
           <motion.div 
              initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              style={{ flex: '1 1 500px' }}
           >
             <h3 style={{ color: 'white', fontSize: '40px', fontWeight: 'bold', marginBottom: '24px', lineHeight: 1.2 }}>Voice & Video bypass the server entirely.</h3>
             <p style={{ color: '#94a3b8', fontSize: '20px', lineHeight: 1.6, marginBottom: '32px' }}>
               When you initiate a call, LatticeLink acts only as a signaling intermediary. Once the WebRTC tunnel is established, audio and video streams flow directly between your machine and the recipient. 
             </p>
             <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
               {[
                 'Ultra-low latency direct connections',
                 'DTLS-SRTP mandated stream encryption',
                 'Zero server bandwidth consumption',
                 'Immune to centralized wiretapping'
               ].map((item, i) => (
                 <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'white', fontSize: '18px' }}>
                   <CheckCircle size={20} color="#8b5cf6" /> {item}
                 </li>
               ))}
             </ul>
           </motion.div>
           
           <motion.div 
              initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
              style={{ flex: '1 1 400px', position: 'relative' }}
           >
             <img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=2070&auto=format&fit=crop" alt="WebRTC" style={{ width: '100%', borderRadius: '24px', border: '1px solid rgba(139, 92, 246, 0.3)', boxShadow: '0 20px 50px rgba(139, 92, 246, 0.2)' }} />
           </motion.div>
         </div>
      </div>
      
      {/* Footer / CTA */}
      <div style={{ padding: '120px 24px', textAlign: 'center', position: 'relative', zIndex: 10, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <h2 style={{ color: 'white', fontSize: '48px', fontWeight: '900', marginBottom: '32px' }}>Ready to secure your comms?</h2>
        <button onClick={() => onNavigate ? onNavigate('messages') : window.history.back()} className="neon-button" style={{ fontSize: '18px', padding: '16px 48px', cursor: 'pointer' }}>
          Return to Dashboard
        </button>
      </div>

    </div>
  );
};

export default Documentation;
