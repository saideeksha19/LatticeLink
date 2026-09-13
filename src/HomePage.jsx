import React, { useEffect, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { 
  Shield, Zap, Lock, Globe, Server, Database, Code, ShieldAlert, Key, 
  Link as LinkIcon, Activity, Eye, Play, CheckCircle2, ChevronRight, Cpu, 
  Sparkles, Terminal, Layers, ArrowUpRight, Check, Award
} from 'lucide-react';
import ScrollVideo from './ScrollVideo';
import PremiumNavbar from './components/PremiumNavbar';

// --- Shared Framer Motion Variants ---
const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12 }
  }
};

// --- Interactive 3D Cursor Tilt Card Component ---
const InteractiveTiltCard = ({ children, className = "", themeColor = "#45d8f1" }) => {
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rx = ((y - centerY) / centerY) * -10;
    const ry = ((x - centerX) / centerX) * 10;
    
    setRotateX(rx);
    setRotateY(ry);
    setSpotlight({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.18
    });
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setSpotlight(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
      className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Dynamic 3D Cursor Spotlight Effect */}
      <div 
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-10"
        style={{
          background: `radial-gradient(500px circle at ${spotlight.x}% ${spotlight.y}%, ${themeColor}, transparent 45%)`,
          opacity: spotlight.opacity
        }}
      />
      <div style={{ transform: "translateZ(20px)" }}>
        {children}
      </div>
    </motion.div>
  );
};

// --- Interactive 3D Quantum Core Component ---
const Interactive3DQuantumCore = () => {
  const [rotX, setRotX] = useState(15);
  const [rotY, setRotY] = useState(25);
  const [activeTab, setActiveTab] = useState(0);

  const stats = [
    { title: 'ML-KEM-1024', sub: 'Kyber Key Encapsulation', color: '#45d8f1', detail: 'NIST FIPS 203 primary standard for post-quantum key exchange.' },
    { title: 'ML-DSA-87', sub: 'Dilithium Digital Signature', color: '#6c3ef4', detail: 'NIST FIPS 204 lattice signature algorithm for quantum tamper resistance.' },
    { title: 'AES-256-GCM', sub: 'Authenticated Payload Cipher', color: '#10b981', detail: '256-bit symmetric key payload encryption in Galois/Counter mode.' },
    { title: 'SHA3-512', sub: 'Keccak Cryptographic Hash', color: '#f59e0b', detail: '512-bit integrity digest preventing payload modification.' }
  ];

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotX(y * -40);
    setRotY(x * 40);
  };

  const handleMouseLeave = () => {
    setRotX(15);
    setRotY(25);
  };

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-[540px] flex flex-col items-center justify-center perspective-[1200px] cursor-grab active:cursor-grabbing"
    >
      {/* 3D Interactive Rotating Box */}
      <motion.div
        animate={{ rotateX: rotX, rotateY: rotY }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
        className="relative w-72 h-72 flex items-center justify-center"
      >
        {/* Front 3D Holographic Core */}
        <div 
          className="absolute inset-0 rounded-3xl border-2 border-[#45d8f1]/60 bg-gradient-to-tr from-[#030712] via-[#09152b] to-[#1e0b4b] backdrop-blur-2xl shadow-[0_0_90px_rgba(69,216,241,0.35)] flex flex-col items-center justify-center p-8 text-center"
          style={{ transform: "translateZ(45px)" }}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#1857c8] to-[#6c3ef4] p-0.5 mb-4 shadow-[0_0_30px_#45d8f1]">
            <div className="w-full h-full bg-black/90 rounded-[14px] flex items-center justify-center">
              <Cpu size={36} className="text-[#45d8f1] animate-pulse" />
            </div>
          </div>
          <h4 className="text-2xl font-black text-white tracking-wide font-tech">{stats[activeTab].title}</h4>
          <p className="text-xs text-[#45d8f1] mt-1 font-semibold">{stats[activeTab].sub}</p>
        </div>

        {/* Back 3D Layer */}
        <div 
          className="absolute inset-0 rounded-3xl border border-[#6c3ef4]/50 bg-black/80 backdrop-blur-md"
          style={{ transform: "translateZ(-45px) rotateY(180deg)" }}
        />

        {/* Orbiting Energy Rings */}
        <motion.div 
          animate={{ rotateZ: 360, scale: [1, 1.05, 1] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute w-[400px] h-[400px] rounded-full border border-dashed border-[#45d8f1]/40"
          style={{ transform: "translateZ(0px)" }}
        />
        <motion.div 
          animate={{ rotateZ: -360 }} 
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          className="absolute w-[480px] h-[480px] rounded-full border border-[#6c3ef4]/30"
          style={{ transform: "translateZ(10px)" }}
        />

        {/* Interactive Orbital Particles */}
        {[0, 60, 120, 180, 240, 300].map((deg, idx) => (
          <motion.div
            key={idx}
            onClick={(e) => { e.stopPropagation(); setActiveTab(idx % stats.length); }}
            className={`absolute w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold font-mono cursor-pointer transition-all duration-300 ${activeTab === (idx % stats.length) ? 'bg-[#45d8f1] text-black scale-125 shadow-[0_0_30px_#45d8f1]' : 'bg-black/80 text-white border border-white/20 hover:scale-110'}`}
            animate={{
              x: Math.cos((deg + rotY * 2) * (Math.PI / 180)) * 230,
              y: Math.sin((deg + rotY * 2) * (Math.PI / 180)) * 230,
              translateZ: Math.sin((deg + rotY * 2) * (Math.PI / 180)) * 60
            }}
            transition={{ duration: 0.1 }}
          >
            P{idx + 1}
          </motion.div>
        ))}
      </motion.div>

      {/* Interactive Detail Selector */}
      <div className="absolute bottom-0 flex gap-2 z-30 bg-black/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
        {stats.map((s, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === i ? 'bg-gradient-to-r from-[#1857c8] to-[#6c3ef4] text-white shadow-[0_0_20px_rgba(108,62,244,0.7)] scale-105' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            {s.title}
          </button>
        ))}
      </div>
    </div>
  );
};

const HomePage = ({ onNavigate }) => {
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.2], [0, -120]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  // Interactive Pipeline Active Step
  const [activePipelineStep, setActivePipelineStep] = useState(0);

  // Real Database Stats from Backend Server
  const [realStats, setRealStats] = useState({ users: 0, threats: 0, messages: 0, files: 0, sessions: 0 });
  
  useEffect(() => {
    const fetchRealStats = async () => {
      try {
        const res = await fetch('/api/user/admin/stats');
        if (res.ok) {
          const data = await res.json();
          setRealStats({
            users: data.users || 0,
            threats: data.threats || 0,
            messages: data.messages || 0,
            files: data.files || 0,
            sessions: data.sessions || 0
          });
        }
      } catch (err) {
        console.error("Failed to fetch server stats", err);
      }
    };
    
    fetchRealStats();
    const interval = setInterval(fetchRealStats, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full text-white font-sans relative selection:bg-[#45d8f1] selection:text-black bg-[#030712]">
      
      <PremiumNavbar currentPage="home" onNavigate={onNavigate} />

      {/* --- HERO SECTION --- */}
      <section id="home" className="relative min-h-screen flex items-center justify-center pt-36 pb-24 px-6 z-10 overflow-hidden">
        
        {/* Radial Background Glows */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#6c3ef4]/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-[#45d8f1]/15 rounded-full blur-[120px] pointer-events-none" />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Copy */}
          <motion.div 
            initial="hidden" animate="visible" variants={staggerContainer}
            className="lg:col-span-7 space-y-8"
          >
            <motion.div variants={fadeIn} className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#45d8f1]/40 bg-[#45d8f1]/10 text-[#45d8f1] text-xs font-bold uppercase tracking-wider shadow-[0_0_15px_rgba(69,216,241,0.2)]">
                <Sparkles size={14} /> NIST FIPS 203 & 204 Standardized
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#10b981]/40 bg-[#10b981]/10 text-[#10b981] text-xs font-bold uppercase tracking-wider">
                <Check size={14} /> Zero Trust Architecture
              </span>
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-none font-tech">
              Lattice<span className="holographic-text">Link</span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-2xl sm:text-3xl text-gray-200 font-light leading-snug border-l-4 border-[#6c3ef4] pl-6 py-1">
              The Post-Quantum Enterprise<br/>Security & Messaging Platform
            </motion.p>
            
            <motion.div variants={fadeIn} className="text-gray-400 text-base leading-relaxed max-w-xl">
              Protect your organizational data against current eavesdropping and future quantum computer decryption attacks through lattice-based key encapsulation and signatures.
            </motion.div>
            
            <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-4 pt-4">
              <button 
                onClick={() => onNavigate('auth')} 
                className="px-9 py-4 bg-gradient-to-r from-[#1857c8] via-[#5315dc] to-[#6c3ef4] hover:brightness-125 text-white rounded-full font-bold transition-all duration-300 shadow-[0_0_30px_rgba(108,62,244,0.6)] flex items-center justify-center gap-3 group text-base"
              >
                Launch Secure Gateway <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
              </button>
              <button 
                onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
                className="px-9 py-4 premium-glass text-white rounded-full font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 text-base border-white/20"
              >
                Explore Features
              </button>
            </motion.div>
          </motion.div>

          {/* Right Column: 3D Quantum Processor */}
          <motion.div variants={fadeIn} className="lg:col-span-5 hidden lg:block">
            <Interactive3DQuantumCore />
          </motion.div>
        </motion.div>
      </section>

      {/* --- SCROLL VIDEO SECTION --- */}
      <section className="relative w-full z-20 bg-black/60 border-y border-white/10">
         <ScrollVideo />
      </section>

      {/* --- REAL-TIME SECURITY OVERVIEW (BENTO METRICS) --- */}
      <section id="security" className="py-24 px-6 relative z-10 max-w-7xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="premium-glass p-10 lg:p-14 border border-[#10b981]/40 relative overflow-hidden shadow-[0_0_50px_rgba(16,185,129,0.15)]">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-[#10b981]/15 rounded-full blur-3xl" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 border-b border-white/10 pb-6 gap-4">
            <div>
              <h2 className="text-3xl font-bold font-tech mb-2">Live Enterprise Telemetry</h2>
              <p className="text-[#10b981] flex items-center gap-2 text-sm font-semibold">
                <Activity size={18} className="animate-pulse" /> Direct Server Database Metrics (SQLite Engine)
              </p>
            </div>
            <div className="px-4 py-1.5 rounded-full bg-[#10b981]/20 text-[#10b981] text-xs font-bold tracking-wider border border-[#10b981]/60 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#10b981] animate-ping" />
              SYSTEM HEALTH: OPTIMAL
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            <InteractiveTiltCard themeColor="#ffffff">
              <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-bold">Registered Users</p>
                <p className="text-4xl font-mono font-bold text-white">{realStats.users.toLocaleString()}</p>
              </div>
            </InteractiveTiltCard>

            <InteractiveTiltCard themeColor="#10b981">
              <div className="bg-white/5 p-6 rounded-xl border border-[#10b981]/30">
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-bold">Active Sessions</p>
                <p className="text-4xl font-mono font-bold text-[#10b981]">{realStats.sessions.toLocaleString()}</p>
              </div>
            </InteractiveTiltCard>

            <InteractiveTiltCard themeColor="#3b82f6">
              <div className="bg-white/5 p-6 rounded-xl border border-[#3b82f6]/30">
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-bold">Msgs Encrypted</p>
                <p className="text-4xl font-mono font-bold text-white">{realStats.messages.toLocaleString()}</p>
              </div>
            </InteractiveTiltCard>

            <InteractiveTiltCard themeColor="#45d8f1">
              <div className="bg-white/5 p-6 rounded-xl border border-[#45d8f1]/30">
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-bold">Files Secured</p>
                <p className="text-4xl font-mono font-bold text-[#45d8f1]">{realStats.files.toLocaleString()}</p>
              </div>
            </InteractiveTiltCard>

            <InteractiveTiltCard themeColor="#6c3ef4">
              <div className="bg-white/5 p-6 rounded-xl border border-[#6c3ef4]/30">
                <p className="text-gray-400 text-xs mb-1 uppercase tracking-wider font-bold">Threat Logs</p>
                <p className="text-4xl font-mono font-bold text-[#6c3ef4]">{realStats.threats.toLocaleString()}</p>
              </div>
            </InteractiveTiltCard>
          </div>
        </motion.div>
      </section>

      {/* --- FEATURE CARDS (3D BENTO GRID) --- */}
      <section id="features" className="py-24 px-6 relative z-10 max-w-7xl mx-auto">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} className="text-center mb-16">
          <motion.h2 variants={fadeIn} className="text-4xl md:text-5xl font-black font-tech mb-4">Post-Quantum Capabilities</motion.h2>
          <p className="text-gray-400 text-base max-w-2xl mx-auto">Hover over cards to explore 3D optical tilt physics and security specifications.</p>
        </motion.div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.1 }} variants={staggerContainer} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: <Lock size={26} />, title: "Quantum Secure Messaging", desc: "End-to-end lattice encrypted channels resistant to Shor's algorithm.", color: "#45d8f1" },
            { icon: <Shield size={26} />, title: "AES-256-GCM Encryption", desc: "Symmetric payload cipher with 128-bit authentication integrity tags.", color: "#10b981" },
            { icon: <Key size={26} />, title: "ML-KEM (Kyber-1024)", desc: "NIST FIPS 203 standardized module lattice key encapsulation.", color: "#6c3ef4" },
            { icon: <Activity size={26} />, title: "ML-DSA (Dilithium)", desc: "NIST FIPS 204 digital signatures ensuring non-repudiation.", color: "#f59e0b" },
            { icon: <LinkIcon size={26} />, title: "SHA3-512 Digest Integrity", desc: "Keccak sponge hashing producing 512-bit integrity verifiers.", color: "#3b82f6" },
            { icon: <Database size={26} />, title: "Quantum Safe Vault", desc: "Zero-knowledge file vault with PQC key wrapping.", color: "#10b981" },
            { icon: <Play size={26} />, title: "Secure Voice & Video", desc: "P2P low-latency media streams with quantum handshakes.", color: "#ec4899" },
            { icon: <Eye size={26} />, title: "Zero Knowledge Identity", desc: "Authenticate without revealing user credentials to third parties.", color: "#8b5cf6" },
            { icon: <Server size={26} />, title: "Enterprise Admin Console", desc: "Centralized device revocation, key rotation, and role access.", color: "#45d8f1" },
            { icon: <Activity size={26} />, title: "Security Analytics", desc: "Deep operational insight into encrypted message traffic.", color: "#3b82f6" },
            { icon: <Lock size={26} />, title: "Immutable Audit Logs", desc: "Cryptographically bound security event tracking.", color: "#10b981" },
            { icon: <ShieldAlert size={26} />, title: "Real-Time SOC Telemetry", desc: "Automated threat classification and network defense.", color: "#ef4444" }
          ].map((feature, i) => (
            <motion.div key={i} variants={fadeIn}>
              <InteractiveTiltCard themeColor={feature.color} className="h-full">
                <div className="premium-glass p-8 group relative overflow-hidden h-full flex flex-col justify-between border-white/10 hover:border-white/30">
                  <div className="absolute -right-12 -top-12 w-36 h-36 opacity-10 rounded-full blur-2xl group-hover:opacity-30 transition-opacity" style={{ background: feature.color }} />
                  <div>
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 transition-all duration-300 group-hover:scale-110 shadow-lg" style={{ color: feature.color }}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white font-tech">{feature.title}</h3>
                    <p className="text-gray-300 text-sm leading-relaxed font-light">{feature.desc}</p>
                  </div>
                  <div className="mt-8 flex items-center gap-2 text-xs font-bold tracking-wide uppercase transition-all duration-300" style={{ color: feature.color }}>
                    <span>Technical Specification</span> <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </InteractiveTiltCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* --- INTERACTIVE CRYPTOGRAPHIC PIPELINE (ARCHITECTURE) --- */}
      <section id="architecture" className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeIn} className="text-4xl md:text-5xl font-bold font-tech text-center mb-4">
            Interactive Cryptographic Pipeline
          </motion.h2>
          <p className="text-center text-gray-400 mb-16 max-w-xl mx-auto">Click any pipeline stage below to inspect the mathematical transformations applied to each packet.</p>

          <div className="flex items-center overflow-x-auto pb-10 pt-4 px-4 custom-scrollbar snap-x gap-4">
            {[
              { name: "Plaintext Input", spec: "UTF-8 Payload Ingestion", code: "MSG: Hello Quantum World" },
              { name: "AES-256-GCM Encryption", spec: "Symmetric Cipher", code: "CIPHERTEXT: 4a9f...e102 [Tag Validated]" },
              { name: "SHA3-512 Integrity", spec: "Cryptographic Hash", code: "HASH: d92c...f811 (512-bit digest)" },
              { name: "ML-DSA Signature", spec: "Dilithium Lattice Signature", code: "SIG: 88a3...19e0 (Lattice verified)" },
              { name: "ML-KEM Key Encapsulation", spec: "Kyber Post-Quantum KEM", code: "KEM: 33f1...00bc (Kyber-1024)" },
              { name: "Secure Transmission", spec: "WebSocket/TLS Tunnel", code: "SOCKET: Packet in flight (0.012ms)" },
              { name: "Verification", spec: "Signature & Hash Audit", code: "STATUS: Signature Verified OK" },
              { name: "Plaintext Recovery", spec: "Authenticated Output", code: "DECRYPTED: Hello Quantum World" }
            ].map((step, i) => (
              <motion.div 
                key={i}
                onClick={() => setActivePipelineStep(i)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="flex items-center shrink-0 snap-center"
              >
                <div className={`premium-glass p-6 text-center w-64 h-40 flex flex-col items-center justify-between border-t-4 cursor-pointer transition-all duration-300 ${activePipelineStep === i ? 'border-t-[#45d8f1] bg-[#1857c8]/30 scale-105 shadow-[0_0_35px_rgba(69,216,241,0.4)]' : 'border-t-[#6c3ef4] hover:bg-white/10'}`}>
                  <div>
                    <span className="font-bold text-sm block text-white font-tech">{step.name}</span>
                    <span className="text-[11px] text-[#45d8f1] mt-1.5 block font-semibold">{step.spec}</span>
                  </div>
                  <span className={`text-[10px] px-2.5 py-0.5 rounded font-mono ${activePipelineStep === i ? 'bg-[#45d8f1] text-black font-bold' : 'text-gray-400 bg-white/5'}`}>
                    STAGE 0{i+1}
                  </span>
                </div>
                {i < 7 && (
                  <div className="w-10 h-px bg-white/20 mx-1 relative">
                     <motion.div 
                       className="absolute top-[-2px] left-0 w-5 h-1 rounded-full bg-[#45d8f1] shadow-[0_0_8px_#45d8f1]"
                       animate={{ left: ['0%', '100%'] }}
                       transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                     />
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* Active Step Live Inspector Drawer */}
          <motion.div 
            key={activePipelineStep}
            initial={{ opacity: 0, y: 15 }} 
            animate={{ opacity: 1, y: 0 }}
            className="premium-glass p-8 mt-6 border border-[#45d8f1]/40 max-w-4xl mx-auto rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_0_40px_rgba(69,216,241,0.15)]"
          >
             <div className="flex-1">
               <div className="text-xs uppercase tracking-wider text-[#45d8f1] font-bold mb-1 font-mono">Stage 0{activePipelineStep + 1} Technical Spec</div>
               <h3 className="text-2xl font-bold text-white mb-2 font-tech">
                 {[
                   "Plaintext Input", "AES-256-GCM Encryption", "SHA3-512 Integrity Digest", 
                   "ML-DSA Signature", "ML-KEM Key Encapsulation", "Secure Transmission", 
                   "Verification", "Plaintext Recovery"
                 ][activePipelineStep]}
               </h3>
               <p className="text-sm text-gray-300 leading-relaxed font-light">
                 {[
                   "Ingests UTF-8 strings and binary file streams into the client memory space.",
                   "Payload encrypted using a 256-bit key in Galois/Counter Mode with 128-bit authentication tag.",
                   "SHA3-512 Keccak sponge algorithm generates an immutable 512-bit hash digest over ciphertext.",
                   "ML-DSA (Dilithium) applies a post-quantum digital signature to guarantee non-repudiation.",
                   "ML-KEM (Kyber-1024) encapsulates symmetric session keys using module learning-with-errors.",
                   "Encrypted packet stream transmitted over Socket.IO TLS 1.3 encrypted websocket channel.",
                   "Recipient node verifies SHA3-512 digest and validates ML-DSA signature before decryption.",
                   "Symmetric session key decapsulated via recipient ML-KEM private key to recover payload."
                 ][activePipelineStep]}
               </p>
             </div>
             <div className="bg-black/90 px-6 py-4 rounded-xl border border-white/15 font-mono text-xs text-[#10b981] whitespace-nowrap shadow-inner">
               {[
                 "MSG: Hello Quantum World",
                 "CIPHERTEXT: 4a9f...e102 [Tag Validated]",
                 "HASH: d92c...f811 (512-bit digest)",
                 "SIG: 88a3...19e0 (Lattice verified)",
                 "KEM: 33f1...00bc (Kyber-1024)",
                 "SOCKET: Packet in flight (0.012ms)",
                 "STATUS: Signature Verified OK",
                 "DECRYPTED: Hello Quantum World"
               ][activePipelineStep]}
             </div>
          </motion.div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="py-16 px-6 border-t border-white/10 relative z-10 bg-black/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h3 className="text-2xl font-black text-white font-tech mb-2">Lattice<span className="holographic-text">Link</span></h3>
            <p className="text-xs text-gray-400">Post-Quantum Enterprise Security Infrastructure. Powered by NIST PQC Standards.</p>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <button onClick={() => onNavigate('auth')} className="hover:text-[#45d8f1] transition-colors">Portal Access</button>
            <button onClick={() => document.getElementById('security').scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#45d8f1] transition-colors">Telemetry</button>
            <button onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#45d8f1] transition-colors">Capabilities</button>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default HomePage;
