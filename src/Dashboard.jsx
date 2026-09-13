import React from 'react';
import MatrixRain from './MatrixRain';
import { DashboardHero } from './DashboardWidgets';
import { TodaysSummary } from './WorkspaceWidgets';
import { ContinueWorking, ActiveContacts, TodaysSchedule } from './WorkspaceWidgets2';
import { AIAssistant, LiveTimeline, WorkspaceAnalytics } from './WorkspaceWidgets3';
import { EncryptionPipeline } from './DashboardWidgets2';
import { QuantumCommunicationCanvas } from './QuantumCanvas';
import { WorkspaceGallery, WorkspaceQuote, PremiumFooter, QuantumJourneyCard } from './WorkspaceWidgets4';

const Dashboard = ({ onLogout }) => {
  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', padding: '32px', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1400px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Removed Search Bar */}
        
        {/* Phase 1 Modules: Workspace Core & Identity */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
          
          <div style={{ gridColumn: 'span 8' }}>
            <DashboardHero />
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <QuantumCommunicationCanvas />
          </div>
          
          <div style={{ gridColumn: 'span 12' }}>
            <TodaysSummary />
          </div>

          {/* Phase 2 Modules: Collaboration Hub */}
          <div style={{ gridColumn: 'span 8' }}>
            <ContinueWorking />
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <ActiveContacts />
          </div>

          <div style={{ gridColumn: 'span 12' }}>
            <TodaysSchedule />
          </div>

          {/* Phase 3 Modules: Intelligent Workspace */}
          <div style={{ gridColumn: 'span 4' }}>
            <AIAssistant />
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <LiveTimeline />
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <WorkspaceAnalytics />
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <QuantumJourneyCard />
          </div>

          <div style={{ gridColumn: 'span 8' }}>
            <WorkspaceGallery />
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <WorkspaceQuote />
          </div>

          {/* Persistent Crypto Pipeline */}
          <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <EncryptionPipeline />
          </div>

          <div style={{ gridColumn: '1 / -1', marginTop: '16px' }}>
            <PremiumFooter />
          </div>

        </div>

      </div>
    </div>
  );
};

export default Dashboard;
