import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

const DEFAULT_SETTINGS = {
  security: {
    autoDelete: '7 Days',
    keyRotation: 'Automatic',
    forwardSecrecy: true
  },
  notifications: {
    messages: true,
    calls: true,
    securityAlerts: true,
    msgNotif: true,
    callNotif: true,
    secAlerts: true,
    groupAct: true,
    meetRemind: true,
    taskUpdate: true,
    sounds: true
  },
  appearance: {
    darkMode: true,
    matrixRain: true,
    compactMode: false,
    presentationMode: false,
    presentationStep: 0
  },
  language: 'English'
};

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('ll_settings_v4');
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const [globalNotifications, setGlobalNotifications] = useState(() => {
    const saved = localStorage.getItem('ll_notifications_v4');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('ll_settings_v4', JSON.stringify(settings));
    
    // Apply Global Theme Settings
    if (settings.appearance) {
       const themeColor = settings.appearance.themeColor || '#3b82f6';
       document.documentElement.style.setProperty('--primary', themeColor);
       
       // Generate variations for glow effects
       document.documentElement.style.setProperty('--primary-glow', `${themeColor}44`);
       document.documentElement.style.setProperty('--primary-bg', `${themeColor}11`);
    }
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('ll_notifications_v4', JSON.stringify(globalNotifications));
  }, [globalNotifications]);

  const pushNotification = (message, type = 'info') => {
    setGlobalNotifications(prev => [
      { id: Date.now().toString(), message, type, time: new Date().toLocaleTimeString() },
      ...prev
    ].slice(0, 50));
  };

  const updateSettings = (category, updates) => {
    setSettings(prev => ({
      ...prev,
      [category]: typeof updates === 'object' ? { ...prev[category], ...updates } : updates
    }));
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, globalNotifications, pushNotification }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
