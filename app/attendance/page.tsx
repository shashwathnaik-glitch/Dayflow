'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function AttendancePage() {
  const { role } = useAuth();
  const dashboardLink = role === 'admin' ? '/admin/dashboard' : '/dashboard';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <a href={dashboardLink} className="text-sm text-primary hover:underline">← Back to Dashboard</a>
      </div>
      <h1 className="text-3xl font-bold text-foreground">Attendance & Timesheet</h1>
      <p className="text-muted-foreground mt-2">Check in/out and view records.</p>
      
      <div className="mt-8 p-12 text-center bg-card border border-border border-dashed rounded-lg">
        <p className="text-muted-foreground text-sm">Attendance module workspace. Member 2 (Employee Experience / Attendance) is building this section.</p>
      </div>
    </div>
  );
}
