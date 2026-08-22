-- Automated Verification Script for Dayflow Supabase Backend
-- Run this in the Supabase SQL editor to test the backend logic.

do $$
declare
  v_test_email text;
  v_john_login text;
  v_john_emp_id uuid;
  v_jane_emp_id uuid;
  v_salary_comp jsonb;
  v_pto_alloc record;
  v_sick_alloc record;
  v_john_aug11_att public.attendance_status;
  v_jane_aug18_att public.attendance_status;
begin
  raise notice '=======================================';
  raise notice 'STARTING DAYFLOW DATABASE VERIFICATION';
  raise notice '=======================================';

  -- 1. Test Login ID to Email Resolution
  select login_id, id into v_john_login, v_john_emp_id
  from public.employees
  where first_name = 'John' and last_name = 'Doe';

  v_test_email := public.resolve_email_from_login_id(v_john_login);
  if v_test_email = 'john.doe@dayflow.local' then
    raise notice '✓ SUCCESS: Login ID resolution resolved % to %', v_john_login, v_test_email;
  else
    raise exception '✗ FAILURE: Login ID resolution returned incorrect email: %', v_test_email;
  end if;

  -- 2. Test Salary Calculation Function (wage = 80000)
  -- formula: basic = 50% = 40000, hra = 50% basic = 20000, standard = 10% basic = 40000 * 0.10 = 4000,
  -- performance = 8% basic = 3200, lta = 8.33% basic = 3332, pf = 12% basic = 4800, tax = 200
  -- net = 80000 - 4800 - 200 = 75000
  v_salary_comp := public.calculate_salary(80000.00);
  
  if (v_salary_comp->>'basic')::numeric = 40000.00 and
     (v_salary_comp->>'hra')::numeric = 20000.00 and
     (v_salary_comp->>'pf')::numeric = 4800.00 and
     (v_salary_comp->>'net')::numeric = 75000.00 then
    raise notice '✓ SUCCESS: Salary calculation verified for wage 80000. Net: %, Basic: %, PF: %',
      v_salary_comp->>'net', v_salary_comp->>'basic', v_salary_comp->>'pf';
  else
    raise exception '✗ FAILURE: Salary formula output mismatch: %', v_salary_comp;
  end if;

  -- 3. Test Auto Leave Allocation Initialization
  select allocated_days, used_days, remaining_days into v_pto_alloc
  from public.leave_allocations la
  join public.leave_types lt on la.leave_type_id = lt.id
  where la.employee_id = v_john_emp_id and lt.category = 'paid';

  if v_pto_alloc.allocated_days = 24.00 then
    raise notice '✓ SUCCESS: Auto-allocation for PTO (Paid Time Off) verified at 24.00 days.';
  else
    raise exception '✗ FAILURE: PTO allocation mismatch: %', v_pto_alloc.allocated_days;
  end if;

  -- 4. Test Leave Request Balance Trigger
  -- John Doe Sick Leave was approved for 1 day. Check if Sick allocation has used_days = 1.00 and remaining = 6.00
  select la.allocated_days, la.used_days, la.remaining_days into v_sick_alloc
  from public.leave_allocations la
  join public.leave_types lt on la.leave_type_id = lt.id
  where la.employee_id = v_john_emp_id and lt.category = 'sick';

  if v_sick_alloc.used_days = 1.00 and v_sick_alloc.remaining_days = 6.00 then
    raise notice '✓ SUCCESS: Leave Request approval triggers decrement/increment correctly. Used: %, Remaining: %',
      v_sick_alloc.used_days, v_sick_alloc.remaining_days;
  else
    raise exception '✗ FAILURE: Sick leave balance not correctly updated. Used: %, Remaining: %',
      v_sick_alloc.used_days, v_sick_alloc.remaining_days;
  end if;

  -- 5. Test Leave to Attendance Status Synchronization
  -- John Doe Sick Leave on Aug 11 was approved. Confirm attendance status on Aug 11 is 'On Leave'
  select status into v_john_aug11_att
  from public.attendance
  where employee_id = v_john_emp_id and date = '2026-08-11'::date;

  if v_john_aug11_att = 'On Leave' then
    raise notice '✓ SUCCESS: Approved Sick Leave on Aug 11 synchronized to attendance as On Leave.';
  else
    raise exception '✗ FAILURE: Attendance for John Doe on Aug 11 is: %', v_john_aug11_att;
  end if;

  -- Jane Smith PTO on Aug 18 & Aug 19 was approved. Confirm attendance status on Aug 18 is 'On Leave'
  select id into v_jane_emp_id from public.employees where first_name = 'Jane' and last_name = 'Smith';
  select status into v_jane_aug18_att
  from public.attendance
  where employee_id = v_jane_emp_id and date = '2026-08-18'::date;

  if v_jane_aug18_att = 'On Leave' then
    raise notice '✓ SUCCESS: Approved PTO range on Aug 18 synchronized to attendance as On Leave.';
  else
    raise exception '✗ FAILURE: Attendance for Jane Smith on Aug 18 is: %', v_jane_aug18_att;
  end if;

  raise notice '=======================================';
  raise notice 'ALL VERIFICATION TESTS PASSED SUCCESSFULLY!';
  raise notice '=======================================';
end;
$$;
