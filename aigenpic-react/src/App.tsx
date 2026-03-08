import { useState } from 'react';
import { Image, Sparkles, LogOut } from 'lucide-react';
import SplashScreen from './components/SplashScreen';
import Generator from './components/Generator';
import Gallery from './components/Gallery';
import type { User } from './types';
import './App.css';

type Tab = 'generate' | 'gallery';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<Tab>('generate');
  const [galleryKey, setGalleryKey] = useState(0);
  const [generatorKey, setGeneratorKey] = useState(0);
  const [initialPrompt, setInitialPrompt] = useState('');

  const handleLogin = (username: string, pin: string) => setUser({ username, pin });

  const handleLogout = () => {
    localStorage.removeItem('aigenpic_username');
    localStorage.removeItem('aigenpic_pin');
    setUser(null);
  };

  const handleUsePrompt = (prompt: string) => {
    setInitialPrompt(prompt);
    setGeneratorKey(k => k + 1);
    setTab('generate');
  };

  if (!user) return <SplashScreen onLogin={handleLogin} />;

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <div style={styles.logo}>🎨 <span style={styles.logoText}>Генератор ИИ изображений</span></div>
          <div style={styles.userInfo}>
            <span style={styles.username}>👤 {user.username}</span>
            <button style={styles.logoutBtn} onClick={handleLogout} title="Выйти">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <div style={styles.tabsOuter}>
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(tab === 'generate' ? styles.tabActive : {}) }}
            onClick={() => setTab('generate')}
          >
            <Sparkles size={16} /> ИИ генератор
          </button>
          <button
            style={{ ...styles.tab, ...(tab === 'gallery' ? styles.tabActive : {}) }}
            onClick={() => { setTab('gallery'); setGalleryKey(k => k + 1); }}
          >
            <Image size={16} /> Галерея
          </button>
        </div>
      </div>

      <main style={styles.main}>
        <div style={{ display: tab === 'generate' ? 'block' : 'none' }}>
          <Generator key={generatorKey} user={user} onGenerated={() => setGalleryKey(k => k + 1)} initialPrompt={initialPrompt} />
        </div>
        <div style={{ display: tab === 'gallery' ? 'block' : 'none' }}>
          <Gallery key={galleryKey} user={user} onUsePrompt={handleUsePrompt} />
        </div>
      </main>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: { minHeight: '100vh', background: '#f8f5ff' },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  headerInner: {
    maxWidth: 900, margin: '0 auto', padding: '0 20px', height: 56,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 20 },
  logoText: { fontWeight: 700, letterSpacing: '-0.5px' },
  userInfo: { display: 'flex', alignItems: 'center', gap: 12 },
  username: { fontSize: '0.9em', opacity: 0.9 },
  logoutBtn: {
    background: 'rgba(255,255,255,0.2)', border: 'none',
    color: 'white', borderRadius: 8, padding: '6px 8px',
    cursor: 'pointer', display: 'flex', alignItems: 'center',
  },
  tabsOuter: { background: 'white', borderBottom: '2px solid #e8e0ff' },
  tabs: { maxWidth: 900, margin: '0 auto', padding: '0 20px', display: 'flex' },
  tab: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '14px 20px', background: 'none', border: 'none',
    color: '#888', fontSize: 15, cursor: 'pointer',
    borderBottom: '2px solid transparent', marginBottom: -2,
  },
  tabActive: { color: '#764ba2', borderBottom: '2px solid #764ba2', fontWeight: 600 },
  main: { maxWidth: 900, margin: '0 auto', padding: '20px' },
};
