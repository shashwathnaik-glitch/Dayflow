import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </ProtectedRoute>
  );
}
