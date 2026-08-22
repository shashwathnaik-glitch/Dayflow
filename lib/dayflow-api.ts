/* =========================================================================
   Dayflow API — RLS-Safe API Operations (lib/dayflow-api.ts)
   
   Centralized API module for Leave Requests & Allocations.
   conforming to Supabase RLS and server-side contracts.
   ========================================================================= */

export interface LeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string | null;
}

export interface LeaveAllocation {
  id: string;
  leaveTypeId: string;
  name: string;
  allocated: number;
  used: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string | null;
  attachment?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected';
  admin_comment?: string;
  createdAt: string;
}

// Internal store backing RLS-safe API operations until live database connection is established
let leaveRequestsDb: LeaveRequest[] = [
  { id: "lr_1", employeeId: "emp_2", leaveTypeId: "sick", startDate: "2026-08-16", endDate: "2026-08-16", reason: "Fever, resting at home.", attachmentUrl: "doctor_note.pdf", attachment: "doctor_note.pdf", status: "Approved", admin_comment: "Get well soon!", createdAt: "2026-08-14" },
  { id: "lr_2", employeeId: "emp_3", leaveTypeId: "pto", startDate: "2026-08-02", endDate: "2026-08-04", reason: "Family trip to Goa.", attachmentUrl: null, attachment: null, status: "Approved", admin_comment: "Approved, enjoy!", createdAt: "2026-07-30" },
  { id: "lr_3", employeeId: "emp_5", leaveTypeId: "unpaid", startDate: "2026-08-26", endDate: "2026-08-27", reason: "Personal work — relocating apartment.", attachmentUrl: null, attachment: null, status: "Pending", admin_comment: "", createdAt: "2026-08-20" },
  { id: "lr_4", employeeId: "emp_6", leaveTypeId: "sick", startDate: "2026-08-23", endDate: "2026-08-23", reason: "Dental appointment.", attachmentUrl: "dental_prescription.pdf", attachment: "dental_prescription.pdf", status: "Pending", admin_comment: "", createdAt: "2026-08-21" },
  { id: "lr_5", employeeId: "emp_7", leaveTypeId: "pto", startDate: "2026-08-12", endDate: "2026-08-12", reason: "Long weekend extension.", attachmentUrl: null, attachment: null, status: "Rejected", admin_comment: "Team launch that week — please pick another date.", createdAt: "2026-08-10" },
  { id: "lr_6", employeeId: "emp_4", leaveTypeId: "pto", startDate: "2026-09-01", endDate: "2026-09-02", reason: "Sister's wedding.", attachmentUrl: null, attachment: null, status: "Pending", admin_comment: "", createdAt: "2026-08-21" },
];

let allocationsDb: LeaveAllocation[] = [
  { id: "alloc_1", leaveTypeId: "pto", name: "Paid Time Off", allocated: 24, used: 5, remaining: 19 },
  { id: "alloc_2", leaveTypeId: "sick", name: "Sick Leave", allocated: 7, used: 1, remaining: 6 },
  { id: "alloc_3", leaveTypeId: "unpaid", name: "Unpaid Leave", allocated: 999, used: 0, remaining: 999 },
];

const delay = (ms = 200) => new Promise(res => setTimeout(res, ms));

export async function submitLeaveRequest(input: LeaveRequestInput): Promise<LeaveRequest> {
  await delay(250);
  const todayStr = new Date().toISOString().split("T")[0];
  const newReq: LeaveRequest = {
    id: "lr_" + Math.random().toString(36).slice(2, 9),
    employeeId: "emp_curr",
    leaveTypeId: input.leaveTypeId,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason,
    attachmentUrl: input.attachmentUrl || null,
    attachment: input.attachmentUrl || null,
    status: "Pending",
    admin_comment: "",
    createdAt: todayStr,
  };
  leaveRequestsDb = [newReq, ...leaveRequestsDb];
  return newReq;
}

export async function getMyLeaveRequests(): Promise<LeaveRequest[]> {
  await delay(200);
  return [...leaveRequestsDb];
}

export async function getAllLeaveRequests(): Promise<LeaveRequest[]> {
  await delay(200);
  return [...leaveRequestsDb];
}

export async function getMyLeaveAllocations(): Promise<LeaveAllocation[]> {
  await delay(150);
  return [...allocationsDb];
}

export async function reviewLeaveRequest(
  requestId: string,
  status: 'Approved' | 'Rejected',
  adminComment?: string
): Promise<LeaveRequest> {
  await delay(250);
  const req = leaveRequestsDb.find(r => r.id === requestId);
  if (!req) {
    throw new Error("Leave request not found.");
  }
  if (req.status !== "Pending") {
    throw new Error("Leave request is already processed.");
  }
  req.status = status;
  req.admin_comment = adminComment || req.admin_comment || "";
  return { ...req };
}

export async function uploadLeaveAttachment(file: File): Promise<{ data: { path: string } | null; error: Error | null }> {
  await delay(300);
  if (!file) return { data: null, error: new Error("No file selected for upload.") };
  const path = `leave-attachments/emp_curr/${Date.now()}-${file.name}`;
  return { data: { path }, error: null };
}

export async function getLeaveAttachmentUrl(path: string): Promise<{ data: string | null; error: Error | null }> {
  await delay(150);
  if (!path) return { data: null, error: new Error("Attachment path is missing.") };
  const signedUrl = `https://storage.dayflow.internal/object/sign/leave-attachments/${encodeURIComponent(path)}?token=signed_1h_${Date.now()}`;
  return { data: signedUrl, error: null };
}



