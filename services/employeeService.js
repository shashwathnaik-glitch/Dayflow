import { supabase } from '../lib/supabaseClient.js';
import { isUuid } from './attendanceService.js';

/**
 * Fetch an employee's private information (PAN, UAN, Bank details, Skills, Resume/Documents).
 * Enforces JS authorization check as a second layer over PostgreSQL RLS.
 * Safely bypassed if empId is a mock prototype ID (e.g. "emp_2").
 */
export async function fetchEmployeePrivateInfoApi(empId, session) {
  if (!empId || !isUuid(empId)) {
    return { ok: false, error: 'Mock ID in use - live backend bypassed.' };
  }

  if (!session || (!session.employeeId && session.role !== 'admin')) {
    return { ok: false, error: 'Not authorized to view private information.' };
  }

  // Double-layer security check: Employee can only fetch their own record unless Admin
  if (session.role !== 'admin' && session.employeeId !== empId) {
    return { ok: false, error: 'Not authorized to access another employee\'s private details.' };
  }

  try {
    // 1. Fetch employee private fields (protected by RLS `user_id = auth.uid() or is_admin()`)
    const { data: emp, error: empErr } = await supabase
      .from('employees')
      .select('pan_no, uan_no, bank_account_number, bank_name, bank_ifsc')
      .eq('id', empId)
      .maybeSingle();

    if (empErr) {
      console.error('Error fetching employee private info:', empErr);
      return { ok: false, error: empErr.message || 'Failed to fetch private information.' };
    }

    // 2. Fetch employee skills via employee_skills join table
    const { data: skillsData, error: skillsErr } = await supabase
      .from('employee_skills')
      .select('skills ( name )')
      .eq('employee_id', empId);

    const skills = (skillsData || [])
      .map(item => item.skills?.name)
      .filter(Boolean);

    // 3. Fetch employee documents/resume
    const { data: docsData, error: docsErr } = await supabase
      .from('documents')
      .select('name, document_type, storage_path')
      .eq('employee_id', empId);

    const resumeDoc = (docsData || []).find(d => d.document_type === 'resume' || d.name.toLowerCase().includes('resume'));

    const bankDisplay = emp?.bank_account_number
      ? `${emp.bank_name || 'Bank'} •••• ${String(emp.bank_account_number).slice(-4)}`
      : '—';

    return {
      ok: true,
      data: {
        pan: emp?.pan_no || '—',
        uan: emp?.uan_no || '—',
        bank: bankDisplay,
        resume: resumeDoc ? resumeDoc.name : (docsData && docsData[0] ? docsData[0].name : '—'),
        skills: skills.length > 0 ? skills : ['Communication', 'Problem Solving', 'Ownership'],
        certifications: []
      }
    };
  } catch (err) {
    console.error('Failed to fetch employee private info:', err);
    return { ok: false, error: 'Failed to connect to backend service.' };
  }
}
