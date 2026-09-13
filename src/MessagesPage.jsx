import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Paperclip, Mic, Send, MoreVertical, Phone, Video,
  ShieldCheck, UserPlus, X, CheckCheck, Lock, PhoneOff, Camera,
  Fingerprint, Box, Shield, User, Mail, Hash, Clock, RefreshCw,
  MessageSquare, Info, Smile, Bell, Users, Plus, Trash2, StopCircle
} from 'lucide-react';
import MatrixRain from './MatrixRain';
import { useAuth } from './context/AuthContext';
import { useUser } from './context/UserContext';
import { useChat } from './context/ChatContext';
import { useSettings } from './context/SettingsContext';
import PacketInspectorModal from './components/PacketInspectorModal';
import MessageCryptoPipeline from './components/MessageCryptoPipeline';
import MultiDeviceVisualizer from './components/MultiDeviceVisualizer';
import CallOverlay from './components/CallOverlay';
import IncomingCallModal from './components/IncomingCallModal';
import FileMessageCard from './components/FileMessageCard';
import { motion, AnimatePresence } from 'framer-motion';

const MessagesPage = () => {
  const { currentUser } = useAuth();
  const { getContacts, addContact, searchUser, sendContactRequest, acceptContactRequest, rejectContactRequest, getPendingRequests, allUsers } = useUser();
  const { socket, messages, chatList, fetchChats, sendMessage, sendFileMessage, editMessage, deleteMessage, markAsRead, logCall, getConversationId, presences, typingUsers, sendTyping, fetchHistory, calls, clearUnread, groups, createGroup, sendGroupMessage } = useChat();
  const { pushNotification } = useSettings();

  const [activeSidebarTab, setActiveSidebarTab] = useState('chats'); // 'chats' | 'groups' | 'contacts' | 'calls'
  const [selectedChatId, setSelectedChatId] = useState('');
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);

  // New Chat & Group creation modal states
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  
  // Chat States
  const [input, setInput] = useState('');
  const fileInputRef = useRef(null);
  const [activeCall, setActiveCall] = useState(null); // { type: 'audio' | 'video', contact: string, offer?: object }
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [inspectPacket, setInspectPacket] = useState(null);
  const [expandedMsgId, setExpandedMsgId] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const messagesEndRef = useRef(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const audioStreamRef = useRef(null);
  const [sendingState, setSendingState] = useState(null);

  const contacts = getContacts(currentUser?.username) || [];
  const pendingRequests = getPendingRequests(currentUser?.username) || [];
  const activeGroup = (groups || []).find(g => g.id === selectedChatId) || null;
  const activeContact = (activeGroup ? { username: activeGroup.name, isGroup: true, group: activeGroup } : null) || contacts.find(c => c.username === selectedChatId) || (allUsers && allUsers[selectedChatId] ? allUsers[selectedChatId] : null) || (selectedChatId ? { username: selectedChatId, status: presences[selectedChatId] || 'offline' } : null);
  const activeConvId = selectedChatId ? (activeGroup ? activeGroup.id : getConversationId(currentUser?.username, selectedChatId)) : null;
  const activeMessages = activeConvId && messages[activeConvId] ? messages[activeConvId] : [];

  useEffect(() => {
    if (activeConvId) {
      fetchHistory(activeConvId);
    }
  }, [activeConvId, fetchHistory]);

  useEffect(() => {
    if (activeConvId && currentUser?.username) {
      const unread = (messages[activeConvId] || []).filter(m => m.receiver === currentUser.username && m.status !== 'read');
      if (unread.length > 0) {
        unread.forEach(m => {
          if (markAsRead) markAsRead(m.id, m.sender);
        });
      }
      if (clearUnread && selectedChatId) {
        clearUnread(selectedChatId);
      }
    }
  }, [activeConvId, selectedChatId, currentUser?.username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  useEffect(() => {
    if (!socket) return;
    const handleIncoming = (data) => setIncomingCallData(data);
    socket.on('call_incoming', handleIncoming);
    return () => socket.off('call_incoming', handleIncoming);
  }, [socket]);

  useEffect(() => {
    const handleEdit = (e) => { if (editMessage) editMessage(e.detail.id, e.detail.text, e.detail.receiver); };
    const handleDel = (e) => { if (deleteMessage) deleteMessage(e.detail.id, e.detail.receiver); };
    window.addEventListener('ll_edit_msg', handleEdit);
    window.addEventListener('ll_del_msg', handleDel);
    return () => {
      window.removeEventListener('ll_edit_msg', handleEdit);
      window.removeEventListener('ll_del_msg', handleDel);
    };
  }, [editMessage, deleteMessage]);

  if (!currentUser) return null;

  // --- Handlers ---
  const handleSend = (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || !selectedChatId) return;
    const text = input;
    setInput('');
    setShowEmojiPicker(false);
    
    if (activeGroup) {
      sendGroupMessage(activeGroup.id, text, 'text');
    } else {
      sendTyping(selectedChatId, false);
      sendMessage(selectedChatId, text, 'text');
    }
  };

  const handleSyncComplete = () => {
    setIsSyncing(false);
    sendMessage(selectedChatId, sendingState?.text || input, 'text');
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const startRecording = async () => {
    if (!selectedChatId) return;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        pushNotification('Audio recording is not supported in this browser.', 'error');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      audioChunksRef.current = [];

      let mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
          mimeType = 'audio/ogg;codecs=opus';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else {
          mimeType = '';
        }
      }

      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied or error:', err);
      pushNotification('Microphone access denied. Please allow microphone permission in your browser.', 'error');
      setIsRecording(false);
    }
  };

  const stopRecording = (shouldSend = true) => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = async () => {
        if (shouldSend && audioChunksRef.current.length > 0) {
          const mimeType = recorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          const ext = mimeType.includes('ogg') ? 'ogg' : mimeType.includes('mp4') ? 'mp4' : 'webm';
          const fileName = `Voice_Note_${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`;
          
          await sendRecordedAudio(audioBlob, fileName, mimeType);
        }
        if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(t => t.stop());
          audioStreamRef.current = null;
        }
        audioChunksRef.current = [];
      };
      recorder.stop();
    } else {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
        audioStreamRef.current = null;
      }
      audioChunksRef.current = [];
    }

    setIsRecording(false);
    setRecordingDuration(0);
  };

  const cancelRecording = () => {
    stopRecording(false);
    pushNotification('Voice recording cancelled', 'info');
  };

  const sendRecordedAudio = async (audioBlob, fileName, mimeType) => {
    if (!selectedChatId) return;
    const isGroup = !!activeGroup;
    const recipient = selectedChatId;

    try {
      pushNotification('Securing and sending voice note...', 'info');

      const formData = new FormData();
      formData.append('file', audioBlob, fileName);
      formData.append('receiver', recipient);
      formData.append('recipient', recipient);
      formData.append('sensitivity', 'CONFIDENTIAL');

      const headers = {
        'ngrok-skip-browser-warning': 'true'
      };
      if (currentUser?.session_token) {
        headers['Authorization'] = `Bearer ${currentUser.session_token}`;
      }

      const res = await fetch('/api/vault/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload voice note');
      }

      const fileMeta = data.file;
      await sendFileMessage(recipient, fileMeta, isGroup);
      pushNotification('Voice note sent successfully!', 'success');
    } catch (err) {
      console.error('Voice note send error:', err);
      pushNotification(`Voice note failed: ${err.message}`, 'error');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedChatId) return;

    // Reset input so same file can be selected again
    e.target.value = '';

    const isGroup = !!activeGroup;
    const recipient = selectedChatId;

    try {
      pushNotification(`Uploading ${file.name} to Quantum Vault...`, 'info');
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('receiver', recipient);
      formData.append('recipient', recipient);
      formData.append('sensitivity', 'CONFIDENTIAL');

      const headers = {
        'ngrok-skip-browser-warning': 'true'
      };
      if (currentUser?.session_token) {
        headers['Authorization'] = `Bearer ${currentUser.session_token}`;
      }

      const res = await fetch('/api/vault/upload', {
        method: 'POST',
        headers,
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      const fileMeta = data.file;
      await sendFileMessage(recipient, fileMeta, isGroup);
      pushNotification(`File shared successfully: ${file.name}`, 'success');
    } catch (err) {
      console.error('File sharing error:', err);
      pushNotification(`File share failed: ${err.message}`, 'error');
    }
  };

  const handleContactSearch = () => {
    if (!searchQuery.trim()) return;
    const results = searchUser(searchQuery.trim()).filter(u => u.username !== currentUser.username);
    setSearchResults(results);
    setShowSearch(true);
  };

  // --- Render Components ---

  const renderLeftSidebar = () => (
    <div style={{ width: '340px', display: 'flex', flexDirection: 'column', background: 'rgba(10, 15, 30, 0.65)', backdropFilter: 'blur(16px)', borderRight: '1px solid rgba(255,255,255,0.05)', zIndex: 20 }}>
      {/* Sidebar Header (WhatsApp Style) */}
      <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
            {currentUser.username.charAt(0)}
          </div>
          <span style={{ fontWeight: '600', color: 'white' }}>{currentUser.username}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', color: '#94a3b8' }}>
          <MessageSquare size={20} style={{ cursor: 'pointer', color: activeSidebarTab === 'chats' ? '#3b82f6' : '#94a3b8' }} onClick={() => setActiveSidebarTab('chats')} title="Chats" />
          <Users size={20} style={{ cursor: 'pointer', color: activeSidebarTab === 'groups' ? '#8b5cf6' : '#94a3b8' }} onClick={() => setActiveSidebarTab('groups')} title="Group Chats" />
          <UserPlus size={20} style={{ cursor: 'pointer', color: activeSidebarTab === 'contacts' ? '#10b981' : '#94a3b8' }} onClick={() => setActiveSidebarTab('contacts')} title="Contacts" />
          <Phone size={20} style={{ cursor: 'pointer', color: activeSidebarTab === 'calls' ? '#f59e0b' : '#94a3b8' }} onClick={() => setActiveSidebarTab('calls')} title="Calls" />
        </div>
      </div>

      {/* Sidebar Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {activeSidebarTab === 'chats' && (
          <>
            <div style={{ padding: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div className="input-group" style={{ flex: 1, padding: '8px 16px', background: 'rgba(0,0,0,0.4)', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Search size={16} color="#64748b" />
                <input 
                  type="text" 
                  value={chatSearchQuery} 
                  onChange={(e) => setChatSearchQuery(e.target.value)} 
                  placeholder="Search secure chats..." 
                  style={{ fontSize: '14px', background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} 
                />
              </div>
              <button
                onClick={() => setShowNewChatModal(true)}
                title="Start New Chat"
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#3b82f6', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 10px rgba(59,130,246,0.4)', flexShrink: 0 }}
              >
                <Plus size={18} />
              </button>
            </div>
            {/* Active Conversations & Connected Contacts Chat List */}
            {(() => {
              const validChatList = chatList || [];
              const chatPartners = new Set(validChatList.map(c => c.partner));
              
              // Connected contacts who don't have a message history yet
              const contactChats = contacts
                .filter(c => !chatPartners.has(c.username))
                .map(c => ({ 
                  partner: c.username, 
                  displayName: c.username, 
                  lastMessage: 'Connected • Click to chat', 
                  online: presences[c.username] === 'ONLINE' 
                }));

              let displayChats = [...validChatList, ...contactChats];

              // Filter by search query if typed
              if (chatSearchQuery.trim()) {
                const q = chatSearchQuery.toLowerCase().trim();
                displayChats = displayChats.filter(c => 
                  c.partner.toLowerCase().includes(q) || (c.displayName && c.displayName.toLowerCase().includes(q))
                );
              }

              if (displayChats.length === 0) {
                return (
                  <div style={{ padding: '32px 24px', color: '#64748b', fontSize: '13px', textAlign: 'center' }}>
                    {chatSearchQuery.trim() ? (
                      "No connected contacts match your search."
                    ) : (
                      <>
                        <div style={{ marginBottom: '8px', color: '#94a3b8', fontWeight: '500' }}>No connected contacts yet</div>
                        <div>Go to the <b>Contacts</b> tab or click <b>+</b> to send connection requests to users.</div>
                      </>
                    )}
                  </div>
                );
              }

              return displayChats.map(chat => (
                <div
                  key={chat.partner}
                  onClick={() => setSelectedChatId(chat.partner)}
                  style={{
                    padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                    background: selectedChatId === chat.partner ? 'rgba(59,130,246,0.15)' : 'transparent',
                    borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'all 0.2s'
                  }}
                  className="hover:bg-white/5"
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px', position: 'relative' }}>
                    {chat.displayName ? chat.displayName.charAt(0) : chat.partner.charAt(0)}
                    <div style={{ position: 'absolute', bottom: '0px', right: '0px', width: '12px', height: '12px', borderRadius: '50%', background: chat.online || presences[chat.partner] === 'ONLINE' ? '#10b981' : '#64748b', border: '2px solid #0f172a' }}></div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'white', fontWeight: '600', fontSize: '15px' }}>{chat.displayName || chat.partner}</span>
                      {chat.lastMessageTime && (
                        <span style={{ color: '#64748b', fontSize: '11px' }}>
                          {new Date(chat.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    {typingUsers[chat.partner] ? (
                      <div style={{ color: '#3b82f6', fontSize: '13px', fontStyle: 'italic' }}>typing...</div>
                    ) : (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: '#94a3b8', fontSize: '13px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                          {chat.lastSender === currentUser.username && (
                            <CheckCheck size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle', color: '#94a3b8' }} />
                          )}
                          {chat.lastMessage || <i>Click to start chat</i>}
                        </div>
                        {chat.unreadCount > 0 && (
                          <div style={{ background: '#3b82f6', color: 'white', borderRadius: '50%', padding: '2px 6px', fontSize: '10px', fontWeight: 'bold', marginLeft: '8px' }}>
                            {chat.unreadCount}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ));
            })()}
          </>
        )}

        {activeSidebarTab === 'groups' && (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '15px' }}>Group Channels</h3>
              <button 
                onClick={() => setShowCreateGroup(true)}
                style={{ background: '#8b5cf6', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Plus size={14} /> New Group
              </button>
            </div>

            {groups.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px' }}>
                No group chats created yet. Click "New Group" to create a quantum encrypted group channel.
              </div>
            ) : (
              groups.map(group => (
                <div
                  key={group.id}
                  onClick={() => setSelectedChatId(group.id)}
                  style={{
                    padding: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', borderRadius: '12px', marginBottom: '8px',
                    background: selectedChatId === group.id ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
                    <Users size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{group.name}</div>
                    <div style={{ color: '#94a3b8', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {group.members?.length || 0} members • {group.lastMessage || group.description}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeSidebarTab === 'contacts' && (
          <div style={{ padding: '16px' }}>
            <h3 style={{ color: 'white', margin: '0 0 16px', fontSize: '15px' }}>Add Contact</h3>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <div className="input-group" style={{ flex: 1, padding: '8px 12px', background: 'rgba(0,0,0,0.4)', borderRadius: '12px' }}>
                <Search size={14} color="#64748b" />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Username..." style={{ fontSize: '13px', background: 'transparent', border: 'none', color: 'white', outline: 'none', width: '100%' }} onKeyDown={(e) => e.key === 'Enter' && handleContactSearch()} />
              </div>
              <button onClick={handleContactSearch} style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer' }}>Search</button>
            </div>
            
            {showSearch && searchResults.length > 0 && searchResults.map(user => (
              <div key={user.username} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '8px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>{user.username.charAt(0)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{user.username}</div>
                  <div style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>{user.nodeId}</div>
                </div>
                <button onClick={() => { sendContactRequest(currentUser.username, user.username); setShowSearch(false); setSearchQuery(''); pushNotification(`Request sent to ${user.username}`, 'info'); }} style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>Add</button>
              </div>
            ))}
            {showSearch && searchResults.length === 0 && (
              <div style={{ padding: '12px', color: '#94a3b8', fontSize: '13px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '8px' }}>
                No users found.
              </div>
            )}

            {pendingRequests.length > 0 && (
              <>
                <h3 style={{ color: '#f59e0b', margin: '24px 0 16px', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={16} /> Pending Requests ({pendingRequests.length})
                </h3>
                {pendingRequests.map(req => (
                  <div key={req.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>{req.sender.charAt(0)}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{req.sender}</div>
                      <div style={{ color: '#94a3b8', fontSize: '11px' }}>wants to connect</div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={async () => { await acceptContactRequest(req.id); pushNotification(`Accepted request from ${req.sender}`, 'success'); }} style={{ background: '#10b981', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Accept</button>
                      <button onClick={async () => { await rejectContactRequest(req.id); pushNotification(`Rejected request from ${req.sender}`, 'info'); }} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Reject</button>
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Global Directory User Discovery List */}
            <h3 style={{ color: 'white', margin: '24px 0 16px', fontSize: '15px' }}>Discover Network Users</h3>
            {(() => {
              const otherUsers = Object.values(allUsers || {}).filter(u => u.username !== currentUser.username);
              if (otherUsers.length === 0) {
                return (
                  <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    No other users registered in directory yet. Use the search bar above or register another account to connect.
                  </div>
                );
              }
              return otherUsers.map(u => {
                const isContact = contacts.some(c => c.username === u.username);
                const hasPending = pendingRequests.some(r => r.sender === u.username || r.receiver === u.username);
                return (
                  <div key={u.username} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', marginBottom: '8px' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '14px' }}>
                      {u.username.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{u.username}</div>
                      <div style={{ color: '#64748b', fontSize: '11px', fontFamily: 'monospace' }}>{u.nodeId?.substring(0, 14)}...</div>
                    </div>
                    {isContact ? (
                      <button onClick={() => { setSelectedChatId(u.username); setActiveSidebarTab('chats'); }} style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#10b981', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Chat</button>
                    ) : hasPending ? (
                      <span style={{ color: '#f59e0b', fontSize: '11px', fontStyle: 'italic' }}>Pending</span>
                    ) : (
                      <button onClick={async (e) => {
                        e.stopPropagation();
                        const success = await sendContactRequest(currentUser.username, u.username);
                        if (success) {
                          pushNotification(`Connection request sent to ${u.username}!`, 'success');
                        }
                      }} style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 0 10px rgba(59,130,246,0.4)' }}>+ Add</button>
                    )}
                  </div>
                );
              });
            })()}

            <h3 style={{ color: 'white', margin: '24px 0 16px', fontSize: '15px' }}>Your Connected Contacts</h3>
            {contacts.length === 0 ? (
              <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                No connected contacts yet. Click "+ Add" above to connect.
              </div>
            ) : (
              contacts.map(contact => (
                <div key={contact.username} onClick={() => { setSelectedChatId(contact.username); setActiveSidebarTab('chats'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', cursor: 'pointer', borderRadius: '12px' }} className="hover:bg-white/5">
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>{contact.username.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>{contact.username}</div>
                    <div style={{ color: '#64748b', fontSize: '12px' }}>{contact.role}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeSidebarTab === 'calls' && (
          <div style={{ padding: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '15px' }}>Recent Calls</h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>{calls.length} logs</span>
            </div>
            {calls.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b', fontSize: '13px' }}>
                No recent calls recorded.
              </div>
            ) : (
              calls.map((call, i) => {
                const otherParty = call.contact || (call.caller === currentUser?.username ? call.receiver : call.caller) || 'Contact';
                const callTime = call.time || (call.timestamp ? (call.timestamp.includes('T') ? call.timestamp.split('T')[0] + ' ' + call.timestamp.split('T')[1].substring(0, 5) : call.timestamp) : 'Recent');
                const callDuration = typeof call.duration === 'number' ? (call.duration > 0 ? `${Math.floor(call.duration / 60)}:${(call.duration % 60).toString().padStart(2, '0')}` : '0:00') : (call.duration || '0:00');
                return (
                  <div key={call.id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }} className="hover:bg-white/5 rounded-lg transition-colors">
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: call.status === 'missed' ? 'rgba(239,68,68,0.15)' : 'rgba(59,130,246,0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                      {call.type === 'video' ? <Video size={18} color={call.status === 'missed' ? '#ef4444' : '#3b82f6'} /> : <Phone size={18} color={call.status === 'missed' ? '#ef4444' : '#3b82f6'} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontSize: '15px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{otherParty}</span>
                        {call.caller === currentUser?.username ? (
                          <span style={{ fontSize: '10px', color: '#38bdf8', background: 'rgba(56,189,248,0.1)', padding: '1px 6px', borderRadius: '4px' }}>Outgoing</span>
                        ) : (
                          <span style={{ fontSize: '10px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '4px' }}>Incoming</span>
                        )}
                      </div>
                      <div style={{ color: call.status === 'missed' ? '#ef4444' : '#94a3b8', fontSize: '12px', display: 'flex', gap: '6px', marginTop: '2px' }}>
                        <span>{callTime}</span> • <span>{call.status === 'missed' ? 'Missed' : `Duration: ${callDuration}`}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderActiveChat = () => {
    if (!activeContact) {
      return (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', background: 'rgba(5, 8, 15, 0.9)', position: 'relative' }}>
          <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(59,130,246,0.4) 0%, transparent 50%)' }} />
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}>
             <ShieldCheck size={100} color="#3b82f6" style={{ margin: '0 auto 24px', filter: 'drop-shadow(0 0 20px rgba(59,130,246,0.5))' }} />
          </motion.div>
          <h2 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '12px' }}>Quantum Secure Messaging</h2>
          <p style={{ color: '#94a3b8', maxWidth: '400px', textAlign: 'center' }}>End-to-end encrypted with ML-KEM and ML-DSA. Select a contact from the sidebar to establish a secure tunnel.</p>
        </div>
      );
    }

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', background: 'rgba(5, 8, 15, 0.9)' }}>
        
        {/* Chat Background Pattern */}
        <div style={{
           position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none', zIndex: 0,
           backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l30 17.32v34.64L30 69.28 0 51.96V17.32L30 0zM30 103.923l30-17.32V51.96L30 34.64 0 51.96v34.64l30 17.32z' fill='none' stroke='%23ffffff' stroke-width='1'/%3E%3C/svg%3E")`
        }} />

        {/* Header */}
        <div style={{ padding: '12px 24px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: activeGroup ? 'linear-gradient(135deg, #8b5cf6, #3b82f6)' : 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
              {activeGroup ? <Users size={22} /> : activeContact.username.charAt(0)}
            </div>
            <div>
              <h3 style={{ color: 'white', margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {activeGroup ? activeGroup.name : activeContact.username} <ShieldCheck size={14} color="#10b981" />
              </h3>
              <div style={{ color: activeGroup ? '#8b5cf6' : (presences[activeContact.username]?.includes('Online') ? '#10b981' : '#64748b'), fontSize: '12px' }}>
                {activeGroup ? `${activeGroup.members?.length || 0} members: ${activeGroup.members?.join(', ')}` : (typingUsers[activeContact.username] ? 'typing...' : (presences[activeContact.username] || (activeContact.status === 'online' ? 'Online' : 'Offline')))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '20px', color: '#cbd5e1' }}>
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }} onClick={() => setActiveCall({ type: 'audio', contact: activeContact?.username })}>
              <Phone size={20} color="#3b82f6" />
            </button>
            <button style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }} onClick={() => setActiveCall({ type: 'video', contact: activeContact?.username })}>
              <Video size={20} color="#3b82f6" />
            </button>
            <span style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }}></span>
            <Info size={22} style={{ cursor: 'pointer', color: showSecurityPanel ? '#3b82f6' : '#cbd5e1' }} onClick={() => setShowSecurityPanel(!showSecurityPanel)} />
          </div>
        </div>

        {/* Message Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10 }}>
           {isSyncing && <MultiDeviceVisualizer isActive={isSyncing} onComplete={handleSyncComplete} />}
           
           {activeMessages.map((msg, index) => {
              const isMe = msg.sender === currentUser.username;
              const isEncrypting = msg.status === 'encrypting';
              
              // WhatsApp style border radius logic (tail on first message of group)
              const prevMsg = index > 0 ? activeMessages[index - 1] : null;
              const nextMsg = index < activeMessages.length - 1 ? activeMessages[index + 1] : null;
              const isFirstInGroup = !prevMsg || prevMsg.sender !== msg.sender;
              const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender;

              let borderRadius = '12px';
              if (isMe) {
                 borderRadius = `12px ${isFirstInGroup ? '0px' : '12px'} 12px 12px`;
              } else {
                 borderRadius = `${isFirstInGroup ? '0px' : '12px'} 12px 12px 12px`;
              }

              return (
                <div key={msg.id} style={{ 
                    alignSelf: isMe ? 'flex-end' : 'flex-start', 
                    maxWidth: '65%', 
                    display: 'flex', 
                    flexDirection: 'column',
                    marginTop: isFirstInGroup ? '8px' : '2px'
                }}>
                  <div style={{
                    background: isEncrypting ? 'rgba(59,130,246,0.1)' : (isMe ? 'linear-gradient(135deg, #2563eb, #4f46e5)' : 'rgba(30, 41, 59, 0.9)'),
                    border: isEncrypting ? '1px dashed #3b82f6' : (isMe ? 'none' : '1px solid rgba(255,255,255,0.05)'),
                    padding: '8px 12px',
                    borderRadius: borderRadius,
                    color: isEncrypting ? '#94a3b8' : 'white',
                    fontSize: '15px',
                    position: 'relative',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                  }}>
                    {isEncrypting ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontStyle: 'italic' }}>
                        <Lock size={12} /> Encrypting...
                      </span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {!isMe && activeGroup && (
                          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#a7f3d0', marginBottom: '2px' }}>
                            {msg.sender}
                          </span>
                        )}
                        {msg.type === 'file' ? (
                          <FileMessageCard 
                            message={msg} 
                            isMe={isMe} 
                            sessionToken={currentUser?.session_token} 
                          />
                        ) : (
                          <>
                            {(msg.type === 'image' || msg.image?.startsWith('data:image/')) && (
                              <img src={msg.image} alt="Attachment" style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', marginBottom: '4px', cursor: 'pointer' }} onClick={() => window.open(msg.image, '_blank')} />
                            )}
                            {(msg.type === 'video' || msg.image?.startsWith('data:video/')) && (
                              <video src={msg.image} controls style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', marginBottom: '4px' }} />
                            )}
                            {(msg.type === 'audio' || msg.image?.startsWith('data:audio/')) && (
                              <audio src={msg.image} controls style={{ maxWidth: '100%', marginBottom: '4px' }} />
                            )}
                            {msg.type !== 'image' && msg.type !== 'video' && msg.type !== 'audio' && (() => {
                              const trimmed = (msg.text || '').trim();
                              // Check if message is pure emoji (1 to 3 emojis)
                              const emojiRegex = /^(\p{Extended_Pictographic}|\p{Emoji_Presentation}){1,3}$/u;
                              const isOnlyEmoji = emojiRegex.test(trimmed);

                              return (
                                <span style={{ 
                                  textDecoration: msg.is_deleted ? 'line-through' : 'none', 
                                  fontStyle: msg.is_deleted ? 'italic' : 'normal', 
                                  opacity: msg.is_deleted ? 0.7 : 1, 
                                  lineHeight: '1.4',
                                  fontSize: isOnlyEmoji ? '32px' : '15px',
                                  display: 'inline-block'
                                }}>
                                  {msg.text}
                                </span>
                              );
                            })()}
                          </>
                        )}
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                           <span style={{ fontSize: '10px', color: isMe ? 'rgba(255,255,255,0.7)' : '#94a3b8' }}>{msg.timestamp}</span>
                           <span 
                             title="Inspect PQC Packet" 
                             style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                             onClick={() => setInspectPacket(msg)}
                           >
                             <Shield size={11} color={isMe ? 'rgba(255,255,255,0.7)' : '#38bdf8'} />
                           </span>
                           {isMe && (
                             <span style={{ display: 'flex', alignItems: 'center' }}>
                               {msg.status === 'read' ? <CheckCheck size={14} color="#60a5fa" /> : <CheckCheck size={14} color="rgba(255,255,255,0.6)" />}
                             </span>
                           )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
           })}
           {sendingState && (
              <div style={{ alignSelf: 'flex-end', maxWidth: '65%' }}>
                <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px dashed #3b82f6', padding: '8px 12px', borderRadius: '12px 0 12px 12px', color: '#94a3b8', fontSize: '14px' }}>
                  {sendingState.text}
                </div>
                <div style={{ fontSize: '11px', color: '#3b82f6', marginTop: '4px', textAlign: 'right', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px' }}>
                  <Lock size={12} className="spin-icon" /> {sendingState.step}
                </div>
              </div>
            )}
           <div ref={messagesEndRef} style={{ height: '20px' }} />
        </div>

        {/* Input Bar */}
        <div style={{ padding: '16px 24px', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', borderTop: '1px solid rgba(255,255,255,0.05)', zIndex: 20, position: 'relative' }}>
           {showEmojiPicker && (
             <div style={{ position: 'absolute', bottom: '85px', left: '24px', background: 'rgba(15,23,42,0.98)', backdropFilter: 'blur(16px)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: '16px', padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '10px', zIndex: 60, boxShadow: '0 -10px 40px rgba(0,0,0,0.7)', maxHeight: '200px', overflowY: 'auto' }}>
               {['😀','😃','😄','😁','😆','😂','🤣','😊','😇','🥰','😍','🤩','😘','😋','😜','😎','🥳','😏','🤔','🤫','🤗','🫡','😴','🤯','🥳','👍','👎','👏','🙌','🫶','❤️','🔥','🎉','✨','🚀','💯','⭐','💡','🔒','🛡️','⚡','💻','📱','📸','🎥','🎵','🍔','🍕'].map(emoji => (
                 <button 
                   key={emoji} 
                   type="button"
                   style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '22px', padding: '4px', borderRadius: '8px', transition: 'transform 0.1s, background 0.1s' }} 
                   className="hover:scale-125 hover:bg-white/10" 
                   onClick={() => setInput(prev => prev + emoji)}
                 >
                   {emoji}
                 </button>
               ))}
             </div>
           )}

           {isRecording ? (
             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '30px', padding: '8px 16px', gap: '12px' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 10px #ef4444' }} className="animate-pulse" />
                 <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '15px', fontFamily: 'monospace' }}>
                   {formatRecordingTime(recordingDuration)}
                 </span>
                 <span style={{ color: '#cbd5e1', fontSize: '13px' }}>Recording voice note...</span>
               </div>
               <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                 <button 
                   type="button" 
                   onClick={cancelRecording} 
                   style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}
                   className="hover:bg-red-500/40"
                   title="Cancel recording"
                 >
                   <Trash2 size={18} color="#fca5a5" />
                 </button>
                 <button 
                   type="button" 
                   onClick={() => stopRecording(true)} 
                   style={{ background: '#10b981', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 15px rgba(16,185,129,0.5)', transition: '0.2s' }}
                   className="hover:bg-emerald-400 hover:scale-105"
                   title="Send voice note"
                 >
                   <Send size={18} color="white" style={{ marginLeft: '2px' }} />
                 </button>
               </div>
             </div>
           ) : (
             <form onSubmit={handleSend} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
               <Smile size={24} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="hover:text-white transition-colors" />
               <input type="file" accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} />
               <Paperclip size={24} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()} className="hover:text-white transition-colors" />
               
               <input
                 type="text" value={input} onChange={(e) => { setInput(e.target.value); sendTyping(selectedChatId, e.target.value.length > 0); }}
                 placeholder="Type a secure message..."
                 style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 20px', borderRadius: '30px', color: 'white', outline: 'none', fontSize: '15px', transition: 'all 0.2s' }}
                 className="focus:bg-white/10 focus:border-blue-500/50"
               />
               
               {!input.trim() ? (
                 <button 
                   type="button" 
                   onClick={startRecording} 
                   style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' }}
                   className="hover:bg-blue-600/30"
                   title="Record Voice Note"
                 >
                   <Mic size={24} color="#94a3b8" />
                 </button>
               ) : (
                 <button type="submit" style={{ background: '#3b82f6', border: 'none', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 0 20px rgba(59,130,246,0.5)', transition: '0.2s' }} className="hover:bg-blue-400 hover:scale-105">
                   <Send size={20} color="white" style={{ marginLeft: '4px' }} />
                 </button>
               )}
             </form>
           )}
        </div>

      </div>
    );
  };

  const renderSecurityPanel = () => {
    if (!showSecurityPanel || !activeContact) return null;
    
    const sharedMedia = activeMessages.filter(msg => msg.image || msg.type === 'image' || msg.type === 'file');

    return (
      <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: '320px', opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.3 }} style={{ background: 'rgba(10, 15, 30, 0.8)', backdropFilter: 'blur(20px)', borderLeft: '1px solid rgba(255,255,255,0.05)', padding: '24px', overflowY: 'auto', zIndex: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h4 style={{ color: 'white', fontSize: '16px', margin: 0 }}>Contact Info</h4>
          <X size={20} color="#94a3b8" style={{ cursor: 'pointer' }} onClick={() => setShowSecurityPanel(false)} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold', fontSize: '40px', marginBottom: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>
            {activeContact.username.charAt(0)}
          </div>
          <div style={{ color: 'white', fontSize: '22px', fontWeight: 'bold' }}>{activeContact.username}</div>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>{activeContact.nodeId}</div>
        </div>

        <h4 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Quantum Security</h4>
        
        <div style={{ marginBottom: '16px', padding: '16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', textAlign: 'center' }}>
          <ShieldCheck size={24} color="#10b981" style={{ margin: '0 auto 8px' }} />
          <div style={{ color: '#10b981', fontSize: '14px', fontWeight: 'bold' }}>End-to-End Encrypted</div>
          <div style={{ color: '#a7f3d0', fontSize: '12px', marginTop: '4px' }}>Nobody outside this chat, not even LatticeLink, can read or listen to them.</div>
        </div>

        {[
          { label: 'ML-KEM Key', value: activeContact.mlKemPubKey?.slice(0, 16) + '...', color: '#8b5cf6', icon: Box },
          { label: 'ML-DSA Key', value: activeContact.mlDsaPubKey?.slice(0, 16) + '...', color: '#3b82f6', icon: Shield },
        ].map((item, i) => (
          <div key={i} style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 16px', borderRadius: '12px', marginBottom: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
              <item.icon size={12} color={item.color} /> {item.label}
            </div>
            <div style={{ color: item.color, fontSize: '13px', fontFamily: 'monospace', fontWeight: '500' }}>{item.value}</div>
          </div>
        ))}
        
        <h4 style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '24px', marginBottom: '12px' }}>Media & Docs</h4>
        {sharedMedia.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', paddingBottom: '16px' }}>
            {sharedMedia.map(media => {
              const targetFileId = media.file_id || media.file_meta?.id;
              const token = currentUser?.session_token || (() => {
                try { return JSON.parse(localStorage.getItem('ll_session_v4') || '{}').session_token || ''; } catch { return ''; }
              })();
              const streamUrl = targetFileId 
                ? `/api/vault/files/${targetFileId}/download?inline=true${token ? `&token=${encodeURIComponent(token)}` : ''}` 
                : media.image;
              const isImg = (media.file_meta?.mimetype || '').startsWith('image/') || (media.file_meta?.name || '').match(/\.(jpg|jpeg|png|gif|webp)$/i) || !!media.image;
              const isVid = (media.file_meta?.mimetype || '').startsWith('video/') || (media.file_meta?.name || '').match(/\.(mp4|webm|mov)$/i);

              return (
                <div key={media.id} style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', cursor: 'pointer', position: 'relative' }} onClick={() => {
                  if (streamUrl) {
                    window.open(streamUrl, '_blank');
                  }
                }}>
                  {isImg && streamUrl ? (
                    <img src={streamUrl} alt="Shared media" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                  ) : isVid ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(139,92,246,0.15)', gap: '4px' }}>
                      <Video size={22} color="#a855f7" />
                      <span style={{ fontSize: '9px', color: '#c084fc' }}>Video</span>
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', padding: '4px', textAlign: 'center' }}>
                      <Paperclip size={20} color="#38bdf8" />
                      <span style={{ fontSize: '9px', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>{media.file_meta?.name || media.text || 'File'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '16px' }}>
            No media shared yet.
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59,130,246,0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 20px rgba(59,130,246,0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
        .spin-icon { animation: spin 2s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        /* Custom Scrollbar for Chat */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
      
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {renderLeftSidebar()}
        {renderActiveChat()}
        <AnimatePresence>
          {renderSecurityPanel()}
        </AnimatePresence>
      </div>

      <PacketInspectorModal packet={inspectPacket} onClose={() => setInspectPacket(null)} />
      {incomingCallData && (
        <IncomingCallModal 
          callData={incomingCallData} 
          onAccept={() => {
            setActiveCall({
              type: incomingCallData.call_type,
              contact: incomingCallData.caller,
              offer: incomingCallData.offer
            });
            setIncomingCallData(null);
          }}
          onReject={() => {
            // Need socket to emit reject
            setIncomingCallData(null);
          }}
        />
      )}
      {activeCall && (
        <CallOverlay 
          activeContact={activeCall.contact || activeContact?.username} 
          initialCallType={activeCall.type} 
          incomingOffer={activeCall.offer}
          onEnd={() => setActiveCall(null)} 
        />
      )}
      {showCreateGroup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '90%', maxWidth: '440px', padding: '24px', background: '#0f172a', border: '1px solid #8b5cf6', borderRadius: '16px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', color: 'white' }}>
                <Users size={20} color="#8b5cf6" /> Create Quantum Group Channel
              </h3>
              <button onClick={() => setShowCreateGroup(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!newGroupName.trim()) return;
              const g = await createGroup(newGroupName.trim(), newGroupDesc.trim(), selectedMembers);
              if (g) {
                pushNotification(`Group '${g.name}' created!`, 'success');
                setSelectedChatId(g.id);
                setShowCreateGroup(false);
                setNewGroupName('');
                setNewGroupDesc('');
                setSelectedMembers([]);
                setActiveSidebarTab('groups');
              }
            }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Group Name:</label>
              <input 
                type="text" 
                placeholder="e.g. Cyber Defense Squad" 
                value={newGroupName} 
                onChange={e => setNewGroupName(e.target.value)} 
                required 
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '14px', marginBottom: '16px', outline: 'none' }}
              />

              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Description:</label>
              <input 
                type="text" 
                placeholder="Group purpose or topic..." 
                value={newGroupDesc} 
                onChange={e => setNewGroupDesc(e.target.value)} 
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontSize: '14px', marginBottom: '16px', outline: 'none' }}
              />

              <label style={{ display: 'block', color: '#94a3b8', fontSize: '12px', marginBottom: '6px' }}>Select Contacts to Add:</label>
              <div style={{ maxHeight: '140px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '8px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.05)' }}>
                {contacts.length === 0 ? (
                  <div style={{ color: '#64748b', fontSize: '12px', textAlign: 'center', padding: '8px' }}>No contacts found. Add contacts first.</div>
                ) : (
                  contacts.map(c => (
                    <label key={c.username} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px', cursor: 'pointer', color: 'white', fontSize: '13px' }}>
                      <input 
                        type="checkbox" 
                        checked={selectedMembers.includes(c.username)} 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedMembers(prev => [...prev, c.username]);
                          else setSelectedMembers(prev => prev.filter(m => m !== c.username));
                        }} 
                      />
                      {c.username}
                    </label>
                  ))
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateGroup(false)} style={{ padding: '10px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 22px', background: '#8b5cf6', border: 'none', borderRadius: '8px', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>
                  Create Channel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showNewChatModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: '90%', maxWidth: '440px', padding: '24px', background: '#0f172a', border: '1px solid #3b82f6', borderRadius: '16px', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px', color: 'white' }}>
                <MessageSquare size={20} color="#3b82f6" /> Start New Encrypted Chat
              </h3>
              <button onClick={() => setShowNewChatModal(false)} style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '16px' }}>
              Select from your connected contacts to open a conversation:
            </div>

            <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {(() => {
                const otherUsers = Object.values(allUsers || {}).filter(u => u.username !== currentUser.username);
                const combinedList = [...contacts];
                otherUsers.forEach(u => {
                  if (!combinedList.some(c => c.username === u.username)) {
                    combinedList.push({ username: u.username, isDirectoryUser: true });
                  }
                });
                if (combinedList.length === 0) {
                  return (
                    <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
                      <div style={{ marginBottom: '6px', color: '#cbd5e1' }}>No other users found in directory yet</div>
                      <div style={{ fontSize: '12px' }}>Register a second user account to begin secure messaging.</div>
                    </div>
                  );
                }
                return combinedList.map(c => (
                  <div
                    key={c.username}
                    onClick={() => {
                      setSelectedChatId(c.username);
                      setShowNewChatModal(false);
                      setActiveSidebarTab('chats');
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px',
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px', cursor: 'pointer', transition: '0.2s'
                    }}
                    className="hover:bg-blue-500/20"
                  >
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #10b981)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontWeight: 'bold' }}>
                      {c.username.charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: 'white', fontWeight: '600', fontSize: '14px' }}>{c.username}</div>
                      <div style={{ color: c.isDirectoryUser ? '#94a3b8' : '#10b981', fontSize: '11px' }}>
                        {c.isDirectoryUser ? 'Network User' : 'Connected Contact'}
                      </div>
                    </div>
                    <button style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Chat</button>
                  </div>
                ));
              })()}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setShowNewChatModal(false)} style={{ padding: '8px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', color: 'white', cursor: 'pointer' }}>Close</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
