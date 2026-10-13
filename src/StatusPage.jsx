import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, X, ChevronLeft, ChevronRight, Eye, Trash2, Image as ImageIcon,
  Video, Type, RefreshCw, CircleDashed, Send, AlertTriangle, Users, Loader2
} from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useChat } from './context/ChatContext';

/* ------------------------------------------------------------------ */
/* Constants                                                            */
/* ------------------------------------------------------------------ */

const TEXT_COLORS = [
  '#1e293b', '#3b82f6', '#8b5cf6', '#ec4899',
  '#ef4444', '#f59e0b', '#10b981', '#0f172a',
];

const MAX_MEDIA_BYTES = 15 * 1024 * 1024; // matches backend limit
const ACCEPTED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'video/mp4', 'video/webm', 'video/quicktime',
];
const TEXT_DURATION = 5000;
const IMAGE_DURATION = 5000;
const VIDEO_FALLBACK_DURATION = 15000;

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #3b82f6, #8b5cf6)',
  'linear-gradient(135deg, #10b981, #3b82f6)',
  'linear-gradient(135deg, #f59e0b, #ef4444)',
  'linear-gradient(135deg, #8b5cf6, #ec4899)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #ec4899, #f59e0b)',
];

const gradientFor = (name = '') =>
  AVATAR_GRADIENTS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_GRADIENTS.length];

const pad = (n) => String(n).padStart(2, '0');

const formatTimestamp = (value) => {
  if (!value) return '';
  const d = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(d.getTime())) return value;
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = `${((d.getHours() + 11) % 12) + 1}:${pad(d.getMinutes())} ${d.getHours() >= 12 ? 'PM' : 'AM'}`;
  if (sameDay) return `Today, ${time}`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return `Yesterday, ${time}`;
  return `${d.toLocaleString('default', { month: 'short' })} ${d.getDate()}, ${time}`;
};

/* ------------------------------------------------------------------ */
/* Composer                                                            */
/* ------------------------------------------------------------------ */

const StatusComposer = ({ token, onClose, onCreated }) => {
  const [text, setText] = useState('');
  const [color, setColor] = useState(TEXT_COLORS[0]);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
  }, [filePreview]);

  const pickFile = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type)) {
      setError('Unsupported file type. Use JPEG, PNG, WebP, GIF, MP4, WebM or MOV.');
      return;
    }
    if (f.size > MAX_MEDIA_BYTES) {
      setError('Media exceeds the 15 MB status limit.');
      return;
    }
    setError('');
    setFile(f);
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFilePreview(f.type.startsWith('video/') ? URL.createObjectURL(f) : URL.createObjectURL(f));
  };

  const removeFile = () => {
    if (filePreview) URL.revokeObjectURL(filePreview);
    setFile(null);
    setFilePreview(null);
  };

  const submit = async () => {
    if (posting) return;
    if (!file && !text.trim()) {
      setError('Write something or pick a photo/video first.');
      return;
    }
    setPosting(true);
    setError('');
    try {
      const form = new FormData();
      form.append('text', text.trim());
      form.append('bg_color', color);
      if (file) form.append('file', file);
      const res = await fetch('/api/status/create', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not post your status.');
        return;
      }
      onCreated(data.status);
      onClose();
    } catch (e) {
      setError('Network error while posting your status.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: '520px', background: 'rgba(12,17,35,0.98)',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px',
          padding: '24px', color: 'white', boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '17px', fontWeight: 700 }}>New Status</div>
          <button
            onClick={onClose}
            aria-label="Close composer"
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}
          >
            <X size={16} />
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value.slice(0, 500))}
          placeholder="What's on your mind?"
          rows={4}
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
            padding: '12px 14px', color: 'white', fontSize: '15px', resize: 'vertical',
            outline: 'none', boxSizing: 'border-box',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
          <span>{file ? `${file.name} selected` : 'Text statuses are shown on a color background'}</span>
          <span>{text.length}/500</span>
        </div>

        {/* color swatches */}
        <div style={{ display: 'flex', gap: '10px', margin: '14px 0', flexWrap: 'wrap' }}>
          {TEXT_COLORS.map((c) => (
            <button
              key={c}
              aria-label={`Background color ${c}`}
              onClick={() => setColor(c)}
              style={{
                width: '30px', height: '30px', borderRadius: '50%', background: c,
                border: color === c ? '3px solid #3b82f6' : '2px solid rgba(255,255,255,0.25)',
                cursor: 'pointer', transition: 'transform 0.15s',
                transform: color === c ? 'scale(1.12)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* media preview */}
        {filePreview && (
          <div style={{ position: 'relative', marginBottom: '14px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
            {file && file.type.startsWith('video/') ? (
              <video src={filePreview} style={{ width: '100%', maxHeight: '220px', display: 'block' }} muted playsInline />
            ) : (
              <img src={filePreview} alt="Status preview" style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }} />
            )}
            <button
              onClick={removeFile}
              aria-label="Remove media"
              style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {error && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5', padding: '10px 12px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px' }}>
            <AlertTriangle size={15} /> {error}
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '10px', color: '#cbd5e1', padding: '10px 14px', cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px' }}
          >
            <ImageIcon size={15} /> Photo / Video
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            onChange={pickFile}
            style={{ display: 'none' }}
          />
          <button
            onClick={submit}
            disabled={posting}
            style={{ flex: 1, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', borderRadius: '10px', color: 'white', padding: '10px 16px', cursor: posting ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '14px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center', opacity: posting ? 0.7 : 1 }}
          >
            {posting ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
            {posting ? 'Posting…' : 'Post Status'}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Viewer list (owner only)                                            */
/* ------------------------------------------------------------------ */

const ViewersModal = ({ statusId, token, onClose }) => {
  const [state, setState] = useState({ loading: true, error: '', viewers: [] });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: '' }));
    try {
      const res = await fetch(`/api/status/${statusId}/views`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState({ loading: false, error: data.error || 'Could not load viewers', viewers: [] });
        return;
      }
      setState({ loading: false, error: '', viewers: data.viewers || [] });
    } catch (e) {
      setState({ loading: false, error: 'Network error', viewers: [] });
    }
  }, [statusId, token]);

  useEffect(() => { load(); }, [load]);

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '420px', background: 'rgba(12,17,35,0.98)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '22px', color: 'white' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '16px', fontWeight: 700 }}>
            <Users size={17} /> Viewed by
          </div>
          <button
            onClick={onClose}
            aria-label="Close viewers"
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', color: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={15} />
          </button>
        </div>

        {state.loading && (
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#94a3b8', fontSize: '14px', padding: '18px 0' }}>
            <Loader2 size={16} className="animate-spin" /> Loading viewers…
          </div>
        )}
        {!state.loading && state.error && (
          <div style={{ color: '#fca5a5', fontSize: '13px', padding: '10px 0' }}>{state.error}</div>
        )}
        {!state.loading && !state.error && state.viewers.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: '14px', padding: '18px 0' }}>No views yet.</div>
        )}
        {!state.loading && !state.error && state.viewers.map((v, i) => (
          <div key={`${v.username}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 4px', borderTop: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: gradientFor(v.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '14px' }}>
              {(v.username || '?').charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 600 }}>{v.username}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>{formatTimestamp(v.viewed_at)}</div>
            </div>
            <Eye size={15} color="#3b82f6" />
          </div>
        ))}
      </div>
    </div>
  );
};

const resolveMediaUrl = (url, token) => {
  if (!url) return '';
  let fullUrl = url;
  if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
    const rawBackend = (import.meta.env.VITE_BACKEND_URL || '').trim().replace(/\/+$/, '');
    const isLocalHost = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    const backend = rawBackend || (import.meta.env.DEV || isLocalHost ? '' : 'https://latticelink-backend.onrender.com');
    if (backend) {
      fullUrl = `${backend}${fullUrl.startsWith('/') ? '' : '/'}${fullUrl}`;
    }
  }
  if (token && !fullUrl.includes('token=')) {
    fullUrl += (fullUrl.includes('?') ? '&' : '?') + `token=${encodeURIComponent(token)}`;
  }
  return fullUrl;
};

const StatusViewer = ({ groups, startIndex, startStatusIndex, token, currentUsername, onClose, onViewed, onDelete, onOpenViewers }) => {
  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [statusIndex, setStatusIndex] = useState(startStatusIndex);
  const [progress, setProgress] = useState(0);
  const [unavailable, setUnavailable] = useState('');
  const timerRef = useRef(null);
  const startedRef = useRef('');
  const videoRef = useRef(null);

  const group = groups[groupIndex];
  const status = group && group.statuses[statusIndex];

  const durationFor = (s) => {
    if (!s) return TEXT_DURATION;
    if (s.type === 'image') return IMAGE_DURATION;
    if (s.type === 'video') return VIDEO_FALLBACK_DURATION;
    return TEXT_DURATION;
  };

  const goNext = useCallback(() => {
    const g = groups[groupIndex];
    if (!g) return;
    if (statusIndex + 1 < g.statuses.length) {
      setStatusIndex(statusIndex + 1);
      setProgress(0);
      setUnavailable('');
    } else if (groupIndex + 1 < groups.length) {
      // move to the next group
      setGroupIndex(groupIndex + 1);
      setStatusIndex(0);
      setProgress(0);
      setUnavailable('');
    } else {
      onClose();
    }
  }, [groupIndex, statusIndex, groups, onClose]);

  const goPrev = useCallback(() => {
    if (statusIndex > 0) {
      setStatusIndex(statusIndex - 1);
      setProgress(0);
      setUnavailable('');
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex(groupIndex - 1);
      setStatusIndex(Math.max(0, (prevGroup ? prevGroup.statuses.length : 1) - 1));
      setProgress(0);
      setUnavailable('');
    }
  }, [groupIndex, statusIndex, groups]);

  // Record the view once per status
  useEffect(() => {
    if (!status || !group) return;
    if (group.username === currentUsername) return;
    const key = `${group.username}:${status.id}`;
    if (startedRef.current === key) return;
    startedRef.current = key;
    (async () => {
      try {
        const res = await fetch(`/api/status/${status.id}/view`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 404 || res.status === 410 || res.status === 403) {
          const data = await res.json().catch(() => ({}));
          setUnavailable(data.error || 'This status is no longer available.');
          return;
        }
        if (res.ok) onViewed(group.username, status.id);
      } catch (e) {
        // offline: keep viewing, feed refresh will reconcile
      }
    })();
  }, [status, group, currentUsername, token, onViewed]);

  // Auto-advance progress
  useEffect(() => {
    if (!status || unavailable) return;
    setProgress(0);
    const duration = durationFor(status);
    const startedAt = Date.now();
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - startedAt) / duration) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timerRef.current);
        goNext();
      }
    }, 100);
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status && status.id, unavailable]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  if (!group || !status) {
    return (
      <div style={viewerShell}>
        <div style={{ color: '#cbd5e1', textAlign: 'center' }}>
          <div style={{ marginBottom: '14px' }}>This status is no longer available.</div>
          <button onClick={onClose} style={ghostButton}>Close</button>
        </div>
      </div>
    );
  }

  const isMine = group.username === currentUsername;

  return (
    <div style={viewerShell}>
      {/* progress segments */}
      <div style={{ display: 'flex', gap: '4px', padding: '14px 14px 0' }}>
        {group.statuses.map((s, i) => (
          <div key={s.id} style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.25)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{
              height: '100%', background: 'white', borderRadius: '3px',
              width: i < statusIndex ? '100%' : i === statusIndex ? `${progress}%` : '0%',
              transition: 'width 0.1s linear',
            }} />
          </div>
        ))}
      </div>

      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: gradientFor(group.username), display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
          {(group.username || '?').charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '14px' }}>{isMine ? 'My Status' : group.username}</div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>{formatTimestamp(status.created_at)}</div>
        </div>
        {isMine && (
          <button
            onClick={() => onOpenViewers(status.id)}
            style={{ ...ghostButton, display: 'flex', gap: '6px', alignItems: 'center', padding: '6px 12px', fontSize: '12px' }}
          >
            <Eye size={14} /> {status.view_count ?? 0}
          </button>
        )}
        {isMine && (
          <button
            onClick={() => onDelete(status.id)}
            aria-label="Delete status"
            style={{ ...ghostButton, padding: '6px 10px' }}
          >
            <Trash2 size={15} />
          </button>
        )}
        <button onClick={onClose} aria-label="Close viewer" style={{ ...ghostButton, padding: '6px 10px' }}>
          <X size={17} />
        </button>
      </div>

      {/* content */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0 }}>
        {/* tap zones */}
        <div onClick={goPrev} aria-label="Previous status" style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer', display: 'flex', alignItems: 'center', paddingLeft: '14px', color: 'rgba(255,255,255,0.4)' }}>
          <ChevronLeft size={30} />
        </div>
        <div onClick={goNext} aria-label="Next status" style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '30%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '14px', color: 'rgba(255,255,255,0.4)' }}>
          <ChevronRight size={30} />
        </div>

        {unavailable ? (
          <div style={{ color: '#cbd5e1', textAlign: 'center', padding: '24px', maxWidth: '420px' }}>
            <AlertTriangle size={30} color="#f59e0b" style={{ marginBottom: '10px' }} />
            <div style={{ fontSize: '14px' }}>{unavailable}</div>
          </div>
        ) : status.type === 'text' ? (
          <div style={{
            background: status.bg_color || '#1e293b', color: 'white',
            borderRadius: '16px', padding: '40px 32px', maxWidth: '560px',
            width: '86%', textAlign: 'center', fontSize: '26px', lineHeight: 1.45,
            fontWeight: 600, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            boxShadow: '0 18px 60px rgba(0,0,0,0.45)',
          }}>
            {status.text}
          </div>
        ) : status.type === 'image' ? (
          <img
            src={resolveMediaUrl(status.media_url, token)}
            alt={status.text || 'Status'}
            onError={() => setUnavailable('This media is missing or expired.')}
            style={{ maxWidth: '92%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px' }}
          />
        ) : (
          <video
            ref={videoRef}
            src={resolveMediaUrl(status.media_url, token)}
            autoPlay
            muted
            playsInline
            controls
            onEnded={goNext}
            onError={() => setUnavailable('This media is missing or expired.')}
            style={{ maxWidth: '92%', maxHeight: '100%', borderRadius: '12px', background: 'black' }}
          />
        )}
      </div>

      {status.text && status.type !== 'text' && (
        <div style={{ color: 'rgba(255,255,255,0.85)', textAlign: 'center', padding: '10px 20px 18px', fontSize: '14px' }}>
          {status.text}
        </div>
      )}
    </div>
  );
};

const viewerShell = {
  position: 'fixed', inset: 0, zIndex: 1200, background: 'rgba(3,6,15,0.97)',
  display: 'flex', flexDirection: 'column',
};

const ghostButton = {
  background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)',
  borderRadius: '10px', color: 'white', padding: '7px 12px', cursor: 'pointer',
  fontSize: '13px',
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

const StatusPage = () => {
  const { currentUser } = useAuth();
  const { socket } = useChat();
  const token = currentUser?.session_token;
  const username = currentUser?.username;

  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showComposer, setShowComposer] = useState(false);
  const [viewer, setViewer] = useState(null); // {groupIndex, statusIndex}
  const [viewersStatusId, setViewersStatusId] = useState(null);

  const loadFeed = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/status/feed', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || 'Could not load statuses.');
        setFeed([]);
        return;
      }
      setFeed(data.statuses || []);
    } catch (e) {
      setError('Network error while loading statuses.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  // Real-time: refresh when a contact posts a new status
  useEffect(() => {
    if (!socket) return undefined;
    const onNewStatus = () => { loadFeed(); };
    socket.on('new_status', onNewStatus);
    return () => { socket.off('new_status', onNewStatus); };
  }, [socket, loadFeed]);

  // Group by creator, preserving newest-first ordering from the API
  const groups = [];
  const groupIndexByUsername = {};
  feed.forEach((s) => {
    if (groupIndexByUsername[s.creator] === undefined) {
      groupIndexByUsername[s.creator] = groups.length;
      groups.push({ username: s.creator, statuses: [] });
    }
    groups[groupIndexByUsername[s.creator]].statuses.push(s);
  });

  const myGroup = groups.find((g) => g.username === username);
  const otherGroups = groups.filter((g) => g.username !== username);

  const openViewer = (groupIdx, statusIdx = 0) => setViewer({ groupIndex: groupIdx, statusIdx });

  const markViewed = useCallback((creator, statusId) => {
    setFeed((prev) => prev.map((s) => {
      if (s.creator === creator && s.id === statusId) return { ...s, viewed: true };
      if (s.creator === creator && s.is_mine && s.view_count != null) {
        // owner's view count refreshes when they open their own list
        return s;
      }
      return s;
    }));
  }, []);

  const handleDelete = async (statusId) => {
    if (!window.confirm('Delete this status?')) return;
    try {
      const res = await fetch(`/api/status/${statusId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setViewer(null);
        setViewersStatusId(null);
        loadFeed();
      } else {
        const data = await res.json().catch(() => ({}));
        window.alert(data.error || 'Could not delete status.');
      }
    } catch (e) {
      window.alert('Network error while deleting.');
    }
  };

  const unviewedCountFor = (g) => g.statuses.filter((s) => !s.viewed && !s.is_mine).length;

  const renderRing = (inner, unviewed) => (
    <div style={{
      padding: '3px', borderRadius: '50%',
      background: unviewed ? 'linear-gradient(135deg,#3b82f6,#8b5cf6,#ec4899)' : 'rgba(255,255,255,0.15)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      {inner}
    </div>
  );

  const avatar = (name, size = 46) => (
    <div style={{
      width: `${size}px`, height: `${size}px`, borderRadius: '50%',
      background: gradientFor(name),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: `${size * 0.4}px`,
    }}>
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );

  const sectionCard = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '16px',
    padding: '8px',
    marginBottom: '18px',
  };

  return (
    <div style={{ padding: '28px 32px', maxWidth: '760px', color: 'white' }}>
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0 }}>Status</h1>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
            Share updates that disappear after 24 hours
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={loadFeed} aria-label="Refresh statuses" style={{ ...ghostButton, display: 'flex', gap: '6px', alignItems: 'center' }}>
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setShowComposer(true)}
            style={{ ...ghostButton, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', display: 'flex', gap: '7px', alignItems: 'center', fontWeight: 600 }}
          >
            <Plus size={15} /> New Status
          </button>
        </div>
      </div>

      {/* loading state */}
      {loading && (
        <div style={{ ...sectionCard, padding: '38px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
          <Loader2 size={18} className="animate-spin" /> Loading statuses…
        </div>
      )}

      {/* error state */}
      {!loading && error && (
        <div style={{ ...sectionCard, padding: '26px', textAlign: 'center' }}>
          <AlertTriangle size={26} color="#f59e0b" style={{ marginBottom: '10px' }} />
          <div style={{ color: '#fca5a5', fontSize: '14px', marginBottom: '14px' }}>{error}</div>
          <button onClick={loadFeed} style={{ ...ghostButton, display: 'inline-flex', gap: '7px', alignItems: 'center' }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* empty state */}
      {!loading && !error && groups.length === 0 && (
        <div style={{ ...sectionCard, padding: '44px 26px', textAlign: 'center' }}>
          <CircleDashed size={38} color="#3b82f6" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>No status updates yet</div>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '18px' }}>
            Be the first to share something with your contacts.
          </div>
          <button
            onClick={() => setShowComposer(true)}
            style={{ ...ghostButton, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', border: 'none', fontWeight: 600 }}
          >
            <Plus size={15} /> Add your status
          </button>
        </div>
      )}

      {/* my status */}
      {!loading && !error && (myGroup || true) && (
        <div style={sectionCard}>
          <div
            onClick={() => {
              if (myGroup) {
                const gIdx = groups.indexOf(myGroup);
                openViewer(gIdx, 0);
              } else {
                setShowComposer(true);
              }
            }}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', cursor: 'pointer', borderRadius: '12px' }}
            className="status-hover-row"
          >
            <div style={{ position: 'relative' }}>
              {renderRing(avatar(username || 'U', 46), !!myGroup)}
              <div style={{
                position: 'absolute', right: '-3px', bottom: '-3px', width: '20px', height: '20px',
                borderRadius: '50%', background: '#3b82f6', border: '2px solid #0b1020',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
              }}>
                <Plus size={12} />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>My Status</div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {myGroup
                  ? `${myGroup.statuses.length} update${myGroup.statuses.length > 1 ? 's' : ''} · ${formatTimestamp(myGroup.statuses[0].created_at)}`
                  : 'Tap to add a status update'}
              </div>
            </div>
            {myGroup && (
              <button
                onClick={(e) => { e.stopPropagation(); openViewer(groups.indexOf(myGroup), 0); }}
                style={{ ...ghostButton, fontSize: '12px', display: 'flex', gap: '6px', alignItems: 'center' }}
              >
                <Eye size={13} /> {myGroup.statuses.reduce((acc, s) => acc + (s.view_count || 0), 0)} views
              </button>
            )}
          </div>
        </div>
      )}

      {/* other users' statuses */}
      {!loading && !error && otherGroups.length > 0 && (
        <div style={sectionCard}>
          <div style={{ padding: '10px 14px 6px', fontSize: '11px', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase', color: '#64748b' }}>
            Recent updates
          </div>
          {otherGroups.map((g) => {
            const gIdx = groups.indexOf(g);
            const unviewed = unviewedCountFor(g) > 0;
            const latest = g.statuses[0];
            return (
              <div
                key={g.username}
                onClick={() => openViewer(gIdx, 0)}
                className="status-hover-row"
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', cursor: 'pointer', borderRadius: '12px', borderTop: '1px solid rgba(255,255,255,0.05)' }}
              >
                {renderRing(avatar(g.username, 46), unviewed)}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: unviewed ? 700 : 500, color: unviewed ? 'white' : '#cbd5e1' }}>
                    {g.username}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {formatTimestamp(latest.created_at)}
                    {' · '}
                    {g.statuses.length} update{g.statuses.length > 1 ? 's' : ''}
                    {unviewed ? ' · New' : ' · Viewed'}
                  </div>
                </div>
                {!unviewed && <Eye size={15} color="#475569" />}
                {unviewed && (
                  <span style={{ background: 'rgba(59,130,246,0.18)', color: '#93c5fd', fontSize: '11px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px' }}>
                    {unviewedCountFor(g)} new
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showComposer && (
        <StatusComposer
          token={token}
          onClose={() => setShowComposer(false)}
          onCreated={() => loadFeed()}
        />
      )}

      {viewer && (
        <StatusViewer
          groups={groups}
          startIndex={viewer.groupIndex}
          startStatusIndex={viewer.statusIdx}
          token={token}
          currentUsername={username}
          onClose={() => setViewer(null)}
          onViewed={markViewed}
          onDelete={handleDelete}
          onOpenViewers={(id) => setViewersStatusId(id)}
        />
      )}

      {viewersStatusId && (
        <ViewersModal
          statusId={viewersStatusId}
          token={token}
          onClose={() => setViewersStatusId(null)}
        />
      )}

      <style>{`
        .status-hover-row:hover {
          background: rgba(255,255,255,0.05);
        }
        .animate-spin { animation: ll-spin 1s linear infinite; }
        @keyframes ll-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default StatusPage;
