import React from 'react';
import { LSOCHero, GlobalQuantumGlobe } from './LSOCWidgets';
import { InteractiveCyberRange } from './LSOCThreats';
import { KeyRotationCenter, AuditTimeline, ServerHealthCenter, ComplianceCenter, DeviceManagementCenter } from './LSOCOperations';
import { AISOCAssistant, SecurityPolicyCenter, DecisionCenter, SecurityKnowledgeCenter, SecurityReplay, CrossPlatformSyncCenter } from './LSOCIntelligence';

const SecurityDashboard = () => {
  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#020617', // Very dark slate (nearly black) for the SOC theme
      padding: '32px', 
      position: 'relative',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Background grid effect for SOC */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(56, 189, 248, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', zIndex: 0 }}></div>
      
      <div style={{ position: 'relative', zIndex: 10, maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Phase 4.1 Modules: LSOC Core & Theme */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '24px' }}>
          
          <div style={{ gridColumn: '1 / -1' }}>
            <LSOCHero />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <GlobalQuantumGlobe />
          </div>

          {/* Phase 4.2 Modules: Threat Intelligence & Attack Simulation */}
          <div style={{ gridColumn: '1 / -1' }}>
            <InteractiveCyberRange />
          </div>

          {/* Phase 4.3 Modules: Operations & Infrastructure */}
          <div style={{ gridColumn: '1 / -1' }}>
            <ComplianceCenter />
          </div>

          <div style={{ gridColumn: 'span 12' }}>
            <DeviceManagementCenter />
          </div>

          <div style={{ gridColumn: 'span 12' }}>
            <CrossPlatformSyncCenter />
          </div>

          <div style={{ gridColumn: 'span 12' }}>
            <KeyRotationCenter />
          </div>

          <div style={{ gridColumn: 'span 7' }}>
            <AuditTimeline />
          </div>

          <div style={{ gridColumn: 'span 5' }}>
            <ServerHealthCenter />
          </div>

          {/* Phase 4.4 Modules: Intelligence & Decision Center */}
          <div style={{ gridColumn: 'span 6' }}>
            <AISOCAssistant />
          </div>

          <div style={{ gridColumn: 'span 6' }}>
            <DecisionCenter />
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <SecurityPolicyCenter />
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <SecurityKnowledgeCenter />
          </div>

          <div style={{ gridColumn: 'span 4' }}>
            <SecurityReplay />
          </div>

        </div>

      </div>
    </div>
  );
};

export default SecurityDashboard;
