'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, logout as apiLogout } from '../lib/dayflow-api';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: any | null;
  role: 'admin' | 'employee' | null;
  loading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [role, setRole] = useState<'admin' | 'employee' | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const { data, error } = await getCurrentUser();
      if (data && data.profile) {
        setUser(data.session.user);
        setRole(data.profile.role);
      } else {
        setUser(null);
        setRole(null);
      }
    } catch (err) {
      console.error('Error fetching user auth status:', err);
      setUser(null);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        fetchUser();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    await apiLogout();
    setUser(null);
    setRole(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, refresh: fetchUser, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
