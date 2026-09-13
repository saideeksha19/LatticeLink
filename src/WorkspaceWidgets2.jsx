import React from 'react';
import { Play, FileText, Users, Calendar, Video, Phone, Clock, MessageSquare, MoreHorizontal } from 'lucide-react';

export const ContinueWorking = () => {
  const tasks = [
    { type: 'Chat', title: 'Alice', subtitle: '5 unread • 2 min ago', icon: MessageSquare, color: '#3b82f6', action: 'Resume' },
    { type: 'File', title: 'Research.pdf', subtitle: 'Encrypted • Yesterday', icon: FileText, color: '#f59e0b', action: 'Open' },
    { type: 'Group', title: 'Project Team', subtitle: 'Meeting Today • 4 PM', icon: Users, color: '#8b5cf6', action: 'Join' },
    { type: 'Call', title: 'Weekly Sync', subtitle: 'Recording Paused', icon: Video, color: '#10b981', action: 'Resume' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '500' }}>Continue Working</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
        {tasks.map((task, idx) => (
          <div key={idx} style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            cursor: 'pointer',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'translateY(0)' }}
          >
            <div style={{ background: `rgba(${task.color === '#3b82f6' ? '59,130,246' : task.color === '#f59e0b' ? '245,158,11' : task.color === '#8b5cf6' ? '139,92,246' : '16,185,129'}, 0.2)`, padding: '10px', borderRadius: '10px' }}>
              <task.icon size={20} color={task.color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: '#94a3b8', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Continue {task.type}</div>
              <div style={{ color: 'white', fontSize: '15px', fontWeight: '500', margin: '2px 0' }}>{task.title}</div>
              <div style={{ color: '#cbd5e1', fontSize: '12px' }}>{task.subtitle}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '50%' }}>
              <Play size={14} color="white" fill="white" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ActiveContacts = () => {
  const contacts = [
    { name: 'Alice', status: 'Online', color: '#10b981' },
    { name: 'Bob', status: 'Busy', color: '#ef4444' },
    { name: 'Charlie', status: 'Offline', color: '#64748b' },
    { name: 'Diana', status: 'Online', color: '#10b981' }
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: 'white', margin: 0, fontSize: '18px', fontWeight: '500' }}>Active Contacts</h3>
        <MoreHorizontal size={20} color="#94a3b8" />
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {contacts.map((c, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: '0.2s' }}
               onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
               onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', position: 'relative' }}>
                 <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', borderRadius: '50%', background: c.color, border: '2px solid #0f172a' }}></div>
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{c.name}</div>
                <div style={{ color: c.color, fontSize: '12px' }}>{c.status}</div>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', opacity: 0.7 }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '50%' }}><MessageSquare size={14} color="#fff" /></div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '50%' }}><Phone size={14} color="#fff" /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const TodaysSchedule = () => {
  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '500' }}>Today's Schedule</h3>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative' }}>
        <div style={{ position: 'absolute', left: '11px', top: '20px', bottom: '20px', width: '2px', background: 'rgba(255,255,255,0.1)' }}></div>
        
        <div style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: '24px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', border: '4px solid #0f172a', zIndex: 1, marginTop: '2px' }}></div>
          <div>
            <div style={{ color: '#3b82f6', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>11:00 AM</div>
            <div style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>Research Review</div>
            <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><Video size={12}/> Video Meeting</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', position: 'relative', paddingBottom: '24px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f59e0b', border: '4px solid #0f172a', zIndex: 1, marginTop: '2px' }}></div>
          <div>
            <div style={{ color: '#f59e0b', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>2:00 PM</div>
            <div style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>Secure Client Call</div>
            <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><Phone size={12}/> Voice Channel</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', position: 'relative' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#8b5cf6', border: '4px solid #0f172a', zIndex: 1, marginTop: '2px' }}></div>
          <div>
            <div style={{ color: '#8b5cf6', fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>5:00 PM</div>
            <div style={{ color: 'white', fontSize: '15px', fontWeight: '500' }}>Group Sync</div>
            <div style={{ color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}><Users size={12}/> Project Team</div>
          </div>
        </div>

      </div>
    </div>
  );
};
