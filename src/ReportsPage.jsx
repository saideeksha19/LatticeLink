import React from 'react';
import { BarChart3, TrendingUp, ShieldCheck, Activity, Zap, Layers } from 'lucide-react';
import MatrixRain from './MatrixRain';

const ReportsPage = () => {
  return (
    <div className='dashboard-container' style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <MatrixRain />
      
      <div style={{ padding: '32px', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ color: 'white', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BarChart3 size={32} color="#10b981" /> Enterprise Analytics
            </h1>
            <p style={{ color: '#94a3b8', margin: 0 }}>Network health, threat mitigation, and cryptographic metrics.</p>
          </div>
          <button style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
             Export Report
          </button>
        </div>

        {/* Top KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
           <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid #3b82f6' }}>
             <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={16} /> Total Tunnels Established</div>
             <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>1,284</div>
             <div style={{ color: '#10b981', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> +12% from last month</div>
           </div>
           
           <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid #10b981' }}>
             <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><ShieldCheck size={16} /> Threats Mitigated</div>
             <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>42,901</div>
             <div style={{ color: '#10b981', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> +5.4% from last month</div>
           </div>

           <div className="glass-card" style={{ padding: '24px', borderTop: '4px solid #8b5cf6' }}>
             <div style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><Layers size={16} /> Quantum Keys Exchanged</div>
             <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>8.4M</div>
             <div style={{ color: '#10b981', fontSize: '12px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={12} /> +22% from last month</div>
           </div>
        </div>

        {/* Charts Area */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', flex: 1 }}>
           
           {/* Big Chart Mockup */}
           <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '18px' }}>Network Traffic & Encryption Load (7 Days)</h3>
             <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '2%', height: '300px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                {/* CSS Bar Chart */}
                {[40, 65, 45, 80, 55, 90, 75].map((h, i) => (
                  <div key={i} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: '4px' }}>
                    <div style={{ width: '100%', height: `${h}%`, background: 'linear-gradient(to top, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.8))', borderRadius: '4px 4px 0 0', transition: '0.5s' }} className="bar"></div>
                  </div>
                ))}
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', color: '#64748b', fontSize: '12px' }}>
               <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
             </div>
           </div>

           {/* Small Chart Mockup */}
           <div className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
             <h3 style={{ color: 'white', margin: '0 0 24px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
               <Activity size={18} color="#ef4444" /> Threat Vectors
             </h3>
             <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '24px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>
                    <span>DDoS Attempts</span> <span>64%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '64%', height: '100%', background: '#ef4444' }}></div>
                  </div>
                </div>
                
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>
                    <span>Shor's Algo Probing</span> <span>22%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '22%', height: '100%', background: '#f59e0b' }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>
                    <span>Man-in-the-Middle</span> <span>14%</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: '14%', height: '100%', background: '#3b82f6' }}></div>
                  </div>
                </div>
             </div>
           </div>

        </div>
      </div>
      <style>{`
        .bar:hover { filter: brightness(1.2); cursor: pointer; }
      `}</style>
    </div>
  );
};

export default ReportsPage;
