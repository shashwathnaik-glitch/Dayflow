import { supabase } from '../lib/supabaseClient.js';

export const isUuid = (id) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

// Convert DB attendance row to UI model shape
// DB column is "date" (not "attendance_date") and status enum is title-cased
export function formatAttendanceRow(row) {
  if (!row) return null;
  const checkInDate = row.check_in ? new Date(row.check_in) : null;
  const checkOutDate = row.check_out ? new Date(row.check_out) : null;
  const dateVal = row.date || row.attendance_date;
  const d = new Date(dateVal);
  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });

  return {
    id: row.id,
    employeeId: row.employee_id,
    date: dateVal,
    attendance_date: dateVal,
    day: dayName,
    checkIn: checkInDate,
    check_in: row.check_in,
    checkOut: checkOutDate,
    check_out: row.check_out,
    workHours: Number(row.work_hours || 0),
    extraHours: Number(row.extra_hours || 0),
    status: row.status || 'Absent'
  };
}

/**
 * Fetch today's attendance record for an employee from Supabase.
 * DB column name is "date", not "attendance_date".
 */
export async function fetchTodayAttendanceApi(empId, todayStr) {
  if (!empId || !isUuid(empId)) return null;

  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', empId)
      .eq('date', todayStr)
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
 * DB column name is "date", not "attendance_date".
 */
export async function fetchAttendanceHistoryApi(empId) {
  if (!empId || !isUuid(empId)) return [];

  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', empId)
      .order('date', { ascending: false });

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
 * Uses DB column "date" and enum value 'Present' (title-cased).
 */
export async function checkInApi(empId, todayStr) {
  if (!empId || !isUuid(empId)) {
    return { ok: false, error: 'Mock ID in use - live backend bypassed.' };
  }

  try {
    // 1. Try the RPC function first (uses auth context, no params needed)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_in_employee');

    if (!rpcError && rpcData) {
      const att = rpcData.attendance || rpcData;
      return { ok: true, record: formatAttendanceRow(att) };
    }

    // 2. Fallback: Check if already checked in today
    const existing = await fetchTodayAttendanceApi(empId, todayStr);
    if (existing && existing.checkIn) {
      return { ok: false, error: 'Already checked in today.' };
    }

    // 3. Fallback: Direct upsert with correct column names and enum values
    const { data, error } = await supabase
      .from('attendance')
      .upsert(
        {
          employee_id: empId,
          date: todayStr,
          check_in: new Date().toISOString(),
          status: 'Present',
          work_hours: 0,
          extra_hours: 0
        },
        { onConflict: 'employee_id,date' }
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
 * Uses DB column "date" and enum values 'Present' / 'Half-day' (title-cased).
 */
export async function checkOutApi(empId, todayStr) {
  if (!empId || !isUuid(empId)) {
    return { ok: false, error: 'Mock ID in use - live backend bypassed.' };
  }

  try {
    // 1. Try the RPC function first (uses auth context, no params needed)
    const { data: rpcData, error: rpcError } = await supabase
      .rpc('check_out_employee');

    if (!rpcError && rpcData) {
      const att = rpcData.attendance || rpcData;
      return { ok: true, record: formatAttendanceRow(att) };
    }

    // 2. Fallback: Fetch existing check-in record from DB
    const { data: existing, error: fetchErr } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', empId)
      .eq('date', todayStr)
      .maybeSingle();

    if (fetchErr || !existing || !existing.check_in) {
      return { ok: false, error: 'Not checked in today.' };
    }

    if (existing.check_out) {
      return { ok: false, error: 'Already checked out today.' };
    }

    // 3. Fallback: Supabase client update with correct enum values
    const checkInTime = new Date(existing.check_in).getTime();
    const serverCheckOutIso = new Date().toISOString();
    const nowTime = new Date(serverCheckOutIso).getTime();

    const workHours = +(((nowTime - checkInTime) / 3600000)).toFixed(1);
    const extraHours = +Math.max(0, workHours - 8).toFixed(1);
    const status = workHours < 5 ? 'Half-day' : 'Present';

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
