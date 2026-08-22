'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar } from '@/components/SharedAtoms';

export default function AdminDashboard() {
  const { user, role, logout } = useAuth();
  const userName = user?.email?.split('@')[0] || 'Admin';

  return (
    <div style={{ padding: 40, maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={userName} size={48} />
          <div>
            <h1 className="df-display" style={{ fontSize: 28, margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Admin Console</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Logged in as <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{user?.email}</span> ({role})
            </p>
          </div>
        </div>
        <button
          onClick={logout}
          className="df-btn df-btn-ghost"
        >
          Sign Out
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24, marginTop: 32 }}>
        <div className="df-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 className="df-display" style={{ fontSize: 18, margin: '0 0 8px', fontWeight: 600 }}>Employees Directory</h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Onboard new employees, view existing profiles, configure jobs, and assign departments.
            </p>
          </div>
          <a href="/admin/employees" className="df-btn df-btn-primary" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
            Manage Employees
          </a>
        </div>

        <div className="df-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 className="df-display" style={{ fontSize: 18, margin: '0 0 8px', fontWeight: 600 }}>Leave Approvals</h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Review pending time off applications, check current leaves calendar, and manage requests.
            </p>
          </div>
          <a href="/timeoff" className="df-btn df-btn-dawn" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
            Approve Leaves
          </a>
        </div>

        <div className="df-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 className="df-display" style={{ fontSize: 18, margin: '0 0 8px', fontWeight: 600 }}>Payroll Summary</h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Manage corporate wage setups, inspect automatic tax/PF calculations, and view payslips.
            </p>
          </div>
          <a href="/payroll" className="df-btn df-btn-ghost" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
            Manage Payroll
          </a>
        </div>
      </div>
    </div>
  );
}
