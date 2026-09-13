import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CollaborationContext = createContext(null);

const DEFAULT_TASKS = [
  { id: 't1', title: 'Implement ML-KEM key rotation', priority: 'high', status: 'in-progress', assignee: 'Rahul' },
  { id: 't2', title: 'SHA-3 benchmark analysis', priority: 'medium', status: 'done', assignee: 'Alice' },
  { id: 't3', title: 'Update LSOC threat detection rules', priority: 'high', status: 'todo', assignee: 'Bob' },
];

const DEFAULT_MEETINGS = [
  { id: 'm1', title: 'Security Review', time: '3:00 PM - 4:00 PM', date: 'Today', host: 'Alice', participants: 4, type: 'video' },
  { id: 'm2', title: 'PQC Implementation Sprint', time: '10:00 AM - 11:30 AM', date: 'Tomorrow', host: 'Bob', participants: 6, type: 'video' },
];

const DEFAULT_GROUPS = [
  {
    id: 'grp_001',
    name: 'Research Team',
    owner: 'Rahul',
    admins: ['Rahul', 'Alice'],
    members: ['Rahul', 'Alice', 'Bob'],
    security: { forwardSecrecy: true, autoDelete: '7d' }
  }
];

export const CollaborationProvider = ({ children }) => {
  const { currentUser } = useAuth();

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('ll_collab_tasks_v4');
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  const [meetings, setMeetings] = useState(() => {
    const saved = localStorage.getItem('ll_collab_meetings_v4');
    return saved ? JSON.parse(saved) : DEFAULT_MEETINGS;
  });

  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem('ll_collab_groups_v4');
    return saved ? JSON.parse(saved) : DEFAULT_GROUPS;
  });

  useEffect(() => {
    localStorage.setItem('ll_collab_tasks_v4', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('ll_collab_meetings_v4', JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem('ll_collab_groups_v4', JSON.stringify(groups));
  }, [groups]);

  /* ─── Tasks ─── */
  const addTask = (title, priority, assignee) => {
    const newTask = { id: `t_${Date.now()}`, title, priority, status: 'todo', assignee };
    setTasks(prev => [newTask, ...prev]);
  };

  const updateTaskStatus = (id, newStatus) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
  };

  /* ─── Meetings ─── */
  const scheduleMeeting = (title, time, date, type) => {
    const newMeeting = { id: `m_${Date.now()}`, title, time, date, host: currentUser?.username || 'You', participants: 1, type };
    setMeetings(prev => [...prev, newMeeting]);
  };

  /* ─── Groups ─── */
  const createGroup = (name, members) => {
    const newGroup = {
      id: `grp_${Date.now()}`,
      name,
      owner: currentUser?.username || 'System',
      admins: [currentUser?.username || 'System'],
      members: [...members, currentUser?.username || 'System'],
      security: { forwardSecrecy: true, autoDelete: '30d' }
    };
    setGroups(prev => [...prev, newGroup]);
    return newGroup;
  };

  return (
    <CollaborationContext.Provider value={{
      tasks, addTask, updateTaskStatus,
      meetings, scheduleMeeting,
      groups, createGroup
    }}>
      {children}
    </CollaborationContext.Provider>
  );
};

export const useCollaboration = () => useContext(CollaborationContext);
