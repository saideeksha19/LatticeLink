import React from 'react';
import { Play, ArrowRight, X, Layers, Flag } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

const demoSteps = [
  { path: 'home', label: 'Landing Page' },
  { path: 'auth', label: 'Authentication' },
  { path: 'identity', label: 'Quantum Identity' },
  { path: 'dashboard', label: 'Dashboard' },
  { path: 'messages', label: 'Secure Messages' },
  { path: 'vault', label: 'Secure Vault' },
  { path: 'collaboration', label: 'Collaboration' },
  { path: 'security', label: 'Security Lab' },
];

const PresentationModeUI = ({ currentPage, onNavigate }) => {
  const { settings, updateSettings } = useSettings();
  const presentationMode = settings?.appearance?.presentationMode;

  if (!presentationMode) return null;

  const currentIndex = demoSteps.findIndex(s => s.path === currentPage);
  const nextStep = currentIndex < demoSteps.length - 1 ? demoSteps[currentIndex + 1] : null;

  const handleNext = () => {
    if (nextStep) {
      onNavigate(nextStep.path);
    }
  };

  const stopPresentation = () => {
    updateSettings('appearance', { presentationMode: false });
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      background: 'rgba(15,23,42,0.9)',
      border: '1px solid #3b82f6',
      borderRadius: '30px',
      padding: '10px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      boxShadow: '0 0 30px rgba(59,130,246,0.3)',
      backdropFilter: 'blur(10px)',
      color: 'white',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#3b82f6', fontWeight: '600', fontSize: '14px' }}>
        <Play size={16} fill="#3b82f6" /> Demo Mode
      </div>
      
      <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.2)' }}></div>
      
      <div style={{ fontSize: '13px', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '8px' }}>
        Step {Math.max(1, currentIndex + 1)} of {demoSteps.length}: 
        <span style={{ fontWeight: '600', color: 'white' }}>
          {currentIndex >= 0 ? demoSteps[currentIndex].label : 'Unknown'}
        </span>
      </div>

      {nextStep ? (
        <button onClick={handleNext} style={{
          background: '#3b82f6', border: 'none', color: 'white', padding: '6px 14px',
          borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          Next: {nextStep.label} <ArrowRight size={14} />
        </button>
      ) : (
        <button onClick={stopPresentation} style={{
          background: '#10b981', border: 'none', color: 'white', padding: '6px 14px',
          borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: '600',
          display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Flag size={14} /> Finish Demo
        </button>
      )}
      
      <button onClick={stopPresentation} style={{
        background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px',
        marginLeft: '8px'
      }}>
        <X size={16} />
      </button>
    </div>
  );
};

export default PresentationModeUI;
