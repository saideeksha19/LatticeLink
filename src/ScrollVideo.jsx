import React, { useEffect, useRef, useState } from 'react';

const ScrollVideo = ({ children }) => {
  const containerRef = useRef(null);
  const [frameCount, setFrameCount] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(1);
  const [error, setError] = useState(null);
  
  // 1. Fetch metadata
  useEffect(() => {
    fetch('/frames/metadata.json')
      .then(res => {
        if (!res.ok) throw new Error('Metadata not found');
        return res.json();
      })
      .then(data => {
        if (data.frameCount > 0) {
          setFrameCount(data.frameCount);
        } else {
          setError("Frame count is 0 in metadata.json");
        }
      })
      .catch(err => {
        console.error('Metadata fetch error', err);
        setError("Could not load /frames/metadata.json. Did you run the python script?");
      });
  }, []);
  
  // 2. Preload images
  useEffect(() => {
    if (frameCount === 0) return;
    
    // Preload them in the browser cache
    for (let i = 1; i <= frameCount; i++) {
      const img = new Image();
      img.src = `/frames/frame_${i}.jpg`;
    }
  }, [frameCount]);
  
  // 3. Scroll logic
  useEffect(() => {
    if (frameCount === 0) return;

    const handleScroll = () => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const scrollProgress = -rect.top;
      const maxScroll = rect.height - window.innerHeight;
      
      if (maxScroll <= 0) return;
      
      let fraction = scrollProgress / maxScroll;
      fraction = Math.max(0, Math.min(1, fraction));
      
      // Calculate which frame to show (1 to frameCount)
      const targetFrame = Math.floor(fraction * (frameCount - 1)) + 1;
      setCurrentFrame(targetFrame);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [frameCount]);

  if (error) {
    return (
      <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#220000', color: '#ff4444' }}>
         <h2 className="text-2xl font-bold">Error loading ScrollVideo: {error}</h2>
      </div>
    );
  }

  if (frameCount === 0) {
    return (
      <div style={{ height: '100vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000', color: 'white' }}>
         Loading cinematic frames...
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', height: '400vh', width: '100%', background: '#000' }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', width: '100%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <img 
            src={`/frames/frame_${currentFrame}.jpg`} 
            alt="Cinematic Scroll" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
         />
         {children}
      </div>
    </div>
  );
};

export default ScrollVideo;
