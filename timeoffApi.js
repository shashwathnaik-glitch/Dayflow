/* =========================================================================
   Dayflow — Time Off API Access Layer (timeoffApi.js)
   
   Swapped internals to delegate to lib/dayflow-api.ts while keeping
   client-side pre-validations (date range, sick attachment, overlap check).
   ========================================================================= */

import * as dayflowApi from "./lib/dayflow-api.ts";

const LEAVE_TYPES = [
  { id: "pto", name: "Paid Time Off", allocated: 24 },
  { id: "sick", name: "Sick Leave", allocated: 7 },
  { id: "unpaid", name: "Unpaid Leave", allocated: 999 },
];

function dateOverlaps(startA, endA, startB, endB) {
  return startA <= endB && endA >= startB;
}

/**
 * 1. fetchLeaveRequests(session)
 * Maps to dayflowApi.getAllLeaveRequests() for admin or dayflowApi.getMyLeaveRequests() for employee.
 */
export async function fetchLeaveRequests(session) {
  if (!session) return [];
  if (session.role === "admin") {
    return await dayflowApi.getAllLeaveRequests();
  }
  return await dayflowApi.getMyLeaveRequests();
}

/**
 * 2. getAllocations(empId)
 * Maps to dayflowApi.getMyLeaveAllocations().
 */
export async function getAllocations(empId) {
  return await dayflowApi.getMyLeaveAllocations();
}

/**
 * 3. submitLeaveRequest(empId, payload)
 * Pre-checks client validations (date range, sick attachment, overlap) then calls dayflowApi.submitLeaveRequest.
 */
export async function submitLeaveRequest(empId, payload) {
  const { leaveTypeId, startDate, endDate, reason, attachment, attachmentUrl, attachmentFile } = payload;

  if (!startDate || !endDate || !reason) {
    throw new Error("Start date, end date, and reason are required.");
  }

  // Pre-check 1: endDate >= startDate
  if (endDate < startDate) {
    throw new Error("End date cannot be before start date.");
  }

  // Pre-check 2: attachment required if Sick Leave (checking File object, path string, or url)
  const finalAttachment = attachmentUrl || attachment || (attachmentFile ? attachmentFile.name : null);
  const isSickLeave = leaveTypeId === "sick" || (LEAVE_TYPES.find(t => t.id === leaveTypeId)?.name === "Sick Leave");
  if (isSickLeave && (!attachmentFile && (!finalAttachment || String(finalAttachment).trim() === ""))) {
    throw new Error("Medical document/certificate attachment is required for Sick Leave.");
  }

  // Pre-check 3: Overlap check
  const existingRequests = await dayflowApi.getMyLeaveRequests();
  const activeRequests = existingRequests.filter(r => r.status === "Pending" || r.status === "Approved");
  const hasOverlap = activeRequests.some(r => dateOverlaps(startDate, endDate, r.startDate, r.endDate));
  if (hasOverlap) {
    throw new Error("You already have a Pending or Approved leave request overlapping with these dates.");
  }

  return await dayflowApi.submitLeaveRequest({
    leaveTypeId,
    startDate,
    endDate,
    reason,
    attachmentUrl: finalAttachment,
  });
}

/**
 * 4. decideLeave(reqId, decision, admin_comment)
 * Maps to dayflowApi.reviewLeaveRequest(reqId, decision, admin_comment).
 */
export async function decideLeave(reqId, decision, admin_comment) {
  if (decision !== "Approved" && decision !== "Rejected") {
    throw new Error("Status must be 'Approved' or 'Rejected' exactly.");
  }
  return await dayflowApi.reviewLeaveRequest(reqId, decision, admin_comment);
}

/**
 * Storage Attachment Helpers (Member 1)
 */
export async function uploadLeaveAttachment(file) {
  return await dayflowApi.uploadLeaveAttachment(file);
}

export async function getLeaveAttachmentUrl(path) {
  return await dayflowApi.getLeaveAttachmentUrl(path);
}

