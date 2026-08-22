'use client';

import React, { useState } from 'react';
import { login } from '../lib/dayflow-api';

export const LoginForm: React.FC = () => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginId || !password) {
      setError('Please fill in all fields.');
      return;
    }

    try {
      setError(null);
      setLoading(true);
      const { data, error: loginError } = await login(loginId, password);
      
      if (loginError) {
        setError(loginError.message || 'Invalid credentials. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="df-card" style={{ width: '100%', maxWidth: 440, padding: 36 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 className="df-display" style={{ fontSize: 32, margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Dayflow</h1>
        <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
          Sign in to your Human Resource Dashboard
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {error && (
          <div style={{
            padding: '12px 14px',
            fontSize: 13,
            color: 'var(--danger)',
            background: 'var(--danger-bg)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(197, 57, 46, 0.15)'
          }}>
            {error}
          </div>
        )}

        <div>
          <label className="df-label" htmlFor="loginId">
            Login ID or Email
          </label>
          <input
            id="loginId"
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            disabled={loading}
            className="df-input"
            placeholder="e.g. OIJODO20260001 or admin@dayflow.com"
          />
        </div>

        <div>
          <label className="df-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            className="df-input"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="df-btn df-btn-primary"
          style={{ justifyContent: 'center', marginTop: 8 }}
        >
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: 'var(--ink-faint)', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
        <p>Demo Login Details:</p>
        <p style={{ marginTop: 4 }}>Admin: <span style={{ fontWeight: 600, color: 'var(--ink)' }}>admin@dayflow.com</span> / admin123</p>
        <p>Employee: <span style={{ fontWeight: 600, color: 'var(--ink)' }}>OIJODO20260001</span> / employee123</p>
      </div>
    </div>
  );
};
