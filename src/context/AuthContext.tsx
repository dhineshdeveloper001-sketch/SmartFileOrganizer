'use client';

import React, { createContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/lib/api';

interface User {
  username: string;
  role: string;
}

interface LoginResponse {
  accessToken: string;
  username: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
});

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setUser(null);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeJwtPayload(token);
      if (decoded) {
        const exp = decoded.exp as number;
        if (exp * 1000 < Date.now()) {
          logout();
        } else {
          const storedRole = localStorage.getItem('role') || 'ROLE_USER';
          setUser({ username: decoded.sub as string, role: storedRole });
        }
      } else {
        logout();
      }
    }
    setLoading(false);
  }, [logout]);

  const login = async (username: string, password: string) => {
    const response = await api.post<LoginResponse>('/auth/login', { username, password });
    localStorage.setItem('token', response.accessToken);
    localStorage.setItem('role', response.role || 'ROLE_USER');
    setUser({ username: response.username, role: response.role || 'ROLE_USER' });
  };

  const register = async (username: string, password: string) => {
    await api.post('/auth/register', { username, password });
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
