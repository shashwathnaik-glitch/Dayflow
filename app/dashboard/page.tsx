'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, Icon } from '@/components/SharedAtoms';
import { FlowRing } from '@/components/employee/FlowRing';
import { checkInApi, checkOutApi, fetchTodayAttendanceApi } from '@/services/attendanceService.js';
import { getMyAttendance, getMyLeaveRequests } from '@/lib/dayflow-api';

const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export default function EmployeeDashboard() {
  const { user, role, logout } = useAuth();
  const userName = user?.email?.split('@')[0] || 'Employee';
  const todayStr = getTodayStr();

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ msg: string; tone: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, tone: 'ok' | 'err' = 'ok') => {
    setToastMsg({ msg, tone });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const empId = user?.id;

  const loadTodayRecord = useCallback(async () => {
    if (!empId) return;
    setLoadingAttendance(true);
    try {
      // 1. Try attendanceService API first
      const record = await fetchTodayAttendanceApi(empId, todayStr);
      if (record) {
        setTodayAttendance(record);
      } else {
        // 2. Fallback to dayflow-api getMyAttendance
        const { data: myLogs } = await getMyAttendance();
        const todayRec = (myLogs || []).find((a: any) => (a.attendance_date || a.date) === todayStr);
        setTodayAttendance(todayRec || null);
      }
    } catch (err) {
      console.error('Error loading today attendance:', err);
    } finally {
      setLoadingAttendance(false);
    }
  }, [empId, todayStr]);

  useEffect(() => {
    loadTodayRecord();
  }, [loadTodayRecord]);

  const handleCheckIn = async () => {
    if (!empId) return;
    setActionLoading(true);
    try {
      const res = await checkInApi(empId, todayStr);
      if (res && res.ok) {
        showToast('Checked in — have a great day!');
        await loadTodayRecord();
      } else {
        showToast(res?.error || 'Check-in failed.', 'err');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to check in.', 'err');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!empId) return;
    setActionLoading(true);
    try {
      const res = await checkOutApi(empId, todayStr);
      if (res && res.ok) {
        showToast('Checked out. See you tomorrow!');
        await loadTodayRecord();
      } else {
        showToast(res?.error || 'Check-out failed.', 'err');
      }
    } catch (err: any) {
      console.error(err);
      showToast('Failed to check out.', 'err');
    } finally {
      setActionLoading(false);
    }
  };

  const checkedIn = !!(todayAttendance && (todayAttendance.checkIn || todayAttendance.check_in));
  const checkedOut = !!(todayAttendance && (todayAttendance.checkOut || todayAttendance.check_out));

  const checkInTime = todayAttendance?.checkIn || todayAttendance?.check_in;
  const checkOutTime = todayAttendance?.checkOut || todayAttendance?.check_out;

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: 9999,
            padding: '12px 20px',
            borderRadius: 10,
            background: toastMsg.tone === 'err' ? 'var(--danger-bg)' : 'var(--success-bg)',
            color: toastMsg.tone === 'err' ? 'var(--danger)' : 'var(--success)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            fontWeight: 600,
            fontSize: 13.5
          }}
        >
          {toastMsg.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={userName} size={52} />
          <div>
            <h1 className="df-display" style={{ fontSize: 26, margin: 0, fontWeight: 700, color: 'var(--ink)' }}>
              Hey, {userName} 👋
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {role === 'admin' && (
            <a href="/admin/dashboard" className="df-btn df-btn-ghost df-btn-sm" style={{ textDecoration: 'none' }}>
              Admin Dashboard
            </a>
          )}
          <button type="button" onClick={logout} className="df-btn df-btn-ghost df-btn-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 20, marginBottom: 24 }}>
        {/* FlowRing Check In/Out Card */}
        <div className="df-card" style={{ padding: 28, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 20px', color: 'var(--ink)', alignSelf: 'flex-start' }}>
            Daily Attendance
          </h2>

          {loadingAttendance ? (
            <div style={{ padding: 40, color: 'var(--ink-soft)', fontSize: 13.5 }}>Checking today's status...</div>
          ) : (
            <FlowRing
              checkedIn={checkedIn}
              checkedOut={checkedOut}
              checkInTime={checkInTime}
              checkOutTime={checkOutTime}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              loading={actionLoading}
            />
          )}
        </div>

        {/* Time Off & Quick Status Card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', gap: 14 }}>
            <div className="df-card" style={{ padding: 18, flex: 1 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>Paid Time Off</div>
              <div className="df-display" style={{ fontSize: 24, margin: '6px 0 2px', fontWeight: 700 }}>
                12 <span style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--ink-faint)', fontWeight: 400 }}>days left</span>
              </div>
            </div>

            <div className="df-card" style={{ padding: 18, flex: 1 }}>
              <div style={{ fontSize: 12.5, color: 'var(--ink-soft)', fontWeight: 600 }}>Sick Leave</div>
              <div className="df-display" style={{ fontSize: 24, margin: '6px 0 2px', fontWeight: 700 }}>
                5 <span style={{ fontSize: 12, fontFamily: 'var(--font-body)', color: 'var(--ink-faint)', fontWeight: 400 }}>days left</span>
              </div>
            </div>
          </div>

          <div className="df-card" style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, margin: 0, fontWeight: 700 }}>Quick Actions</h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, margin: 0 }}>
                Manage check-in logs, submit time off requests, or inspect your profile details anytime.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <a href="/attendance" className="df-btn df-btn-primary df-btn-sm" style={{ textDecoration: 'none' }}>
                <Icon.clock /> Attendance Timesheet
              </a>
              <a href="/profile" className="df-btn df-btn-ghost df-btn-sm" style={{ textDecoration: 'none' }}>
                <Icon.user /> View Profile
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <a href="/attendance" className="df-card" style={{ padding: 20, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <Icon.clock />
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 10 }}>My Attendance</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4 }}>Full log, timesheets & hours</div>
        </a>

        <a href="/profile" className="df-card" style={{ padding: 20, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <Icon.user />
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 10 }}>My Profile</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4 }}>Basic & private information</div>
        </a>

        <a href="/payroll" className="df-card" style={{ padding: 20, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}>
          <Icon.wallet />
          <div style={{ fontWeight: 700, fontSize: 14, marginTop: 10 }}>My Payroll</div>
          <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 4 }}>Salary structure & payslips</div>
        </a>
      </div>
    </div>
  );
}
