'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar } from '@/components/SharedAtoms';

export default function EmployeeDashboard() {
  const { user, role, logout } = useAuth();
  const userName = user?.email?.split('@')[0] || 'Employee';

  return (
    <div style={{ padding: 40, maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={userName} size={48} />
          <div>
            <h1 className="df-display" style={{ fontSize: 28, margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Employee Dashboard</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Welcome back, <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{user?.email}</span> ({role})
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
            <h2 className="df-display" style={{ fontSize: 18, margin: '0 0 8px', fontWeight: 600 }}>My Attendance</h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Clock in and out, track hours worked, view historical logs and timesheets.
            </p>
          </div>
          <a href="/attendance" className="df-btn df-btn-primary" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
            Go to Attendance
          </a>
        </div>

        <div className="df-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 className="df-display" style={{ fontSize: 18, margin: '0 0 8px', fontWeight: 600 }}>Time Off Requests</h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Submit time off requests, check your remaining holiday balances, and review approvals.
            </p>
          </div>
          <a href="/timeoff" className="df-btn df-btn-dawn" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
            Request Time Off
          </a>
        </div>

        <div className="df-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h2 className="df-display" style={{ fontSize: 18, margin: '0 0 8px', fontWeight: 600 }}>My Payroll</h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-soft)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Inspect your pay structures, gross salaries, deductions, and download payslips.
            </p>
          </div>
          <a href="/payroll" className="df-btn df-btn-ghost" style={{ alignSelf: 'flex-start', textDecoration: 'none' }}>
            View Salary Details
          </a>
        </div>
      </div>
    </div>
  );
}
