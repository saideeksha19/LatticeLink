import React from 'react';
import { motion } from 'framer-motion';
import MatrixRain from '../MatrixRain';

const GlobalBackground = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#050505] text-white font-sans">
      {/* 1. Base Dark Cyber Background */}
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#010a18] to-[#050505] pointer-events-none"></div>

      {/* 2. Matrix Rain (Subtle) */}
      <div className="fixed inset-0 z-0 opacity-10 pointer-events-none">
        <MatrixRain />
      </div>

      {/* 3. Soft Volumetric Lighting / Glowing Orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1857c8] rounded-full blur-[150px] opacity-20 mix-blend-screen animate-pulse duration-10000"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-[#6c3ef4] rounded-full blur-[200px] opacity-10 mix-blend-screen animate-pulse duration-[12000ms]"></div>
        <div className="absolute top-[30%] left-[60%] w-[30%] h-[30%] bg-[#45d8f1] rounded-full blur-[120px] opacity-10 mix-blend-screen"></div>
        <div className="absolute top-[60%] left-[20%] w-[40%] h-[40%] bg-[#10b981] rounded-full blur-[150px] opacity-[0.05] mix-blend-screen"></div>
      </div>

      {/* 4. Holographic Hexagon Grid Layer */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='103.923' viewBox='0 0 60 103.923' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 17.32v34.64L30 69.28 0 51.96V17.32L30 0zM30 103.923l30-17.32V51.96L30 34.64 0 51.96v34.64l30 17.32z' fill='none' stroke='%2345d8f1' stroke-width='1'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 207.846px',
          transform: 'perspective(1000px) rotateX(60deg) scale(3) translateY(-20%)',
          transformOrigin: 'top center',
          animation: 'gridMove 20s linear infinite'
        }}
      ></div>

      {/* 5. Cyber Fog Layer */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-20 mix-blend-overlay"
        style={{
           backgroundImage: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
           backgroundSize: '200% 200%',
           animation: 'fogMove 15s ease-in-out infinite alternate'
        }}
      ></div>

      {/* 6. Floating Encryption Keys / Packets (Animated via CSS/Framer) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
         {/* Particles floating up */}
         {[...Array(15)].map((_, i) => (
             <motion.div
               key={i}
               className="absolute w-1 h-1 bg-[#45d8f1] rounded-full blur-[1px]"
               initial={{ 
                   y: "110vh", 
                   x: `${Math.random() * 100}vw`, 
                   opacity: Math.random() * 0.5 + 0.1 
               }}
               animate={{ 
                   y: "-10vh",
                   opacity: 0
               }}
               transition={{
                   duration: Math.random() * 10 + 10,
                   repeat: Infinity,
                   ease: "linear",
                   delay: Math.random() * 10
               }}
             />
         ))}
      </div>

      {/* Actual Content Wrapper */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes gridMove {
            0% { background-position: 0 0; }
            100% { background-position: 0 207.846px; }
        }
        @keyframes fogMove {
            0% { background-position: 0% 0%; }
            50% { background-position: 100% 100%; }
            100% { background-position: 0% 100%; }
        }
      `}} />
    </div>
  );
};

export default GlobalBackground;
