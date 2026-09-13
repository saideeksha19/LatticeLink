import React from 'react';
import { Phone, Video, PhoneOff, Check } from 'lucide-react';
import { useChat } from '../context/ChatContext';

const IncomingCallModal = ({ callData, onAccept, onReject }) => {
  const { socket } = useChat();

  const handleReject = () => {
    if (socket && callData.caller) {
      socket.emit('call_reject', { caller: callData.caller });
    }
    onReject();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', padding: '32px', borderRadius: '24px', textAlign: 'center', minWidth: '300px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '32px', margin: '0 auto 16px' }}>
          {callData.caller.charAt(0)}
        </div>
        <h3 style={{ color: 'white', fontSize: '24px', margin: '0 0 8px 0' }}>{callData.caller}</h3>
        <p style={{ color: '#94a3b8', margin: '0 0 32px 0' }}>Incoming {callData.call_type} call...</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px' }}>
          <button onClick={handleReject} style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }} className="hover:scale-110 transition-transform">
            <PhoneOff size={28} color="white" />
          </button>
          <button onClick={onAccept} style={{ background: '#10b981', border: 'none', borderRadius: '50%', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(16,185,129,0.3)', animation: 'pulse 2s infinite' }} className="hover:scale-110 transition-transform">
            {callData.call_type === 'video' ? <Video size={28} color="white" /> : <Phone size={28} color="white" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCallModal;
