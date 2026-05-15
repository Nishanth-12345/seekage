import React, { useEffect, useRef, useState } from 'react';
import { BASE_URL } from '../utils/api';

interface Props {
  contentId: number;
  title: string;
  fileName: string;
  fileUrl?: string;
  token?: string;
  onClose: () => void;
}

const API_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

function resolveFileUrl(fileUrl: string) {
  if (/^https?:\/\//i.test(fileUrl)) return fileUrl;
  return `${API_ORIGIN}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
}

export default function VideoPlayer({ contentId, title, fileName, fileUrl, token, onClose }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const videoRef = useRef<HTMLVideoElement>(null);
  const createdUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setSrc(null);
    (async () => {
      try {
        if (fileUrl && token) {
          const response = await fetch(resolveFileUrl(fileUrl), {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error('Unable to load video file');
          }

          if (cancelled) return;
          const blob = await response.blob();
          if (cancelled) return;
          const url = URL.createObjectURL(blob);
          createdUrlRef.current = url;
          setSrc(url);
          setStatus('ready');
          return;
        }

        if (fileUrl) {
          setSrc(resolveFileUrl(fileUrl));
          setStatus('ready');
          return;
        }

        setStatus('missing');
      } catch {
        if (!cancelled) setStatus('error');
      }
    })();
    return () => {
      cancelled = true;
      if (createdUrlRef.current) {
        URL.revokeObjectURL(createdUrlRef.current);
        createdUrlRef.current = null;
      }
    };
  }, [contentId, fileUrl, token]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{ maxWidth: 720, width: '90vw', padding: 16 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--navy)' }}>{title}</div>
            <div style={{ fontSize: 11, color: '#888' }}>{fileName}</div>
          </div>
          <button className="cancel-btn" onClick={onClose} aria-label="Close player">✕</button>
        </div>

        {status === 'loading' && <div className="empty">Loading video…</div>}

        {status === 'ready' && src && (
          <video
            ref={videoRef}
            src={src}
            controls
            autoPlay
            playsInline
            style={{ width: '100%', maxHeight: '70vh', background: '#000', borderRadius: 8 }}
          >
            Your browser doesn't support HTML5 video.
          </video>
        )}

        {status === 'missing' && (
          <div className="empty">
            Video file not available on this device. Ask the admin to re-upload, or open the app on the device where it was uploaded.
          </div>
        )}

        {status === 'error' && <div className="empty">Could not load video.</div>}
      </div>
    </div>
  );
}
