import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Phone, Video, PhoneOff, Camera, Mic, MicOff, CameraOff } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { CallManager } from './CallManager';

const CallOverlay = ({ activeContact, initialCallType, incomingOffer, onEnd }) => {
  const { socket, logCall } = useChat();
  const { currentUser } = useAuth();
  
  const [status, setStatus] = useState(incomingOffer ? 'Connecting...' : 'Calling...');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(initialCallType === 'audio');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callManagerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const onEndRef = useRef(onEnd);
  const logCallRef = useRef(logCall);
  const startTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (callManagerRef.current) {
      const prevRemote = callManagerRef.current.onRemoteStream;
      callManagerRef.current.onRemoteStream = (stream) => {
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = stream;
        if (prevRemote) prevRemote(stream);
      };
    }
  }, []);

  // Keep refs in sync so the effect closure always has latest values
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => { logCallRef.current = logCall; }, [logCall]);

  useEffect(() => {
    if (!socket || !activeContact) return;
    
    // Create new CallManager instance
    const manager = new CallManager(
      socket, 
      activeContact, 
      initialCallType, 
      !!incomingOffer
    );
    callManagerRef.current = manager;
    startTimeRef.current = null;

    // Bind UI callbacks
    manager.onStatusChange = (newStatus) => {
      setStatus(newStatus);
      if (newStatus === 'CONNECTED' && !startTimeRef.current) {
        startTimeRef.current = Date.now();
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = setInterval(() => {
          if (startTimeRef.current) {
            const sec = Math.round((Date.now() - startTimeRef.current) / 1000);
            const m = Math.floor(sec / 60);
            const s = (sec % 60).toString().padStart(2, '0');
            setStatus(`Connected • ${m}:${s}`);
          }
        }, 1000);
      }
    };

    manager.onLocalStream = (stream) => {
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
    };

    manager.onRemoteStream = (stream) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.play().catch(e => console.warn("Remote audio play issue:", e));
      }
    };

    manager.onEnded = () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      const elapsedSec = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
      const formattedDuration = `${Math.floor(elapsedSec / 60)}:${(elapsedSec % 60).toString().padStart(2, '0')}`;
      logCallRef.current(activeContact, initialCallType, elapsedSec > 0 ? formattedDuration : '0:00');
      onEndRef.current();
    };

    // Start the call lifecycle
    manager.startCall(incomingOffer);

    // Cleanup on unmount — uses destroy() which does NOT fire onEnded,
    // so StrictMode's unmount/remount cycle won't remove the overlay
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      manager.destroy();
    };
  }, [socket, activeContact, initialCallType, incomingOffer]);

  const handleEndCall = () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    const elapsedSec = startTimeRef.current ? Math.round((Date.now() - startTimeRef.current) / 1000) : 0;
    const formattedDuration = `${Math.floor(elapsedSec / 60)}:${(elapsedSec % 60).toString().padStart(2, '0')}`;
    logCallRef.current(activeContact, initialCallType, elapsedSec > 0 ? formattedDuration : '0:00');
    if (callManagerRef.current) {
      callManagerRef.current.endCall('Ended manually');
    }
    onEnd();
  };

  const toggleMute = () => {
    if (callManagerRef.current) {
      const isEnabled = callManagerRef.current.toggleAudio();
      setIsMuted(!isEnabled);
    }
  };

  const toggleVideo = () => {
    if (callManagerRef.current) {
      const isEnabled = callManagerRef.current.toggleVideo();
      setIsVideoOff(!isEnabled);
    }
  };

  const isVideoCall = initialCallType === 'video';
  const isFailed = status === 'FAILED' || status.startsWith('REJECTED');
  const isConnected = status === 'CONNECTED' || status.startsWith('Connected');
  const statusColor = isFailed ? '#ef4444' : (isConnected ? '#10b981' : '#f59e0b');

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', backdropFilter: 'blur(20px)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      
      {/* Remote video (full screen for video calls, hidden for audio) */}
      <video 
        ref={remoteVideoRef} 
        autoPlay 
        playsInline 
        style={{ 
          position: 'absolute', inset: 0, width: '100%', height: '100%', 
          objectFit: 'cover', zIndex: 0, 
          opacity: isVideoCall ? 1 : 0 
        }} 
      />

      {/* Audio element for remote audio stream playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

      {/* Local video pip (video calls) or audio call avatar */}
      {isVideoCall ? (
        <div style={{ position: 'absolute', bottom: '140px', right: '32px', width: '160px', height: '220px', background: '#222', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', zIndex: 10, boxShadow: '0 0 30px rgba(0,0,0,0.5)' }}>
          <video ref={localVideoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
        </div>
      ) : (
        <div style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(59,130,246,0.1)', border: '2px solid #3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: status === 'CALLING' ? 'callPulse 1.5s infinite' : 'none', boxShadow: '0 0 50px rgba(59,130,246,0.5)', zIndex: 10 }}>
          <Phone size={64} color="#3b82f6" />
        </div>
      )}

      {/* Controls */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', padding: '40px', background: isVideoCall ? 'linear-gradient(to top, rgba(0,0,0,0.9), transparent)' : 'transparent', marginTop: isVideoCall ? 'auto' : '0' }}>
        {!isVideoCall && <h2 style={{ color: 'white', marginTop: '32px', fontSize: '28px' }}>{activeContact}</h2>}
        <p style={{ color: statusColor, fontSize: '18px', marginTop: '12px' }}>{status}</p>
        
        <div style={{ display: 'flex', gap: '20px', marginTop: '40px' }}>
          <button onClick={toggleMute} style={{ background: isMuted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
            {isMuted ? <MicOff size={24} color="white" /> : <Mic size={24} color="white" />}
          </button>
          <button onClick={handleEndCall} style={{ background: '#ef4444', border: 'none', borderRadius: '50%', width: '72px', height: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 30px rgba(239,68,68,0.5)' }}>
            <PhoneOff size={32} color="white" />
          </button>
          {isVideoCall && (
            <button onClick={toggleVideo} style={{ background: isVideoOff ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}>
              {isVideoOff ? <CameraOff size={24} color="white" /> : <Camera size={24} color="white" />}
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes callPulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59,130,246,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(59,130,246,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
      `}</style>
    </div>
  );
};

export default CallOverlay;
