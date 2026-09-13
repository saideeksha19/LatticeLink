import React from 'react';
import { MessageSquare, File, Users, Phone, Bell, HardDrive } from 'lucide-react';

export const TodaysSummary = () => {
  const stats = [
    { label: 'Messages', value: '21', icon: MessageSquare, color: '#3b82f6' },
    { label: 'Files Shared', value: '4', icon: File, color: '#f59e0b' },
    { label: 'Groups Active', value: '2', icon: Users, color: '#8b5cf6' },
    { label: 'Voice Calls', value: '3', icon: Phone, color: '#10b981' },
    { label: 'Unread', value: '6', icon: Bell, color: '#ef4444' },
    { label: 'Storage', value: '6 GB', icon: HardDrive, color: '#06b6d4' },
  ];

  return (
    <div className="glass-card" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ color: 'white', margin: '0 0 20px 0', fontSize: '18px', fontWeight: '500' }}>Today's Summary</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', flex: 1 }}>
        {stats.map((stat, idx) => (
          <div key={idx} style={{ 
            background: 'rgba(0,0,0,0.3)', 
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: '8px'
          }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px' }}>
                <stat.icon size={16} color={stat.color} /> {stat.label}
             </div>
             <div style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>
                {stat.value}
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
