'use client';

import React from 'react';
import { AttendanceBadge, EmptyState } from '@/components/SharedAtoms';

export interface AttendanceRecord {
  id?: string;
  employeeId?: string;
  employee_id?: string;
  date?: string;
  attendance_date?: string;
  day?: string;
  checkIn?: string | Date | null;
  check_in?: string | Date | null;
  checkOut?: string | Date | null;
  check_out?: string | Date | null;
  workHours?: number;
  work_hours?: number;
  extraHours?: number;
  extra_hours?: number;
  status: string;
}

interface AttendanceTableProps {
  rows: AttendanceRecord[];
  loading?: boolean;
}

const fmtTime = (d: string | Date | null | undefined): string => {
  if (!d) return '—';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d);
  return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const AttendanceTable: React.FC<AttendanceTableProps> = ({ rows, loading = false }) => {
  if (loading) {
    return (
      <div className="df-card" style={{ padding: 32, textAlign: 'center', color: 'var(--ink-soft)' }}>
        Loading attendance history from database...
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <EmptyState title="No attendance logs found" subtitle="Your check-in records will appear here once submitted." />;
  }

  return (
    <div className="df-card" style={{ padding: 0, overflowX: 'auto' }}>
      <table className="df-table" style={{ width: '100%', fontSize: 13 }}>
        <thead>
          <tr>
            <th>Date</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Work Hours</th>
            <th>Extra Hours</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => {
            const dateStr = r.date || r.attendance_date || `Row ${idx + 1}`;
            const checkInVal = r.checkIn || r.check_in;
            const checkOutVal = r.checkOut || r.check_out;
            const workH = r.workHours ?? r.work_hours ?? 0;
            const extraH = r.extraHours ?? r.extra_hours ?? 0;

            return (
              <tr key={r.id || `${dateStr}-${idx}`}>
                <td className="df-mono" style={{ fontWeight: 600 }}>{dateStr}</td>
                <td className="df-mono">{fmtTime(checkInVal)}</td>
                <td className="df-mono">{fmtTime(checkOutVal)}</td>
                <td className="df-mono">{workH > 0 ? `${workH} hrs` : '—'}</td>
                <td className="df-mono">{extraH > 0 ? `${extraH} hrs` : '—'}</td>
                <td>
                  <AttendanceBadge status={r.status} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
