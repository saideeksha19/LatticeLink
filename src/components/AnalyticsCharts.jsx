import React, { useState, useEffect } from 'react';

// A simple native SVG Line Chart that mimics Recharts
export const NativeLineChart = ({ data, dataKey, color, height = 200 }) => {
  const [points, setPoints] = useState('');
  
  useEffect(() => {
    if (!data || data.length === 0) return;
    const maxVal = Math.max(...data.map(d => d[dataKey]));
    const minVal = 0; // Baseline
    const range = maxVal - minVal || 1;
    
    const svgWidth = 500; // arbitrary internal scale
    const svgHeight = height;
    
    const xStep = svgWidth / (data.length - 1);
    
    const pts = data.map((d, i) => {
      const x = i * xStep;
      const y = svgHeight - ((d[dataKey] - minVal) / range) * (svgHeight - 20) - 10;
      return `${x},${y}`;
    }).join(' ');
    
    setPoints(pts);
  }, [data, dataKey, height]);

  return (
    <div style={{ width: '100%', height: `${height}px`, position: 'relative' }}>
      <svg width="100%" height="100%" preserveAspectRatio="none" viewBox={`0 0 500 ${height}`}>
        {/* Grid Lines */}
        <line x1="0" y1={height * 0.25} x2="500" y2={height * 0.25} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="0" y1={height * 0.5} x2="500" y2={height * 0.5} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        <line x1="0" y1={height * 0.75} x2="500" y2={height * 0.75} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        
        {/* Line */}
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0px 4px 6px ${color}40)` }}
        />
        
        {/* Area under line */}
        <polygon
          fill={`url(#gradient-${dataKey})`}
          points={`0,${height} ${points} 500,${height}`}
          opacity="0.3"
        />
        
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="1" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

// A simple native SVG Bar Chart
export const NativeBarChart = ({ data, dataKey, nameKey, color, height = 200 }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data.map(d => d[dataKey]));
  
  return (
    <div style={{ width: '100%', height: `${height}px`, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '8px', paddingTop: '20px' }}>
      {data.map((d, i) => {
        const h = maxVal === 0 ? 0 : (d[dataKey] / maxVal) * 100;
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', group: 'hover' }}>
            <div style={{ color: 'white', fontSize: '10px', marginBottom: '4px', opacity: 0.7 }}>{d[dataKey]}</div>
            <div style={{ 
              width: '100%', 
              height: `${h}%`, 
              background: `linear-gradient(180deg, ${color} 0%, ${color}40 100%)`,
              borderRadius: '4px 4px 0 0',
              transition: 'height 0.5s ease-out',
              borderTop: `1px solid ${color}`
            }}></div>
            <div style={{ color: '#94a3b8', fontSize: '10px', marginTop: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>{d[nameKey]}</div>
          </div>
        );
      })}
    </div>
  );
};

// Quantum Readiness Progress Bar
export const QuantumReadinessBar = ({ value, label }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>{label}</span>
        <span style={{ color: value === 100 ? '#10b981' : (value > 50 ? '#f59e0b' : '#ef4444'), fontSize: '13px', fontWeight: 'bold' }}>{value}%</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ 
          width: `${value}%`, 
          height: '100%', 
          background: value === 100 ? '#10b981' : (value > 50 ? '#f59e0b' : '#ef4444'),
          borderRadius: '4px',
          boxShadow: `0 0 10px ${value === 100 ? '#10b981' : (value > 50 ? '#f59e0b' : '#ef4444')}`
        }}></div>
      </div>
    </div>
  );
};
