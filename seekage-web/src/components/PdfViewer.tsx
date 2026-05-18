import React, { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { BASE_URL } from '../utils/api';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

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

function shouldSendAuthHeader(fileUrl: string) {
  return !/^https?:\/\//i.test(fileUrl) || fileUrl.startsWith(API_ORIGIN);
}

export default function PdfViewer({ contentId, title, fileName, fileUrl, token, onClose }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | 'error'>('loading');
  const createdUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setSrc(null);
    setNumPages(0);

    if (createdUrlRef.current) {
      URL.revokeObjectURL(createdUrlRef.current);
      createdUrlRef.current = null;
    }

    (async () => {
      try {
        if (!fileUrl) {
          setStatus('missing');
          return;
        }

        const resolvedUrl = resolveFileUrl(fileUrl);

        if (token && shouldSendAuthHeader(fileUrl)) {
          const response = await fetch(resolvedUrl, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!response.ok) {
            throw new Error('Unable to load PDF file');
          }

          const blob = await response.blob();
          if (cancelled) return;

          const url = URL.createObjectURL(blob);
          createdUrlRef.current = url;
          setSrc(url);
          setStatus('ready');
          return;
        }

        setSrc(resolvedUrl);
        setStatus('ready');
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
      <div className="pdf-viewer-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pdf-viewer-header">
          <div>
            <div className="pdf-viewer-title">{title}</div>
            <div className="pdf-viewer-subtitle">{fileName}</div>
          </div>
          <button className="cancel-btn pdf-close-btn" onClick={onClose} aria-label="Close PDF">
            x
          </button>
        </div>

        {status === 'loading' && <div className="empty">Loading PDF...</div>}

        {status === 'ready' && src && (
          <div className="pdf-pages">
            <Document
              file={src}
              onLoadSuccess={({ numPages: loadedPages }) => setNumPages(loadedPages)}
              onLoadError={() => setStatus('error')}
              loading={<div className="empty">Preparing PDF...</div>}
            >
              {Array.from({ length: numPages }, (_, index) => (
                <Page
                  key={`page_${index + 1}`}
                  pageNumber={index + 1}
                  width={Math.min(window.innerWidth - 64, 760)}
                />
              ))}
            </Document>
          </div>
        )}

        {status === 'missing' && <div className="empty">PDF file is not available.</div>}
        {status === 'error' && <div className="empty">Could not load PDF.</div>}
      </div>
    </div>
  );
}
