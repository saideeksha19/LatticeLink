import React, { useState } from 'react';
import {
  Users, Calendar, Presentation, CheckSquare, Plus, Clock,
  Video, Lock, ShieldCheck, Search, MapPin, User,
  ChevronLeft, ChevronRight, MoreVertical, Hash, Box, CheckCircle2
} from 'lucide-react';
import MatrixRain from './MatrixRain';
import { useAuth } from './context/AuthContext';
import { useCollaboration } from './context/CollaborationContext';
import { useUser } from './context/UserContext';

/* ─── Tab Bar ─── */
const TabBar = ({ tabs, activeTab, onTabChange }) => (
  <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)' }}>
    {tabs.map(tab => (
      <div key={tab.id} onClick={() => onTabChange(tab.id)} style={{
        flex: 1, padding: '14px 0', textAlign: 'center', cursor: 'pointer',
        color: activeTab === tab.id ? '#3b82f6' : '#64748b',
        borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
        fontWeight: activeTab === tab.id ? '600' : '400', fontSize: '13px', transition: '0.2s',
      }}>
        {tab.label}
      </div>
    ))}
  </div>
);

/* ─── Groups Tab ─── */
const GroupsTab = () => {
  const { currentUser } = useAuth();
  const { groups, createGroup } = useCollaboration();
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupInput, setGroupInput] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    const g = createGroup(newGroupName, []);
    setSelectedGroup(g);
    setShowCreate(false);
    setNewGroupName('');
  };

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
      <div style={{ width: '280px', borderRight: '1px solid rgba(255,255,255,0.06)', overflowY: 'auto', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '16px' }}>
          {!showCreate ? (
            <button onClick={() => setShowCreate(true)} style={{ width: '100%', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#3b82f6', padding: '10px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: '500' }}>
              <Plus size={14} /> Create New Group
            </button>
          ) : (
            <form onSubmit={handleCreateGroup} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input type="text" autoFocus value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="Group Name" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', color: 'white', borderRadius: '6px', fontSize: '13px', outline: 'none' }} />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" style={{ flex: 1, background: '#3b82f6', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Create</button>
                <button type="button" onClick={() => setShowCreate(false)} style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Cancel</button>
              </div>
            </form>
          )}
        </div>
        {groups.length === 0 ? (
          <div style={{ color: '#475569', fontSize: '13px', textAlign: 'center', padding: '32px 16px' }}>No groups yet.</div>
        ) : groups.map(g => (
          <div key={g.id} onClick={() => setSelectedGroup(g)} style={{
            padding: '14px 16px', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)',
            background: selectedGroup?.id === g.id ? 'rgba(59,130,246,0.1)' : 'transparent',
            borderLeft: selectedGroup?.id === g.id ? '3px solid #3b82f6' : '3px solid transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', fontSize: '14px' }}>👥</div>
              <div>
                <div style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>{g.name}</div>
                <div style={{ color: '#64748b', fontSize: '11px' }}>{g.members?.length || 0} members</div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedGroup ? (
          <>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
              <h3 style={{ color: 'white', margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                👥 {selectedGroup.name} <ShieldCheck size={14} color="#10b981" />
              </h3>
              <span style={{ color: '#64748b', fontSize: '11px' }}>{selectedGroup.members?.join(', ')} • Quantum Encrypted</span>
            </div>
            <div style={{ flex: 1, padding: '20px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '13px' }}>
              Group chat messages will appear here. Send a message to start.
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)' }}>
              <form onSubmit={(e) => { e.preventDefault(); setGroupInput(''); }} style={{ display: 'flex', gap: '12px' }}>
                <input type="text" value={groupInput} onChange={(e) => setGroupInput(e.target.value)} placeholder={`Message ${selectedGroup.name}...`} style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', padding: '10px 16px', borderRadius: '24px', color: 'white', outline: 'none', fontSize: '13px' }} />
                <button type="submit" style={{ background: '#3b82f6', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}>→</button>
              </form>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <Users size={48} color="#1e293b" style={{ marginBottom: '12px' }} />
            <p>Select a group or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const MeetingsTab = () => {
  const { meetings, scheduleMeeting } = useCollaboration();
  const [showSchedule, setShowSchedule] = useState(false);
  const [mTitle, setMTitle] = useState('');
  
  const handleSchedule = (e) => {
    e.preventDefault();
    if (!mTitle.trim()) return;
    scheduleMeeting(mTitle, 'Now', 'Today', 'video');
    setMTitle('');
    setShowSchedule(false);
  };

  return (
    <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: 'white', margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Presentation size={18} color="#8b5cf6" /> Upcoming Meetings
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {showSchedule && (
            <form onSubmit={handleSchedule} style={{ display: 'flex', gap: '8px' }}>
              <input type="text" autoFocus value={mTitle} onChange={e => setMTitle(e.target.value)} placeholder="Meeting Title" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', color: 'white', borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
              <button type="submit" style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Save</button>
            </form>
          )}
          <button onClick={() => setShowSchedule(!showSchedule)} style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', color: '#c4b5fd', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={12} /> {showSchedule ? 'Cancel' : 'Schedule Meeting'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {meetings.map((m, i) => (
          <div key={i} className="glass-card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: '16px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {m.type === 'video' ? <Video size={20} color="#8b5cf6" /> : <Presentation size={20} color="#8b5cf6" />}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: 'white', fontWeight: '500', fontSize: '14px' }}>{m.title}</div>
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span><Clock size={10} /> {m.time}</span>
                <span><Calendar size={10} /> {m.date}</span>
                <span><User size={10} /> {m.host}</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: '#64748b', fontSize: '11px' }}>{m.participants} participants</span>
              <button style={{ background: '#3b82f6', border: 'none', color: 'white', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}>Join</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Calendar Tab ─── */
const CalendarTab = () => {
  const [currentMonth] = useState(new Date());
  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
  const today = new Date().getDate();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const events = { 12: '🛡 Security Review', 14: '📊 Sprint Planning', 18: '🔑 Key Rotation', 22: '📡 LSOC Audit' };

  return (
    <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: 'white', margin: 0, fontSize: '18px' }}>{monthName}</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronLeft size={16} /></button>
          <button style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronRight size={16} /></button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} style={{ textAlign: 'center', color: '#475569', fontSize: '11px', padding: '8px', fontWeight: '600' }}>{d}</div>
        ))}
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`}></div>)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const isToday = day === today;
          const hasEvent = events[day];
          return (
            <div key={day} style={{
              textAlign: 'center', padding: '10px 4px', borderRadius: '8px', cursor: 'pointer',
              background: isToday ? 'rgba(59,130,246,0.2)' : hasEvent ? 'rgba(139,92,246,0.1)' : 'rgba(0,0,0,0.2)',
              border: isToday ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.03)',
            }}>
              <div style={{ color: isToday ? '#3b82f6' : 'white', fontSize: '13px', fontWeight: isToday ? '700' : '400' }}>{day}</div>
              {hasEvent && <div style={{ color: '#c4b5fd', fontSize: '8px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{hasEvent}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const TasksTab = () => {
  const { tasks, addTask, updateTaskStatus } = useCollaboration();
  const [showAdd, setShowAdd] = useState(false);
  const [tTitle, setTTitle] = useState('');
  
  const handleAdd = (e) => {
    e.preventDefault();
    if (!tTitle.trim()) return;
    addTask(tTitle, 'medium', 'You');
    setTTitle('');
    setShowAdd(false);
  };

  const priorityColors = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' };
  const statusLabels = { 'todo': 'To Do', 'in-progress': 'In Progress', 'done': 'Done' };
  const statusColors = { 'todo': '#64748b', 'in-progress': '#f59e0b', 'done': '#10b981' };

  return (
    <div style={{ padding: '20px', overflowY: 'auto', flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ color: 'white', margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckSquare size={18} color="#f59e0b" /> Tasks & Workflow
        </h3>
        <div style={{ display: 'flex', gap: '10px' }}>
          {showAdd && (
            <form onSubmit={handleAdd} style={{ display: 'flex', gap: '8px' }}>
              <input type="text" autoFocus value={tTitle} onChange={e => setTTitle(e.target.value)} placeholder="Task Title" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 10px', color: 'white', borderRadius: '6px', fontSize: '12px', outline: 'none' }} />
              <button type="submit" style={{ background: '#f59e0b', color: 'black', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Save</button>
            </form>
          )}
          <button onClick={() => setShowAdd(!showAdd)} style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={12} /> {showAdd ? 'Cancel' : 'Add Task'}
          </button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {tasks.map((t, i) => (
          <div key={i} className="glass-card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderLeft: `3px solid ${priorityColors[t.priority]}` }}>
            <CheckSquare onClick={() => updateTaskStatus(t.id, t.status === 'done' ? 'todo' : 'done')} size={16} color={statusColors[t.status]} style={{ cursor: 'pointer' }} />
            <div style={{ flex: 1 }}>
              <div style={{ color: t.status === 'done' ? '#64748b' : 'white', fontWeight: '500', fontSize: '13px', textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
              <div style={{ color: '#475569', fontSize: '11px', marginTop: '4px' }}>Assigned to {t.assignee}</div>
            </div>
            <span onClick={() => updateTaskStatus(t.id, t.status === 'todo' ? 'in-progress' : t.status === 'in-progress' ? 'done' : 'todo')} style={{ color: statusColors[t.status], fontSize: '10px', fontWeight: '600', background: `${statusColors[t.status]}15`, padding: '4px 10px', borderRadius: '6px', textTransform: 'uppercase', cursor: 'pointer' }}>{statusLabels[t.status]}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ─── Main Collaboration Page ─── */
const CollaborationPage = () => {
  const [activeTab, setActiveTab] = useState('groups');
  const tabs = [
    { id: 'groups', label: '👥 Groups' },
    { id: 'meetings', label: '📹 Meetings' },
    { id: 'calendar', label: '📅 Calendar' },
    { id: 'tasks', label: '✅ Tasks' },
  ];

  return (
    <div className="dashboard-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
        {activeTab === 'groups' && <GroupsTab />}
        {activeTab === 'meetings' && <MeetingsTab />}
        {activeTab === 'calendar' && <CalendarTab />}
        {activeTab === 'tasks' && <TasksTab />}
      </div>
    </div>
  );
};

export default CollaborationPage;
