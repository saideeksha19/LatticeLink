import React from 'react';
import { Calendar, Users, Image as ImageIcon, Map, CheckSquare, Presentation, UserCog, FileBarChart, Settings2 } from 'lucide-react';

const PagePlaceholder = ({ title, icon: Icon, description }) => (
  <div style={{ padding: '32px', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <div style={{ padding: '12px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '12px', color: '#38bdf8' }}>
        <Icon size={32} />
      </div>
      <div>
        <h1 style={{ color: 'white', fontSize: '28px', margin: 0 }}>{title}</h1>
        <p style={{ color: '#94a3b8', margin: '8px 0 0 0', fontSize: '15px' }}>{description}</p>
      </div>
    </div>
    <div className="glass-card" style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#64748b', fontSize: '18px' }}>
      Module Structure Initialized. Under Construction.
    </div>
  </div>
);
export const MediaGalleryPage = () => <PagePlaceholder title="Media Gallery" icon={ImageIcon} description="Organized gallery of shared encrypted images and videos." />;
export const QuantumJourneyPage = () => <PagePlaceholder title="Quantum Journey" icon={Map} description="Interactive visualization of the end-to-end cryptographic pipeline." />;
