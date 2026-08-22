'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  Avatar, 
  AttendanceBadge,
  Icon,
  EmptyState 
} from '@/components/SharedAtoms';
import { listEmployees, getAllAttendance, getAllLeaveRequests } from '@/lib/dayflow-api';
import { mapEmployeeDbToUi, mapAttendanceDbToUi, mapLeaveRequestDbToUi } from '@/lib/dataMappers';

export const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  HALF_DAY: "Half-day",
  ABSENT: "Absent",
  LEAVE: "On Leave"
};

function fmtDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AdminEmployees() {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [dept, setDept] = useState("All");

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
        console.error("Error loading employee directory data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Compute live today status for each employee
  const getTodayStatus = (empId: string) => {
    const onLeave = leaveRequests.some(r => r.employeeId === empId && r.status === "Approved" && todayStr >= r.startDate && todayStr <= r.endDate);
    if (onLeave) return ATTENDANCE_STATUS.LEAVE;

    const a = attendance.find(x => x.employeeId === empId && x.date === todayStr);
    if (a) {
      if (a.status === ATTENDANCE_STATUS.PRESENT) return ATTENDANCE_STATUS.PRESENT;
      if (a.status === ATTENDANCE_STATUS.HALF_DAY) return ATTENDANCE_STATUS.HALF_DAY;
      if (a.status === ATTENDANCE_STATUS.LEAVE) return ATTENDANCE_STATUS.LEAVE;
      if (a.status === ATTENDANCE_STATUS.ABSENT) return ATTENDANCE_STATUS.ABSENT;
    }
    return "Not Checked In";
  };

  // Dynamic department list from actual records
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(e => {
      if (e.department) depts.add(e.department);
    });
    return Array.from(depts);
  }, [employees]);

  // Filters search and department selection
  const filtered = useMemo(() => {
    return employees.filter(e =>
      (dept === "All" || e.department === dept) &&
      (e.name.toLowerCase().includes(query.toLowerCase()) || e.position.toLowerCase().includes(query.toLowerCase()))
    );
  }, [employees, query, dept]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <p style={{ color: "var(--ink-soft)", fontSize: "15px" }}>Loading Employees Directory...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 1140, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 24 }}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <a href="/admin/dashboard" className="df-btn df-btn-ghost df-btn-sm" style={{ textDecoration: 'none', padding: "6px 12px" }}>
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon.chev /></span> Back to Dashboard
            </a>
          </div>
          <h1 className="df-display" style={{ fontSize: 24, margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Employees</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
            {employees.length} people across {uniqueDepartments.length} departments
          </p>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
        <input 
          className="df-input" 
          style={{ maxWidth: 280, minWidth: 200 }} 
          placeholder="Search by name or role…" 
          value={query} 
          onChange={e => setQuery(e.target.value)}
        />
        <select 
          className="df-select" 
          style={{ maxWidth: 180, minWidth: 140 }} 
          value={dept} 
          onChange={e => setDept(e.target.value)}
        >
          <option value="All">All Departments</option>
          {uniqueDepartments.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {/* Employee Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px,1fr))", gap: 14 }}>
        {filtered.map(e => {
          const status = getTodayStatus(e.id);
          return (
            <div 
              key={e.id} 
              className="df-card" 
              onClick={() => window.location.href = `/admin/employees/${e.id}`}
              style={{ padding: 16, cursor: "pointer", transition: "box-shadow .15s" }}
              onMouseEnter={ev => ev.currentTarget.style.boxShadow = "0 8px 20px rgba(18,21,28,0.08)"}
              onMouseLeave={ev => ev.currentTarget.style.boxShadow = "none"}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 10 }}>
                  <Avatar name={e.name} url={e.profile_image_url} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{e.name}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-soft)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{e.position}</div>
                  </div>
                </div>
                <AttendanceBadge status={status} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 14, fontSize: 12, color: "var(--ink-faint)" }}>
                <span>{e.department}</span>
                <span className="df-mono">{e.loginId}</span>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1 / -1" }}>
            <EmptyState title="No employees match" subtitle="Try a different search or department filter." />
          </div>
        )}
      </div>
    </div>
  );
}
