'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { useDayflowData } from './DayflowDataProvider';
import { Sidebar, Icon } from '@/dayflow-prototype.jsx';

interface AppLayoutProps {
  activeTab: string;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ activeTab, children }) => {
  const { user, role, logout } = useAuth();
  const { me, loading } = useDayflowData();
  const router = useRouter();

  if (loading) {
    return (
      <div className="df-app" style={{ padding: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink-soft)' }}>
          Loading Dayflow HRMS...
        </div>
      </div>
    );
  }

  const adminNav = [
    { id: 'dashboard', label: 'Dashboard', icon: Icon.dashboard, path: '/admin/dashboard' },
    { id: 'employees', label: 'Employees', icon: Icon.users, path: '/admin/employees' },
    { id: 'timeoff', label: 'Time Off', icon: Icon.calendar, path: '/admin/timeoff' },
    { id: 'payroll', label: 'Payroll', icon: Icon.wallet, path: '/admin/payroll' },
    { id: 'analytics', label: 'Analytics', icon: Icon.chart, path: '/admin/analytics' },
  ];

  const employeeNav = [
    { id: 'dashboard', label: 'Dashboard', icon: Icon.dashboard, path: '/dashboard' },
    { id: 'attendance', label: 'Attendance', icon: Icon.clock, path: '/attendance' },
    { id: 'timeoff', label: 'Time Off', icon: Icon.calendar, path: '/timeoff' },
    { id: 'payroll', label: 'Payroll', icon: Icon.wallet, path: '/payroll' },
  ];

  const nav = role === 'admin' ? adminNav : employeeNav;

  const handleSetPage = (id: string) => {
    const item = nav.find(n => n.id === id);
    if (item) {
      router.push(item.path);
    }
  };

  const displayName = me ? me.name : (user?.email?.split('@')[0] || 'User');
  const roleLabel = role === 'admin' ? 'Admin / HR' : 'Employee';

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar
        nav={nav}
        page={activeTab}
        setPage={handleSetPage}
        title="Dayflow"
        roleLabel={roleLabel}
        name={displayName}
        onLogout={logout}
      />
      <div style={{ flex: 1, minWidth: 0, padding: '28px 34px', maxHeight: '100vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
};
