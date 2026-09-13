import React from 'react';
import { 
  FileText, 
  Film, 
  Music, 
  Image as ImageIcon, 
  Archive, 
  Download, 
  Play, 
  ShieldCheck, 
  Lock,
  ExternalLink,
  Loader
} from 'lucide-react';

export const FileMessageCard = ({ message, isMe, sessionToken }) => {
  const fileMeta = message.file_meta || {};
  const fileId = message.file_id || fileMeta.id;
  const fileName = fileMeta.name || message.text || 'Encrypted File';
  const fileSize = fileMeta.size 
    ? (fileMeta.size < 1024 ? `${fileMeta.size} B` : fileMeta.size < 1048576 ? `${(fileMeta.size / 1024).toFixed(1)} KB` : `${(fileMeta.size / 1048576).toFixed(1)} MB`)
    : '';
  const mimeType = fileMeta.mimetype || '';

  const isVideo = mimeType.startsWith('video/') || !!fileName.match(/\.(mp4|webm|mov|mkv)$/i);
  const isImage = mimeType.startsWith('image/') || !!fileName.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  const isAudio = mimeType.startsWith('audio/') || !!fileName.match(/\.(mp3|wav|ogg|m4a|webm)$/i);
  const isArchive = !!fileName.match(/\.(zip|tar|gz|rar|7z)$/i);
  const isPdf = mimeType === 'application/pdf' || !!fileName.match(/\.pdf$/i);

  const [showPreview, setShowPreview] = React.useState(isVideo);
  const [mediaError, setMediaError] = React.useState(false);
  const [blobUrl, setBlobUrl] = React.useState(null);
  const [isLoadingMedia, setIsLoadingMedia] = React.useState(false);

  // Resolve active auth token from prop or local storage fallback
  const authToken = sessionToken || (() => {
    try {
      const saved = localStorage.getItem('ll_session_v4');
      if (saved) return JSON.parse(saved).session_token || '';
    } catch {
      return '';
    }
    return '';
  })();

  // Fallback stream URL
  const streamUrl = fileId 
    ? `/api/vault/files/${fileId}/download?inline=true${authToken ? `&token=${encodeURIComponent(authToken)}` : ''}` 
    : null;

  // Pre-fetch media as Blob to bypass ngrok browser warning headers and guarantee authorization
  React.useEffect(() => {
    let active = true;
    let objectUrl = null;

    if (!fileId || (!isImage && !isVideo && !isAudio)) {
      return;
    }

    const fetchMediaBlob = async () => {
      setIsLoadingMedia(true);
      setMediaError(false);
      try {
        const fetchUrl = `/api/vault/files/${fileId}/download?inline=true${authToken ? `&token=${encodeURIComponent(authToken)}` : ''}`;
        const headers = {
          'ngrok-skip-browser-warning': 'true'
        };
        if (authToken) {
          headers['Authorization'] = `Bearer ${authToken}`;
        }
        const res = await fetch(fetchUrl, { headers });
        if (!res.ok) {
          throw new Error(`Media fetch returned HTTP ${res.status}`);
        }
        const blob = await res.blob();
        if (!active) return;
        objectUrl = window.URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      } catch (err) {
        console.warn('Media blob fetch failed:', err);
        if (active) setMediaError(true);
      } finally {
        if (active) setIsLoadingMedia(false);
      }
    };

    fetchMediaBlob();

    return () => {
      active = false;
      if (objectUrl) {
        window.URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId, isImage, isVideo, isAudio, authToken]);

  const handleDownload = async (e) => {
    e.preventDefault();
    if (!fileId) return;

    try {
      const downloadUrl = `/api/vault/files/${fileId}/download${authToken ? `?token=${encodeURIComponent(authToken)}` : ''}`;
      const headers = {
        'ngrok-skip-browser-warning': 'true'
      };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(downloadUrl, { headers });

      if (!response.ok) {
        alert('File download unauthorized or file has been revoked.');
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const activeMediaUrl = blobUrl || streamUrl;

  return (
    <div 
      style={{
        background: isMe ? 'rgba(30, 58, 138, 0.4)' : 'rgba(15, 23, 42, 0.7)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '14px',
        padding: '12px 16px',
        maxWidth: '340px',
        width: '100%',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}
    >
      {/* Header Info with Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: isVideo ? 'rgba(139, 92, 246, 0.2)' : isImage ? 'rgba(16, 185, 129, 0.2)' : isAudio ? 'rgba(245, 158, 11, 0.2)' : 'rgba(56, 189, 248, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}
        >
          {isVideo ? (
            <Film size={22} color="#a855f7" />
          ) : isImage ? (
            <ImageIcon size={22} color="#10b981" />
          ) : isAudio ? (
            <Music size={22} color="#f59e0b" />
          ) : isArchive ? (
            <Archive size={22} color="#ec4899" />
          ) : (
            <FileText size={22} color="#38bdf8" />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div 
            style={{
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={fileName}
          >
            {fileName}
          </div>
          <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px', display: 'flex', gap: '6px' }}>
            <span>{isVideo ? 'Video' : isImage ? 'Image' : isAudio ? 'Audio Note' : isPdf ? 'PDF Document' : 'Document'}</span>
            {fileSize && <span>• {fileSize}</span>}
          </div>
        </div>
      </div>

      {/* Media Inline Preview if Image, Video, or Audio */}
      {isImage && (
        <div style={{ width: '100%', minHeight: '120px', maxHeight: '240px', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isLoadingMedia ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
              <Loader size={16} className="animate-spin" /> Loading image...
            </div>
          ) : !mediaError && activeMediaUrl ? (
            <img 
              src={activeMediaUrl} 
              alt={fileName} 
              style={{ maxWidth: '100%', maxHeight: '240px', objectFit: 'contain', borderRadius: '8px', cursor: 'pointer' }}
              onClick={() => window.open(activeMediaUrl, '_blank')}
              onError={() => setMediaError(true)}
            />
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              <span>📷 Click below to download image</span>
            </div>
          )}
        </div>
      )}

      {isVideo && showPreview && (
        <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', background: 'rgba(0,0,0,0.5)' }}>
          {isLoadingMedia ? (
            <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Loader size={16} className="animate-spin" /> Loading video...
            </div>
          ) : !mediaError && activeMediaUrl ? (
            <video 
              src={activeMediaUrl} 
              controls 
              playsInline
              preload="metadata"
              style={{ width: '100%', maxHeight: '240px', borderRadius: '8px', display: 'block' }}
              onError={() => setMediaError(true)}
            />
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
              <span>🎥 Click below to download video</span>
            </div>
          )}
        </div>
      )}

      {isAudio && (
        <div style={{ width: '100%', borderRadius: '8px', overflow: 'hidden', marginTop: '4px' }}>
          {isLoadingMedia ? (
            <div style={{ padding: '8px', color: '#94a3b8', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Loader size={14} className="animate-spin" /> Loading audio note...
            </div>
          ) : !mediaError && activeMediaUrl ? (
            <audio 
              src={activeMediaUrl} 
              controls 
              preload="metadata"
              style={{ width: '100%', height: '36px' }}
              onError={() => setMediaError(true)}
            />
          ) : (
            <div style={{ padding: '8px', color: '#94a3b8', fontSize: '12px' }}>
              <span>🎵 Click below to download audio</span>
            </div>
          )}
        </div>
      )}

      {/* Security Status Tag */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(0, 0, 0, 0.3)',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '10px',
          color: '#38bdf8',
          fontFamily: 'monospace'
        }}
      >
        <Lock size={10} />
        <span>PQC Vault Storage • SHA3 Verified</span>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
        <button
          onClick={handleDownload}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: 'rgba(59, 130, 246, 0.25)',
            border: '1px solid rgba(59, 130, 246, 0.5)',
            color: '#ffffff',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          className="hover:bg-blue-600/40"
        >
          <Download size={14} /> Download
        </button>

        {isVideo && (
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              background: showPreview ? 'rgba(168, 85, 247, 0.4)' : 'rgba(168, 85, 247, 0.2)',
              border: '1px solid rgba(168, 85, 247, 0.4)',
              color: '#d8b4fe',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
            title={showPreview ? "Hide Preview" : "Preview Video"}
          >
            <Play size={14} /> {showPreview ? 'Close' : 'Preview'}
          </button>
        )}
      </div>
    </div>
  );
};

export default FileMessageCard;
