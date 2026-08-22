'use client';

import React from 'react';

export default function AdminEmployees() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <a href="/admin/dashboard" className="text-sm text-primary hover:underline">← Back to Dashboard</a>
      </div>
      <h1 className="text-3xl font-bold text-foreground">Employees Directory</h1>
      <p className="text-muted-foreground mt-2">Manage employee records and onboarding.</p>
      
      <div className="mt-8 p-12 text-center bg-card border border-border border-dashed rounded-lg">
        <p className="text-muted-foreground text-sm">Employee management table and onboarding dialog goes here (Member 1 / Admin Dashboard tasks).</p>
      </div>
    </div>
  );
}
