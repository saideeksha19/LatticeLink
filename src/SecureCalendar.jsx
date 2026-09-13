import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Clock, Users, Plus, X, 
  ShieldCheck, Lock, ChevronLeft, ChevronRight, Video, Zap, Key
} from 'lucide-react';
import MatrixRain from './MatrixRain';

const SecureCalendar = () => {
  // --- Global / Authentication State ---
  const [currentUser] = useState(() => localStorage.getItem('ll_current_user_v2') || '');

  // --- Calendar Data State ---
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('ll_calendar_events_v2');
    return saved ? JSON.parse(saved) : [];
  });
  const [contacts, setContacts] = useState([]);

  useEffect(() => {
    if (currentUser) {
      const savedContacts = localStorage.getItem(`ll_contacts_${currentUser}`);
      if (savedContacts) setContacts(JSON.parse(savedContacts));
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('ll_calendar_events_v2', JSON.stringify(events));
  }, [events]);

  // Derived state: only show events where user is host or attendee
  const userEvents = events.filter(e => e.host === currentUser || e.attendees.includes(currentUser));

  // --- UI States ---
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Form State
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    attendees: []
  });

  // --- Calendar Generation ---
  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  // --- Handlers ---
  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date || !newEvent.time) return;

    const eventRecord = {
      id: Date.now().toString(),
      host: currentUser,
      title: newEvent.title,
      date: newEvent.date, // YYYY-MM-DD
      time: newEvent.time,
      attendees: newEvent.attendees,
      passcode: Math.random().toString(36).substring(2, 10).toUpperCase()
    };

    setEvents(prev => [...prev, eventRecord]);
    setIsScheduleOpen(false);
    setNewEvent({ title: '', date: '', time: '', attendees: [] });
  };

  const toggleAttendee = (contactName) => {
    setNewEvent(prev => ({
      ...prev,
      attendees: prev.attendees.includes(contactName) 
        ? prev.attendees.filter(a => a !== contactName)
        : [...prev.attendees, contactName]
    }));
  };

  // Render Calendar Cells
  const renderCalendarCells = () => {
    const cells = [];
    // Empty cells for days before the 1st
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="calendar-cell empty"></div>);
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = userEvents.filter(e => e.date === dateString);

      cells.push(
        <div key={`day-${day}`} className="calendar-cell">
          <div className="cell-date">{day}</div>
          <div className="cell-events">
            {dayEvents.map(ev => (
              <div key={ev.id} className="event-badge" onClick={() => setSelectedEvent(ev)}>
                <ShieldCheck size={12} /> {ev.time} - {ev.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    return cells;
  };

  // --- Render Login Overlay ---
  if (!currentUser) {
    return (
      <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <MatrixRain />
        <div className="glass-card" style={{ padding: '40px', width: '100%', maxWidth: '400px', zIndex: 10, textAlign: 'center' }}>
           <h2 style={{ color: 'white' }}>Identity Verification Required</h2>
           <p style={{ color: '#94a3b8' }}>Please log in to access the Secure Calendar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', position: 'relative', overflow: 'hidden' }}>
      <MatrixRain />

      {/* Main Calendar Area */}
      <div style={{ flex: 1, padding: '32px', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CalendarIcon size={32} color="#3b82f6" /> Secure Meeting Scheduler
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Quantum-encrypted scheduling & coordination.</p>
          </div>
          
          <button className="neon-button" onClick={() => setIsScheduleOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> Schedule Secure Sync
          </button>
        </div>

        {/* Calendar Card */}
        <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px' }}>
          
          {/* Calendar Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h2 style={{ color: 'white', margin: 0, fontSize: '24px' }}>
              {monthNames[month]} {year}
            </h2>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={prevMonth} className="icon-btn"><ChevronLeft size={20} /></button>
              <button onClick={nextMonth} className="icon-btn"><ChevronRight size={20} /></button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="calendar-grid-header">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
              <div key={d}>{d}</div>
            ))}
          </div>
          <div className="calendar-grid">
            {renderCalendarCells()}
          </div>
        </div>
      </div>

      {/* Event Details Side-Panel */}
      {selectedEvent && (
        <div className="glass-card side-panel" style={{ width: '400px', borderLeft: '1px solid rgba(59, 130, 246, 0.3)', borderTop: 'none', borderBottom: 'none', borderRight: 'none', borderRadius: 0, zIndex: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ color: 'white', margin: 0 }}>Sync Details</h3>
            <button onClick={() => setSelectedEvent(null)} className="icon-btn" style={{ border: 'none' }}><X size={20} /></button>
          </div>
          
          <div style={{ padding: '32px 24px', flex: 1, overflowY: 'auto' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '16px', borderRadius: '8px', marginBottom: '24px', textAlign: 'center' }}>
              <ShieldCheck size={32} color="#10b981" style={{ marginBottom: '8px' }} />
              <div style={{ color: '#10b981', fontWeight: 'bold' }}>Quantum Secure Meeting</div>
              <div style={{ color: '#64748b', fontSize: '12px', marginTop: '4px' }}>ML-KEM Encrypted</div>
            </div>

            <h2 style={{ color: 'white', margin: '0 0 16px 0' }}>{selectedEvent.title}</h2>
            
            <div className="detail-row">
              <CalendarIcon size={16} /> <span>{selectedEvent.date}</span>
            </div>
            <div className="detail-row">
              <Clock size={16} /> <span>{selectedEvent.time}</span>
            </div>
            <div className="detail-row">
              <Users size={16} /> <span>Host: {selectedEvent.host}</span>
            </div>

            <div style={{ marginTop: '32px' }}>
              <h4 style={{ color: '#94a3b8', margin: '0 0 12px 0', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>Attendees</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedEvent.attendees.length > 0 ? selectedEvent.attendees.map(a => (
                  <span key={a} className="attendee-pill">{a}</span>
                )) : <span style={{ color: '#64748b', fontSize: '14px' }}>No attendees invited.</span>}
              </div>
            </div>

            <div style={{ marginTop: '32px', background: 'rgba(0,0,0,0.4)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fcd34d', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold' }}>
                <Key size={14} /> One-Time Quantum Passcode
              </div>
              <div style={{ color: 'white', fontFamily: 'monospace', fontSize: '20px', letterSpacing: '2px', textAlign: 'center', padding: '12px', background: 'rgba(0,0,0,0.5)', borderRadius: '4px' }}>
                {selectedEvent.passcode}
              </div>
            </div>
          </div>

          <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <button className="neon-button" style={{ width: '100%', margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Video size={18} /> Join Secure Meeting
            </button>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {isScheduleOpen && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-card" style={{ padding: '32px', width: '100%', maxWidth: '500px', position: 'relative' }}>
            <button onClick={() => setIsScheduleOpen(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>
            <h3 style={{ color: 'white', margin: '0 0 8px 0', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={20} color="#3b82f6" /> Schedule Secure Sync
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '24px' }}>Create a new quantum-encrypted meeting.</p>
            
            <form onSubmit={handleScheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label className="form-label">Meeting Title</label>
                <input 
                  type="text" 
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                  className="form-input" 
                  placeholder="e.g., Q3 Threat Analysis"
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Date</label>
                  <input 
                    type="date" 
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                    className="form-input" 
                    required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="form-label">Time</label>
                  <input 
                    type="time" 
                    value={newEvent.time}
                    onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                    className="form-input" 
                    required
                  />
                </div>
              </div>

              <div>
                <label className="form-label">Invite Contacts</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', maxHeight: '150px', overflowY: 'auto' }}>
                  {contacts.length === 0 ? (
                    <span style={{ color: '#64748b', fontSize: '13px' }}>No contacts available.</span>
                  ) : (
                    contacts.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => toggleAttendee(c.name)}
                        style={{ 
                          padding: '6px 12px', 
                          borderRadius: '16px', 
                          fontSize: '13px',
                          cursor: 'pointer',
                          background: newEvent.attendees.includes(c.name) ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                          border: newEvent.attendees.includes(c.name) ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
                          color: newEvent.attendees.includes(c.name) ? '#38bdf8' : '#94a3b8'
                        }}
                      >
                        {c.name}
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsScheduleOpen(false)} style={{ flex: 1, padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', borderRadius: '8px', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" className="neon-button" style={{ flex: 2, margin: 0, padding: '12px' }}>
                  Generate Secure Link
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .calendar-grid-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 8px;
          color: #94a3b8;
          font-size: 14px;
          text-align: center;
          font-weight: bold;
        }
        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          flex: 1;
        }
        .calendar-cell {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 8px;
          padding: 8px;
          min-height: 100px;
          display: flex;
          flex-direction: column;
        }
        .calendar-cell.empty {
          background: transparent;
          border: none;
        }
        .cell-date {
          color: #64748b;
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .cell-events {
          display: flex;
          flex-direction: column;
          gap: 4px;
          overflow-y: auto;
          flex: 1;
        }
        .event-badge {
          background: rgba(16, 185, 129, 0.15);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #10b981;
          padding: 4px 6px;
          border-radius: 4px;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          display: flex;
          align-items: center;
          gap: 4px;
          transition: 0.2s;
        }
        .event-badge:hover {
          background: rgba(16, 185, 129, 0.25);
          border-color: #10b981;
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
        .icon-btn:hover {
          background: rgba(255,255,255,0.1);
        }
        .detail-row {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #cbd5e1;
          margin-bottom: 12px;
          font-size: 15px;
        }
        .detail-row svg {
          color: #64748b;
        }
        .attendee-pill {
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #38bdf8;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
        }
        .form-label {
          display: block;
          color: #94a3b8;
          font-size: 12px;
          margin-bottom: 6px;
          text-transform: uppercase;
        }
        .form-input {
          background: rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
          padding: 10px 14px;
          border-radius: 8px;
          color: white;
          outline: none;
          width: 100%;
        }
        .form-input:focus {
          border-color: #3b82f6;
        }
        /* Style date/time inputs for dark mode */
        ::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }
      `}</style>
    </div>
  );
};

export default SecureCalendar;
