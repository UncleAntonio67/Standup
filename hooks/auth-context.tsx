import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type AuthUser = {
  id: string;
  username: string;
  createdAt: string;
};

type AuthRecord = AuthUser & {
  password: string;
};

type AuthContextValue = {
  loading: boolean;
  user: AuthUser | null;
  register: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  login: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
};

const AUTH_USERS_KEY = 'BIOMECH_AUTH_USERS_V1';
const AUTH_SESSION_KEY = 'BIOMECH_AUTH_SESSION_V1';

const AuthContext = createContext<AuthContextValue | null>(null);

const normalizeUsername = (value: string) => value.trim().toLowerCase();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(AUTH_SESSION_KEY);
        if (!raw) {
          setUser(null);
          return;
        }
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed?.id && parsed?.username) {
          setUser(parsed);
        }
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const getUsers = useCallback(async (): Promise<AuthRecord[]> => {
    const raw = await AsyncStorage.getItem(AUTH_USERS_KEY);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, []);

  const register = useCallback(async (username: string, password: string) => {
    const normalized = normalizeUsername(username);
    const safeName = username.trim();

    if (normalized.length < 3) {
      return { ok: false, message: '用户名至少 3 位。' };
    }
    if (password.length < 6) {
      return { ok: false, message: '密码至少 6 位。' };
    }

    const users = await getUsers();
    const exists = users.some((item) => normalizeUsername(item.username) === normalized);
    if (exists) {
      return { ok: false, message: '用户名已存在。' };
    }

    const now = new Date().toISOString();
    const record: AuthRecord = {
      id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      username: safeName,
      password,
      createdAt: now,
    };

    const nextUsers = [...users, record];
    const session: AuthUser = {
      id: record.id,
      username: record.username,
      createdAt: record.createdAt,
    };

    await AsyncStorage.multiSet([
      [AUTH_USERS_KEY, JSON.stringify(nextUsers)],
      [AUTH_SESSION_KEY, JSON.stringify(session)],
    ]);
    setUser(session);

    return { ok: true };
  }, [getUsers]);

  const login = useCallback(async (username: string, password: string) => {
    const normalized = normalizeUsername(username);
    const users = await getUsers();
    const matched = users.find((item) => normalizeUsername(item.username) === normalized);

    if (!matched || matched.password !== password) {
      return { ok: false, message: '用户名或密码错误。' };
    }

    const session: AuthUser = {
      id: matched.id,
      username: matched.username,
      createdAt: matched.createdAt,
    };

    await AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    setUser(session);

    return { ok: true };
  }, [getUsers]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      user,
      register,
      login,
      logout,
    }),
    [loading, user, register, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
}

