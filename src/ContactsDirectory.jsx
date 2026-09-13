import React, { useState } from 'react';
import { 
  Users, UserPlus, Search, ShieldCheck, X, 
  MessageSquare, Phone, Video, Lock, Fingerprint, Activity, Network, Bell
} from 'lucide-react';
import MatrixRain from './MatrixRain';
import { useAuth } from './context/AuthContext';
import { useUser } from './context/UserContext';

const ContactsDirectory = () => {
  const { currentUser } = useAuth();
  const { getContacts, getPendingRequests, searchUser, sendContactRequest, acceptContactRequest, rejectContactRequest } = useUser();

  const contacts = currentUser ? getContacts(currentUser.username) : [];
  const pendingRequests = currentUser ? getPendingRequests(currentUser.username) : [];
  // Mock groups for now
  const groups = []; 

  // --- UI States ---
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [addSearchResults, setAddSearchResults] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null); 

  // --- Handlers ---
  const handleContactSearch = () => {
    if (!addSearchQuery.trim()) return;
    const results = searchUser(addSearchQuery.trim()).filter(u => u.username !== currentUser.username);
    setAddSearchResults(results);
  };

  const handleSendRequest = async (username) => {
    await sendContactRequest(currentUser.username, username);
    setIsAddContactOpen(false);
    setAddSearchQuery('');
    setAddSearchResults([]);
    alert(`Request sent to ${username}`);
  };

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event('popstate'));
  };

  const handleQuickAction = (actionType) => {
    if (actionType === 'message') navigateTo('/secure-messaging');
    if (actionType === 'audio' || actionType === 'video') navigateTo('/voice-video');
  };

  const filteredContacts = contacts.filter(c => (c.username || c.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
  const mockHash = selectedContact ? Array.from({length: 32}, () => Math.floor(Math.random()*16).toString(16)).join('').toUpperCase() : '';

  if (!currentUser) {
    return (
      <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <MatrixRain />
        <div className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '400px', zIndex: 10, textAlign: 'center' }}>
           <h2 style={{ color: 'white' }}>Identity Verification Required</h2>
           <p style={{ color: '#94a3b8' }}>Please log in to access the Operator Directory.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <MatrixRain />

      {/* Main Directory Area */}
      <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', zIndex: 10, overflowY: 'auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Users size={32} color="#3b82f6" /> Operator Directory
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Manage secure connections and quantum-linked peers.</p>
          </div>
          
          <button className="neon-button" onClick={() => setIsAddContactOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <UserPlus size={18} /> Add Operator
          </button>
        </div>

        {/* Pending Requests */}
        {pendingRequests.length > 0 && (
          <div style={{ marginBottom: '32px' }}>
            <h2 style={{ color: '#f59e0b', fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid rgba(245,158,11,0.2)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} /> Pending Links ({pendingRequests.length})
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {pendingRequests.map(req => (
                <div key={req.id} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '20px' }}>
                    {req.sender.charAt(0)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{req.sender}</div>
                    <div style={{ color: '#94a3b8', fontSize: '11px' }}>wants to establish a secure link</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button onClick={() => acceptContactRequest(req.id)} style={{ background: '#10b981', border: 'none', color: 'white', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Accept</button>
                    <button onClick={() => rejectContactRequest(req.id)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#94a3b8', padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <Search size={20} color="#64748b" />
          <input 
            type="text" 
            placeholder="Search operators by alias..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', outline: 'none', flex: 1, fontSize: '15px' }}
          />
        </div>

        {/* Contacts Grid */}
        <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Active Links ({filteredContacts.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px', marginBottom: '40px' }}>
          {filteredContacts.length === 0 ? (
            <div style={{ color: '#64748b', gridColumn: '1 / -1' }}>No active operators found.</div>
          ) : (
            filteredContacts.map(contact => {
              const name = contact.username || contact.name;
              return (
              <div 
                key={contact.id || name} 
                onClick={() => setSelectedContact(contact)}
                className="glass-card contact-card"
                style={{ padding: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '16px', transition: '0.2s', border: selectedContact?.id === contact.id ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)' }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '2px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 'bold', fontSize: '20px' }}>
                  {(name || 'U').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{name}</div>
                  <div style={{ color: '#10b981', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <ShieldCheck size={12} /> Quantum Link Active
                  </div>
                </div>
              </div>
            )})
          )}
        </div>

        {/* Groups Grid */}
        <h2 style={{ color: 'white', fontSize: '18px', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Secure Enclaves ({groups.length})</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
          {groups.length === 0 ? (
            <div style={{ color: '#64748b', gridColumn: '1 / -1' }}>You are not part of any enclaves.</div>
          ) : (
            groups.map(group => (
              <div key={group.id} className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.1)', border: '2px solid #8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                  <Network size={24} />
                </div>
                <div>
                  <div style={{ color: 'white', fontWeight: 'bold', fontSize: '16px', marginBottom: '4px' }}>{group.name}</div>
                  <div style={{ color: '#8b5cf6', fontSize: '11px' }}>{group.members.length} Members</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Profile Side-Panel */}
      {selectedContact && (
        <div className="glass-card side-panel" style={{ width: '380px', borderLeft: '1px solid rgba(59, 130, 246, 0.3)', borderTop: 'none', borderBottom: 'none', borderRight: 'none', borderRadius: 0, zIndex: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'white', margin: 0 }}>Operator Profile</h3>
            <button onClick={() => setSelectedContact(null)} className="icon-btn" style={{ border: 'none' }}><X size={20} /></button>
          </div>
          
          <div style={{ padding: '32px 24px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', border: '3px solid #10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981', fontWeight: 'bold', fontSize: '48px', marginBottom: '24px', boxShadow: '0 0 30px rgba(16, 185, 129, 0.2)' }}>
              {(selectedContact.username || selectedContact.name || 'U').charAt(0).toUpperCase()}
            </div>
            
            <h2 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '28px' }}>{selectedContact.username || selectedContact.name}</h2>
            <div style={{ color: '#10b981', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 12px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
              <ShieldCheck size={16} /> ML-KEM Secured
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '32px', width: '100%' }}>
              <button onClick={() => handleQuickAction('message')} className="quick-action-btn">
                <MessageSquare size={20} /><span>Message</span>
              </button>
              <button onClick={() => handleQuickAction('audio')} className="quick-action-btn">
                <Phone size={20} /><span>Audio</span>
              </button>
              <button onClick={() => handleQuickAction('video')} className="quick-action-btn">
                <Video size={20} /><span>Video</span>
              </button>
            </div>

            <div style={{ width: '100%', marginTop: '40px' }}>
              <h4 style={{ color: '#94a3b8', margin: '0 0 16px 0', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Technical Diagnostics</h4>
              <div className="spec-row">
                <div className="spec-label"><Fingerprint size={14} /> Node ID</div>
                <div className="spec-value" style={{ fontFamily: 'monospace', fontSize: '11px', color: '#3b82f6' }}>{selectedContact.nodeId || 'N/A'}</div>
              </div>
              <div className="spec-row">
                <div className="spec-label"><Lock size={14} /> Cipher Suite</div>
                <div className="spec-value">AES-256-GCM / ML-KEM</div>
              </div>
              <div className="spec-row">
                <div className="spec-label"><Activity size={14} /> Latency</div>
                <div className="spec-value" style={{ color: '#10b981' }}>14ms (P2P Tunnel)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {isAddContactOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ padding: '32px', width: '100%', maxWidth: '400px', position: 'relative' }}>
            <button onClick={() => setIsAddContactOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <UserPlus size={20} color="#3b82f6" /> Add New Operator
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>Search directory to establish a secure link.</p>
            
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input 
                type="text" 
                value={addSearchQuery}
                onChange={(e) => setAddSearchQuery(e.target.value)}
                placeholder="Operator Alias" 
                style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px', borderRadius: '8px', color: 'white', outline: 'none', flex: 1 }} 
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleContactSearch()}
              />
              <button onClick={handleContactSearch} className="neon-button" style={{ margin: 0, padding: '0 16px' }}>Search</button>
            </div>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
              {addSearchResults.map(user => (
                <div key={user.username} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', marginBottom: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ color: 'white', fontWeight: 'bold' }}>{user.username}</div>
                    <div style={{ color: '#64748b', fontSize: '11px' }}>{user.nodeId}</div>
                  </div>
                  <button onClick={() => handleSendRequest(user.username)} style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
                    Connect
                  </button>
                </div>
              ))}
              {addSearchQuery && addSearchResults.length === 0 && (
                <div style={{ padding: '12px', color: '#94a3b8', fontSize: '13px', textAlign: 'center', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  No operators found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .contact-card:hover {
          background: rgba(255,255,255,0.05);
          border-color: rgba(59, 130, 246, 0.5) !important;
          transform: translateY(-2px);
        }
        .icon-btn {
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          color: white;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }
        .icon-btn:hover { background: rgba(255,255,255,0.1); }
        .quick-action-btn {
          flex: 1; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3);
          color: #3b82f6; padding: 12px 0; border-radius: 8px; display: flex; flex-direction: column;
          align-items: center; gap: 8px; cursor: pointer; transition: 0.2s;
        }
        .quick-action-btn:hover { background: rgba(59, 130, 246, 0.2); border-color: #3b82f6; color: #60a5fa; }
        .quick-action-btn span { font-size: 12px; font-weight: bold; }
        .spec-row { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.05); border-radius: 8px; padding: 12px; margin-bottom: 8px; }
        .spec-label { color: #64748b; font-size: 11px; display: flex; alignItems: center; gap: 6px; margin-bottom: 4px; }
        .spec-value { color: white; font-size: 13px; padding-left: 20px; }
      `}</style>
    </div>
  );
};

export default ContactsDirectory;
