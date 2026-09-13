import React from 'react';
import { Rocket as RocketIcon } from 'lucide-react';

export const SmallRocket = ({ isLaunching }) => {
  if (!isLaunching) return null;
  
  return (
    <div className="small-rocket-animation">
      <RocketIcon size={48} color="#8b5cf6" style={{ filter: 'drop-shadow(0 0 15px #8b5cf6)', transform: 'rotate(-45deg)' }} />
    </div>
  );
};

export const LargeRocket = ({ isFlying }) => {
  if (!isFlying) return null;

  return (
    <div className="large-rocket-animation">
      <RocketIcon size={120} color="#3b82f6" style={{ filter: 'drop-shadow(0 0 30px #3b82f6)', transform: 'rotate(-45deg)' }} />
    </div>
  );
};
