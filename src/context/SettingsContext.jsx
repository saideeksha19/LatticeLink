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
    mode: 'dark',   // 'dark' | 'light' — single source of truth
    matrixRain: true,
    compactMode: false,
    presentationMode: false,
    presentationStep: 0
  },
  language: 'English'
};

// Derive the effective appearance mode ('dark' | 'light') from a settings object.
// `mode` is authoritative; older saved payloads that only carry `darkMode` are
// migrated here so existing users keep their preference.
export function resolveAppearanceMode(settings) {
  const appearance = settings?.appearance;
  if (!appearance) return 'dark';
  if (appearance.mode === 'light' || appearance.mode === 'dark') return appearance.mode;
  return appearance.darkMode === false ? 'light' : 'dark';
}

// Push the mode onto <html> so the CSS variable sets in index.css switch instantly
// for every component (no reload required).
export function applyAppearance(mode) {
  const root = document.documentElement;
  if (mode === 'light') {
    root.setAttribute('data-appearance', 'light');
    root.style.colorScheme = 'light';
  } else {
    root.removeAttribute('data-appearance');
    root.style.colorScheme = 'dark';
  }
}

// Applied by the inline script in index.html before React mounts, and reused here
// so startup restore and runtime changes share one code path.
export function readSavedAppearance() {
  try {
    const saved = localStorage.getItem('ll_settings_v4');
    if (!saved) return 'dark';
    const parsed = JSON.parse(saved);
    return resolveAppearanceMode(parsed);
  } catch {
    return 'dark';
  }
}

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('ll_settings_v4');
      const parsed = saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
      const merged = { ...DEFAULT_SETTINGS, ...parsed, appearance: { ...DEFAULT_SETTINGS.appearance, ...(parsed?.appearance || {}) } };
      // Migrate: keep legacy darkMode flag consistent with the authoritative mode
      const mode = resolveAppearanceMode(merged);
      merged.appearance.mode = mode;
      merged.appearance.darkMode = mode !== 'light';
      return merged;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [globalNotifications, setGlobalNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('ll_notifications_v4');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Apply appearance on mount (normally already applied by the index.html inline
  // script, but this covers direct mounts e.g. in tests) and whenever it changes.
  useEffect(() => {
    applyAppearance(resolveAppearanceMode(settings));
  }, [settings.appearance?.mode]);

  useEffect(() => {
    localStorage.setItem('ll_settings_v4', JSON.stringify(settings));

    // Apply theme colour
    if (settings.appearance) {
      const themeColor = settings.appearance.themeColor || '#3b82f6';
      document.documentElement.style.setProperty('--primary', themeColor);
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
    setSettings(prev => {
      const nextCategory = typeof updates === 'object'
        ? { ...prev[category], ...updates }
        : updates;
      const next = { ...prev, [category]: nextCategory };

      // Keep appearance.mode and appearance.darkMode in lockstep so legacy
      // consumers of either field always see the same truth.
      if (category === 'appearance' && typeof updates === 'object') {
        const mode = resolveAppearanceMode(next);
        next.appearance = { ...next.appearance, mode, darkMode: mode !== 'light' };
        // Apply synchronously so the UI flips in the same frame as the toggle.
        applyAppearance(mode);
      }
      return next;
    });
  };

  // Convenience: set appearance mode ('dark' | 'light')
  const setAppearanceMode = (mode) => {
    updateSettings('appearance', { mode });
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, setAppearanceMode, globalNotifications, pushNotification }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
