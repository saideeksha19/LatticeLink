import React, { useState, useRef, useEffect } from 'react';
import { X, Palette, Upload, RotateCcw, Check, Loader2, AlertTriangle } from 'lucide-react';

/* ------------------------------------------------------------------ */
/* Theme + wallpaper definitions (validated server-side whitelists     */
/* must stay in sync with backend/routes/customization_routes.py)      */
/* ------------------------------------------------------------------ */

export const THEMES = {
  default: {
    label: 'LatticeLink',
    accent: '#3b82f6', accent2: '#8b5cf6',
    bubble: 'linear-gradient(135deg, #2563eb, #4f46e5)',
  },
  emerald: {
    label: 'Emerald',
    accent: '#10b981', accent2: '#059669',
    bubble: 'linear-gradient(135deg, #059669, #10b981)',
  },
  ocean: {
    label: 'Ocean',
    accent: '#0ea5e9', accent2: '#0284c7',
    bubble: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
  },
  violet: {
    label: 'Violet',
    accent: '#8b5cf6', accent2: '#7c3aed',
    bubble: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
  },
  rose: {
    label: 'Rose',
    accent: '#f43f5e', accent2: '#e11d48',
    bubble: 'linear-gradient(135deg, #e11d48, #f43f5e)',
  },
  amber: {
    label: 'Amber',
    accent: '#f59e0b', accent2: '#d97706',
    bubble: 'linear-gradient(135deg, #d97706, #f59e0b)',
  },
  monochrome: {
    label: 'Monochrome',
    accent: '#94a3b8', accent2: '#64748b',
    bubble: 'linear-gradient(135deg, #475569, #94a3b8)',
  },
};

export const SOLID_WALLPAPERS = {
  midnight: { label: 'Midnight', color: '#0b1120' },
  slate: { label: 'Slate', color: '#1e293b' },
  forest: { label: 'Forest', color: '#0a1f1a' },
  navy: { label: 'Navy', color: '#0a1128' },
  plum: { label: 'Plum', color: '#1a0f2e' },
  charcoal: { label: 'Charcoal', color: '#16181d' },
  teal: { label: 'Teal', color: '#042f2e' },
  wine: { label: 'Wine', color: '#2b0d14' },
};

export const GRADIENT_WALLPAPERS = {
  aurora: { label: 'Aurora', css: 'linear-gradient(160deg, #0f172a 0%, #064e3b 45%, #0ea5e9 140%)' },
  sunset: { label: 'Sunset', css: 'linear-gradient(160deg, #1a0b2e 0%, #7c2d12 55%, #f59e0b 140%)' },
  'ocean-deep': { label: 'Ocean Deep', css: 'linear-gradient(160deg, #020617 0%, #0c4a6e 60%, #22d3ee 140%)' },
  nebula: { label: 'Nebula', css: 'linear-gradient(160deg, #0b0420 0%, #4c1d95 55%, #db2777 140%)' },
  'forest-mist': { label: 'Forest Mist', css: 'linear-gradient(160deg, #05160f 0%, #14532d 60%, #4ade80 140%)' },
  ember: { label: 'Ember', css: 'linear-gradient(160deg, #1c0505 0%, #7f1d1d 55%, #fb923c 140%)' },
  frost: { label: 'Frost', css: 'linear-gradient(160deg, #0a1020 0%, #1e3a5f 55%, #93c5fd 140%)' },
  dusk: { label: 'Dusk', css: 'linear-gradient(160deg, #120b1e 0%, #312e81 55%, #c084fc 140%)' },
};

/**
 * Resolve a wallpaper record into an inline CSS background style.
 * A dark readability scrim is always layered on top of the wallpaper so
 * message text, timestamps and controls stay legible.
 */
export const resolveWallpaperStyle = (wallpaper, mediaUrl) => {
  if (!wallpaper || wallpaper.kind === 'default' || !wallpaper.kind) return null;
  if (wallpaper.kind === 'solid') {
    const solid = SOLID_WALLPAPERS[wallpaper.value];
    if (!solid) return null;
    return { backgroundImage: solid.color };
  }
  if (wallpaper.kind === 'gradient') {
    const grad = GRADIENT_WALLPAPERS[wallpaper.value];
    if (!grad) return null;
    return { backgroundImage: grad.css };
  }
  if (wallpaper.kind === 'image' && mediaUrl) {
    return {
      backgroundImage: `url("${mediaUrl}")`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    };
  }
  return null;
};

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ACCEPTED_UPLOAD_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const ChatAppearancePanel = ({ conversationId, token, current, onClose, onApply }) => {
  const [theme, setTheme] = useState(current?.theme || 'default');
  const [wallpaper, setWallpaper] = useState(current?.wallpaper || { kind: 'default', value: null });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Reset local selections when switching conversations
  useEffect(() => {
    setTheme(current?.theme || 'default');
    setWallpaper(current?.wallpaper || { kind: 'default', value: null });
    setError('');
  }, [conversationId, current]);

  const t = THEMES[theme] || THEMES.default;

  const mediaUrl = wallpaper.kind === 'image' && wallpaper.value
    ? `/api/chat/custom/wallpaper/${wallpaper.value}?token=${encodeURIComponent(token || '')}`
    : null;
  const wpStyle = resolveWallpaperStyle(wallpaper, mediaUrl);

  const applyPreferences = async (nextTheme, nextWallpaper) => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/chat/custom/${conversationId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          theme: nextTheme,
          wallpaper_kind: nextWallpaper.kind === 'image' ? undefined : nextWallpaper.kind,
          wallpaper_value: nextWallpaper.kind === 'image' ? undefined : nextWallpaper.value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not save your appearance settings.');
        return false;
      }
      onApply(data.customization);
      return true;
    } catch (e) {
      setError('Network error while saving appearance settings.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async () => {
    await applyPreferences(theme, wallpaper);
  };

  const handleReset = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/chat/custom/${conversationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not reset appearance settings.');
        return;
      }
      setTheme('default');
      setWallpaper({ kind: 'default', value: null });
      onApply({ conversation_id: conversationId, theme: 'default', wallpaper: { kind: 'default', value: null }, is_default: true });
    } catch (e) {
      setError('Network error while resetting appearance settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!ACCEPTED_UPLOAD_TYPES.includes(f.type)) {
      setError('Unsupported file type. Use a JPEG, PNG or WebP image.');
      return;
    }
    if (f.size > MAX_UPLOAD_BYTES) {
      setError('That image is over the 5 MB wallpaper limit.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const form = new FormData();
      form.append('file', f);
      const res = await fetch(`/api/chat/custom/${conversationId}/wallpaper`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Upload failed.');
        return;
      }
      const saved = data.customization;
      setWallpaper(saved.wallpaper);
      onApply(saved);
    } catch (e) {
      setError('Network error while uploading the wallpaper.');
    } finally {
      setUploading(false);
    }
  };

  const sectionTitle = {
    fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase',
    color: '#64748b', margin: '18px 0 10px',
  };

  const chipStyle = (selected) => ({
    background: selected ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.04)',
    border: selected ? '1.5px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)',
    borderRadius: '10px',
    padding: '7px 12px',
    color: selected ? '#93c5fd' : '#cbd5e1',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '7px',
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 'min(560px, 94vw)', maxHeight: '90vh', overflowY: 'auto',
          background: 'rgba(12,17,35,0.98)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '18px', padding: '22px', color: 'white',
          boxSizing: 'border-box',
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <div style={{ display: 'flex', gap: '9px', alignItems: 'center', fontSize: '16px', fontWeight: 700 }}>
            <Palette size={17} color="#3b82f6" /> Chat Appearance
          </div>
          <button
            onClick={onClose}
            aria-label="Close appearance panel"
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={15} />
          </button>
        </div>
        <div style={{ color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>
          Applies to this conversation only — preview updates live before you apply.
        </div>

        {/* live preview */}
        <div style={{
          position: 'relative', borderRadius: '14px', overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.1)', minHeight: '128px',
          ...(wpStyle || { background: 'rgba(5,8,15,0.9)' }),
        }}>
          {/* readability scrim */}
          <div style={{ position: 'absolute', inset: 0, background: wpStyle ? 'rgba(5,8,15,0.55)' : 'transparent', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', padding: '16px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ alignSelf: 'flex-start', maxWidth: '70%', background: 'rgba(30,41,59,0.9)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px 12px 12px 2px', padding: '7px 11px', fontSize: '13px', color: 'white' }}>
              Hey! The new theme looks great.
            </div>
            <div style={{ alignSelf: 'flex-end', maxWidth: '70%', background: t.bubble, borderRadius: '12px 12px 2px 12px', padding: '7px 11px', fontSize: '13px', color: 'white' }}>
              Right? Try the wallpapers too ✨
            </div>
            <div style={{ alignSelf: 'flex-end', fontSize: '10px', color: 'rgba(255,255,255,0.65)' }}>
              {t.label} · 12:34 PM ✓✓
            </div>
          </div>
        </div>

        {/* themes */}
        <div style={sectionTitle}>Theme</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(132px, 1fr))', gap: '9px' }}>
          {Object.entries(THEMES).map(([id, def]) => {
            const selected = theme === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                aria-label={`Theme ${def.label}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: '9px',
                  background: selected ? 'rgba(59,130,246,0.14)' : 'rgba(255,255,255,0.04)',
                  border: selected ? '1.5px solid #3b82f6' : '1px solid rgba(255,255,255,0.09)',
                  borderRadius: '10px', padding: '9px 11px', cursor: 'pointer',
                  color: 'white', fontSize: '12.5px', fontWeight: 600,
                }}
              >
                <span style={{
                  width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                  background: def.bubble, border: '1px solid rgba(255,255,255,0.25)',
                }} />
                {def.label}
                {selected && <Check size={13} color="#3b82f6" style={{ marginLeft: 'auto' }} />}
              </button>
            );
          })}
        </div>

        {/* wallpapers */}
        <div style={sectionTitle}>Wallpaper</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px' }}>
          <button onClick={() => setWallpaper({ kind: 'default', value: null })} style={chipStyle(wallpaper.kind === 'default')}>
            Default
          </button>
          {Object.entries(SOLID_WALLPAPERS).map(([id, def]) => (
            <button
              key={id}
              onClick={() => setWallpaper({ kind: 'solid', value: id })}
              aria-label={`Wallpaper ${def.label}`}
              title={def.label}
              style={{
                width: '34px', height: '34px', borderRadius: '9px', background: def.color, cursor: 'pointer',
                border: wallpaper.kind === 'solid' && wallpaper.value === id ? '2px solid #3b82f6' : '1.5px solid rgba(255,255,255,0.18)',
                transform: wallpaper.kind === 'solid' && wallpaper.value === id ? 'scale(1.08)' : 'none',
                transition: 'transform 0.15s',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '9px', marginTop: '10px' }}>
          {Object.entries(GRADIENT_WALLPAPERS).map(([id, def]) => {
            const selected = wallpaper.kind === 'gradient' && wallpaper.value === id;
            return (
              <button
                key={id}
                onClick={() => setWallpaper({ kind: 'gradient', value: id })}
                aria-label={`Wallpaper ${def.label}`}
                title={def.label}
                style={{
                  width: '64px', height: '40px', borderRadius: '9px', background: def.css, cursor: 'pointer',
                  border: selected ? '2px solid #3b82f6' : '1.5px solid rgba(255,255,255,0.15)',
                  transform: selected ? 'scale(1.06)' : 'none', transition: 'transform 0.15s',
                }}
              />
            );
          })}
        </div>

        {/* custom upload */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            disabled={uploading}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px dashed rgba(255,255,255,0.25)',
              borderRadius: '10px', color: '#cbd5e1', padding: '9px 14px', cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12.5px', fontWeight: 600,
            }}
          >
            {uploading ? <Loader2 size={14} className="ll-spin" /> : <Upload size={14} />}
            {uploading ? 'Uploading…' : 'Upload custom image'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleUpload}
            style={{ display: 'none' }}
          />
          <span style={{ color: '#64748b', fontSize: '11px' }}>JPEG / PNG / WebP · max 5 MB</span>
          {wallpaper.kind === 'image' && mediaUrl && (
            <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Check size={12} /> Custom wallpaper active
            </span>
          )}
        </div>

        {error && (
          <div style={{
            display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px',
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)',
            color: '#fca5a5', padding: '10px 12px', borderRadius: '10px', fontSize: '12.5px',
          }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        {/* actions */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '18px' }}>
          <button
            onClick={handleReset}
            disabled={saving || uploading}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: '10px', color: '#cbd5e1', padding: '10px 14px', cursor: 'pointer',
              display: 'flex', gap: '7px', alignItems: 'center', fontSize: '13px', fontWeight: 600,
            }}
          >
            <RotateCcw size={14} /> Reset
          </button>
          <button
            onClick={handleApply}
            disabled={saving || uploading}
            style={{
              flex: 1, background: t.bubble, border: 'none', borderRadius: '10px', color: 'white',
              padding: '10px 16px', cursor: saving || uploading ? 'not-allowed' : 'pointer',
              fontWeight: 700, fontSize: '13.5px', display: 'flex', gap: '8px',
              alignItems: 'center', justifyContent: 'center', opacity: saving || uploading ? 0.7 : 1,
            }}
          >
            {saving ? <Loader2 size={15} className="ll-spin" /> : <Check size={15} />}
            {saving ? 'Applying…' : 'Apply'}
          </button>
        </div>
      </div>

      <style>{`
        .ll-spin { animation: ll-rot 1s linear infinite; }
        @keyframes ll-rot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ChatAppearancePanel;
