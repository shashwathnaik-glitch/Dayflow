import { supabase } from './supabaseClient';

// ==========================================
// TYPES & INTERFACES
// ==========================================

export interface EmployeePayload {
  user_id?: string | null;
  first_name: string;
  last_name: string;
  personal_email: string;
  department_id: string;
  job_position_id: string;
  joining_date: string;
  monthly_wage: number;
  mobile?: string;
  residing_address?: string;
  profile_image_url?: string;
  gender?: string;
  nationality?: string;
  marital_status?: string;
  date_of_birth?: string;
  company?: string;
  location?: string;
  pan_no?: string;
  uan_no?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
  resume_filename?: string;
  skills?: string[];
  certifications?: string[];
}

export interface WhitelistedProfileFields {
  mobile?: string;
  personal_email?: string;
  residing_address?: string;
  profile_image_url?: string;
}

export interface LeaveRequestPayload {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  attachmentUrl?: string;
}

// ==========================================
// AUTH API
// ==========================================

/**
 * Resolves a shorthand login ID (e.g. OIJODO20260001) to its corresponding registered email address.
 * If the loginId is already an email address, it returns it directly.
 * 
 * @param loginId The user's login ID or raw email.
 * @returns An object containing the resolved email string or an error.
 */
export async function resolveLoginEmail(loginId: string): Promise<{ data: string | null; error: any }> {
  if (loginId.includes('@')) {
    return { data: loginId, error: null };
  }

  const { data, error } = await supabase
    .rpc('resolve_email_from_login_id', { p_login_id: loginId });

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: null, error: { message: `Login ID "${loginId}" not found.` } };
  }

  return { data, error: null };
}

/**
 * Signs in a user using their email or login ID and password.
 * Resolves the login ID first if needed.
 * 
 * @param loginId User's login ID (e.g., OIJODO20260001) or email address.
 * @param password The user's password.
 * @returns The Supabase Auth session details or an error.
 */
export async function login(loginId: string, password: string): Promise<{ data: any; error: any }> {
  const { data: email, error: resolveError } = await resolveLoginEmail(loginId);
  if (resolveError || !email) {
    return { data: null, error: resolveError || { message: 'Could not resolve Login ID' } };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  return { data, error };
}

/**
 * Signs out the current logged-in user.
 * 
 * @returns An object containing any error encountered during signOut.
 */
export async function logout(): Promise<{ error: any }> {
  const { error } = await supabase.auth.signOut();
  return { error };
}

/**
 * Retrieves the current active auth session, user details, and their system profile/role.
 * 
 * @returns Session, profile settings (role, employee_id), and role name.
 */
export async function getCurrentUser(): Promise<{ data: { session: any; profile: any; role: string | null } | null; error: any }> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return { data: null, error: sessionError };
  if (!session) return { data: null, error: null };

  const user = session.user;
  
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    return { data: null, error: profileError };
  }

  return {
    data: {
      session,
      profile,
      role: profile ? profile.role : null
    },
    error: null
  };
}

// ==========================================
// EMPLOYEE API
// ==========================================

/**
 * Creates a new employee record and sets up their initial salary record. Admin only.
 * Runs atomically inside a single database transaction through a Supabase RPC.
 * Validates required payload fields client-side before submission.
 * 
 * @param payload Full employee data including initial monthly wage.
 * @returns The newly created employee data or an error.
 */
export async function createEmployee(payload: EmployeePayload): Promise<{ data: any; error: any }> {
  // Client-side validation
  const requiredFields: (keyof EmployeePayload)[] = [
    'first_name',
    'last_name',
    'personal_email',
    'department_id',
    'job_position_id',
    'joining_date',
    'monthly_wage'
  ];

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null || payload[field] === '') {
      return { data: null, error: { message: `Missing required field: ${field}` } };
    }
  }

  const { monthly_wage, ...employeeData } = payload;

  // Call the transaction-safe atomic database RPC
  const { data, error } = await supabase.rpc('create_employee_with_salary', {
    p_employee_data: employeeData,
    p_monthly_wage: monthly_wage
  });

  if (error) {
    return { data: null, error };
  }

  if (data && data.success) {
    return { data: { ...data.employee, monthly_wage }, error: null };
  }

  return { data: null, error: { message: 'Failed to create employee.' } };
}

/**
 * Retrieves a single employee's profile details and their computed salary settings.
 * Pulls computed salary components dynamically from a DB view, ensuring single source of truth.
 * 
 * @param id The employee UUID.
 * @returns The employee data with nested department, job position, and salary details.
 */
export async function getEmployee(id: string): Promise<{ data: any; error: any }> {
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .select(`
      *,
      department:departments(id, name),
      job_position:job_positions(id, title)
    `)
    .eq('id', id)
    .single();

  if (empError) return { data: null, error: empError };

  // Fetch computed salary details from database view (formula resolved inside postgres lateral view)
  const { data: salary, error: salaryError } = await supabase
    .from('v_employee_salary_components')
    .select('*')
    .eq('employee_id', id)
    .maybeSingle();

  return {
    data: {
      ...employee,
      salary: salary || null
    },
    error: null
  };
}

/**
 * Lists all employees. Filters can optionally be applied. Admin only.
 * 
 * @param filters Optional search filter variables (departmentId, status).
 * @returns Array of employee objects.
 */
export async function listEmployees(filters?: { departmentId?: string; status?: string }): Promise<{ data: any[]; error: any }> {
  let query = supabase
    .from('employees')
    .select(`
      *,
      department:departments(id, name),
      job_position:job_positions(id, title)
    `);

  if (filters?.departmentId) {
    query = query.eq('department_id', filters.departmentId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

/**
 * Updates whitelisted contact and media fields on an employee's own record.
 * Rejects non-whitelisted columns.
 * 
 * @param id The employee UUID.
 * @param whitelistedFields Subset of update fields (mobile, personal_email, residing_address, profile_image_url).
 * @returns Updated employee row or an error.
 */
export async function updateEmployeeProfile(
  id: string,
  whitelistedFields: WhitelistedProfileFields
): Promise<{ data: any; error: any }> {
  // Validate whitelist client-side
  const allowedKeys = ['mobile', 'personal_email', 'residing_address', 'profile_image_url'];
  const payloadKeys = Object.keys(whitelistedFields);
  const invalidKeys = payloadKeys.filter(key => !allowedKeys.includes(key));

  if (invalidKeys.length > 0) {
    return {
      data: null,
      error: { message: `Unauthorized update fields: [${invalidKeys.join(', ')}]. Employees can only update mobile, personal_email, residing_address, and profile_image_url.` }
    };
  }

  const { data, error } = await supabase
    .from('employees')
    .update(whitelistedFields)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

// ==========================================
// ATTENDANCE API
// ==========================================

/**
 * Checks in the current logged-in employee for today.
 * 
 * @returns Check-in attendance status details.
 */
export async function checkIn(): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.rpc('check_in_employee');
  return { data, error };
}

/**
 * Checks out the current logged-in employee for today.
 * 
 * @returns Check-out attendance status details with calculated work hours.
 */
export async function checkOut(): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.rpc('check_out_employee');
  return { data, error };
}

/**
 * Fetches the attendance logs of the currently logged-in employee.
 * 
 * @param dateRange Optional filters for startDate and endDate (YYYY-MM-DD).
 * @returns Array of attendance rows.
 */
export async function getMyAttendance(dateRange?: { start: string; end: string }): Promise<{ data: any[]; error: any }> {
  const { data: userProfile, error: profileError } = await getCurrentUser();
  if (profileError || !userProfile?.profile?.employee_id) {
    return { data: [], error: profileError || { message: 'Employee profile context not found.' } };
  }

  let query = supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', userProfile.profile.employee_id)
    .order('date', { ascending: false });

  if (dateRange?.start) {
    query = query.gte('date', dateRange.start);
  }
  if (dateRange?.end) {
    query = query.lte('date', dateRange.end);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

/**
 * Fetches the attendance logs of all employees. Admin only.
 * 
 * @param dateRange Optional date range constraints (YYYY-MM-DD).
 * @param filters Optional filters for employeeId or status.
 * @returns Array of attendance rows.
 */
export async function getAllAttendance(
  dateRange?: { start: string; end: string },
  filters?: { employeeId?: string; status?: string }
): Promise<{ data: any[]; error: any }> {
  let query = supabase
    .from('attendance')
    .select(`
      *,
      employee:employees(id, first_name, last_name, email, login_id)
    `)
    .order('date', { ascending: false });

  if (dateRange?.start) {
    query = query.gte('date', dateRange.start);
  }
  if (dateRange?.end) {
    query = query.lte('date', dateRange.end);
  }
  if (filters?.employeeId) {
    query = query.eq('employee_id', filters.employeeId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

// ==========================================
// LEAVE API
// ==========================================

/**
 * Submits a new time-off request for the current employee.
 * 
 * @param payload Time-off parameters (leaveTypeId, startDate, endDate, reason, attachmentUrl).
 * @returns The newly created leave request or an error.
 */
export async function submitLeaveRequest(payload: LeaveRequestPayload): Promise<{ data: any; error: any }> {
  const { data: userProfile, error: profileError } = await getCurrentUser();
  if (profileError || !userProfile?.profile?.employee_id) {
    return { data: null, error: profileError || { message: 'Employee profile context not found.' } };
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert([
      {
        employee_id: userProfile.profile.employee_id,
        leave_type_id: payload.leaveTypeId,
        start_date: payload.startDate,
        end_date: payload.endDate,
        reason: payload.reason,
        attachment_url: payload.attachmentUrl,
        status: 'Pending'
      }
    ])
    .select()
    .single();

  return { data, error };
}

/**
 * Retrieves the leave requests of the currently logged-in employee.
 * 
 * @returns Array of leave requests.
 */
export async function getMyLeaveRequests(): Promise<{ data: any[]; error: any }> {
  const { data: userProfile, error: profileError } = await getCurrentUser();
  if (profileError || !userProfile?.profile?.employee_id) {
    return { data: [], error: profileError || { message: 'Employee profile context not found.' } };
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      leave_type:leave_types(id, name, category)
    `)
    .eq('employee_id', userProfile.profile.employee_id)
    .order('created_at', { ascending: false });

  return { data: data || [], error };
}

/**
 * Retrieves all leave requests. Admin only.
 * 
 * @param filters Optional filters for employeeId or status.
 * @returns Array of leave requests.
 */
export async function getAllLeaveRequests(filters?: { employeeId?: string; status?: string }): Promise<{ data: any[]; error: any }> {
  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees(id, first_name, last_name, login_id),
      leave_type:leave_types(id, name, category)
    `)
    .order('created_at', { ascending: false });

  if (filters?.employeeId) {
    query = query.eq('employee_id', filters.employeeId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  return { data: data || [], error };
}

/**
 * Approves or Rejects a leave request. Admin only.
 * Can only review leave requests that are in 'Pending' status.
 * 
 * @param requestId The leave request UUID.
 * @param status Approved or Rejected.
 * @param adminComment Administrative review comment.
 * @returns The reviewed leave request or an error.
 */
export async function reviewLeaveRequest(
  requestId: string,
  status: 'Approved' | 'Rejected',
  adminComment: string
): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.rpc('review_leave_request', {
    p_request_id: requestId,
    p_status: status,
    p_admin_comment: adminComment
  });
  return { data, error };
}

/**
 * Retrieves the leave allocation balances (PTO, Sick, Unpaid) of the currently logged-in employee.
 * 
 * @returns Array of leave allocations.
 */
export async function getMyLeaveAllocations(): Promise<{ data: any[]; error: any }> {
  const { data: userProfile, error: profileError } = await getCurrentUser();
  if (profileError || !userProfile?.profile?.employee_id) {
    return { data: [], error: profileError || { message: 'Employee profile context not found.' } };
  }

  const { data, error } = await supabase
    .from('leave_allocations')
    .select(`
      *,
      leave_type:leave_types(id, name, category)
    `)
    .eq('employee_id', userProfile.profile.employee_id);

  return { data: data || [], error };
}

// ==========================================
// PAYROLL API
// ==========================================

/**
 * Retrieves the currently logged-in employee's salary and computed components.
 * Uses the pre-calculated database view, maintaining the SQL RPC as single source of truth.
 * 
 * @returns Salary components data row.
 */
export async function getMySalary(): Promise<{ data: any; error: any }> {
  const { data: userProfile, error: profileError } = await getCurrentUser();
  if (profileError || !userProfile?.profile?.employee_id) {
    return { data: null, error: profileError || { message: 'Employee profile context not found.' } };
  }

  const { data, error } = await supabase
    .from('v_employee_salary_components')
    .select('*')
    .eq('employee_id', userProfile.profile.employee_id)
    .maybeSingle();

  return { data, error };
}

/**
 * Retrieves any employee's salary components. Admin only.
 * Uses the pre-calculated database view, maintaining the SQL RPC as single source of truth.
 * 
 * @param employeeId The employee UUID.
 * @returns Salary components data row.
 */
export async function getEmployeeSalary(employeeId: string): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase
    .from('v_employee_salary_components')
    .select('*')
    .eq('employee_id', employeeId)
    .maybeSingle();

  return { data, error };
}

/**
 * Retrieves a preview of salary components according to the official formula for a given monthly wage.
 * Does not write any data to the database. Helper for Admin creation UIs.
 * 
 * @param monthlyWage The target monthly wage amount.
 * @returns Computed component values matching the prototype formula.
 */
export async function calculateSalaryPreview(monthlyWage: number): Promise<{ data: any; error: any }> {
  const { data, error } = await supabase.rpc('calculate_salary', {
    monthly_wage: monthlyWage
  });
  return { data, error };
}

// ==========================================
// STORAGE API
// ==========================================

/**
 * Uploads a leave attachment file to the private 'leave-attachments' bucket.
 * The path is prefixed with the current employee's ID to comply with RLS policies.
 * 
 * @param file The File object from input.
 * @returns The uploaded file path (or a clean error).
 */
export async function uploadLeaveAttachment(file: File): Promise<{ data: { path: string } | null; error: any }> {
  try {
    const { data: userProfile, error: profileError } = await getCurrentUser();
    if (profileError || !userProfile?.profile?.employee_id) {
      return { data: null, error: profileError || { message: 'Employee profile context not found.' } };
    }

    const employeeId = userProfile.profile.employee_id;
    const timestamp = Date.now();
    const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filePath = `${employeeId}/${timestamp}-${sanitizedFilename}`;

    const { data, error: uploadError } = await supabase.storage
      .from('leave-attachments')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      return { data: null, error: uploadError };
    }

    return { data: { path: data.path }, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Storage upload failed' } };
  }
}

/**
 * Generates a temporary signed URL for a private leave attachment path.
 * The signed URL will be valid for 1 hour.
 * 
 * @param path The relative path inside the 'leave-attachments' bucket.
 * @returns The signed URL (or a clean error).
 */
export async function getLeaveAttachmentUrl(path: string): Promise<{ data: string | null; error: any }> {
  try {
    const { data, error } = await supabase.storage
      .from('leave-attachments')
      .createSignedUrl(path, 3600); // 1 hour validity

    if (error) {
      return { data: null, error };
    }

    return { data: data.signedUrl, error: null };
  } catch (err: any) {
    return { data: null, error: { message: err.message || 'Failed to generate signed URL' } };
  }
}

