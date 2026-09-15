import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { io } from 'socket.io-client';

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState({});
  const [presences, setPresences] = useState({});
  const [typingUsers, setTypingUsers] = useState({});
  const [chatList, setChatList] = useState([]);

  const [calls, setCalls] = useState(() => {
    const saved = localStorage.getItem('ll_chat_calls_v4');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchedConvsRef = React.useRef(new Set());

  const getConversationId = useCallback((userA, userB) => {
    if (!userA || !userB) return '';
    return [userA, userB].sort().join('-');
  }, []);

  const fetchChats = useCallback(async () => {
    if (!currentUser || !currentUser.session_token) return;
    try {
      const res = await fetch('/api/chat/chats', {
        headers: {
          'Authorization': `Bearer ${currentUser.session_token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setChatList(data.chats || []);
      }
    } catch (e) {
      console.error('Error fetching chat list', e);
    }
  }, [currentUser]);

  const [groups, setGroups] = useState([]);

  const fetchGroups = useCallback(async () => {
    if (!currentUser || !currentUser.username || !currentUser.session_token) return;
    try {
      const res = await fetch(`/api/chat/groups/${currentUser.username}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.session_token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups || []);
      }
    } catch (e) {
      console.error('Error fetching user groups', e);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || !currentUser.username) {
      setMessages({});
      setPresences({});
      setTypingUsers({});
      setChatList([]);
      setCalls([]);
      fetchedConvsRef.current.clear();
      return;
    }

    // Socket.IO must connect to the Render backend explicitly. With no URL
    // argument, the client would target the Vercel frontend origin, where
    // no Socket.IO server exists in production.
    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL ||
      'https://latticelink-backend.onrender.com';

    const newSocket = io(BACKEND_URL, {
      // Polling only: Render's proxy rejects the WebSocket upgrade (HTTP 500),
      // while polling works reliably. Restricting the transport list means
      // no WebSocket upgrade is ever attempted.
      transports: ['polling'],
      auth: { token: currentUser.session_token }
    });
    
    let heartbeatInterval;
    
    newSocket.on('connect', () => {
      // Backend automatically joins rooms based on JWT
      // We can emit heartbeat periodically
      console.info('[socket] connected:', newSocket.id);
      heartbeatInterval = setInterval(() => {
        newSocket.emit('heartbeat');
      }, 30000);
    });
    
    newSocket.on('disconnect', (reason) => {
      console.warn('[socket] disconnected:', reason);
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually
        // or trigger a logout if it was due to invalid token
        console.error("Socket disconnected by server. Token might be invalid.");
      }
      clearInterval(heartbeatInterval);
    });

    // ---- Safe client diagnostics: never log tokens, keys, or OTPs ----
    newSocket.on('connect_error', (err) => {
      console.error('[socket] connect_error:', err?.message || 'unknown connection error');
    });

    // Manager-level transport errors (e.g. a failed poll between reconnects)
    newSocket.io.on('error', (err) => {
      console.error('[socket] transport error:', err?.message || 'unknown transport error');
    });

    newSocket.io.on('reconnect', (attempt) => {
      console.info('[socket] reconnected after', attempt, 'attempt(s)');
    });

      newSocket.on('receive_message', (msg) => {
        setMessages(prev => {
          const convId = getConversationId(msg.sender, msg.receiver);
          const existing = prev[convId] || [];
          // Remove any temp message with same sender+text, then add real one
          const withoutTemp = existing.filter(m =>
            !(typeof m.id === 'string' && m.id.startsWith('temp_') && m.sender === msg.sender && m.text === msg.text)
          );
          if (withoutTemp.find(m => m.id === msg.id)) return prev; // already there
          return {
            ...prev,
            [convId]: [...withoutTemp, msg]
          };
        });
        // Refresh chat list for unread counts / last messages
        fetchChats();
      });

      newSocket.on('receive_group_message', (msg) => {
        setMessages(prev => {
          const groupId = msg.group_id || msg.receiver;
          const existing = prev[groupId] || [];
          const withoutTemp = existing.filter(m =>
            !(typeof m.id === 'string' && m.id.startsWith('temp_') && m.sender === msg.sender && m.text === msg.text)
          );
          if (withoutTemp.find(m => m.id === msg.id)) return prev;
          return {
            ...prev,
            [groupId]: [...withoutTemp, msg]
          };
        });
        fetchChats();
      });

      newSocket.on('message_status', (data) => {
        // data: { messageId, status: 'delivered'|'read', convId }
        setMessages(prev => {
          if (!prev[data.convId]) return prev;
          const updated = prev[data.convId].map(msg => 
            msg.id === data.messageId ? { ...msg, status: data.status } : msg
          );
          return { ...prev, [data.convId]: updated };
        });
        fetchChats();
      });

      newSocket.on('message_edited', (data) => {
        // data: { messageId, newText, convId }
        setMessages(prev => {
          if (!prev[data.convId]) return prev;
          const updated = prev[data.convId].map(msg => 
            msg.id === data.messageId ? { ...msg, text: data.newText, is_edited: true } : msg
          );
          return { ...prev, [data.convId]: updated };
        });
      });

      newSocket.on('message_deleted', (data) => {
        // data: { messageId, convId }
        setMessages(prev => {
          if (!prev[data.convId]) return prev;
          const updated = prev[data.convId].map(msg => 
            msg.id === data.messageId ? { ...msg, text: 'This message was deleted.', is_deleted: true, image: null } : msg
          );
          return { ...prev, [data.convId]: updated };
        });
      });

      newSocket.on('presence_change', (data) => {
        setPresences(prev => ({ ...prev, [data.username]: data.status }));
      });

      newSocket.on('typing_start', (data) => {
        setTypingUsers(prev => ({ ...prev, [data.sender]: 'typing...' }));
      });

      newSocket.on('typing_stop', (data) => {
        setTypingUsers(prev => ({ ...prev, [data.sender]: null }));
      });

      newSocket.on('group_created', () => {
        fetchGroups();
      });

      setSocket(newSocket);
      return () => {
        clearInterval(heartbeatInterval);
        newSocket.close();
      };
  }, [currentUser, fetchChats, fetchGroups]);

  // We fetch calls in a dedicated function
  const fetchCalls = useCallback(async () => {
    if (!currentUser || !currentUser.username) return;
    try {
      const res = await fetch(`/api/chat/calls/${currentUser.username}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.session_token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCalls(data.calls || []);
      }
    } catch (e) {
      console.error('Error fetching calls', e);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCalls();
  }, [fetchCalls]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    localStorage.setItem('ll_chat_calls_v4', JSON.stringify(calls));
  }, [calls]);



  const fetchHistory = async (convId) => {
    if (!convId || fetchedConvsRef.current.has(convId)) return;
    fetchedConvsRef.current.add(convId);
    try {
      const res = await fetch(`/api/chat/history/${convId}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.session_token}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => {
          const existingIds = new Set((prev[convId] || []).map(m => m.id));
          const newMsgs = (data.messages || []).filter(m => !existingIds.has(m.id));
          return {
            ...prev,
            [convId]: [...newMsgs, ...(prev[convId] || [])]
          };
        });
      } else {
        fetchedConvsRef.current.delete(convId);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
      fetchedConvsRef.current.delete(convId);
    }
  };

  const sendMessage = (receiver, text, type = 'text', image = null) => {
        if (!currentUser || !socket) return;

        // Optimistic update — show message immediately in sender's UI
        const tempMsg = {
          id: `temp_${Date.now()}`,
          sender: currentUser.username,
          receiver,
          text,
          type,
          image,
          timestamp: new Date().toISOString(),
          status: 'SENDING'
        };
        const convId = getConversationId(currentUser.username, receiver);
        setMessages(prev => ({
          ...prev,
          [convId]: [...(prev[convId] || []), tempMsg]
        }));
        
        socket.emit('send_message', {
          sender: currentUser.username,
          receiver,
          text,
          type,
          image
        });
        
        socket.emit('typing_stop', { receiver });
      };
    
      const updatePresence = (status) => {
        if (!currentUser || !socket) return;
        // status_change isn't strictly handled by backend, but we'll keep it or ignore.
        // The backend handles presence on connect/disconnect.
        setPresences(prev => ({ ...prev, [currentUser.username]: status }));
      };
    
      const sendTyping = (receiver, isTyping, activity = 'is typing...') => {
        if (!currentUser || !socket) return;
        if (isTyping) {
            socket.emit('typing_start', { receiver, activity });
        } else {
            socket.emit('typing_stop', { receiver });
        }
      };

      const editMessage = (messageId, newText, receiver) => {
        // Backend does not currently support edit_message. Stub.
      };

      const deleteMessage = (messageId, receiver) => {
        // Backend does not currently support delete_message. Stub.
      };

      const markAsRead = (messageId, sender) => {
        if (!currentUser || !socket) return;
        socket.emit('read_receipt', { sender, message_id: messageId });
      };

      const clearUnread = (partnerId) => {
        setChatList(prev => prev.map(chat => 
          chat.partner === partnerId ? { ...chat, unreadCount: 0 } : chat
        ));
      };

  const logCall = async (contact, type, duration = '0:00') => {
    const newCall = {
      id: `call_${Date.now()}`,
      contact,
      caller: currentUser?.username,
      receiver: contact,
      type,
      time: 'Just now',
      timestamp: new Date().toISOString(),
      duration,
      status: 'completed'
    };
    setCalls(prev => [newCall, ...prev]);

    let durationSeconds = 0;
    if (typeof duration === 'number') {
      durationSeconds = duration;
    } else if (typeof duration === 'string' && duration.includes(':')) {
      const parts = duration.split(':');
      durationSeconds = (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
    }

    if (currentUser?.session_token && contact) {
      try {
        await fetch('/api/chat/calls/log', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${currentUser.session_token}`
          },
          body: JSON.stringify({
            contact,
            type,
            duration: durationSeconds,
            status: 'completed'
          })
        });
        fetchCalls();
      } catch (err) {
        console.warn("Failed to persist call log to backend", err);
      }
    }
  };

  const createGroup = async (name, description, members) => {
    if (!currentUser) return null;
    try {
      const res = await fetch('/api/chat/groups/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.session_token}`
        },
        body: JSON.stringify({
          name,
          description,
          creator: currentUser.username,
          members
        })
      });
      if (res.ok) {
        const data = await res.json();
        fetchGroups();
        if (socket && data.group?.id) {
          socket.emit('join_group', { group_id: data.group.id, username: currentUser.username });
        }
        return data.group;
      }
    } catch (e) {
      console.error('Error creating group', e);
    }
    return null;
  };

  const sendGroupMessage = (groupId, text, type = 'text', image = null) => {
    if (!currentUser || !socket) return;
    const tempMsg = {
      id: `temp_${Date.now()}`,
      sender: currentUser.username,
      receiver: groupId,
      text,
      type,
      image,
      timestamp: new Date().toISOString(),
      status: 'SENDING'
    };
    setMessages(prev => ({
      ...prev,
      [groupId]: [...(prev[groupId] || []), tempMsg]
    }));

    socket.emit('send_group_message', {
      sender: currentUser.username,
      group_id: groupId,
      text,
      type,
      image
    });
  };

  useEffect(() => {
    if (groups.length > 0 && socket) {
      groups.forEach(g => {
        socket.emit('join_group', { group_id: g.id, username: currentUser?.username });
      });
    }
  }, [groups, socket, currentUser]);

  const sendFileMessage = (receiver, fileMeta, isGroup = false) => {
    if (!currentUser || !socket) return;
    
    // Optimistically add to UI
    const convId = isGroup ? receiver : getConversationId(currentUser.username, receiver);
    const tempMsg = {
      id: `temp_${Date.now()}`,
      conversation_id: convId,
      sender: currentUser.username,
      receiver,
      type: 'file',
      file_id: fileMeta.id,
      file_meta: fileMeta,
      text: fileMeta.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'SENDING'
    };

    setMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), tempMsg]
    }));

    socket.emit('send_file_message', {
      receiver,
      file_id: fileMeta.id,
      filename: fileMeta.name,
      mime_type: fileMeta.mimetype,
      size: fileMeta.size,
      is_group: isGroup
    });
  };

  return (
    <ChatContext.Provider value={{ 
      socket, messages, chatList, fetchChats, sendMessage, sendFileMessage, editMessage, deleteMessage, 
      markAsRead, calls, logCall, getConversationId, presences, typingUsers, 
      updatePresence, sendTyping, fetchHistory, clearUnread,
      groups, fetchGroups, createGroup, sendGroupMessage
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
