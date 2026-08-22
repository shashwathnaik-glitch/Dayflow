'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  Avatar, 
  StatCard, 
  EmptyState, 
  LeaveStatusBadge, 
  AttendanceBadge,
  Icon 
} from '@/components/SharedAtoms';
import { 
  listEmployees, 
  getAllAttendance, 
  getAllLeaveRequests 
} from '@/lib/dayflow-api';
import { 
  mapEmployeeDbToUi, 
  mapAttendanceDbToUi, 
  mapLeaveRequestDbToUi 
} from '@/lib/dataMappers';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid
} from 'recharts';

export const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  HALF_DAY: "Half-day",
  ABSENT: "Absent",
  LEAVE: "On Leave"
};

const LEAVE_TYPES = [
  { id: "pto", name: "Paid Time Off" },
  { id: "sick", name: "Sick Leave" },
  { id: "unpaid", name: "Unpaid Leave" }
];

const PIE_COLORS = ["#4C5FD6", "#FF7A45", "#188A66", "#B9790A"];

function prettyDate(d: Date) { 
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); 
}

function fmtDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function isWeekend(d: Date) { 
  const day = d.getDay(); 
  return day === 0 || day === 6; 
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-soft)" }}>
      <span style={{ width: 8, height: 8, borderRadius: 2, background: color }} />
      {label}
    </div>
  );
}

export default function AdminDashboard() {
  const { user, role, logout } = useAuth();
  const userName = user?.email?.split('@')[0] || 'Admin';

  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = useMemo(() => fmtDate(new Date()), []);

  useEffect(() => {
    async function loadData() {
      try {
        const [empRes, attRes, leaveRes] = await Promise.all([
          listEmployees(),
          getAllAttendance(),
          getAllLeaveRequests()
        ]);
        setEmployees((empRes.data || []).map(mapEmployeeDbToUi));
        setAttendance((attRes.data || []).map(mapAttendanceDbToUi));
        setLeaveRequests((leaveRes.data || []).map(mapLeaveRequestDbToUi));
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute stat metrics
  const total = employees.length;
  const presentToday = employees.filter(e => {
    const a = attendance.find(x => x.employeeId === e.id && x.date === todayStr);
    return a && (a.status === ATTENDANCE_STATUS.PRESENT || a.status === ATTENDANCE_STATUS.HALF_DAY);
  }).length;
  
  const onLeaveToday = employees.filter(e => {
    const a = attendance.find(x => x.employeeId === e.id && x.date === todayStr);
    const hasLeaveRow = a && a.status === ATTENDANCE_STATUS.LEAVE;
    const hasApprovedLeave = leaveRequests.some(r => r.employeeId === e.id && r.status === "Approved" && todayStr >= r.startDate && todayStr <= r.endDate);
    return hasLeaveRow || hasApprovedLeave;
  }).length;

  const notCheckedIn = employees.filter(e => !attendance.some(a => a.employeeId === e.id && a.date === todayStr)).length;
  const pending = leaveRequests.filter(r => r.status === "Pending");

  // Recharts 7-day attendance
  const last7 = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); 
      d.setDate(d.getDate() - i);
      if (isWeekend(d)) continue;
      const ds = fmtDate(d);
      const present = attendance.filter(a => a.date === ds && (a.status === ATTENDANCE_STATUS.PRESENT || a.status === ATTENDANCE_STATUS.HALF_DAY)).length;
      const absent = attendance.filter(a => a.date === ds && a.status === ATTENDANCE_STATUS.ABSENT).length;
      days.push({ 
        day: d.toLocaleDateString("en-US", { weekday: "short" }), 
        Present: present, 
        Absent: absent 
      });
    }
    return days;
  }, [attendance]);

  // Recharts Leave Breakdown
  const leaveByType = useMemo(() => {
    const map: Record<string, number> = {};
    leaveRequests.filter(r => r.status === "Approved").forEach(r => {
      const label = LEAVE_TYPES.find(t => t.id === r.leaveTypeId)?.name || r.leaveTypeId;
      map[label] = (map[label] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [leaveRequests]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <p style={{ color: "var(--ink-soft)", fontSize: "15px" }}>Loading Dashboard metrics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 1140, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Avatar name={userName} size={48} />
          <div>
            <h1 className="df-display" style={{ fontSize: 24, margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Good to see you, Admin</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              {prettyDate(new Date())} · Logged in as <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{user?.email}</span>
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <a href="/admin/employees" className="df-btn df-btn-ghost df-btn-sm" style={{ textDecoration: 'none' }}>
            <Icon.users /> Employees
          </a>
          <a href="/payroll" className="df-btn df-btn-ghost df-btn-sm" style={{ textDecoration: 'none' }}>
            <Icon.wallet /> Payroll
          </a>
          <a href="/admin/analytics" className="df-btn df-btn-ghost df-btn-sm" style={{ textDecoration: 'none' }}>
            <Icon.chart /> Analytics
          </a>
          <button onClick={logout} className="df-btn df-btn-primary df-btn-sm">
            Sign Out
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 22 }}>
        <StatCard label="Total Employees" value={total} icon={<Icon.users />} />
        <StatCard label="Present Today" value={presentToday} tone="var(--success)" icon={<Icon.check />} />
        <StatCard label="Not Checked In" value={notCheckedIn} tone="var(--ink-soft)" icon={<Icon.clock />} />
        <StatCard label="On Leave" value={onLeaveToday} tone="var(--warn)" icon={<Icon.calendar />} />
        <StatCard label="Pending Requests" value={pending.length} tone="var(--brand-dawn)" icon={<Icon.bell />} />
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>
        <div className="df-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14.5, margin: "0 0 14px" }}>Attendance overview · last 7 working days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last7} barGap={4}>
              <CartesianGrid vertical={false} stroke="#EEF0F6" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9AA0AF" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9AA0AF" }} allowDecimals={false} />
              <Tooltip cursor={{ fill: "#F3F4F9" }} contentStyle={{ borderRadius: 10, border: "1px solid #E4E6F0", fontSize: 12 }} />
              <Bar dataKey="Present" fill="#188A66" radius={[5, 5, 0, 0]} />
              <Bar dataKey="Absent" fill="#C5392E" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="df-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14.5, margin: "0 0 14px" }}>Approved leave by type</h3>
          {leaveByType.length === 0 ? (
            <EmptyState title="No approved leave yet" subtitle="Approved time off will show up here." />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={leaveByType} dataKey="value" nameKey="name" innerRadius={40} outerRadius={68} paddingAngle={3} isAnimationActive={false}>
                    {leaveByType.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E4E6F0", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", marginTop: 6, justifyContent: "center" }}>
                {leaveByType.map((e, i) => (
                  <LegendDot key={i} color={PIE_COLORS[i % PIE_COLORS.length]} label={e.name} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Pending Time-Off Requests Table */}
      <div className="df-card" style={{ padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ fontSize: 14.5, margin: 0 }}>Pending time-off requests</h3>
          <a href="/timeoff" className="df-btn df-btn-ghost df-btn-sm" style={{ textDecoration: 'none' }}>
            View all <Icon.chev />
          </a>
        </div>
        {pending.length === 0 ? (
          <EmptyState title="All caught up" subtitle="No pending requests right now." />
        ) : (
          <table className="df-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {pending.slice(0, 5).map(r => {
                const emp = employees.find(e => e.id === r.employeeId);
                return (
                  <tr key={r.id} className="clickable" style={{ cursor: "pointer" }} onClick={() => window.location.href = `/admin/employees/${emp?.id}`}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Avatar name={emp?.name || r.employeeId} size={26} />
                        {emp?.name || r.employeeId}
                      </div>
                    </td>
                    <td>{LEAVE_TYPES.find(t => t.id === r.leaveTypeId)?.name || r.leaveTypeId}</td>
                    <td className="df-mono" style={{ fontSize: 12 }}>{r.startDate} → {r.endDate}</td>
                    <td style={{ color: "var(--ink-soft)" }}>{r.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
