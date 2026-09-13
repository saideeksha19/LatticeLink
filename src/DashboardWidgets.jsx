import React, { useState, useEffect } from 'react';
import { ShieldCheck, MessageSquare, Plus, Phone, File, Settings, LogOut, CheckCircle2 } from 'lucide-react';

export const DashboardHero = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 18) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const formattedDate = time.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  return (
    <div className="glass-card" style={{ 
      padding: '40px', 
      height: '100%', 
      display: 'flex', 
      justifyContent: 'space-between',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
      position: 'relative',
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.1)'
    }}>
      <div style={{ position: 'absolute', right: '-10%', top: '-50%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)', borderRadius: '50%', filter: 'blur(40px)', zIndex: 0 }}></div>
      
      <div style={{ zIndex: 10, display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '18px', letterSpacing: '0.5px', marginBottom: '8px', transition: '0.5s' }}>{getGreeting()}</div>
            <h1 style={{ color: 'white', fontSize: '42px', margin: '0', fontWeight: 'bold' }}>Shamith R</h1>
            <div style={{ color: '#cbd5e1', fontSize: '16px', marginTop: '12px', fontWeight: '300' }}>Welcome to LatticeLink <span style={{color: '#3b82f6'}}>•</span> Your Quantum Secure Workspace</div>
          </div>
          
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'white', fontSize: '28px', fontWeight: 'bold', fontFamily: 'monospace' }}>{formattedTime}</div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>{formattedDate}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Node ID</div>
            <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '600', fontFamily: 'monospace' }}>NODE-A8C91F</div>
          </div>
          
          <div style={{ background: 'rgba(0, 0, 0, 0.4)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Role</div>
            <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500' }}>Normal User</div>
          </div>
          
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
            <div style={{ color: '#94a3b8', fontSize: '12px', marginBottom: '4px' }}>Status</div>
            <div style={{ color: '#10b981', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
               <ShieldCheck size={16} /> Quantum Protected
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <button style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', transition: '0.2s' }}>
            <MessageSquare size={16} /> New Secure Chat
          </button>
          <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', transition: '0.2s' }}>
            <Plus size={16} /> Create Group
          </button>
          <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', transition: '0.2s' }}>
            <Phone size={16} /> Secure Call
          </button>
          <button style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 20px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '500', transition: '0.2s' }}>
            <File size={16} /> Share File
          </button>
        </div>
      </div>
    </div>
  );
};
