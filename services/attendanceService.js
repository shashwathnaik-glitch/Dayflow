import { supabase } from '../lib/supabaseClient.js';

export const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Status mapper between Postgres enum and UI display format
export function dbToUiStatus(status) {
  switch (status) {
    case 'present': return 'Present';
    case 'half_day': return 'Half-day';
    case 'absent': return 'Absent';
    case 'leave': return 'On Leave';
    default: return 'Not Checked In';
  }
}

export function uiToDbStatus(status) {
  switch (status) {
    case 'Present': return 'present';
    case 'Half-day': return 'half_day';
    case 'Absent': return 'absent';
    case 'On Leave': return 'leave';
    default: return 'absent';
  }
}

// Convert DB attendance row to UI model shape
export function formatAttendanceRow(row) {
  if (!row) return null;
  const checkInDate = row.check_in ? new Date(row.check_in) : null;
  const checkOutDate = row.check_out ? new Date(row.check_out) : null;
  const d = new Date(row.attendance_date);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

  return {
    id: row.id,
    employeeId: row.employee_id,
    date: row.attendance_date,
    day: dayName,
    checkIn: checkInDate,
    checkOut: checkOutDate,
    workHours: Number(row.work_hours || 0),
    extraHours: Number(row.extra_hours || 0),
    status: dbToUiStatus(row.status)
  };
}

/**
 * Fetch today's attendance record for an employee from Supabase.
 * Bypassed safely if empId is a local prototype mock string (e.g. "emp_1").
 */
export async function fetchTodayAttendanceApi(empId, todayStr) {
  if (!empId || !isUuid(empId)) return null;

  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', empId)
      .eq('attendance_date', todayStr)
      .maybeSingle();

    if (error) {
      console.error('Error fetching today attendance:', error);
      return null;
    }
    return formatAttendanceRow(data);
  } catch (err) {
    console.error('Failed to fetch today attendance:', err);
    return null;
  }
}

/**
 * Fetch attendance history for an employee from Supabase.
 * Bypassed safely if empId is a local prototype mock string (e.g. "emp_1").
 */
export async function fetchAttendanceHistoryApi(empId) {
  if (!empId || !isUuid(empId)) return [];

  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', empId)
      .order('attendance_date', { ascending: false });

    if (error) {
      console.error('Error fetching attendance history:', error);
      return [];
    }
    return (data || []).map(formatAttendanceRow);
  } catch (err) {
    console.error('Failed to fetch attendance history:', err);
    return [];
  }
}

/**
 * Check In employee for today.
 * Bypassed safely if empId is a local prototype mock string (e.g. "emp_1").
 */
export async function checkInApi(empId, todayStr) {
  if (!empId || !isUuid(empId)) {
    return { ok: false, error: 'Mock ID in use - live backend bypassed.' };
  }

  try {
    // 1. Check if already checked in today
    const existing = await fetchTodayAttendanceApi(empId, todayStr);
    if (existing && existing.checkIn) {
      return { ok: false, error: 'Already checked in today.' };
    }

    // 2. Insert check-in record using server timestamp for check_in
    const { data, error } = await supabase
      .from('attendance')
      .upsert(
        {
          employee_id: empId,
          attendance_date: todayStr,
          check_in: new Date().toISOString(),
          status: 'present',
          work_hours: 0,
          extra_hours: 0
        },
        { onConflict: 'employee_id,attendance_date' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error performing checkIn:', error);
      return { ok: false, error: error.message || 'Check in failed.' };
    }

    return { ok: true, record: formatAttendanceRow(data) };
  } catch (err) {
    console.error('CheckIn error:', err);
    return { ok: false, error: 'Failed to connect to backend.' };
  }
}

/**
 * Check Out employee for today using DB stored check_in time.
 * Bypassed safely if empId is a local prototype mock string (e.g. "emp_1").
 */
export async function checkOutApi(empId, todayStr) {
  if (!empId || !isUuid(empId)) {
    return { ok: false, error: 'Mock ID in use - live backend bypassed.' };
  }

  try {
    // 1. Explicit Guard: Fetch existing check-in record from DB
    const { data: existing, error: fetchErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', empId)
      .eq('attendance_date', todayStr)
      .maybeSingle();

    if (fetchErr || !existing || !existing.check_in) {
      return { ok: false, error: 'Not checked in today.' };
    }

    if (existing.check_out) {
      return { ok: false, error: 'Already checked out today.' };
    }

    // 2. Try RPC function `check_out_employee` if Member 1 adds it to Postgres schema
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_out_employee', { p_employee_id: empId, p_date: todayStr });

    if (!rpcError && rpcData) {
      return { ok: true, record: formatAttendanceRow(rpcData) };
    }

    // 3. Fallback Supabase client update query sourcing check_in from stored row
    const checkInTime = new Date(existing.check_in).getTime();
    const serverCheckOutIso = new Date().toISOString();
    const nowTime = new Date(serverCheckOutIso).getTime();

    const workHours = +(((nowTime - checkInTime) / 3600000)).toFixed(1);
    const extraHours = +Math.max(0, workHours - 8).toFixed(1);
    const status = workHours < 5 ? 'half_day' : 'present';

    const { data: updatedData, error: updateErr } = await supabase
      .from('attendance')
      .update({
        check_out: serverCheckOutIso,
        work_hours: workHours,
        extra_hours: extraHours,
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (updateErr) {
      console.error('Error performing checkOut:', updateErr);
      return { ok: false, error: updateErr.message || 'Check out failed.' };
    }

    return { ok: true, record: formatAttendanceRow(updatedData) };
  } catch (err) {
    console.error('CheckOut error:', err);
    return { ok: false, error: 'Failed to connect to backend.' };
  }
}
