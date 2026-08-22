'use client';

import React from 'react';

interface FlowRingProps {
  checkedIn: boolean;
  checkedOut: boolean;
  checkInTime?: string | Date | null;
  checkOutTime?: string | Date | null;
  onCheckIn: () => void;
  onCheckOut: () => void;
  loading?: boolean;
}

const fmtTimeStr = (d: string | Date | null | undefined): string => {
  if (!d) return '';
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return String(d);
  return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export const FlowRing: React.FC<FlowRingProps> = ({
  checkedIn,
  checkedOut,
  checkInTime,
  checkOutTime,
  onCheckIn,
  onCheckOut,
  loading = false
}) => {
  let statusText = 'Not Checked In';
  let ringColor = 'var(--line)';
  let glowColor = 'transparent';

  if (checkedOut) {
    statusText = 'Checked Out';
    ringColor = 'var(--brand-deep)';
    glowColor = 'rgba(30, 42, 82, 0.1)';
  } else if (checkedIn) {
    statusText = 'Checked In & Working';
    ringColor = 'var(--success)';
    glowColor = 'rgba(24, 138, 102, 0.15)';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' }}>
      <div
        style={{
          position: 'relative',
          width: 140,
          height: 140,
          borderRadius: '50%',
          border: `6px solid ${ringColor}`,
          boxShadow: `0 0 24px ${glowColor}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--surface)',
          transition: 'all 0.4s ease'
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-faint)', marginBottom: 2 }}>
          Status
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: checkedIn && !checkedOut ? 'var(--success)' : 'var(--ink)', padding: '0 8px' }}>
          {statusText}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 20, width: '100%', maxWidth: 320 }}>
        <button
          type="button"
          className="df-btn df-btn-primary"
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={checkedIn || loading}
          onClick={onCheckIn}
        >
          {loading ? 'Processing...' : 'Check In'}
        </button>

        <button
          type="button"
          className="df-btn df-btn-ghost"
          style={{ flex: 1, justifyContent: 'center' }}
          disabled={!checkedIn || checkedOut || loading}
          onClick={onCheckOut}
        >
          {loading ? 'Processing...' : 'Check Out'}
        </button>
      </div>

      {checkedIn && (
        <p style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 12 }}>
          Checked in at <span className="df-mono">{fmtTimeStr(checkInTime)}</span>
          {checkedOut && checkOutTime ? <> · Out at <span className="df-mono">{fmtTimeStr(checkOutTime)}</span></> : ''}
        </p>
      )}
    </div>
  );
};
