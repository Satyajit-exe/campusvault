import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('cv_token') || null);
  const [loading, setLoading] = useState(true);

  // Verify active session on load
  useEffect(() => {
    async function loadUser() {
      try {
        if (token) {
          const res = await api.me();
          if (res && res.user) {
            setUser(res.user);
          } else {
            setUser(null);
            setToken(null);
            localStorage.removeItem('cv_token');
          }
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err.message);
        setUser(null);
        setToken(null);
        localStorage.removeItem('cv_token');
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.token) {
      localStorage.setItem('cv_token', res.token);
      setToken(res.token);
    }
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.token) {
      localStorage.setItem('cv_token', res.token);
      setToken(res.token);
    }
    if (res.user) {
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      // Continue client cleanup even if network fails
    } finally {
      localStorage.removeItem('cv_token');
      setToken(null);
      setUser(null);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isContributor = user?.role === 'CONTRIBUTOR' || user?.role === 'ADMIN';
  const isStudent = !!user;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isContributor,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
