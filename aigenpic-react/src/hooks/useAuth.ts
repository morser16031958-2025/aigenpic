import { useState, useCallback } from 'react';
import * as api from '../api/client';
import type { User } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback(async (username: string, pin: string) => {
    const res = await api.login(username, pin);
    if (res.ok) {
      localStorage.setItem('aigenpic_username', username);
      localStorage.setItem('aigenpic_pin', pin);
      setUser({ username, pin });
    }
    return res;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('aigenpic_username');
    localStorage.removeItem('aigenpic_pin');
    setUser(null);
  }, []);

  return { user, login, logout };
}
