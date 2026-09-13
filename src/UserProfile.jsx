import React, { useState, useEffect } from 'react';
import { User, Shield, Key, Fingerprint, Lock, Upload, Save } from 'lucide-react';
import MatrixRain from './MatrixRain';

const UserProfile = () => {
  const [currentUser] = useState(() => localStorage.getItem('ll_current_user_v2') || 'Agent');

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '40px', zIndex: 10, maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        
        <h1 style={{ color: 'white', margin: '0 0 32px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <User size={32} color="#3b82f6" /> Profile Settings
        </h1>

        <div className="glass-card" style={{ padding: '40px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
          
          {/* Avatar and Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <div style={{ position: 'relative' }}>
               <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6', fontSize: '36px', fontWeight: 'bold' }}>
                 {currentUser.charAt(0).toUpperCase()}
               </div>
               <button style={{ position: 'absolute', bottom: 0, right: 0, background: '#3b82f6', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                 <Upload size={16} />
               </button>
            </div>
            <div>
              <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '28px' }}>{currentUser}</h2>
              <div style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px' }}>
                <Shield size={16} /> Verified Operator
              </div>
            </div>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />

          {/* Security Details */}
          <div>
            <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={20} color="#8b5cf6" /> Cryptographic Identity
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
                   <Key size={18} /> Public KEM Key
                 </div>
                 <div style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '14px', background: 'rgba(56, 189, 248, 0.1)', padding: '4px 8px', borderRadius: '4px' }}>
                   3F8A...992C
                 </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '16px 20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
                   <Fingerprint size={18} /> Biometric Authentication
                 </div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                   <div style={{ width: '40px', height: '20px', background: '#10b981', borderRadius: '10px', position: 'relative', cursor: 'pointer' }}>
                     <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }}></div>
                   </div>
                   <span style={{ color: 'white', fontSize: '14px' }}>Enabled</span>
                 </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="neon-button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Save size={18} /> Save Changes
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default UserProfile;
