'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { FlowRing } from '@/components/employee/FlowRing';
import { AttendanceTable, AttendanceRecord } from '@/components/employee/AttendanceTable';
import { checkInApi, checkOutApi, fetchTodayAttendanceApi, fetchAttendanceHistoryApi } from '@/services/attendanceService.js';
import { getMyAttendance } from '@/lib/dayflow-api';

const getTodayStr = () => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

export default function AttendancePage() {
  const { user, role } = useAuth();
  const empId = user?.id;
  const todayStr = getTodayStr();

  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [historyRows, setHistoryRows] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ msg: string; tone: 'ok' | 'err' } | null>(null);

  const showToast = (msg: string, tone: 'ok' | 'err' = 'ok') => {
    setToastMsg({ msg, tone });
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadAttendanceData = useCallback(async () => {
    if (!empId) return;
    setLoading(true);
    try {
      // 1. Load today's attendance record
      const todayRec = await fetchTodayAttendanceApi(empId, todayStr);
      if (todayRec) {
        setTodayAttendance(todayRec);
      } else {
        const { data: myLogs } = await getMyAttendance();
        const foundToday = (myLogs || []).find((a: any) => (a.attendance_date || a.date) === todayStr);
        setTodayAttendance(foundToday || null);
      }

      // 2. Load historical logs
      const history = await fetchAttendanceHistoryApi(empId);
      if (history && history.length > 0) {
        const cleanHistory = history.filter(Boolean) as AttendanceRecord[];
        setHistoryRows(cleanHistory);
      } else {
        const { data: myLogs } = await getMyAttendance();
        setHistoryRows((myLogs || []) as AttendanceRecord[]);
      }
    } catch (err) {
      console.error('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  }, [empId, todayStr]);

  useEffect(() => {
    loadAttendanceData();
  }, [loadAttendanceData]);

  const handleCheckIn = async () => {
    if (!empId) return;
    setActionLoading(true);
    try {
      const res = await checkInApi(empId, todayStr);
      if (res && res.ok) {
        showToast('Checked in — have a great day!');
        await loadAttendanceData();
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
        await loadAttendanceData();
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

  const dashboardLink = role === 'admin' ? '/admin/dashboard' : '/dashboard';

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1040, margin: '0 auto' }}>
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

      <div style={{ marginBottom: 20 }}>
        <a href={dashboardLink} style={{ fontSize: 13.5, color: 'var(--brand-flow)', textDecoration: 'none', fontWeight: 600 }}>
          ← Back to Dashboard
        </a>
      </div>

      <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 20, marginBottom: 28 }}>
        <h1 className="df-display" style={{ fontSize: 26, margin: 0, fontWeight: 700, color: 'var(--ink)' }}>
          My Attendance & Timesheets
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
          Check in, check out, and review your complete work history logs.
        </p>
      </div>

      {/* Clock In / Out Widget Section */}
      <div className="df-card" style={{ padding: 32, marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 24px', alignSelf: 'flex-start', color: 'var(--ink)' }}>
          Today's Punch Clock ({todayStr})
        </h2>

        {loading ? (
          <div style={{ padding: 32, color: 'var(--ink-soft)', fontSize: 13.5 }}>Loading attendance status...</div>
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

      {/* Attendance History Section */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: 'var(--ink)' }}>
          Attendance History Logs
        </h2>
        <AttendanceTable rows={historyRows} loading={loading} />
      </div>
    </div>
  );
}
