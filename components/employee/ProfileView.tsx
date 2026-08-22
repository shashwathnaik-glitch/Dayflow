'use client';

import React, { useState, useEffect } from 'react';
import { fetchEmployeePrivateInfoApi } from '@/services/employeeService.js';

interface EmployeeProfileViewProps {
  emp: any;
  session?: any;
}

function InfoField({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="df-label" style={{ marginBottom: 4, color: 'var(--ink-soft)' }}>{label}</div>
      <div style={{ fontSize: 13.5, fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="df-card"
      style={{
        padding: 22,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '20px 24px'
      }}
    >
      {children}
    </div>
  );
}

export const ProfileView: React.FC<EmployeeProfileViewProps> = ({ emp, session }) => {
  const [tab, setTab] = useState<'basic' | 'private'>('basic');
  const [privateInfo, setPrivateInfo] = useState<any>(emp?.privateInfo || null);
  const [loadingPrivate, setLoadingPrivate] = useState<boolean>(false);
  const [privateError, setPrivateError] = useState<string>('');

  const empId = emp?.id || session?.employeeId;

  useEffect(() => {
    if (tab === 'private' && empId) {
      setLoadingPrivate(true);
      setPrivateError('');

      const activeSession = session || { role: 'employee', employeeId: empId };

      fetchEmployeePrivateInfoApi(empId, activeSession)
        .then((res: any) => {
          if (res && res.ok && res.data) {
            setPrivateInfo(res.data);
          } else {
            if (emp?.privateInfo) {
              setPrivateInfo(emp.privateInfo);
            } else {
              setPrivateError(res?.error || 'Unable to load private details.');
            }
          }
        })
        .catch((err: any) => {
          console.error('Error fetching private details:', err);
          if (emp?.privateInfo) {
            setPrivateInfo(emp.privateInfo);
          } else {
            setPrivateError('Failed to connect to service.');
          }
        })
        .finally(() => setLoadingPrivate(false));
    }
  }, [tab, empId, session, emp]);

  if (!emp && !empId) return null;

  const p = privateInfo || {};
  const skillsText = Array.isArray(p.skills)
    ? p.skills.join(', ')
    : (typeof p.skills === 'string' ? p.skills : '—');

  const certsText = Array.isArray(p.certifications)
    ? p.certifications.join(', ')
    : (typeof p.certifications === 'string' ? p.certifications : '—');

  return (
    <div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', marginBottom: 20 }}>
        <button
          type="button"
          className={`df-tab ${tab === 'basic' ? 'active' : ''}`}
          style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}
          onClick={() => setTab('basic')}
        >
          Basic Information
        </button>
        <button
          type="button"
          className={`df-tab ${tab === 'private' ? 'active' : ''}`}
          style={{ cursor: 'pointer', background: 'transparent', border: 'none' }}
          onClick={() => setTab('private')}
        >
          Private & Documents
        </button>
      </div>

      {tab === 'basic' && (
        <InfoGrid>
          <InfoField label="Full name" value={emp?.name || `${emp?.first_name || ''} ${emp?.last_name || ''}`.trim() || 'Employee'} />
          <InfoField label="Work email" value={emp?.email || emp?.work_email || emp?.personal_email} />
          <InfoField label="Mobile" value={emp?.mobile} />
          <InfoField label="Department" value={emp?.department || emp?.department_name || 'Engineering'} />
          <InfoField label="Job position" value={emp?.position || emp?.job_position_title || 'Team Member'} />
          <InfoField label="Company" value={emp?.company || 'Dayflow Inc.'} />
          <InfoField label="Location" value={emp?.location || 'Remote'} />
          <InfoField label="Joining date" value={emp?.joinDate || emp?.joining_date} />
          <InfoField label="Gender" value={emp?.gender} />
          <InfoField label="Nationality" value={emp?.nationality} />
          <InfoField label="Marital status" value={emp?.marital_status || emp?.maritalStatus} />
          <InfoField label="Address" value={emp?.residing_address || emp?.address} />
        </InfoGrid>
      )}

      {tab === 'private' && (
        <>
          {loadingPrivate ? (
            <div className="df-card" style={{ padding: 24, textAlign: 'center', color: 'var(--ink-soft)' }}>
              Loading secure private details...
            </div>
          ) : privateError ? (
            <div className="df-card" style={{ padding: 24, color: 'var(--danger)', background: 'var(--danger-bg)' }}>
              {privateError}
            </div>
          ) : (
            <InfoGrid>
              <InfoField label="PAN" value={p.pan || p.pan_no} />
              <InfoField label="UAN" value={p.uan || p.uan_no} />
              <InfoField label="Bank details" value={p.bank || (p.bank_name ? `${p.bank_name} (${p.bank_account_number || ''})` : null)} />
              <InfoField label="Resume / Document" value={p.resume || p.resume_filename} />
              <InfoField label="Skills" value={skillsText} />
              <InfoField label="Certifications" value={certsText} />
            </InfoGrid>
          )}
        </>
      )}
    </div>
  );
};
