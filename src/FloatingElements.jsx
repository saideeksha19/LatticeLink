import React from 'react';

const BackgroundImages = () => {
  return (
    <div className="background-images-container" style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }}>
      <img 
        src="/holographic_earth.png" 
        alt="Background Globe" 
        style={{ 
          position: 'absolute', 
          top: '-10%', 
          left: '-5%', 
          width: '600px', 
          opacity: 0.15, 
          mixBlendMode: 'screen',
          filter: 'blur(4px)'
        }} 
      />
      <img 
        src="/quantum_cubes.png" 
        alt="Background Cubes" 
        style={{ 
          position: 'absolute', 
          bottom: '-10%', 
          right: '-5%', 
          width: '500px', 
          opacity: 0.1, 
          mixBlendMode: 'screen',
          filter: 'blur(3px)'
        }} 
      />
    </div>
  );
};

export default BackgroundImages;
