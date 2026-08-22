'use client';

import React from 'react';
import { useAuth } from '@/components/AuthProvider';

export default function TimeOffPage() {
  const { role } = useAuth();
  const dashboardLink = role === 'admin' ? '/admin/dashboard' : '/dashboard';

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <a href={dashboardLink} className="text-sm text-primary hover:underline">← Back to Dashboard</a>
      </div>
      <h1 className="text-3xl font-bold text-foreground">Time Off & Leaves</h1>
      <p className="text-muted-foreground mt-2">Request leaves and manage approvals.</p>
      
      <div className="mt-8 p-12 text-center bg-card border border-border border-dashed rounded-lg">
        <p className="text-muted-foreground text-sm">Time Off module workspace. Member 3 (Time Off / HR Workflow) is building this section.</p>
      </div>
    </div>
  );
}
