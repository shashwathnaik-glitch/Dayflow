export function mapEmployeeDbToUi(emp: any) {
  if (!emp) return null;
  return {
    id: emp.id,
    loginId: emp.login_id,
    firstName: emp.first_name,
    lastName: emp.last_name,
    name: `${emp.first_name} ${emp.last_name}`,
    email: emp.email,
    personalEmail: emp.personal_email || "",
    mobile: emp.mobile || "",
    department: emp.department?.name || "",
    position: emp.job_position?.title || "",
    manager: emp.manager || "—",
    company: emp.company || "Dayflow Inc.",
    location: emp.location || "Bengaluru HQ",
    dob: emp.date_of_birth || "",
    address: emp.residing_address || "",
    gender: emp.gender || "",
    nationality: emp.nationality || "",
    maritalStatus: emp.marital_status || "",
    joinDate: emp.joining_date || "",
    profile_image_url: emp.profile_image_url || null,
    monthlyWage: emp.monthly_wage || 0,
    privateInfo: {
      pan: emp.pan_no || "—",
      uan: emp.uan_no || "—",
      bank: emp.bank_name ? `${emp.bank_name} •••• ${emp.bank_account_number?.slice(-4) || ""}` : "—",
      bankName: emp.bank_name || "",
      bankAccount: emp.bank_account_number || "",
      bankIfsc: emp.bank_ifsc || "",
      resume: emp.resume_filename || "—",
      skills: emp.skills || [],
      certifications: emp.certifications || []
    }
  };
}

export function mapAttendanceDbToUi(att: any) {
  if (!att) return null;
  return {
    id: att.id,
    employeeId: att.employee_id,
    date: att.date,
    day: att.day || "",
    checkIn: att.check_in || null,
    checkOut: att.check_out || null,
    workHours: att.work_hours || 0,
    extraHours: att.extra_hours || 0,
    status: att.status || ""
  };
}

export function mapLeaveRequestDbToUi(req: any) {
  if (!req) return null;
  return {
    id: req.id,
    employeeId: req.employee_id,
    leaveTypeId: req.leave_type_id,
    startDate: req.start_date,
    endDate: req.end_date,
    reason: req.reason || "",
    attachmentUrl: req.attachment_url || null,
    status: req.status || "Pending",
    admin_comment: req.admin_comment || "",
    createdAt: req.created_at || ""
  };
}
