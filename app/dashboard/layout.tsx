import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['employee']}>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ProtectedRoute>
  );
}
