'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Avatar, Icon } from '@/components/SharedAtoms';
import { 
  listEmployees, 
  getAllAttendance, 
  getAllLeaveRequests 
} from '@/lib/dayflow-api';
import { supabase } from '@/lib/supabaseClient';
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

const COLORS = ["#4C5FD6", "#FF7A45", "#188A66"];

function fmtDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function AdminAnalyticsPage() {
  const { user } = useAuth();
  const [range, setRange] = useState(7); // 7 or 30 days

  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [empRes, attRes, leaveRes, salRes] = await Promise.all([
          listEmployees(),
          getAllAttendance(),
          getAllLeaveRequests(),
          supabase.from('v_employee_salary_components').select('*')
        ]);
        
        setEmployees((empRes.data || []).map(mapEmployeeDbToUi));
        setAttendance((attRes.data || []).map(mapAttendanceDbToUi));
        setLeaveRequests((leaveRes.data || []).map(mapLeaveRequestDbToUi));

        const salaryMap: Record<string, any> = {};
        (salRes.data || []).forEach((s: any) => {
          salaryMap[s.employee_id] = { gross: s.gross || 0 };
        });
        setSalaries(salaryMap);

      } catch (err) {
        console.error("Error loading analytics data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 1. Attendance stats over range (7 or 30 working days)
  const attendanceData = useMemo(() => {
    const dates = [];
    for (let i = range - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (d.getDay() !== 0 && d.getDay() !== 6) { // Skip weekends
        dates.push(fmtDate(d));
      }
    }

    return dates.map(dateStr => {
      const dayRecords = attendance.filter(a => a.date === dateStr);
      const checkedInCount = dayRecords.filter(a => a.status === ATTENDANCE_STATUS.PRESENT || a.status === ATTENDANCE_STATUS.HALF_DAY).length;
      return {
        date: dateStr.slice(5), // MM-DD
        "Checked In": checkedInCount
      };
    });
  }, [attendance, range]);

  // 2. Leave stats by status
  const leaveStatusData = useMemo(() => {
    const counts = { Approved: 0, Pending: 0, Rejected: 0 };
    leaveRequests.forEach(r => {
      if (counts[r.status as keyof typeof counts] !== undefined) {
        counts[r.status as keyof typeof counts]++;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [leaveRequests]);

  // 3. Leave stats by type
  const leaveTypeData = useMemo(() => {
    const counts = { pto: 0, sick: 0, unpaid: 0 };
    leaveRequests.forEach(r => {
      if (counts[r.leaveTypeId as keyof typeof counts] !== undefined) {
        counts[r.leaveTypeId as keyof typeof counts]++;
      }
    });
    const labelMap = { pto: "Paid Time Off", sick: "Sick Leave", unpaid: "Unpaid Leave" };
    return Object.entries(counts).map(([id, value]) => ({ 
      name: labelMap[id as keyof typeof labelMap] || id, 
      value 
    }));
  }, [leaveRequests]);

  // 4. Payroll by department
  const payrollData = useMemo(() => {
    const map: Record<string, number> = {};
    employees.forEach(e => {
      const sal = salaries[e.id] || { gross: 0 };
      map[e.department] = (map[e.department] || 0) + sal.gross;
    });
    return Object.entries(map).map(([name, value]) => ({ 
      name, 
      value: Math.round(value / 1000) // ₹ thousands
    }));
  }, [employees, salaries]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <p style={{ color: "var(--ink-soft)", fontSize: "15px" }}>Loading Analytics metrics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: 40, maxWidth: 1040, margin: '0 auto', display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 12 }}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <a href="/admin/dashboard" className="df-btn df-btn-ghost df-btn-sm" style={{ textDecoration: 'none', padding: "6px 12px" }}>
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon.chev /></span> Back to Dashboard
            </a>
          </div>
          <h1 className="df-display" style={{ fontSize: 24, margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Analytics</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
            System insights and range-based HR reporting.
          </p>
        </div>
        <div>
          <select 
            className="df-select" 
            style={{ maxWidth: 120 }} 
            value={range} 
            onChange={e => setRange(Number(e.target.value))}
          >
            <option value={7}>7 Days</option>
            <option value={30}>30 Days</option>
          </select>
        </div>
      </div>

      {/* Attendance Volume */}
      <div className="df-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14.5, margin: "0 0 14px" }}>Attendance Volume (Checked In Employees)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={attendanceData}>
            <CartesianGrid vertical={false} stroke="#EEF0F6" />
            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9AA0AF" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9AA0AF" }} />
            <Tooltip contentStyle={{ borderRadius: 10, fontSize: 12 }} />
            <Bar dataKey="Checked In" fill="#4C5FD6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Leave Pies */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <div className="df-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14.5, margin: "0 0 14px" }}>Leave Requests by Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={leaveStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" label={{ fontSize: 11 }}>
                {leaveStatusData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="df-card" style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14.5, margin: "0 0 14px" }}>Leave Requests by Type</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={leaveTypeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#8884d8" label={{ fontSize: 11 }}>
                {leaveTypeData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gross Payroll department bar chart */}
      <div className="df-card" style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14.5, margin: "0 0 14px" }}>Gross Payroll Distribution by Department (₹ thousands)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={payrollData}>
            <CartesianGrid vertical={false} stroke="#EEF0F6" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9AA0AF" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9AA0AF" }} />
            <Tooltip formatter={(v) => `₹${v}k`} />
            <Bar dataKey="value" fill="#1E2A52" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
