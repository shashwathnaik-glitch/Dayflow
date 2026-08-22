'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ProfileView } from '@/components/employee/ProfileView';
import { getEmployee } from '@/lib/dayflow-api';

export default function ProfilePage() {
  const { user, role } = useAuth();
  const empId = user?.id;

  const [employeeData, setEmployeeData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const loadEmployee = useCallback(async () => {
    if (!empId) return;
    setLoading(true);
    try {
      // Load employee record from dayflow-api
      const { data } = await getEmployee(empId);
      if (data) {
        setEmployeeData(data);
      } else {
        // Fallback info from user session
        setEmployeeData({
          id: empId,
          name: user?.email?.split('@')[0] || 'Employee',
          email: user?.email,
          department: 'Engineering',
          position: 'Team Member',
          company: 'Dayflow Inc.',
          location: 'Remote',
          joinDate: '2026-01-01'
        });
      }
    } catch (err) {
      console.error('Error loading employee profile:', err);
      setEmployeeData({
        id: empId,
        name: user?.email?.split('@')[0] || 'Employee',
        email: user?.email
      });
    } finally {
      setLoading(false);
    }
  }, [empId, user]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  const dashboardLink = role === 'admin' ? '/admin/dashboard' : '/dashboard';

  const sessionObj = { role: role || 'employee', employeeId: empId };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1040, margin: '0 auto' }}>
      <div style={{ marginBottom: 20 }}>
        <a href={dashboardLink} style={{ fontSize: 13.5, color: 'var(--brand-flow)', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Dashboard
        </a>
      </div>

      <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 20, marginBottom: 24 }}>
        <h1 className="df-display" style={{ fontSize: 26, margin: 0, fontWeight: 700, color: 'var(--ink)' }}>
          My Profile
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
          View basic details and secure private documents.
        </p>
      </div>

      {loading ? (
        <div className="df-card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-soft)' }}>
          Loading profile...
        </div>
      ) : (
        <ProfileView emp={employeeData} session={sessionObj} />
      )}
    </div>
  );
}
