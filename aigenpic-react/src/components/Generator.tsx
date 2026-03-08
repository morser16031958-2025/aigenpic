import { useState, useRef, useEffect } from 'react';
import { Sparkles, Download, X } from 'lucide-react';
import * as api from '../api/client';
import type { User } from '../types';

interface Props { user: User; onGenerated?: () => void; initialPrompt?: string; }

export default function Generator({ user, onGenerated, initialPrompt = '' }: Props) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setPrompt(initialPrompt);
    }
  }, [initialPrompt]);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const generate = async () => {
    if (!prompt.trim()) { setError('Введите описание изображения'); return; }
    setError(''); setImageUrl(null); setLoading(true); startTimer();
    try {
      const res = await api.generateImage(prompt, user.username, user.pin);
      if (res.savedImage) {
        setImageUrl(res.savedImage.url);
        setFilename(res.savedImage.filename);
        onGenerated?.();
      } else setError('Ошибка генерации');
    } catch { setError('⚠️ Нет связи с сервером'); }
    finally { setLoading(false); stopTimer(); }
  };

  const download = () => {
    if (!imageUrl || !filename) return;
    const a = document.createElement('a');
    a.href = imageUrl; a.download = filename; a.click();
  };

  const closeModal = () => setImageUrl(null);

  return (
    <div style={styles.wrap}>
      <div style={styles.promptArea}>
        <textarea
          value={prompt}
          onChange={e => { setPrompt(e.target.value); setError(''); }}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); } }}
          placeholder="Введите ваш текстовый запрос"
          style={styles.textarea}
          rows={4}
        />
        <button style={{ ...styles.genBtn, opacity: loading ? 0.7 : 1 }} onClick={generate} disabled={loading}>
          <Sparkles size={18} />
          {loading ? `${elapsed}с...` : 'Генерировать'}
        </button>
      </div>

      {error && <p style={styles.err}>{error}</p>}

      {loading && (
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>Создаю изображение... {elapsed}с</p>
        </div>
      )}

      {imageUrl && !loading && (
        <div style={styles.overlay} onClick={closeModal}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <button style={styles.closeBtn} onClick={closeModal}><X size={20} /></button>
            <img src={imageUrl} alt={prompt} style={styles.modalImg} />
            <p style={styles.modalPrompt}>{prompt}</p>
            <div style={styles.modalActions}>
              <button style={styles.downloadBtn} onClick={download}>
                <Download size={16} /> Скачать
              </button>
              <button style={styles.okBtn} onClick={closeModal}>OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: { padding: '20px 0' },
  promptArea: { display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 },
  textarea: {
    width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: 12,
    fontSize: 15, fontFamily: 'inherit', resize: 'none', outline: 'none',
    lineHeight: 1.5, boxSizing: 'border-box',
  } as React.CSSProperties,
  genBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', padding: '14px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white', border: 'none', borderRadius: 12,
    fontSize: 16, fontWeight: 600, cursor: 'pointer',
  },
  err: { color: '#e33', fontSize: '0.9em', textAlign: 'center', margin: '0 0 12px' },
  loadingBox: { textAlign: 'center', padding: 60 },
  spinner: {
    width: 56, height: 56, margin: '0 auto 20px',
    border: '4px solid #e0e0e0', borderTop: '4px solid #764ba2',
    borderRadius: '50%', animation: 'spin 1s linear infinite',
  },
  loadingText: { color: '#888', fontSize: '1em' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: 16,
  },
  modal: {
    background: 'white', borderRadius: 20, overflow: 'hidden',
    maxWidth: 560, width: '100%', maxHeight: '90vh',
    display: 'flex', flexDirection: 'column', position: 'relative' as const,
  },
  closeBtn: {
    position: 'absolute' as const, top: 12, right: 12, zIndex: 1,
    background: 'rgba(0,0,0,0.4)', border: 'none', color: 'white',
    borderRadius: '50%', width: 36, height: 36,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  modalImg: { width: '100%', display: 'block', maxHeight: '65vh', objectFit: 'contain' as const, background: '#f8f5ff' },
  modalPrompt: { padding: '12px 16px 8px', fontSize: '0.85em', color: '#666', margin: 0 },
  modalActions: { display: 'flex', gap: 10, padding: '12px 16px 20px' },
  downloadBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '12px', background: 'white', color: '#764ba2',
    border: '2px solid #764ba2', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
  okBtn: {
    flex: 1, padding: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white', border: 'none', borderRadius: 12,
    fontSize: 15, fontWeight: 600, cursor: 'pointer',
  },
};
