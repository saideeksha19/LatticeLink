import React, { useState } from 'react';
import { Sparkles, CheckCircle2 } from 'lucide-react';

const DemoModeActivator = () => {
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const activateDemo = () => {
    setLoading(true);
    // Simulate injecting demo data across the app
    setTimeout(() => {
      setLoading(false);
      setComplete(true);
      setTimeout(() => setComplete(false), 3000);
    }, 2000);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 500 }}>
      {complete ? (
        <div style={{ background: '#10b981', color: '#020617', padding: '12px 24px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)', animation: 'slideUp 0.3s ease-out' }}>
          <CheckCircle2 size={18} /> Demo Environment Ready
        </div>
      ) : (
        <button 
          onClick={activateDemo}
          disabled={loading}
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)', border: 'none', color: 'white', padding: '12px 24px', borderRadius: '30px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4)', transition: '0.2s', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? (
            <div style={{ width: '18px', height: '18px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          ) : (
            <Sparkles size={18} />
          )}
          {loading ? 'Populating Data...' : 'Run Demo Script'}
        </button>
      )}

      <style>{`
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      `}</style>
    </div>
  );
};

export default DemoModeActivator;
