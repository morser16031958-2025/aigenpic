import { useState, useEffect } from 'react';
import { Trash2, ZoomIn, Copy, RefreshCw } from 'lucide-react';
import * as api from '../api/client';
import type { User, ImageItem } from '../types';

interface Props { user: User; onUsePrompt?: (prompt: string) => void; }

interface ImageItemExt extends ImageItem {
  prompt?: string;
}

export default function Gallery({ user, onUsePrompt }: Props) {
  const [images, setImages] = useState<ImageItemExt[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ImageItemExt | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.getImages(user.username, user.pin);
        if (res.images) setImages(res.images || []);
      } finally { setLoading(false); }
    };
    load();
  }, [user.username, user.pin]);

  const remove = async (img: ImageItemExt) => {
    if (!confirm(`Удалить ${img.filename}?`)) return;
    await api.deleteImage(user.username, img.filename, user.pin);
    setImages(imgs => imgs.filter(i => i.filename !== img.filename));
    if (modal?.filename === img.filename) setModal(null);
  };

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const usePrompt = (prompt: string) => {
    if (onUsePrompt) {
      onUsePrompt(prompt);
    }
    setModal(null);
  };

  if (loading) return <div style={styles.center}>Загружаю галерею...</div>;
  if (!images.length) return <div style={styles.center}>Галерея пуста — сгенерируйте первое изображение!</div>;

  return (
    <div>
      <div style={styles.grid}>
        {images.map(img => (
          <div key={img.filename} style={styles.item}>
            <img src={img.url} alt={img.prompt} style={styles.thumb} onClick={() => setModal(img)} />
            <div style={styles.footer}>
              <button style={styles.iconBtn} onClick={() => setModal(img)}><ZoomIn size={14} /></button>
              <button style={{ ...styles.iconBtn, color: '#e33' }} onClick={() => remove(img)}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {modal && (
        <div style={styles.overlay} onClick={() => setModal(null)}>
          <div style={styles.modalBox} onClick={e => e.stopPropagation()}>
            <img src={modal.url} alt={modal.prompt} style={styles.modalImg} />
            <p style={styles.modalPrompt}>{modal.prompt}</p>
            <div style={styles.modalActions}>
              <button style={styles.actionBtn} onClick={() => copyPrompt(modal.prompt || '')}>
                <Copy size={14} /> {copied ? 'Скопировано!' : 'Копировать'}
              </button>
              <button style={styles.actionBtnPrimary} onClick={() => usePrompt(modal.prompt || '')}>
                <RefreshCw size={14} /> Использовать
              </button>
              <button style={styles.deleteBtn} onClick={() => remove(modal)}><Trash2 size={14} /> Удалить</button>
              <button style={styles.closeBtn} onClick={() => setModal(null)}>Закрыть</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  center: { textAlign: 'center', color: '#888', padding: 40 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 },
  item: { borderRadius: 12, overflow: 'hidden', border: '2px solid #f0e8ff', background: 'white' },
  thumb: { width: '100%', aspectRatio: '1', objectFit: 'cover', cursor: 'pointer', display: 'block' },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: 4, padding: '6px 8px', background: '#faf7ff' },
  iconBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#764ba2', padding: 4, display: 'flex' },
  overlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
  },
  modalBox: {
    background: 'white', borderRadius: 16, overflow: 'hidden',
    maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
  },
  modalImg: { maxWidth: '80vw', maxHeight: '70vh', objectFit: 'contain', display: 'block' },
  modalPrompt: { padding: '12px 16px', fontSize: '0.9em', color: '#555', margin: 0 },
  modalActions: { display: 'flex', gap: 8, padding: '8px 16px 16px', flexWrap: 'wrap' },
  actionBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', background: '#f0f0f0', color: '#333',
    border: '1px solid #ddd', borderRadius: 8, cursor: 'pointer', fontSize: 14,
  },
  actionBtnPrimary: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', background: '#764ba2', color: 'white',
    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
  },
  deleteBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '8px 16px', background: '#fee', color: '#c33',
    border: '1px solid #fcc', borderRadius: 8, cursor: 'pointer', fontSize: 14,
  },
  closeBtn: {
    flex: 1, padding: '8px 16px', background: '#764ba2', color: 'white',
    border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14,
  },
};
