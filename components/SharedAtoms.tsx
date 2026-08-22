'use client';

import React from 'react';

/* =========================================================================
   DAYFLOW — SHARED UI ATOMS
   Shared atom components ported directly from dayflow-prototype.jsx.
   ========================================================================= */

// AVATAR COLOR PALETTE
const AVATAR_PALETTE = ["#1E2A52", "#4C5FD6", "#B9790A", "#188A66", "#C5392E", "#293869", "#7A4FD6"];

const avatarColor = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};

const initials = (name: string) => {
  if (!name) return "";
  return name.split(" ").map(p => p[0]).slice(0, 2).join("").toUpperCase();
};

const fmtTime = (d: Date | string | null | undefined) => {
  if (!d) return "—";
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  return dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
};

// 1. Icon Library
export const Icon = {
  dashboard: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}>
      <rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="11" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  users: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}>
      <circle cx="7" cy="6.5" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2 16c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="14.5" cy="7" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M12.7 11.7c2-.2 4.8 1 5.3 3.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  clock: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}>
      <circle cx="10" cy="10" r="7.3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M10 6v4.3l2.8 1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  calendar: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}>
      <rect x="2.5" y="4" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  wallet: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}>
      <rect x="2.5" y="5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M2.5 8.5h15" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="14" cy="12" r="1.2" fill="currentColor" />
    </svg>
  ),
  user: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}>
      <circle cx="10" cy="6.7" r="3.2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3.3 17c0-3.6 3-5.8 6.7-5.8s6.7 2.2 6.7 5.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
  logout: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}>
      <path d="M7.5 17.5H4.8a1.3 1.3 0 01-1.3-1.3V3.8a1.3 1.3 0 011.3-1.3h2.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M13 14l4-4-4-4M17 10H7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bell: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}>
      <path d="M5 8a5 5 0 0110 0c0 4 1.5 5 1.5 5h-13S5 12 5 8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M8.2 15.5a1.9 1.9 0 003.6 0" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  ),
  chart: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}>
      <path d="M3.3 17V3.3m0 13.4h13.4M6.7 13.3v-4m3.3 4v-7.3m3.3 7.3v-10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  spark: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}>
      <path d="M10 2.5l1.4 4.6 4.6 1.4-4.6 1.4L10 14.5l-1.4-4.6-4.6-1.4 4.6-1.4L10 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
    </svg>
  ),
  check: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" {...p}>
      <path d="M4 10.5l3.5 3.5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  x: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" {...p}>
      <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  plus: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" {...p}>
      <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  chev: (p: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 20 20" width="15" height="15" fill="none" {...p}>
      <path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
};

// 2. Badge
export interface BadgeProps {
  tone?: 'neutral' | 'present' | 'leave' | 'absent' | 'pending' | 'approved' | 'rejected';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', children }) => {
  return (
    <span className={`df-badge df-badge-${tone}`}>
      <span className="df-badge-dot" style={{ background: 'currentColor' }} />
      {children}
    </span>
  );
};

// 3. Avatar
export interface AvatarProps {
  name: string;
  size?: number;
  url?: string | null;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 38, url }) => {
  if (url) {
    return (
      <img 
        src={url} 
        alt={name} 
        className="df-avatar" 
        style={{ width: size, height: size, objectFit: "cover" }} 
      />
    );
  }
  return (
    <div
      className="df-avatar"
      style={{
        width: size,
        height: size,
        background: avatarColor(name),
        fontSize: size * 0.36
      }}
    >
      {initials(name)}
    </div>
  );
};

// 4. Modal
export interface ModalProps {
  onClose: () => void;
  children: React.ReactNode;
  width?: number;
}

export const Modal: React.FC<ModalProps> = ({ onClose, children, width }) => {
  return (
    <div
      className="df-modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="df-modal" style={width ? { maxWidth: width } : {}}>
        {children}
      </div>
    </div>
  );
};

// 5. ModalHeader
export interface ModalHeaderProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({ title, subtitle, onClose }) => {
  return (
    <div
      style={{
        padding: '20px 24px 14px',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
      }}
    >
      <div>
        <h3 style={{ fontSize: 18, margin: 0 }}>{title}</h3>
        {subtitle && (
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-soft)' }}>
            {subtitle}
          </p>
        )}
      </div>
      <button
        className="df-btn df-btn-ghost df-btn-sm"
        onClick={onClose}
        style={{ padding: 6 }}
      >
        <Icon.x />
      </button>
    </div>
  );
};

// 6. StatCard
export interface StatCardProps {
  label: string;
  value: React.ReactNode;
  tone?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, tone, icon }) => {
  return (
    <div className="df-card" style={{ padding: '18px 20px', flex: 1, minWidth: 150 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span
          style={{
            fontSize: 11.5,
            fontWeight: 700,
            color: 'var(--ink-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}
        >
          {label}
        </span>
        {icon && <div style={{ color: tone || 'var(--ink-faint)' }}>{icon}</div>}
      </div>
      <div className="df-display" style={{ fontSize: 30, marginTop: 8, color: tone || 'var(--ink)' }}>
        {value}
      </div>
    </div>
  );
};

// 7. EmptyState
export interface EmptyStateProps {
  title: string;
  subtitle: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ title, subtitle }) => {
  return (
    <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-faint)' }}>
      <div className="df-display" style={{ fontSize: 15, color: 'var(--ink-soft)', marginBottom: 4 }}>
        {title}
      </div>
      <div style={{ fontSize: 13 }}>{subtitle}</div>
    </div>
  );
};

// 8. LeaveStatusBadge
export interface LeaveStatusBadgeProps {
  status: string;
}

export const LeaveStatusBadge: React.FC<LeaveStatusBadgeProps> = ({ status }) => {
  const tone = status === 'Approved' ? 'approved' : status === 'Rejected' ? 'rejected' : 'pending';
  return <Badge tone={tone}>{status}</Badge>;
};

// 9. AttendanceBadge
export interface AttendanceBadgeProps {
  status: string;
}

export const AttendanceBadge: React.FC<AttendanceBadgeProps> = ({ status }) => {
  const tone =
    status === 'Present' ? 'present' :
    status === 'On Leave' ? 'leave' :
    status === 'Half-day' ? 'leave' :
    status === 'Absent' ? 'absent' : 'neutral';
  return <Badge tone={tone}>{status}</Badge>;
};

// 10. FlowRing
export interface FlowRingProps {
  checkedIn?: Date | string | null;
  checkedOut?: Date | string | null;
  size?: number;
}

export const FlowRing: React.FC<FlowRingProps> = ({ checkedIn, checkedOut, size = 132 }) => {
  const r = (size - 14) / 2;
  const c = 2 * Math.PI * r;
  
  // Calculate running duration inside standard 8am-6pm window
  const now = new Date();
  const progress = Math.min(1, Math.max(0, (now.getHours() * 60 + now.getMinutes() - 480) / 600));
  const dash = checkedOut ? c : c * (checkedIn ? progress : 0.02);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="dfFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A45" />
          <stop offset="55%" stopColor="#4C5FD6" />
          <stop offset="100%" stopColor="#1E2A52" />
        </linearGradient>
      </defs>
      <circle className="df-flow-ring-track" cx={size / 2} cy={size / 2} r={r} strokeWidth="10" />
      <circle
        className="df-flow-ring-progress"
        cx={size / 2}
        cy={size / 2}
        r={r}
        strokeWidth="10"
        strokeDasharray={c}
        strokeDashoffset={c - dash}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontSize="13"
        fontWeight="700"
        fill="var(--ink)"
      >
        {checkedOut ? 'Wrapped up' : checkedIn ? 'In flow' : 'Not started'}
      </text>
      <text
        x="50%"
        y="62%"
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--ink-faint)"
      >
        {checkedOut ? 'day complete' : checkedIn ? 'since ' + fmtTime(checkedIn) : 'check in to begin'}
      </text>
    </svg>
  );
};
