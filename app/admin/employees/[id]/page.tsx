'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { 
  Avatar, 
  AttendanceBadge, 
  LeaveStatusBadge,
  Icon, 
  EmptyState 
} from '@/components/SharedAtoms';
import { 
  getEmployee, 
  getAllAttendance, 
  getAllLeaveRequests, 
  calculateSalaryPreview,
  updateEmployeeSalary
} from '@/lib/dayflow-api';
import { supabase } from '@/lib/supabaseClient';
import { 
  mapEmployeeDbToUi, 
  mapAttendanceDbToUi, 
  mapLeaveRequestDbToUi 
} from '@/lib/dataMappers';

export const ATTENDANCE_STATUS = {
  PRESENT: "Present",
  HALF_DAY: "Half-day",
  ABSENT: "Absent",
  LEAVE: "On Leave"
};

const LEAVE_TYPES = [
  { id: "pto", name: "Paid Time Off" },
  { id: "sick", name: "Sick Leave" },
  { id: "unpaid", name: "Unpaid Leave" }
];

function fmtDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function fmtTime(d: any) {
  if (!d) return "—";
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  return dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function fmtINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

function InfoField({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <div className="df-label" style={{ marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 13.5 }}>{value || "—"}</div>
    </div>
  );
}

function InfoGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="df-card" style={{ padding: 22, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "18px 20px" }}>
      {children}
    </div>
  );
}

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [emp, setEmp] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState("basic");
  
  // Salary tab state
  const [salaryLoading, setSalaryLoading] = useState(false);
  const [salaryStructure, setSalaryStructure] = useState<any>(null);
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [wageInput, setWageInput] = useState(0);
  const [previewSalary, setPreviewSalary] = useState<any>(null);
  const [salaryError, setSalaryError] = useState("");

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [empRes, attRes, leaveRes] = await Promise.all([
        getEmployee(id as string),
        getAllAttendance(undefined, { employeeId: id as string }),
        getAllLeaveRequests({ employeeId: id as string })
      ]);

      if (empRes.data) {
        const mappedEmp = mapEmployeeDbToUi(empRes.data);
        if (mappedEmp) {
          setEmp(mappedEmp);
          setWageInput(mappedEmp.monthlyWage || 0);
          setSalaryStructure(empRes.data.salary || null);
        }
      }

      setAttendance((attRes.data || []).map(mapAttendanceDbToUi));
      setLeaveRequests((leaveRes.data || []).map(mapLeaveRequestDbToUi));

      // Query leave allocations directly for this employee
      const { data: allocData } = await supabase
        .from('leave_allocations')
        .select(`*, leave_type:leave_types(id, name)`)
        .eq('employee_id', id);

      // Map allocations
      const mappedAlloc = LEAVE_TYPES.map(lt => {
        const a = (allocData || []).find((x: any) => x.leave_type_id === lt.id) || { allocated_days: lt.id === 'pto' ? 24 : lt.id === 'sick' ? 7 : 0, used_days: 0 };
        const allocated = a.allocated_days ?? 0;
        const used = a.used_days ?? 0;
        return {
          id: lt.id,
          name: lt.name,
          allocated,
          used,
          remaining: allocated - used
        };
      });
      setAllocations(mappedAlloc);

    } catch (err) {
      console.error("Error loading employee details:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live salary preview on wage change
  useEffect(() => {
    if (!isEditingSalary) return;
    let active = true;
    
    async function fetchPreview() {
      try {
        const res = await calculateSalaryPreview(Number(wageInput) || 0);
        if (active && res.data) {
          // Map snake_case response from Supabase calculate_salary RPC
          setPreviewSalary({
            basic: res.data.basic,
            hra: res.data.hra,
            standardAllowance: res.data.standard_allowance,
            performanceBonus: res.data.performance_bonus,
            lta: res.data.lta,
            fixedAllowance: res.data.fixed_allowance,
            pf: res.data.pf,
            professionalTax: res.data.professional_tax,
            gross: res.data.gross,
            net: res.data.net
          });
        }
      } catch (err) {
        console.error("Preview failed:", err);
      }
    }

    fetchPreview();
    return () => { active = false; };
  }, [wageInput, isEditingSalary]);

  const activeSalary = isEditingSalary ? previewSalary : salaryStructure;

  const handleSaveSalary = async () => {
    setSalaryError("");
    setSalaryLoading(true);
    try {
      const { error } = await updateEmployeeSalary(id as string, Number(wageInput));
      if (error) {
        setSalaryError(error.message || "Failed to update salary.");
      } else {
        setIsEditingSalary(false);
        await loadData();
      }
    } catch (err: any) {
      setSalaryError(err.message || "Failed to update salary.");
    } finally {
      setSalaryLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <p style={{ color: "var(--ink-soft)", fontSize: "15px" }}>Loading Employee details...</p>
      </div>
    );
  }

  if (!emp) {
    return (
      <div style={{ padding: 40, maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
        <h2 className="df-display">Employee not found</h2>
        <a href="/admin/employees" className="df-btn df-btn-ghost df-btn-sm" style={{ marginTop: 16 }}>Back to employees</a>
      </div>
    );
  }

  // Calculate live status for header
  const getTodayStatus = () => {
    const todayStr = fmtDate(new Date());
    const onLeave = leaveRequests.some(r => r.status === "Approved" && todayStr >= r.startDate && todayStr <= r.endDate);
    if (onLeave) return ATTENDANCE_STATUS.LEAVE;

    const a = attendance.find(x => x.date === todayStr);
    if (a) {
      if (a.status === ATTENDANCE_STATUS.PRESENT) return ATTENDANCE_STATUS.PRESENT;
      if (a.status === ATTENDANCE_STATUS.HALF_DAY) return ATTENDANCE_STATUS.HALF_DAY;
      if (a.status === ATTENDANCE_STATUS.LEAVE) return ATTENDANCE_STATUS.LEAVE;
      if (a.status === ATTENDANCE_STATUS.ABSENT) return ATTENDANCE_STATUS.ABSENT;
    }
    return "Not Checked In";
  };

  const status = getTodayStatus();

  return (
    <div style={{ padding: 40, maxWidth: 1040, margin: '0 auto' }}>
      {/* Back button */}
      <button className="df-btn df-btn-ghost df-btn-sm" onClick={() => router.push('/admin/employees')} style={{ marginBottom: 16 }}>
        <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon.chev /></span> Back to employees
      </button>

      {/* Header Info */}
      <div className="df-card" style={{ padding: 22, marginBottom: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <Avatar name={emp.name} size={56} url={emp.profile_image_url} />
          <div>
            <h2 style={{ fontSize: 20, margin: 0 }}>{emp.name}</h2>
            <p style={{ margin: "3px 0 0", color: "var(--ink-soft)", fontSize: 13.5 }}>{emp.position} · {emp.department}</p>
            <p className="df-mono" style={{ margin: "6px 0 0", fontSize: 12, color: "var(--ink-faint)" }}>{emp.loginId}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AttendanceBadge status={status} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--line)", marginBottom: 20, overflowX: "auto" }}>
        {["basic", "private", "salary", "attendance", "timeoff"].map(t => (
          <div key={t} className={`df-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)} style={{ textTransform: "capitalize" }}>
            {t === "timeoff" ? "Time Off" : t}
          </div>
        ))}
      </div>

      {/* Tab Contents */}
      {tab === "basic" && (
        <InfoGrid>
          <InfoField label="Full name" value={emp.name} />
          <InfoField label="Mobile" value={emp.mobile} />
          <InfoField label="Work email" value={emp.email} />
          <InfoField label="Department" value={emp.department} />
          <InfoField label="Job position" value={emp.position} />
          <InfoField label="Manager" value={emp.manager} />
          <InfoField label="Company" value={emp.company} />
          <InfoField label="Location" value={emp.location} />
          <InfoField label="Date of birth" value={emp.dob} />
          <InfoField label="Personal email" value={emp.personalEmail} />
          <InfoField label="Gender" value={emp.gender} />
          <InfoField label="Nationality" value={emp.nationality} />
          <InfoField label="Marital status" value={emp.maritalStatus} />
          <InfoField label="Joining date" value={emp.joinDate} />
          <InfoField label="Address" value={emp.address} />
        </InfoGrid>
      )}

      {tab === "private" && (
        <InfoGrid>
          <InfoField label="PAN" value={emp.privateInfo.pan} />
          <InfoField label="UAN" value={emp.privateInfo.uan} />
          <InfoField label="Bank details" value={emp.privateInfo.bank} />
          <InfoField label="Resume" value={emp.privateInfo.resume} />
          <InfoField label="Skills" value={emp.privateInfo.skills.join(", ") || "—"} />
          <InfoField label="Certifications" value={emp.privateInfo.certifications.join(", ") || "—"} />
        </InfoGrid>
      )}

      {tab === "salary" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Salary Administration panel */}
          <div className="df-card" style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            {isEditingSalary ? (
              <div style={{ display: "flex", gap: 14, alignItems: "center", width: "100%", flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <label className="df-label">Monthly Wage (INR)</label>
                  <input type="number" className="df-input" value={wageInput} onChange={e => setWageInput(Number(e.target.value))} />
                </div>
                <div style={{ display: "flex", gap: 10, alignSelf: "flex-end" }}>
                  <button className="df-btn df-btn-success" onClick={handleSaveSalary} disabled={salaryLoading}>
                    {salaryLoading ? "Saving..." : "Save"}
                  </button>
                  <button className="df-btn df-btn-ghost" onClick={() => {
                    setIsEditingSalary(false);
                    setWageInput(emp.monthlyWage || 0);
                  }} disabled={salaryLoading}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>Salary Administration</span>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--ink-faint)" }}>Manage monthly wage and allowance structure.</p>
                </div>
                <button className="df-btn df-btn-ghost df-btn-sm" onClick={() => setIsEditingSalary(true)}>Edit Structure</button>
              </>
            )}
          </div>

          {salaryError && (
            <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "10px 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 600 }}>
              {salaryError}
            </div>
          )}

          {/* Salary Components Breakdown */}
          {activeSalary ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              <div className="df-card" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 14, margin: "0 0 14px" }}>Earnings {isEditingSalary && <span style={{ color: "var(--brand-dawn)", fontSize: 11 }}>(Preview)</span>}</h3>
                {[
                  ["Basic Salary", activeSalary.basic],
                  ["HRA", activeSalary.hra],
                  ["Standard Allowance", activeSalary.standardAllowance],
                  ["Performance Bonus", activeSalary.performanceBonus],
                  ["Leave Travel Allowance", activeSalary.lta],
                  ["Fixed Allowance", activeSalary.fixedAllowance]
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13.5, borderBottom: "1px solid var(--line)" }}>
                    <span style={{ color: "var(--ink-soft)" }}>{label}</span>
                    <span className="df-mono">{fmtINR(val || 0)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: 14, fontWeight: 700 }}>
                  <span>Gross Salary</span>
                  <span className="df-mono">{fmtINR(activeSalary.gross || 0)}</span>
                </div>
              </div>
              <div className="df-card" style={{ padding: 22 }}>
                <h3 style={{ fontSize: 14, margin: "0 0 14px" }}>Deductions {isEditingSalary && <span style={{ color: "var(--brand-dawn)", fontSize: 11 }}>(Preview)</span>}</h3>
                {[
                  ["Provident Fund", activeSalary.pf],
                  ["Professional Tax", activeSalary.professionalTax]
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13.5, borderBottom: "1px solid var(--line)" }}>
                    <span style={{ color: "var(--ink-soft)" }}>{label}</span>
                    <span className="df-mono" style={{ color: "var(--danger)" }}>−{fmtINR(val || 0)}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: 16, fontWeight: 700, color: "var(--success)" }}>
                  <span>Net Salary / month</span>
                  <span className="df-mono">{fmtINR(activeSalary.net || 0)}</span>
                </div>
                <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 14, lineHeight: 1.5 }}>
                  Wage type: Monthly · {fmtINR(isEditingSalary ? Number(wageInput) : emp.monthlyWage)}/mo. Figures are a hackathon demonstration of salary structure, not statutory payroll advice.
                </p>
              </div>
            </div>
          ) : (
            <div className="df-card" style={{ padding: 30, textAlign: 'center' }}>
              <p style={{ color: "var(--ink-soft)", fontSize: 13.5 }}>No salary components configured for this employee yet.</p>
            </div>
          )}
        </div>
      )}

      {tab === "attendance" && (
        attendance.length === 0 ? (
          <EmptyState title="No attendance records yet" subtitle="Records appear once check-ins begin." />
        ) : (
          <div className="df-card df-scrollbar" style={{ padding: "6px 20px 14px", maxHeight: 420, overflowY: "auto" }}>
            <table className="df-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Day</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Work Hrs</th>
                  <th>Extra Hrs</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((r, i) => (
                  <tr key={i}>
                    <td className="df-mono" style={{ fontSize: 12 }}>{r.date}</td>
                    <td>{r.day}</td>
                    <td>{fmtTime(r.checkIn)}</td>
                    <td>{fmtTime(r.checkOut)}</td>
                    <td>{r.workHours || "—"}</td>
                    <td>{r.extraHours || "—"}</td>
                    <td><AttendanceBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {tab === "timeoff" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Allocations Balance Row */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {allocations.map(a => (
              <div key={a.id} className="df-card" style={{ padding: 16, flex: 1, minWidth: 160 }}>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 600 }}>{a.name}</div>
                <div className="df-display" style={{ fontSize: 22, margin: "4px 0" }}>
                  {a.remaining} <span style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-body)" }}>days left</span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{a.used} used of {a.allocated}</div>
              </div>
            ))}
          </div>

          {/* Time Off history table */}
          {leaveRequests.length === 0 ? (
            <EmptyState title="No time-off requests" subtitle="Requests will show up here." />
          ) : (
            <div className="df-card" style={{ padding: "6px 20px 14px" }}>
              <table className="df-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th>Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.map(r => (
                    <tr key={r.id}>
                      <td>{LEAVE_TYPES.find(t => t.id === r.leaveTypeId)?.name || r.leaveTypeId}</td>
                      <td className="df-mono" style={{ fontSize: 12 }}>{r.startDate} → {r.endDate}</td>
                      <td style={{ color: "var(--ink-soft)" }}>{r.reason}</td>
                      <td><LeaveStatusBadge status={r.status} /></td>
                      <td style={{ color: "var(--ink-faint)", fontSize: 12.5 }}>{r.admin_comment || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
