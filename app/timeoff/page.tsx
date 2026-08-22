'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Avatar } from '@/components/SharedAtoms';
import * as timeoffApi from '@/timeoffApi';

const LEAVE_TYPES = [
  { id: "pto", name: "Paid Time Off", allocated: 24 },
  { id: "sick", name: "Sick Leave", allocated: 7 },
  { id: "unpaid", name: "Unpaid Leave", allocated: 999 },
];

function LeaveStatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    Approved: { bg: "var(--success-bg)", color: "var(--success)" },
    Pending: { bg: "var(--warning-bg)", color: "var(--warning)" },
    Rejected: { bg: "var(--danger-bg)", color: "var(--danger)" },
  };
  const s = styles[status] || { bg: "var(--neutral-bg)", color: "var(--ink-soft)" };
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      padding: "3px 9px",
      borderRadius: 99,
      fontSize: 11.5,
      fontWeight: 700,
      display: "inline-block"
    }}>
      {status}
    </span>
  );
}

function AttachmentViewer({ path }: { path: string | null | undefined }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  if (!path) return <span style={{ color: "var(--ink-faint)" }}>—</span>;

  async function openAttachment() {
    setErr("");
    setLoading(true);
    try {
      const res = await timeoffApi.getLeaveAttachmentUrl(path);
      if (res.error || !res.data) {
        setErr("Failed to load link");
      } else {
        window.open(res.data, "_blank");
      }
    } catch {
      setErr("Failed to load link");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", gap: 2 }}>
      <button
        type="button"
        className="df-btn df-btn-ghost df-btn-sm"
        onClick={openAttachment}
        disabled={loading}
        style={{ padding: "3px 8px", fontSize: 12, color: "var(--brand-flow)" }}
      >
        {loading ? "Getting link..." : `📎 View attachment`}
      </button>
      {err && <span style={{ color: "var(--danger)", fontSize: 11 }}>{err}</span>}
    </div>
  );
}

function RequestTimeOffModal({
  allocations,
  onClose,
  onSubmit
}: {
  allocations: any[];
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
}) {
  const [form, setForm] = useState<{
    leaveTypeId: string;
    startDate: string;
    endDate: string;
    reason: string;
    attachmentFile: File | null;
    attachment: string;
  }>({
    leaveTypeId: "pto",
    startDate: "",
    endDate: "",
    reason: "",
    attachmentFile: null,
    attachment: ""
  });
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  function set(k: string, v: any) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    if (!form.startDate || !form.endDate || !form.reason) {
      setErr("Start date, end date, and reason are required.");
      return;
    }
    if (form.endDate < form.startDate) {
      setErr("End date cannot be before start date.");
      return;
    }
    const isSick = form.leaveTypeId === "sick";
    if (isSick && !form.attachmentFile) {
      setErr("Medical document/certificate attachment is required for Sick Leave.");
      return;
    }

    let storagePath: string | null = null;
    if (isSick && form.attachmentFile) {
      setUploading(true);
      try {
        const res = await timeoffApi.uploadLeaveAttachment(form.attachmentFile);
        if (res.error || !res.data?.path) {
          setErr(res.error?.message || "Attachment upload failed. Please try again.");
          setUploading(false);
          return;
        }
        storagePath = res.data.path;
      } catch (uploadErr: any) {
        setErr(uploadErr.message || "Attachment upload failed. Please try again.");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    setSubmitting(true);
    try {
      await onSubmit({
        leaveTypeId: form.leaveTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
        attachmentFile: form.attachmentFile,
        attachmentUrl: storagePath,
        attachment: storagePath || form.attachment || null
      });
    } catch (error: any) {
      setErr(error.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  const isSickSelected = form.leaveTypeId === "sick";

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.45)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      padding: 20
    }}>
      <div className="df-card" style={{ width: "100%", maxWidth: 460, background: "var(--card-bg, #ffffff)", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Request time off</h3>
          <button type="button" className="df-btn df-btn-ghost df-btn-sm" onClick={onClose} style={{ padding: "4px 8px" }}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14 }}>
            {err && (
              <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "10px 14px", borderRadius: 9, fontSize: 12.5, fontWeight: 600 }}>
                {err}
              </div>
            )}
            <div>
              <label className="df-label">Time-off type</label>
              <select className="df-select" value={form.leaveTypeId} onChange={e => set("leaveTypeId", e.target.value)}>
                {LEAVE_TYPES.map(t => {
                  const bal = (allocations || []).find(a => a.id === t.id || a.leaveTypeId === t.id);
                  return <option key={t.id} value={t.id}>{t.name}{bal ? ` (${bal.remaining} left)` : ""}</option>;
                })}
              </select>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}><label className="df-label">Start date</label><input className="df-input" type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} /></div>
              <div style={{ flex: 1 }}><label className="df-label">End date</label><input className="df-input" type="date" value={form.endDate} onChange={e => set("endDate", e.target.value)} /></div>
            </div>
            <div>
              <label className="df-label">Reason / remarks</label>
              <textarea className="df-textarea" rows={3} value={form.reason} onChange={e => set("reason", e.target.value)} />
            </div>
            <div>
              <label className="df-label">
                Attach document {isSickSelected ? <span style={{ color: "var(--danger)" }}>* (Required for Sick Leave)</span> : "(optional)"}
              </label>
              <input className="df-input" type="file" onChange={e => {
                const file = e.target.files?.[0] || null;
                setForm(f => ({ ...f, attachmentFile: file, attachment: file ? file.name : "" }));
              }} />
            </div>
          </div>
          <div style={{ padding: 22, display: "flex", gap: 10, justifyContent: "flex-end", borderTop: "1px solid var(--line)" }}>
            <button type="button" className="df-btn df-btn-ghost" onClick={onClose} disabled={uploading || submitting}>Cancel</button>
            <button type="submit" className="df-btn df-btn-dawn" disabled={uploading || submitting}>
              {uploading ? "Uploading..." : submitting ? "Submitting..." : "Submit request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DecisionModal({
  data,
  onClose,
  onConfirm
}: {
  data: { req: any; decision: "Approved" | "Rejected" };
  onClose: () => void;
  onConfirm: (comment: string) => Promise<void>;
}) {
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const approve = data.decision === "Approved";

  async function handleConfirm() {
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await onConfirm(comment);
    } catch (err: any) {
      setErrorMsg(err.message || "Action failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(15, 23, 42, 0.45)",
      backdropFilter: "blur(4px)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 100,
      padding: 20
    }}>
      <div className="df-card" style={{ width: "100%", maxWidth: 460, background: "var(--card-bg, #ffffff)", overflow: "hidden" }}>
        <div style={{ padding: "18px 22px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>{data.decision} request</h3>
          <button type="button" className="df-btn df-btn-ghost df-btn-sm" onClick={onClose} style={{ padding: "4px 8px" }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>
          <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 0 }}>
            {data.req.startDate} → {data.req.endDate} · "{data.req.reason}"
          </p>
          {(data.req.attachmentUrl || data.req.attachment) && (
            <div style={{ fontSize: 12.5, color: "var(--brand-flow)", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <span>Attachment:</span>
              <AttachmentViewer path={data.req.attachmentUrl || data.req.attachment} />
            </div>
          )}
          {errorMsg && (
            <div style={{ background: "var(--danger-bg)", color: "var(--danger)", padding: "10px 14px", borderRadius: 8, fontSize: 12.5, marginBottom: 14, fontWeight: 600 }}>
              {errorMsg}
            </div>
          )}
          <label className="df-label">Comment (optional)</label>
          <textarea
            className="df-textarea"
            rows={3}
            placeholder={approve ? "e.g. Approved, enjoy your time off!" : "Let them know why."}
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>
        <div style={{ padding: "0 22px 22px", display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button className="df-btn df-btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
          <button className={`df-btn ${approve ? "df-btn-success" : "df-btn-danger"}`} onClick={handleConfirm} disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : `Confirm ${data.decision.toLowerCase()}`}
          </button>
        </div>
      </div>
    </div>
  );
}

function TimeOffContent() {
  const { user, role } = useAuth();
  const isAdmin = role === 'admin';
  const dashboardLink = isAdmin ? '/admin/dashboard' : '/dashboard';

  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [adminFilter, setAdminFilter] = useState("Pending");
  const [decisionModal, setDecisionModal] = useState<{ req: any; decision: "Approved" | "Rejected" } | null>(null);

  const empId = user?.id || 'emp_curr';

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const session = { role, employeeId: empId };
      const [reqs, allocs] = await Promise.all([
        timeoffApi.fetchLeaveRequests(session),
        timeoffApi.getAllocations(empId)
      ]);
      const resolvedReqs = Array.isArray(reqs) ? reqs : (reqs as any)?.data || [];
      const resolvedAllocs = Array.isArray(allocs) ? allocs : (allocs as any)?.data || [];
      setLeaveRequests(resolvedReqs);
      setAllocations(resolvedAllocs);
    } catch (err) {
      console.error('Failed to load leave data:', err);
    } finally {
      setLoading(false);
    }
  }, [role, empId]);


  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleCreateLeaveRequest(payload: any) {
    await timeoffApi.submitLeaveRequest(empId, payload);
    setRequestModalOpen(false);
    await loadData();
  }

  async function handleDecideLeave(reqId: string, decision: "Approved" | "Rejected", comment: string) {
    await timeoffApi.decideLeave(reqId, decision, comment);
    setDecisionModal(null);
    await loadData();
  }

  const filteredAdminRows = leaveRequests
    .filter(r => adminFilter === "All" || r.status === adminFilter)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div style={{ padding: "32px 40px", maxWidth: 1040, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <a href={dashboardLink} style={{ fontSize: 13, color: "var(--brand-flow)", textDecoration: "none", fontWeight: 600 }}>
            ← Back to Dashboard
          </a>
          <h1 className="df-display" style={{ fontSize: 26, margin: "8px 0 0", fontWeight: 700, color: "var(--ink)" }}>
            Time Off & Leave Management
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13.5, color: "var(--ink-soft)" }}>
            {isAdmin ? "Review workforce time off requests, approve or reject applications, and leave comments." : "Check your leave balances, submit time off requests, and track approval status."}
          </p>
        </div>
        {!isAdmin && (
          <button className="df-btn df-btn-dawn" onClick={() => setRequestModalOpen(true)}>
            + Request time off
          </button>
        )}
      </div>

      {/* Employee Leave Allocations Section */}
      {!isAdmin && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Leave Allocations
          </h2>
          {loading ? (
            <div style={{ padding: 20, color: "var(--ink-faint)" }}>Loading balances...</div>
          ) : allocations && allocations.length > 0 ? (
            <div style={{ display: "flex", gap: 14 }}>
              {allocations.map(a => (
                <div key={a.id || a.leaveTypeId} className="df-card" style={{ padding: 18, flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 600 }}>{a.name}</div>
                  <div className="df-display" style={{ fontSize: 24, margin: "4px 0" }}>
                    {a.remaining} <span style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-body)" }}>days left</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>{a.used} used of {a.allocated}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 14 }}>
              {LEAVE_TYPES.map(t => (
                <div key={t.id} className="df-card" style={{ padding: 18, flex: 1 }}>
                  <div style={{ fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 600 }}>{t.name}</div>
                  <div className="df-display" style={{ fontSize: 24, margin: "4px 0" }}>
                    {t.allocated} <span style={{ fontSize: 12, color: "var(--ink-faint)", fontFamily: "var(--font-body)" }}>days left</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>0 used of {t.allocated}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Admin Review Table */}
      {isAdmin ? (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
            {["Pending", "Approved", "Rejected", "All"].map(f => (
              <button
                key={f}
                className={`df-btn df-btn-sm ${adminFilter === f ? "df-btn-primary" : "df-btn-ghost"}`}
                onClick={() => setAdminFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="df-card" style={{ padding: "6px 20px 14px" }}>
            {loading ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-soft)" }}>Loading time off requests...</div>
            ) : filteredAdminRows.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-faint)" }}>No requests match this filter.</div>
            ) : (
              <table className="df-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Attachment</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdminRows.map(r => (
                    <tr key={r.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <Avatar name={r.employeeId} size={26} />
                          <span>{r.employeeId}</span>
                        </div>
                      </td>
                      <td>{LEAVE_TYPES.find(t => t.id === r.leaveTypeId)?.name || r.leaveTypeId}</td>
                      <td className="df-mono" style={{ fontSize: 12 }}>{r.startDate} → {r.endDate}</td>
                      <td style={{ maxWidth: 220, color: "var(--ink-soft)" }}>{r.reason}</td>
                      <td><AttachmentViewer path={r.attachmentUrl || r.attachment} /></td>
                      <td><LeaveStatusBadge status={r.status} /></td>
                      <td>
                        {r.status === "Pending" ? (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button
                              className="df-btn df-btn-success df-btn-sm"
                              onClick={() => setDecisionModal({ req: r, decision: "Approved" })}
                            >
                              Approve
                            </button>
                            <button
                              className="df-btn df-btn-danger df-btn-sm"
                              onClick={() => setDecisionModal({ req: r, decision: "Rejected" })}
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>{r.admin_comment || r.comment || "—"}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      ) : (
        /* Employee Request History Table */
        <div>
          <h2 style={{ fontSize: 14, fontWeight: 700, margin: "0 0 12px", color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Leave Request History
          </h2>
          <div className="df-card" style={{ padding: "6px 20px 14px" }}>
            {loading ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-soft)" }}>Loading request history...</div>
            ) : leaveRequests.length === 0 ? (
              <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--ink-faint)" }}>No leave requests submitted yet.</div>
            ) : (
              <table className="df-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Dates</th>
                    <th>Reason</th>
                    <th>Attachment</th>
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
                      <td><AttachmentViewer path={r.attachmentUrl || r.attachment} /></td>
                      <td><LeaveStatusBadge status={r.status} /></td>
                      <td style={{ color: "var(--ink-faint)", fontSize: 12.5 }}>{r.admin_comment || r.comment || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Submit Request Modal */}
      {requestModalOpen && (
        <RequestTimeOffModal
          allocations={allocations}
          onClose={() => setRequestModalOpen(false)}
          onSubmit={handleCreateLeaveRequest}
        />
      )}

      {/* Admin Decision Modal */}
      {decisionModal && (
        <DecisionModal
          data={decisionModal}
          onClose={() => setDecisionModal(null)}
          onConfirm={(comment) => handleDecideLeave(decisionModal.req.id, decisionModal.decision, comment)}
        />
      )}
    </div>
  );
}

export default function TimeOffPage() {
  return (
    <ProtectedRoute>
      <TimeOffContent />
    </ProtectedRoute>
  );
}
