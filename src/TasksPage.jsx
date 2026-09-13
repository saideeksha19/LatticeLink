import React from 'react';
import { CheckSquare, Clock, AlertCircle, Plus, ShieldCheck, MoreVertical } from 'lucide-react';
import MatrixRain from './MatrixRain';

const TasksPage = () => {
  const columns = [
    {
      title: "To Do",
      color: "#94a3b8",
      tasks: [
        { id: 1, title: "Rotate ML-KEM Keys", tag: "Security", priority: "High" },
        { id: 2, title: "Audit Node 74-Alpha", tag: "Compliance", priority: "Medium" }
      ]
    },
    {
      title: "In Progress",
      color: "#3b82f6",
      tasks: [
        { id: 3, title: "Deploy Lattice Updates", tag: "Infrastructure", priority: "High" },
        { id: 4, title: "Review Penetration Test", tag: "Security", priority: "Critical" }
      ]
    },
    {
      title: "Completed",
      color: "#10b981",
      tasks: [
        { id: 5, title: "Initialize Quantum Tunnels", tag: "Network", priority: "Low" },
        { id: 6, title: "Patch WebRTC Vulnerability", tag: "Security", priority: "High" }
      ]
    }
  ];

  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <CheckSquare size={32} color="#3b82f6" /> Secure Task Operations
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Manage and track encrypted workflows across operators.</p>
          </div>
          <button className="neon-button" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} /> New Task
          </button>
        </div>

        <div style={{ display: 'flex', gap: '24px', flex: 1, overflowX: 'auto', paddingBottom: '16px' }}>
          {columns.map((col, idx) => (
            <div key={idx} className="glass-card" style={{ flex: '1', minWidth: '300px', display: 'flex', flexDirection: 'column', background: 'rgba(15, 23, 42, 0.6)', borderTop: `4px solid ${col.color}` }}>
              <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ color: 'white', margin: 0, fontSize: '16px' }}>{col.title} <span style={{ color: '#64748b', fontSize: '12px', marginLeft: '8px' }}>{col.tasks.length}</span></h3>
                <MoreVertical size={16} color="#94a3b8" style={{ cursor: 'pointer' }} />
              </div>
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
                {col.tasks.map(task => (
                  <div key={task.id} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', padding: '16px', cursor: 'pointer', transition: '0.2s' }} className="task-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <span style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#38bdf8', padding: '4px 8px', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>{task.tag}</span>
                      {task.priority === 'Critical' ? <AlertCircle size={14} color="#ef4444" /> : (task.priority === 'High' ? <Clock size={14} color="#f59e0b" /> : null)}
                    </div>
                    <h4 style={{ color: 'white', margin: '0 0 16px 0', fontSize: '15px' }}>{task.title}</h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
                       <div style={{ color: '#10b981', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <ShieldCheck size={12} /> Encrypted
                       </div>
                       <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '10px' }}>OP</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      <style>{`
        .task-card:hover {
          border-color: rgba(59, 130, 246, 0.5) !important;
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
};

export default TasksPage;
