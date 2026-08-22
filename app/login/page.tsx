import React from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <LoginForm />
      </div>
    </ProtectedRoute>
  );
}
