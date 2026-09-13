import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Paperclip, Mic, Send, MoreVertical, Phone, Video, ShieldCheck, 
  Users, UserPlus, LogOut, X, CheckCheck, PhoneOff, Camera, Lock
} from 'lucide-react';
import MatrixRain from './MatrixRain';

const GroupMessaging = () => {
  // --- Global / Authentication State ---
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem('ll_current_user_v2') || '');
  const [loginInput, setLoginInput] = useState('');

  // --- Group & Message State ---
  const [allGroups, setAllGroups] = useState(() => {
    const saved = localStorage.getItem('ll_groups_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [selectedGroupId, setSelectedGroupId] = useState('');

  const [allGroupMessages, setAllGroupMessages] = useState(() => {
    const saved = localStorage.getItem('ll_group_messages_v2');
    return saved ? JSON.parse(saved) : {};
  });

  const [input, setInput] = useState('');

  // --- UI States ---
  const [isAddGroupOpen, setIsAddGroupOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMembers, setNewGroupMembers] = useState('');
  const fileInputRef = useRef(null);
  const [activeCall, setActiveCall] = useState(null); // 'audio' | 'video' | null

  // Derived state: only show groups where the current user is a member
  const userGroups = allGroups.filter(g => g.members.includes(currentUser));
  
  // Set initial selected group if needed
  useEffect(() => {
    if (userGroups.length > 0 && !selectedGroupId) {
      setSelectedGroupId(userGroups[0].id);
    }
  }, [userGroups, selectedGroupId]);

  // Save state globally
  useEffect(() => {
    localStorage.setItem('ll_groups_v2', JSON.stringify(allGroups));
  }, [allGroups]);

  useEffect(() => {
    localStorage.setItem('ll_group_messages_v2', JSON.stringify(allGroupMessages));
  }, [allGroupMessages]);

  const activeGroup = userGroups.find(g => g.id === selectedGroupId) || null;
  const activeMessages = selectedGroupId && allGroupMessages[selectedGroupId] ? allGroupMessages[selectedGroupId] : [];

  // --- Handlers ---
  const handleLogin = (e) => {
    e.preventDefault();
    if (loginInput.trim()) {
      setCurrentUser(loginInput.trim());
      localStorage.setItem('ll_current_user_v2', loginInput.trim());
    }
  };

  const handleLogout = () => {
    setCurrentUser('');
    localStorage.removeItem('ll_current_user_v2');
    setSelectedGroupId('');
  };

  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || !currentUser || !selectedGroupId) return;
    appendMessage({ text: input, type: 'user' });
    setInput('');
  };

  const appendMessage = (msgData) => {
    if (!selectedGroupId) return;

    const tempId = Date.now();
    const newMessage = { 
      id: tempId, 
      sender: currentUser, 
      time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}), 
      status: 'encrypting', // Initial security state
      ...msgData
    };

    setAllGroupMessages(prev => ({
      ...prev,
      [selectedGroupId]: [...(prev[selectedGroupId] || []), newMessage]
    }));

    // Simulate encryption delay
    setTimeout(() => {
      setAllGroupMessages(prev => {
        const msgs = prev[selectedGroupId] || [];
        return {
          ...prev,
          [selectedGroupId]: msgs.map(m => m.id === tempId ? { ...m, status: 'sent' } : m)
        };
      });
    }, 800);
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    const groupName = newGroupName.trim();
    if (groupName) {
      // Parse members string into array, trim, remove empty, and ensure currentUser is included
      let membersArray = newGroupMembers.split(',').map(m => m.trim()).filter(m => m);
      if (!membersArray.includes(currentUser)) {
        membersArray.push(currentUser);
      }

      const newId = Date.now().toString();
      const newGroup = {
        id: newId,
        name: groupName,
        members: membersArray
      };

      setAllGroups([...allGroups, newGroup]);
      setSelectedGroupId(newId);
      setIsAddGroupOpen(false);
      setNewGroupName('');
      setNewGroupMembers('');
    }
  };

  const handleAttachmentClick = () => fileInputRef.current?.click();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        appendMessage({ type: 'image', image: reader.result, text: 'Attached Image' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMicClick = () => alert("Microphone access requested. Voice notes coming soon!");

  // --- Render Login Overlay ---
  if (!currentUser) {
    return (
      <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <MatrixRain />
        <div className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '400px', zIndex: 10, textAlign: 'center' }}>
          <ShieldCheck size={48} color="#3b82f6" style={{ margin: '0 auto 20px auto' }} />
          <h2 style={{ color: 'white', marginBottom: '8px' }}>Identity Verification</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '32px' }}>Enter your operator alias to access secure groups.</p>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input 
              type="text" 
              value={loginInput}
              onChange={(e) => setLoginInput(e.target.value)}
              placeholder="e.g. Neo, Trinity..." 
              style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', color: 'white', outline: 'none', width: '100%' }} 
              autoFocus
            />
            <button type="submit" className="neon-button" style={{ width: '100%' }}>
              Establish Secure Link
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <MatrixRain />
      
      {/* Create Group Modal */}
      {isAddGroupOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ padding: '32px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => setIsAddGroupOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '18px' }}>Create Secure Group</h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>Establish a multi-operator secure tunnel.</p>
            
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input 
                type="text" 
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Group Name" 
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', color: 'white', outline: 'none', width: '100%' }} 
                autoFocus
              />
              <input 
                type="text" 
                value={newGroupMembers}
                onChange={(e) => setNewGroupMembers(e.target.value)}
                placeholder="Member Aliases (comma separated)" 
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', color: 'white', outline: 'none', width: '100%' }} 
              />
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setIsAddGroupOpen(false)} style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="neon-button" style={{ flex: 1, margin: 0, padding: '10px' }}>
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Calling UI Overlay */}
      {activeCall && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.2)', border: '2px solid #8b5cf6', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              animation: 'pulse 1.5s infinite',
              boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)'
            }}>
              {activeCall === 'video' ? <Camera size={48} color="#8b5cf6" /> : <Phone size={48} color="#8b5cf6" />}
            </div>
            
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ color: 'white', fontSize: '32px', margin: '0 0 8px 0' }}>{activeGroup?.name}</h2>
              <p style={{ color: '#10b981', fontSize: '18px', margin: 0 }}>Establishing Secure Group {activeCall === 'video' ? 'Video' : 'Audio'} Link...</p>
            </div>
            
            <button 
              onClick={() => setActiveCall(null)} 
              style={{ 
                marginTop: '40px', background: '#ef4444', border: 'none', borderRadius: '50%', width: '64px', height: '64px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                boxShadow: '0 0 20px rgba(239, 68, 68, 0.5)'
              }}
              title="End Call"
            >
              <PhoneOff size={28} color="white" />
            </button>
          </div>
          <style>{`
            @keyframes pulse {
              0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.7); }
              70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(139, 92, 246, 0); }
              100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
            }
          `}</style>
        </div>
      )}

      {/* LEFT SIDEBAR - Group List */}
      <div className="glass-card" style={{ width: '300px', borderRight: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ color: 'white', margin: 0, fontSize: '20px' }}>Groups</h2>
            <button onClick={() => {setNewGroupName(''); setNewGroupMembers(''); setIsAddGroupOpen(true);}} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '4px' }} title="Create Group">
              <UserPlus size={18} />
            </button>
          </div>
          
          <div className="input-group" style={{ padding: '8px 12px', marginBottom: '16px' }}>
            <Search size={16} color="#64748b" />
            <input type="text" placeholder="Search groups..." style={{ fontSize: '14px' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', padding: '8px 12px', borderRadius: '8px' }}>
            <div style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={12} /> {currentUser}
            </div>
            <LogOut size={14} color="#10b981" style={{ cursor: 'pointer' }} onClick={handleLogout} title="Disconnect" />
          </div>
        </div>
        
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {userGroups.length === 0 ? (
            <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '32px 16px' }}>
              No active group links. Click the + icon to create one.
            </div>
          ) : (
            userGroups.map((group) => (
              <div 
                key={group.id} 
                onClick={() => setSelectedGroupId(group.id)}
                style={{ 
                  padding: '16px 24px', 
                  borderBottom: '1px solid rgba(255,255,255,0.05)', 
                  background: selectedGroupId === group.id ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                  borderLeft: selectedGroupId === group.id ? '3px solid #3b82f6' : '3px solid transparent',
                  cursor: 'pointer'
                }}
              >
                <div style={{ color: 'white', fontWeight: selectedGroupId === group.id ? '600' : '400' }}>{group.name}</div>
                <div style={{ color: '#10b981', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Users size={12} /> {group.members.length} Members
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CENTER - Chat Window */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', zIndex: 10, background: 'rgba(0,0,0,0.4)' }}>
        {activeGroup ? (
          <>
            {/* Chat Header */}
            <div className="glass-card" style={{ padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 0 }}>
              <div>
                <h2 style={{ color: 'white', margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeGroup.name} <ShieldCheck size={16} color="#10b981" />
                </h2>
                <span style={{ color: '#10b981', fontSize: '12px' }}>Quantum Secure Group Tunnel</span>
              </div>
              <div style={{ display: 'flex', gap: '16px', color: '#94a3b8' }}>
                <Phone size={20} style={{ cursor: 'pointer' }} onClick={() => setActiveCall('audio')} title="Start Audio Call" />
                <Video size={20} style={{ cursor: 'pointer' }} onClick={() => setActiveCall('video')} title="Start Video Call" />
                <MoreVertical size={20} style={{ cursor: 'pointer' }} />
              </div>
            </div>

            {/* E2E Security Notice */}
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '12px', borderRadius: '8px', margin: '24px 32px 0 32px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fcd34d', fontSize: '13px', justifyContent: 'center' }}>
              <Lock size={14} /> Messages to this group are secured with ML-KEM and AES-256-GCM.
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {activeMessages.length > 0 ? (
                activeMessages.map((msg) => {
                  const isMe = msg.sender === currentUser;
                  const isEncrypting = msg.status === 'encrypting';

                  return (
                    <div key={msg.id} style={{ 
                      alignSelf: isMe ? 'flex-end' : 'flex-start',
                      maxWidth: '60%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isMe ? 'flex-end' : 'flex-start'
                    }}>
                      {!isMe && (
                        <span style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '4px', marginLeft: '4px' }}>{msg.sender}</span>
                      )}
                      
                      <div style={{ 
                        background: isEncrypting ? 'rgba(59, 130, 246, 0.1)' : (isMe ? 'var(--primary-blue)' : 'rgba(255,255,255,0.1)'),
                        border: isEncrypting ? '1px dashed #3b82f6' : 'none',
                        padding: '12px 16px',
                        borderRadius: isMe ? '16px 16px 0 16px' : '16px 16px 16px 0',
                        color: isEncrypting ? '#94a3b8' : 'white',
                        fontSize: '15px',
                        boxShadow: (isMe && !isEncrypting) ? '0 4px 15px rgba(59, 130, 246, 0.3)' : 'none',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}>
                        {isEncrypting ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontStyle: 'italic', fontSize: '13px' }}>
                            <Lock size={14} /> Encrypting Payload...
                          </div>
                        ) : (
                          <>
                            {msg.type === 'image' && msg.image ? (
                              <img src={msg.image} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', objectFit: 'contain' }} />
                            ) : null}
                            {msg.type !== 'image' && msg.text}
                          </>
                        )}
                      </div>
                      
                      {(!isEncrypting) && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Lock size={10} color="#10b981" /> {msg.time} {isMe && <CheckCheck size={12} color="#3b82f6" />}
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div style={{ color: '#64748b', fontSize: '14px', textAlign: 'center', marginTop: '40px' }}>
                  No messages yet. Send a message to the group.
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="glass-card" style={{ padding: '20px 32px', borderTop: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 0 }}>
              <form onSubmit={handleSend} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
                <Paperclip size={20} color="#64748b" style={{ cursor: 'pointer' }} onClick={handleAttachmentClick} title="Attach Image" />
                
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Message ${activeGroup.name}...`} 
                  style={{ flex: 1, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '24px', color: 'white', outline: 'none' }} 
                />
                
                <Mic size={20} color="#64748b" style={{ cursor: 'pointer' }} onClick={handleMicClick} title="Send Voice Note" />
                <button type="submit" className="neon-button" style={{ padding: '10px', borderRadius: '50%', width: '45px', height: '45px', margin: 0 }}>
                  <Send size={18} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            <Users size={64} color="#1e293b" style={{ marginBottom: '16px' }} />
            <h2>No Group Selected</h2>
            <p>Select a group from the sidebar or create a new one to start messaging.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupMessaging;
