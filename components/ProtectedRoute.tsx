'use client';

import React, { useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { useRouter, usePathname } from 'next/navigation';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'employee')[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Inject loader keyframes if they don't exist
    if (typeof document !== 'undefined' && !document.getElementById('spinner-keyframes')) {
      const style = document.createElement('style');
      style.id = 'spinner-keyframes';
      style.innerHTML = `@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    // 1. Unauthenticated users visiting protected pages -> Redirect to /login
    if (!user && pathname !== '/login') {
      router.replace('/login');
      return;
    }

    // 2. Authenticated users visiting /login -> Redirect to their target home dashboard
    if (user && pathname === '/login') {
      if (role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
      return;
    }

    // 3. Authenticated but unauthorized role visiting role-specific routes -> Redirect to own dashboard
    if (user && allowedRoles && role && !allowedRoles.includes(role)) {
      if (role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [user, role, loading, pathname, router, allowedRoles]);

  // Loading state with visual loader (prevents protected content flash)
  if (loading) {
    return (
      <div style={loadingContainerStyle}>
        <div style={spinnerStyle}></div>
        <p style={{ marginTop: '16px', fontFamily: 'sans-serif', color: '#666', fontSize: '14px' }}>
          Loading Dayflow HRMS...
        </p>
      </div>
    );
  }

  // Prevent rendering children if unauthorized
  if (!user && pathname !== '/login') {
    return null;
  }
  if (user && allowedRoles && role && !allowedRoles.includes(role)) {
    return null;
  }

  return <>{children}</>;
};

// Inline helper styles
const loadingContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  width: '100vw',
  backgroundColor: '#f9f9f9',
};

const spinnerStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  border: '4px solid rgba(0,0,0,0.1)',
  borderTop: '4px solid #3b82f6',
  borderRadius: '50%',
  animation: 'spin 1s linear infinite',
};
