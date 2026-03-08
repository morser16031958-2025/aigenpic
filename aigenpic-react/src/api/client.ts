import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

export const checkCode = (code: string) =>
  api.post<{ ok: boolean }>('/check-code', { code }).then(r => r.data);

export const checkUsername = (username: string) =>
  api.post<{ ok: boolean; exists: boolean }>('/check-username', { username }).then(r => r.data);

export const login = (username: string, pin: string) =>
  api.post<{ ok: boolean; error?: string }>('/login', { username, pin: String(pin) }).then(r => r.data);

export const register = (username: string, pin: string) =>
  api.post<{ ok: boolean; error?: string }>('/register', { username, pin: String(pin) }).then(r => r.data);

export const resetPin = (username: string, code: string, newPin: string) =>
  api.post<{ ok: boolean; error?: string }>('/reset-pin', { username, code, newPin: String(newPin) }).then(r => r.data);

export const generateImage = (prompt: string, username: string, pin: string) =>
  api.post<{ ok?: boolean; savedImage: { url: string; filename: string } }>(
    '/generate-image',
    { prompt, provider: 'routerai_flux', username, pin }
  ).then(r => r.data);

export const getImages = (username: string, pin: string) =>
  api.get<{ ok: boolean; images: any[] }>(
    `/images?username=${encodeURIComponent(username)}&pin=${encodeURIComponent(pin)}`
  ).then(r => r.data);

export const deleteImage = (username: string, filename: string, pin: string) =>
  api.delete(
    `/images/${encodeURIComponent(username)}/${encodeURIComponent(filename)}`,
    { data: { pin } }
  ).then(r => r.data);
