import React, { useState, useEffect, useRef } from 'react';
import { Search, Activity, ShieldCheck, Box, FileSearch, Shield } from 'lucide-react';

const CommandPalette = ({ onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Cmd/Ctrl + K to open
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
        setQuery('');
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const commands = [
    { label: 'Go to Security Lab (Simulate Attacks)', action: () => onNavigate('lab'), icon: Activity, color: '#ef4444' },
    { label: 'Go to Key Management (Rotate Keys)', action: () => onNavigate('keymanagement'), icon: Box, color: '#8b5cf6' },
    { label: 'Go to Audit & Forensics (View Logs)', action: () => onNavigate('audit'), icon: FileSearch, color: '#3b82f6' },
    { label: 'Go to Administration', action: () => onNavigate('admin'), icon: Shield, color: '#f59e0b' },
    { label: 'Go to Documentation & Help', action: () => onNavigate('docs'), icon: ShieldCheck, color: '#10b981' }
  ];

  const filteredCommands = commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  const handleCommand = (action) => {
    action();
    setIsOpen(false);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '15vh', zIndex: 9999
    }} onClick={() => setIsOpen(false)}>
      
      <div 
        style={{ width: '600px', background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <Search size={20} color="#94a3b8" />
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search commands or modules..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', width: '100%', outline: 'none', marginLeft: '12px' }}
          />
        </div>

        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
          {filteredCommands.length > 0 ? filteredCommands.map((cmd, i) => (
            <div 
              key={i} 
              onClick={() => handleCommand(cmd.action)}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.02)' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: `${cmd.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <cmd.icon size={16} color={cmd.color} />
              </div>
              <span style={{ color: 'white', fontSize: '15px' }}>{cmd.label}</span>
            </div>
          )) : (
            <div style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No commands found</div>
          )}
        </div>
        
        <div style={{ padding: '12px 16px', background: 'rgba(0,0,0,0.4)', color: '#64748b', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Use <b>↑ ↓</b> to navigate</span>
          <span><b>Enter</b> to select</span>
          <span><b>Esc</b> to close</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
