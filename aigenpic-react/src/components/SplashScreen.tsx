import { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import * as api from '../api/client';
import type { SplashStep } from '../types';

interface Props {
  onLogin: (username: string, pin: string) => void;
}

export default function SplashScreen({ onLogin }: Props) {
  const [step, setStep] = useState<SplashStep>('code');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [showPin, setShowPin] = useState(true);

  const codeRef      = useRef<HTMLInputElement>(null);
  const usernameRef  = useRef<HTMLInputElement>(null);
  const pinRef       = useRef<HTMLInputElement>(null);
  const pinNewRef    = useRef<HTMLInputElement>(null);
  const resetCodeRef = useRef<HTMLInputElement>(null);
  const resetPinRef  = useRef<HTMLInputElement>(null);
  const usernameStore = useRef('');

  useEffect(() => { setTimeout(() => codeRef.current?.focus(), 300); }, []);

  const clearError = () => setError('');

  const handleCheckCode = async () => {
    const code = codeRef.current?.value.trim() || '';
    if (!code) { setError('Введите код доступа'); return; }
    try {
      const res = await api.checkCode(code);
      if (res.ok) {
        const savedUser = localStorage.getItem('aigenpic_username');
        const savedPin  = localStorage.getItem('aigenpic_pin');
        if (savedUser && savedPin) {
          const r2 = await api.login(savedUser, savedPin);
          if (r2.ok) { onLogin(savedUser, savedPin); return; }
          localStorage.removeItem('aigenpic_username');
          localStorage.removeItem('aigenpic_pin');
        }
        setStep('username');
        setTimeout(() => usernameRef.current?.focus(), 100);
      } else {
        if (codeRef.current) codeRef.current.value = '';
        setError('❌ Вы ошиблись. Повторите');
        setTimeout(() => codeRef.current?.focus(), 100);
      }
    } catch { setError('⚠️ Вы ошиблись. Повторите'); }
  };

  const handleCheckUsername = async () => {
    const username = usernameRef.current?.value.trim() || '';
    if (username.length < 2) { setError('Псевдоним минимум 2 символа'); return; }
    try {
      const res = await api.checkUsername(username);
      usernameStore.current = username;
      if (res.exists) {
        setInfo(`Привет, ${username}! Введите PIN`);
        setStep('pin');
        setTimeout(() => pinRef.current?.focus(), 100);
      } else {
        setInfo(`Создаём аккаунт для ${username}`);
        setStep('pin-new');
        setTimeout(() => pinNewRef.current?.focus(), 100);
      }
    } catch { setError('⚠️ Вы ошиблись. Повторите'); }
  };

  const handleLogin = async () => {
    const pin = pinRef.current?.value || '';
    if (pin.length !== 4) { setError('PIN — 4 цифры'); return; }
    try {
      const res = await api.login(usernameStore.current, pin);
      if (res.ok) {
        localStorage.setItem('aigenpic_username', usernameStore.current);
        localStorage.setItem('aigenpic_pin', pin);
        onLogin(usernameStore.current, pin);
      } else {
        if (pinRef.current) pinRef.current.value = '';
        setError('❌ Вы ошиблись. Повторите');
        setTimeout(() => pinRef.current?.focus(), 100);
      }
    } catch { setError('⚠️ Вы ошиблись. Повторите'); }
  };

  const handleRegister = async () => {
    const pin = pinNewRef.current?.value || '';
    if (pin.length !== 4) { setError('PIN — 4 цифры'); return; }
    try {
      const res = await api.register(usernameStore.current, pin);
      if (res.ok) {
        localStorage.setItem('aigenpic_username', usernameStore.current);
        localStorage.setItem('aigenpic_pin', pin);
        onLogin(usernameStore.current, pin);
      } else {
        setError(res.error || 'Ошибка регистрации');
      }
    } catch { setError('⚠️ Вы ошиблись. Повторите'); }
  };

  const handleResetPin = async () => {
    const code   = resetCodeRef.current?.value.trim() || '';
    const newPin = resetPinRef.current?.value || '';
    if (!code) { setError('Введите код доступа'); return; }
    if (newPin.length !== 4) { setError('PIN — 4 цифры'); return; }
    try {
      const res = await api.resetPin(usernameStore.current, code, newPin);
      if (res.ok) {
        localStorage.setItem('aigenpic_username', usernameStore.current);
        localStorage.setItem('aigenpic_pin', newPin);
        onLogin(usernameStore.current, newPin);
      } else {
        setError(res.error || 'Ошибка сброса PIN');
      }
    } catch { setError('⚠️ Вы ошиблись. Повторите'); }
  };

  const onKey = (e: React.KeyboardEvent, fn: () => void) => {
    if (e.key === 'Enter') fn();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.banner}>
          <img src="/splash.jpg" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 20%', display: 'block' }} />
        </div>
        <div style={styles.body}>
          <h1 style={styles.title}>🎨 Генератор ИИ изображений</h1>

          {step === 'code' && (
            <div>
              <p style={styles.subtitle}>Введите код доступа для входа</p>
              <div style={styles.inputWrap}>
                <input ref={codeRef} type={showPin ? 'text' : 'password'}
                  placeholder="Код доступа" maxLength={20}
                  style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
                  onChange={clearError}
                  onKeyDown={e => onKey(e, handleCheckCode)} />
                <button style={styles.eye} onClick={() => setShowPin(p => !p)}>
                  {showPin ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {error && <p style={styles.err}>{error}</p>}
              <button style={styles.btn} onClick={handleCheckCode}>Войти →</button>
              <div style={styles.flowers}>🌷🌸🌼🌸🌷</div>
            </div>
          )}

          {step === 'username' && (
            <div>
              <p style={styles.subtitle}>Ваш псевдоним для сохранения коллекции</p>
              <div style={styles.inputWrap}>
                <input ref={usernameRef} type="text"
                  placeholder="Ваш псевдоним" maxLength={30}
                  style={{ ...styles.input, letterSpacing: 0, ...(error ? styles.inputError : {}) }}
                  onChange={clearError}
                  onKeyDown={e => onKey(e, handleCheckUsername)} />
              </div>
              {error && <p style={styles.err}>{error}</p>}
              <button style={styles.btn} onClick={handleCheckUsername}>Далее →</button>
            </div>
          )}

          {step === 'pin' && (
            <div>
              {info && <p style={styles.infoMsg}>{info}</p>}
              <div style={styles.inputWrap}>
                <input ref={pinRef} type="text" inputMode="numeric" pattern="\d*"
                  placeholder="4-значный PIN"
                  style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
                  onChange={e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); clearError(); }}
                  onKeyDown={e => onKey(e, handleLogin)} />
              </div>
              {error && <p style={styles.err}>{error}</p>}
              <button style={styles.btn} onClick={handleLogin}>Войти →</button>
              <button style={styles.linkBtn} onClick={() => {
                clearError();
                setStep('reset-pin');
                setTimeout(() => resetCodeRef.current?.focus(), 100);
              }}>Забыли PIN?</button>
            </div>
          )}

          {step === 'pin-new' && (
            <div>
              {info && <p style={styles.infoMsg}>{info}</p>}
              <div style={styles.inputWrap}>
                <input ref={pinNewRef} type="text" inputMode="numeric" pattern="\d*"
                  placeholder="Придумайте 4-значный PIN"
                  style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
                  onChange={e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); clearError(); }}
                  onKeyDown={e => onKey(e, handleRegister)} />
              </div>
              {error && <p style={styles.err}>{error}</p>}
              <button style={styles.btn} onClick={handleRegister}>Создать аккаунт →</button>
            </div>
          )}

          {step === 'reset-pin' && (
            <div>
              <p style={styles.subtitle}>Сброс PIN для <b>{usernameStore.current}</b></p>
              <div style={styles.inputWrap}>
                <input ref={resetCodeRef} type="password"
                  placeholder="Код доступа" maxLength={20}
                  style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
                  onChange={clearError} />
              </div>
              <div style={{ ...styles.inputWrap, marginTop: 8 }}>
                <input ref={resetPinRef} type="text" inputMode="numeric" pattern="\d*"
                  placeholder="Новый PIN"
                  style={{ ...styles.input, ...(error ? styles.inputError : {}) }}
                  onChange={e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); clearError(); }}
                  onKeyDown={e => onKey(e, handleResetPin)} />
              </div>
              {error && <p style={styles.err}>{error}</p>}
              <button style={styles.btn} onClick={handleResetPin}>Сбросить PIN →</button>
              <button style={styles.linkBtn} onClick={() => { clearError(); setStep('pin'); }}>← Назад</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'linear-gradient(135deg, #1a0533 0%, #3d1060 50%, #6b1e8f 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  card: {
    background: 'white', borderRadius: 24,
    boxShadow: '0 30px 80px rgba(0,0,0,0.5)',
    width: 440, maxWidth: '96vw', maxHeight: '96vh',
    overflow: 'hidden', display: 'flex', flexDirection: 'column',
  },
  banner: {
    height: 260, flexShrink: 0, overflow: 'hidden', position: 'relative' as const,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  body: { padding: '28px 30px 32px', overflowY: 'auto' },
  title: { textAlign: 'center', fontSize: '1.4em', fontWeight: 700, color: '#333', marginBottom: 4, marginTop: 0 },
  subtitle: { textAlign: 'center', fontSize: '0.85em', color: '#888', marginBottom: 20, lineHeight: 1.4 },
  infoMsg: { textAlign: 'center', color: '#764ba2', fontSize: '0.85em', marginBottom: 12 },
  inputWrap: { position: 'relative', marginBottom: 10 },
  input: {
    width: '100%', boxSizing: 'border-box',
    padding: '13px 46px 13px 16px',
    border: '2px solid #e0e0e0', borderRadius: 12,
    fontSize: 16, letterSpacing: 2, textAlign: 'center',
    outline: 'none', fontFamily: 'inherit',
  } as React.CSSProperties,
  inputError: { borderColor: '#e33', boxShadow: '0 0 0 3px rgba(220,50,50,0.15)' },
  eye: {
    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, padding: 0,
    display: 'flex', alignItems: 'center',
  },
  err: { textAlign: 'center', color: '#e33', fontSize: '0.88em', fontWeight: 600, margin: '0 0 10px' },
  btn: {
    width: '100%', padding: '13px', marginBottom: 8,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white', border: 'none', borderRadius: 12,
    fontSize: 16, fontWeight: 600, cursor: 'pointer',
  },
  linkBtn: {
    width: '100%', padding: '8px',
    background: 'none', border: 'none', color: '#764ba2',
    fontSize: '0.9em', cursor: 'pointer', textDecoration: 'underline',
  },
  flowers: { textAlign: 'center', fontSize: 20, marginTop: 12 },
};
