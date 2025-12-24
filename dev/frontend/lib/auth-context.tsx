'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, LoginCredentials } from '@/types/auth';
import { authService } from './auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      const savedUser = authService.getUser();

      if (token && savedUser) {
        try {
          const currentUser = await authService.getMe();
          setUser(currentUser);
          authService.saveUser(currentUser);

          if (currentUser.mustChangePassword) {
            router.push('/change-password');
          }
        } catch (error) {
          authService.removeToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      authService.saveToken(response.access_token);
      authService.saveUser(response.user);
      setUser(response.user);

      if (response.user.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    authService.removeToken();
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
