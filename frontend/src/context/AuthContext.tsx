'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '@/types/route53';
import { api } from '@/lib/api';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (username?: string, role?: string, accountId?: string) => Promise<void>;
  logout: () => void;
  switchAccount: (accountId: string, accountAlias: string, role: string) => Promise<void>;
}

const defaultMockUser: UserProfile = {
  username: 'admin',
  role_arn: 'arn:aws:iam::123456789012:role/AdministratorAccess',
  account_id: '123456789012',
  account_alias: 'production-main',
  region: 'global',
  token: 'mock-jwt-session-token'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(defaultMockUser);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    // Try to load cached user from localStorage or API
    const cached = localStorage.getItem('aws_r53_user');
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        setUser(defaultMockUser);
      }
    }
  }, []);

  const login = async (username = 'admin', role = 'AdministratorAccess', accountId = '123456789012') => {
    setLoading(true);
    try {
      const loggedUser = await api.login(username, role, accountId);
      setUser(loggedUser);
      localStorage.setItem('aws_r53_user', JSON.stringify(loggedUser));
    } catch {
      const mock: UserProfile = {
        username,
        role_arn: `arn:aws:iam::${accountId}:role/${role}`,
        account_id: accountId,
        account_alias: accountId === '123456789012' ? 'production-main' : 'staging-env',
        region: 'global',
        token: 'mock-session'
      };
      setUser(mock);
      localStorage.setItem('aws_r53_user', JSON.stringify(mock));
    } finally {
      setLoading(false);
    }
  };

  const switchAccount = async (accountId: string, accountAlias: string, role: string) => {
    setLoading(true);
    try {
      const switched = await api.switchAccount(accountId, accountAlias, role);
      setUser(switched);
      localStorage.setItem('aws_r53_user', JSON.stringify(switched));
    } catch {
      if (user) {
        const updated = {
          ...user,
          account_id: accountId,
          account_alias: accountAlias,
          role_arn: `arn:aws:iam::${accountId}:role/${role}`
        };
        setUser(updated);
        localStorage.setItem('aws_r53_user', JSON.stringify(updated));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('aws_r53_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, switchAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
