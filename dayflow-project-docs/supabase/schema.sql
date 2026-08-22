-- Dayflow HRMS Backend Migration Schema
-- Clean start for hackathon safety
drop table if exists public.employee_salary cascade;
drop table if exists public.salary_components cascade;
drop table if exists public.salary_structures cascade;
drop table if exists public.leave_requests cascade;
drop table if exists public.leave_allocations cascade;
drop table if exists public.leave_types cascade;
drop table if exists public.attendance cascade;
drop table if exists public.attendance_schedules cascade;
drop table if exists public.employees cascade;
drop table if exists public.job_positions cascade;
drop table if exists public.departments cascade;
drop table if exists public.profiles cascade;

drop type if exists public.leave_category cascade;
drop type if exists public.leave_status cascade;
drop type if exists public.attendance_status cascade;
drop type if exists public.app_role cascade;

-- Custom types and Enums
create type public.app_role as enum ('admin', 'employee');
create type public.attendance_status as enum ('Present', 'Half-day', 'Absent', 'On Leave');
create type public.leave_status as enum ('Pending', 'Approved', 'Rejected');
create type public.leave_category as enum ('paid', 'sick', 'unpaid');

-- 1. Profiles Table (Linked to Supabase Auth)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'employee',
  email text,
  employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Organizations / Departments / Job Positions
create table public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.job_positions (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  created_at timestamptz not null default now()
);

-- 3. Employees Table (Flattened Skills, Certifications, and Resume Filename)
create table public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  login_id text unique,
  first_name text not null,
  last_name text,
  email text unique,
  mobile text,
  department_id uuid references public.departments(id) on delete set null,
  job_position_id uuid references public.job_positions(id) on delete set null,
  manager_id uuid references public.employees(id) on delete set null,
  company text,
  location text,
  date_of_birth date,
  residing_address text,
  personal_email text,
  gender text,
  nationality text,
  marital_status text,
  joining_date date,
  profile_image_url text,
  status text not null default 'active',
  joining_serial integer,
  -- Private Info & Attachments (Prototype wire up)
  pan_no text,
  uan_no text,
  bank_account_number text,
  bank_name text,
  bank_ifsc text,
  resume_filename text,
  skills text[],
  certifications text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_employee_id_fkey
  foreign key (employee_id) references public.employees(id) on delete set null;

-- 4. Attendance & Schedules
create table public.attendance_schedules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  working_days integer not null default 5,
  start_time time,
  end_time time,
  break_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  schedule_id uuid references public.attendance_schedules(id) on delete set null,
  date date not null,
  check_in timestamptz,
  check_out timestamptz,
  work_hours numeric(6,2) not null default 0,
  extra_hours numeric(6,2) not null default 0,
  status public.attendance_status not null default 'Absent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, date)
);

-- 5. Time Off / Leaves
create table public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category public.leave_category not null,
  requires_attachment boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.leave_allocations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  allocated_days numeric(6,2) not null default 0,
  used_days numeric(6,2) not null default 0,
  remaining_days numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, leave_type_id)
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  reason text,
  attachment_url text,
  status public.leave_status not null default 'Pending',
  admin_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_leave_dates check (end_date >= start_date)
);

-- 6. Payroll Configuration & Employee Salary Info
create table public.salary_structures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  wage_type text not null default 'fixed',
  created_at timestamptz not null default now()
);

create table public.salary_components (
  id uuid primary key default gen_random_uuid(),
  salary_structure_id uuid not null references public.salary_structures(id) on delete cascade,
  name text not null,
  computation_type text not null default 'fixed',
  value numeric(12,4) not null default 0,
  base_component text,
  is_deduction boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.employee_salary (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  salary_structure_id uuid references public.salary_structures(id) on delete set null,
  monthly_wage numeric(12,2) not null default 0,
  effective_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id)
);

-- Indexes for performance & query targets
create index if not exists idx_leave_requests_employee_status on public.leave_requests(employee_id, status);
create index if not exists idx_employees_department_id on public.employees(department_id);
create index if not exists idx_employees_status on public.employees(status);
create index if not exists idx_attendance_employee_date on public.attendance(employee_id, date);

-- ----------------------------------------------------
-- Database Trigger Functions & Automation
-- ----------------------------------------------------

-- Login ID Generator Trigger: OI + first2(first_name) + first2(last_name) + joining_year + serial_number
create or replace function public.generate_login_id()
returns trigger
language plpgsql
as $$
declare
  v_year integer;
  v_serial integer;
  v_first2 text;
  v_last2 text;
begin
  if new.joining_date is null then
    v_year := extract(year from current_date);
  else
    v_year := extract(year from new.joining_date);
  end if;

  select coalesce(max(joining_serial), 0) + 1
  into v_serial
  from public.employees
  where extract(year from joining_date) = v_year;

  new.joining_serial := v_serial;

  v_first2 := upper(substring(coalesce(new.first_name, 'XX') from 1 for 2));
  if length(v_first2) < 2 then
    v_first2 := rpad(v_first2, 2, 'X');
  end if;

  v_last2 := upper(substring(coalesce(new.last_name, 'XX') from 1 for 2));
  if length(v_last2) < 2 then
    v_last2 := rpad(v_last2, 2, 'X');
  end if;

  -- Format: OI + first2_first + first2_last + year + 4-digit serial
  new.login_id := 'OI' || v_first2 || v_last2 || to_char(v_year, 'FM9999') || lpad(to_char(v_serial, 'FM9999'), 4, '0');
  
  -- Auto-generate work email if not set
  new.email := coalesce(new.email, new.login_id || '@dayflow.local');

  return new;
end;
$$;

create trigger tr_generate_login_id
  before insert on public.employees
  for each row execute procedure public.generate_login_id();

-- Profiles to Employee Auto Linkage
create or replace function public.handle_employee_user_link()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.user_id is not null then
    update public.profiles
    set employee_id = new.id
    where id = new.user_id;
  end if;
  return new;
end;
$$;

create trigger tr_employee_user_link
  after insert or update of user_id on public.employees
  for each row execute procedure public.handle_employee_user_link();

-- Automatic Leave Allocation setup on onboarding (PTO: 24, Sick: 7, Unpaid: 999)
create or replace function public.initialize_employee_leave_allocations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_pto_id uuid;
  v_sick_id uuid;
  v_unpaid_id uuid;
begin
  select id into v_pto_id from public.leave_types where category = 'paid' limit 1;
  select id into v_sick_id from public.leave_types where category = 'sick' limit 1;
  select id into v_unpaid_id from public.leave_types where category = 'unpaid' limit 1;

  if v_pto_id is not null then
    insert into public.leave_allocations (employee_id, leave_type_id, allocated_days, used_days, remaining_days)
    values (new.id, v_pto_id, 24.00, 0.00, 24.00)
    on conflict (employee_id, leave_type_id) do nothing;
  end if;

  if v_sick_id is not null then
    insert into public.leave_allocations (employee_id, leave_type_id, allocated_days, used_days, remaining_days)
    values (new.id, v_sick_id, 7.00, 0.00, 7.00)
    on conflict (employee_id, leave_type_id) do nothing;
  end if;

  if v_unpaid_id is not null then
    insert into public.leave_allocations (employee_id, leave_type_id, allocated_days, used_days, remaining_days)
    values (new.id, v_unpaid_id, 999.00, 0.00, 999.00)
    on conflict (employee_id, leave_type_id) do nothing;
  end if;

  return new;
end;
$$;

create trigger tr_initialize_leave_allocations
  after insert on public.employees
  for each row execute procedure public.initialize_employee_leave_allocations();

-- Leave allocations balance tracking
create or replace function public.update_leave_allocation_on_request_status_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days numeric;
begin
  v_days := (coalesce(new.end_date, old.end_date) - coalesce(new.start_date, old.start_date)) + 1;

  if (tg_op = 'UPDATE' and new.status = 'Approved' and old.status <> 'Approved') or
     (tg_op = 'INSERT' and new.status = 'Approved') then
    
    update public.leave_allocations
    set used_days = used_days + v_days,
        remaining_days = allocated_days - (used_days + v_days)
    where employee_id = coalesce(new.employee_id, old.employee_id)
      and leave_type_id = coalesce(new.leave_type_id, old.leave_type_id);

  elsif (tg_op = 'UPDATE' and old.status = 'Approved' and new.status <> 'Approved') or
        (tg_op = 'DELETE' and old.status = 'Approved') then

    update public.leave_allocations
    set used_days = greatest(0, used_days - v_days),
        remaining_days = allocated_days - greatest(0, used_days - v_days)
    where employee_id = coalesce(old.employee_id, new.employee_id)
      and leave_type_id = coalesce(old.leave_type_id, new.leave_type_id);

  end if;

  return null;
end;
$$;

create trigger tr_leave_request_status_change
  after insert or update or delete on public.leave_requests
  for each row execute procedure public.update_leave_allocation_on_request_status_change();

-- BLOCKER 3: Strict profile self-update whitelist validation
create or replace function public.enforce_employee_update_restrictions()
returns trigger
language plpgsql
as $$
begin
  if public.is_admin() then
    return new;
  end if;

  if old.user_id <> auth.uid() then
    raise exception 'Unauthorized update';
  end if;

  -- Verify whitelist: only mobile, personal_email, residing_address, and profile_image_url can be updated
  if new.id <> old.id or
     new.user_id is distinct from old.user_id or
     new.login_id is distinct from old.login_id or
     new.first_name is distinct from old.first_name or
     new.last_name is distinct from old.last_name or
     new.email is distinct from old.email or
     new.department_id is distinct from old.department_id or
     new.job_position_id is distinct from old.job_position_id or
     new.manager_id is distinct from old.manager_id or
     new.company is distinct from old.company or
     new.location is distinct from old.location or
     new.date_of_birth is distinct from old.date_of_birth or
     new.gender is distinct from old.gender or
     new.nationality is distinct from old.nationality or
     new.marital_status is distinct from old.marital_status or
     new.joining_date is distinct from old.joining_date or
     new.status is distinct from old.status or
     new.joining_serial is distinct from old.joining_serial or
     new.pan_no is distinct from old.pan_no or
     new.uan_no is distinct from old.uan_no or
     new.bank_account_number is distinct from old.bank_account_number or
     new.bank_name is distinct from old.bank_name or
     new.bank_ifsc is distinct from old.bank_ifsc or
     new.resume_filename is distinct from old.resume_filename or
     new.skills is distinct from old.skills or
     new.certifications is distinct from old.certifications then
    raise exception 'Unauthorized field modification. Employees are only allowed to update mobile, personal_email, residing_address, and profile_image_url.';
  end if;

  return new;
end;
$$;

create trigger tr_enforce_employee_update
  before update on public.employees
  for each row execute procedure public.enforce_employee_update_restrictions();

-- BLOCKER 2: Sync approved leaves directly to attendance rows
create or replace function public.sync_leave_to_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date;
begin
  if (new.status = 'Approved' and (old.status is null or old.status <> 'Approved')) then
    v_date := new.start_date;
    while v_date <= new.end_date loop
      insert into public.attendance (employee_id, date, status, work_hours, extra_hours)
      values (new.employee_id, v_date, 'On Leave', 0.00, 0.00)
      on conflict (employee_id, date) do update
      set status = 'On Leave',
          work_hours = 0.00,
          extra_hours = 0.00,
          check_in = null,
          check_out = null;
      v_date := v_date + 1;
    end loop;
  end if;
  return new;
end;
$$;

create trigger tr_sync_leave_to_attendance
  after insert or update on public.leave_requests
  for each row execute procedure public.sync_leave_to_attendance();

-- ----------------------------------------------------
-- Helper and RPC DB APIs
-- ----------------------------------------------------

-- Login ID to sign-in email resolver
create or replace function public.resolve_email_from_login_id(p_login_id text)
returns text
language sql
stable
security definer
as $$
  select email from public.employees where login_id = p_login_id;
$$;

-- Global Admin role check
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Authenticated Employee ID lookup
create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select employee_id
  from public.profiles
  where id = auth.uid();
$$;

-- Attendance Check-In (Upsert)
create or replace function public.check_in_employee()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id uuid;
  v_today date;
  v_record record;
begin
  v_employee_id := public.current_employee_id();
  if v_employee_id is null then
    raise exception 'Not authenticated as an employee';
  end if;

  v_today := current_date;

  insert into public.attendance (employee_id, date, check_in, status, work_hours, extra_hours)
  values (v_employee_id, v_today, now(), 'Present', 0.00, 0.00)
  on conflict (employee_id, date) do update
  set check_in = coalesce(attendance.check_in, excluded.check_in),
      status = 'Present'
  returning * into v_record;

  return jsonb_build_object(
    'success', true,
    'attendance', to_jsonb(v_record)
  );
end;
$$;

-- Attendance Check-Out & Auto Status calculation
create or replace function public.check_out_employee()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_employee_id uuid;
  v_today date;
  v_record record;
  v_check_in timestamptz;
  v_check_out timestamptz;
  v_work_hours numeric;
  v_extra_hours numeric;
  v_status public.attendance_status;
begin
  v_employee_id := public.current_employee_id();
  if v_employee_id is null then
    raise exception 'Not authenticated as an employee';
  end if;

  v_today := current_date;
  v_check_out := now();

  select check_in into v_check_in
  from public.attendance
  where employee_id = v_employee_id and date = v_today;

  if v_check_in is null then
    raise exception 'No active check-in found for today';
  end if;

  v_work_hours := round((extract(epoch from (v_check_out - v_check_in)) / 3600.0)::numeric, 2);
  v_extra_hours := round(greatest(0.00, v_work_hours - 8.00)::numeric, 2);

  if v_work_hours < 5.00 then
    v_status := 'Half-day';
  else
    v_status := 'Present';
  end if;

  update public.attendance
  set check_out = v_check_out,
      work_hours = v_work_hours,
      extra_hours = v_extra_hours,
      status = v_status
  where employee_id = v_employee_id and date = v_today
  returning * into v_record;

  return jsonb_build_object(
    'success', true,
    'attendance', to_jsonb(v_record)
  );
end;
$$;

-- Single Source of Truth Salary Calculator Formula
create or replace function public.calculate_salary(monthly_wage numeric)
returns jsonb
language plpgsql
immutable
as $$
declare
  v_basic numeric;
  v_hra numeric;
  v_standard_allowance numeric;
  v_performance_bonus numeric;
  v_lta numeric;
  v_fixed_allowance numeric;
  v_pf numeric;
  v_professional_tax numeric;
  v_gross numeric;
  v_net numeric;
begin
  v_basic := round(monthly_wage * 0.50, 2);
  v_hra := round(v_basic * 0.50, 2);
  v_standard_allowance := round(v_basic * 0.10, 2);
  v_performance_bonus := round(v_basic * 0.08, 2);
  v_lta := round(v_basic * 0.0833, 2);
  v_fixed_allowance := monthly_wage - (v_basic + v_hra + v_standard_allowance + v_performance_bonus + v_lta);
  v_pf := round(v_basic * 0.12, 2);
  v_professional_tax := 200.00;
  v_gross := monthly_wage;
  v_net := v_gross - v_pf - v_professional_tax;

  return jsonb_build_object(
    'basic', v_basic,
    'hra', v_hra,
    'standard_allowance', v_standard_allowance,
    'performance_bonus', v_performance_bonus,
    'lta', v_lta,
    'fixed_allowance', v_fixed_allowance,
    'pf', v_pf,
    'professional_tax', v_professional_tax,
    'gross', v_gross,
    'net', v_net
  );
end;
$$;

-- Leave Review RPC
create or replace function public.review_leave_request(
  p_request_id uuid,
  p_status public.leave_status,
  p_admin_comment text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_record record;
  v_current_status public.leave_status;
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only admins can review leave requests';
  end if;

  select status into v_current_status
  from public.leave_requests
  where id = p_request_id;

  if v_current_status is null then
    raise exception 'Leave request not found';
  end if;

  if v_current_status <> 'Pending' then
    raise exception 'Cannot review leave request: status is already %', v_current_status;
  end if;

  update public.leave_requests
  set status = p_status,
      admin_comment = p_admin_comment,
      updated_at = now()
  where id = p_request_id
  returning * into v_record;

  return jsonb_build_object(
    'success', true,
    'leave_request', to_jsonb(v_record)
  );
end;
$$;

-- Atomic Employee Creation with Salary Setup
create or replace function public.create_employee_with_salary(
  p_employee_data jsonb,
  p_monthly_wage numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_emp_record record;
  v_skills text[];
  v_certifications text[];
begin
  if not public.is_admin() then
    raise exception 'Unauthorized: Only admins can create employees';
  end if;

  -- Safe extraction of skills array
  if p_employee_data ? 'skills' and jsonb_typeof(p_employee_data->'skills') = 'array' then
    v_skills := array(select jsonb_array_elements_text(p_employee_data->'skills'));
  end if;

  -- Safe extraction of certifications array
  if p_employee_data ? 'certifications' and jsonb_typeof(p_employee_data->'certifications') = 'array' then
    v_certifications := array(select jsonb_array_elements_text(p_employee_data->'certifications'));
  end if;

  -- Insert employee profile
  insert into public.employees (
    user_id, first_name, last_name, email, personal_email, department_id, job_position_id, manager_id,
    company, location, date_of_birth, residing_address, gender, nationality, marital_status,
    joining_date, profile_image_url, status, pan_no, uan_no, bank_account_number, bank_name,
    bank_ifsc, resume_filename, skills, certifications
  ) values (
    (p_employee_data->>'user_id')::uuid,
    p_employee_data->>'first_name',
    p_employee_data->>'last_name',
    p_employee_data->>'email',
    p_employee_data->>'personal_email',
    (p_employee_data->>'department_id')::uuid,
    (p_employee_data->>'job_position_id')::uuid,
    (p_employee_data->>'manager_id')::uuid,
    p_employee_data->>'company',
    p_employee_data->>'location',
    (p_employee_data->>'date_of_birth')::date,
    p_employee_data->>'residing_address',
    p_employee_data->>'gender',
    p_employee_data->>'nationality',
    p_employee_data->>'marital_status',
    (p_employee_data->>'joining_date')::date,
    p_employee_data->>'profile_image_url',
    coalesce(p_employee_data->>'status', 'active'),
    p_employee_data->>'pan_no',
    p_employee_data->>'uan_no',
    p_employee_data->>'bank_account_number',
    p_employee_data->>'bank_name',
    p_employee_data->>'bank_ifsc',
    p_employee_data->>'resume_filename',
    v_skills,
    v_certifications
  )
  returning * into v_emp_record;

  -- Insert salary settings
  insert into public.employee_salary (employee_id, monthly_wage, effective_from)
  values (v_emp_record.id, p_monthly_wage, v_emp_record.joining_date);

  return jsonb_build_object(
    'success', true,
    'employee', to_jsonb(v_emp_record)
  );
end;
$$;

-- Lateral join projection view for salary structures
create or replace view public.v_employee_salary_components with (security_invoker = true) as
select
  es.employee_id,
  es.monthly_wage,
  c.basic,
  c.hra,
  c.standard_allowance,
  c.performance_bonus,
  c.lta,
  c.fixed_allowance,
  c.pf,
  c.professional_tax,
  c.gross,
  c.net
from public.employee_salary es,
lateral (select * from jsonb_to_record(public.calculate_salary(es.monthly_wage)) as x(
  basic numeric,
  hra numeric,
  standard_allowance numeric,
  performance_bonus numeric,
  lta numeric,
  fixed_allowance numeric,
  pf numeric,
  professional_tax numeric,
  gross numeric,
  net numeric
)) c;

-- ----------------------------------------------------
-- Enable Row Level Security & Explicit Policies
-- ----------------------------------------------------

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_types enable row level security;
alter table public.leave_allocations enable row level security;
alter table public.leave_requests enable row level security;
alter table public.salary_structures enable row level security;
alter table public.salary_components enable row level security;
alter table public.employee_salary enable row level security;

-- Profiles RLS
create policy "profiles_self_or_admin_select"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- Employees RLS
create policy "employees_self_or_admin_select"
  on public.employees for select
  using (user_id = auth.uid() or public.is_admin());

create policy "employees_admin_insert"
  on public.employees for insert
  with check (public.is_admin());

create policy "employees_self_or_admin_update"
  on public.employees for update
  using (user_id = auth.uid() or public.is_admin());

-- Attendance RLS
create policy "attendance_self_or_admin_select"
  on public.attendance for select
  using (employee_id = public.current_employee_id() or public.is_admin());

create policy "attendance_self_insert"
  on public.attendance for insert
  with check (employee_id = public.current_employee_id() or public.is_admin());

create policy "attendance_self_or_admin_update"
  on public.attendance for update
  using (employee_id = public.current_employee_id() or public.is_admin());

-- Leave Types RLS
create policy "leave_types_authenticated_select"
  on public.leave_types for select
  using (auth.uid() is not null);

-- Leave Allocations RLS
create policy "allocations_self_or_admin_select"
  on public.leave_allocations for select
  using (employee_id = public.current_employee_id() or public.is_admin());

create policy "allocations_admin_manage"
  on public.leave_allocations for all
  using (public.is_admin());

-- Leave Requests RLS
create policy "leave_requests_self_or_admin_select"
  on public.leave_requests for select
  using (employee_id = public.current_employee_id() or public.is_admin());

create policy "leave_requests_self_insert"
  on public.leave_requests for insert
  with check (employee_id = public.current_employee_id());

create policy "leave_requests_admin_update"
  on public.leave_requests for update
  using (public.is_admin());

-- BLOCKER 1: Explicit Salary Tables RLS Policies

-- Salary Structures
create policy "salary_structures_select"
  on public.salary_structures for select
  using (auth.uid() is not null);

create policy "salary_structures_admin_write"
  on public.salary_structures for all
  using (public.is_admin())
  with check (public.is_admin());

-- Salary Components
create policy "salary_components_select"
  on public.salary_components for select
  using (auth.uid() is not null);

create policy "salary_components_admin_write"
  on public.salary_components for all
  using (public.is_admin())
  with check (public.is_admin());

-- Employee Salary Settings
create policy "employee_salary_self_or_admin_select"
  on public.employee_salary for select
  using (employee_id = public.current_employee_id() or public.is_admin());

create policy "employee_salary_admin_write"
  on public.employee_salary for all
  using (public.is_admin())
  with check (public.is_admin());


-- ----------------------------------------------------
-- Supabase Storage Bucket & RLS Policies
-- ----------------------------------------------------
-- Create private bucket for leave attachments
insert into storage.buckets (id, name, public)
values ('leave-attachments', 'leave-attachments', false)
on conflict (id) do nothing;

-- Storage Insert Policy: Employees can only upload files prefixed with their employee_id folder
create policy "Employees can upload leave attachments to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'leave-attachments' AND
    (storage.foldername(name))[1] = (
      select employee_id::text from public.profiles where id = auth.uid()
    )
  );

-- Storage Select Policy: Employees can read their own files, Admins can read all files
create policy "Employees can select own attachments and Admins select all"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'leave-attachments' AND
    (
      public.is_admin() OR
      (storage.foldername(name))[1] = (
        select employee_id::text from public.profiles where id = auth.uid()
      )
    )
  );


-- ----------------------------------------------------
-- Seed Reference Data
-- ----------------------------------------------------
insert into public.leave_types (name, category, requires_attachment)
values
  ('Paid Time Off', 'paid', false),
  ('Sick Leave', 'sick', true),
  ('Unpaid Leave', 'unpaid', false)
on conflict (name) do nothing;

insert into public.departments (name)
values ('Engineering'), ('Human Resources'), ('Design'), ('Finance')
on conflict (name) do nothing;

insert into public.job_positions (title)
values ('Software Engineer'), ('HR Officer'), ('Product Designer'), ('Finance Analyst')
on conflict (title) do nothing;

-- Seeding a generic Salary Structure
insert into public.salary_structures (name, wage_type)
values ('Standard Hackathon Structure', 'fixed');

-- ----------------------------------------------------
-- Seeding Demo Users & HRMS Logic
-- ----------------------------------------------------
do $$
declare
  v_admin_auth_id uuid := 'a0000000-0000-0000-0000-000000000001';
  v_e1_auth_id uuid := 'e0000000-0000-0000-0000-000000000001';
  v_e2_auth_id uuid := 'e0000000-0000-0000-0000-000000000002';
  v_e3_auth_id uuid := 'e0000000-0000-0000-0000-000000000003';
  v_e4_auth_id uuid := 'e0000000-0000-0000-0000-000000000004';
  v_e5_auth_id uuid := 'e0000000-0000-0000-0000-000000000005';
  
  v_e1_emp_id uuid;
  v_e2_emp_id uuid;
  v_e3_emp_id uuid;
  v_e4_emp_id uuid;
  v_e5_emp_id uuid;

  v_dept_eng uuid;
  v_dept_hr uuid;
  v_dept_des uuid;
  v_dept_fin uuid;

  v_job_se uuid;
  v_job_hr uuid;
  v_job_pd uuid;
  v_job_fa uuid;

  v_structure_id uuid;
  
  -- Attendance variables
  v_dates date[] := array[
    '2026-08-06'::date, '2026-08-07'::date, '2026-08-10'::date, '2026-08-11'::date,
    '2026-08-12'::date, '2026-08-13'::date, '2026-08-14'::date, '2026-08-17'::date,
    '2026-08-18'::date, '2026-08-19'::date, '2026-08-20'::date, '2026-08-21'::date
  ];
  v_date date;
  v_emp_id uuid;
  v_seed_emp record;
  v_idx integer;
  v_check_in timestamptz;
  v_check_out timestamptz;
  
  -- Leave variables
  v_pto_type_id uuid;
  v_sick_type_id uuid;
  v_unpaid_type_id uuid;
begin
  -- 1. Clean existing seed records from auth
  delete from auth.users where email in (
    'admin@dayflow.com',
    'john.doe@dayflow.local',
    'jane.smith@dayflow.local',
    'bob.johnson@dayflow.local',
    'alice.williams@dayflow.local',
    'charlie.brown@dayflow.local'
  ) or email like 'OI%@dayflow.local';

  -- 2. Fetch IDs
  select id into v_dept_eng from public.departments where name = 'Engineering';
  select id into v_dept_hr from public.departments where name = 'Human Resources';
  select id into v_dept_des from public.departments where name = 'Design';
  select id into v_dept_fin from public.departments where name = 'Finance';

  select id into v_job_se from public.job_positions where title = 'Software Engineer';
  select id into v_job_hr from public.job_positions where title = 'HR Officer';
  select id into v_job_pd from public.job_positions where title = 'Product Designer';
  select id into v_job_fa from public.job_positions where title = 'Finance Analyst';

  select id into v_structure_id from public.salary_structures limit 1;
  select id into v_pto_type_id from public.leave_types where category = 'paid' limit 1;
  select id into v_sick_type_id from public.leave_types where category = 'sick' limit 1;
  select id into v_unpaid_type_id from public.leave_types where category = 'unpaid' limit 1;

  -- 3. Create Admin auth user
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values (
    v_admin_auth_id,
    'admin@dayflow.com',
    crypt('admin123', gen_salt('bf')),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin"}',
    'authenticated',
    'authenticated'
  );

  -- 4. Create Employee auth users
  insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
  values
  (v_e1_auth_id, 'john.doe@dayflow.local', crypt('employee123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"employee"}', 'authenticated', 'authenticated'),
  (v_e2_auth_id, 'jane.smith@dayflow.local', crypt('employee123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"employee"}', 'authenticated', 'authenticated'),
  (v_e3_auth_id, 'bob.johnson@dayflow.local', crypt('employee123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"employee"}', 'authenticated', 'authenticated'),
  (v_e4_auth_id, 'alice.williams@dayflow.local', crypt('employee123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"employee"}', 'authenticated', 'authenticated'),
  (v_e5_auth_id, 'charlie.brown@dayflow.local', crypt('employee123', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"role":"employee"}', 'authenticated', 'authenticated');

  -- 5. Insert Employee profile records (triggers generate_login_id and initialize_employee_leave_allocations automatically)
  insert into public.employees (user_id, first_name, last_name, email, personal_email, department_id, job_position_id, joining_date, company, location, status, pan_no, uan_no, bank_name, bank_account_number, bank_ifsc, skills, certifications)
  values
  (v_e1_auth_id, 'John', 'Doe', 'john.doe@dayflow.local', 'john.doe.personal@gmail.com', v_dept_eng, v_job_se, '2026-01-15', 'Odoo NMIT', 'Bangalore', 'active', 'ABCDE1234F', '100987654321', 'State Bank of India', '30001234567', 'SBIN0001234', ARRAY['React', 'PostgreSQL', 'Python'], ARRAY['AWS Developer Associate']),
  (v_e2_auth_id, 'Jane', 'Smith', 'jane.smith@dayflow.local', 'jane.smith.personal@gmail.com', v_dept_des, v_job_pd, '2026-02-01', 'Odoo NMIT', 'Bangalore', 'active', 'FGHIJ5678K', '100987654322', 'HDFC Bank', '501000123456', 'HDFC0000123', ARRAY['Figma', 'UI/UX Design', 'CSS'], ARRAY['Google UX Design Certificate']),
  (v_e3_auth_id, 'Bob', 'Johnson', 'bob.johnson@dayflow.local', 'bob.johnson.personal@gmail.com', v_dept_eng, v_job_se, '2026-03-10', 'Odoo NMIT', 'Bangalore', 'active', 'KLMNO9012P', '100987654323', 'ICICI Bank', '000401234567', 'ICIC0000004', ARRAY['Node.js', 'Redis', 'Docker'], ARRAY['Docker Certified Associate']),
  (v_e4_auth_id, 'Alice', 'Williams', 'alice.williams@dayflow.local', 'alice.williams.personal@gmail.com', v_dept_hr, v_job_hr, '2026-04-01', 'Odoo NMIT', 'Bangalore', 'active', 'QRSTU3456Q', '100987654324', 'Axis Bank', '912010012345', 'UTIB0000123', ARRAY['HR Operations', 'Onboarding', 'Conflict Resolution'], ARRAY['PHR Certification']),
  (v_e5_auth_id, 'Charlie', 'Brown', 'charlie.brown@dayflow.local', 'charlie.brown.personal@gmail.com', v_dept_fin, v_job_fa, '2026-05-15', 'Odoo NMIT', 'Bangalore', 'active', 'VWXYZ7890R', '100987654325', 'Kotak Mahindra Bank', '1234567890', 'KKBK0000123', ARRAY['Accounting', 'Excel', 'Financial Planning'], ARRAY['Chartered Accountant']);

  -- Fetch Employee IDs
  select id into v_e1_emp_id from public.employees where email = 'john.doe@dayflow.local';
  select id into v_e2_emp_id from public.employees where email = 'jane.smith@dayflow.local';
  select id into v_e3_emp_id from public.employees where email = 'bob.johnson@dayflow.local';
  select id into v_e4_emp_id from public.employees where email = 'alice.williams@dayflow.local';
  select id into v_e5_emp_id from public.employees where email = 'charlie.brown@dayflow.local';

  -- 6. Seed Employee Salaries
  insert into public.employee_salary (employee_id, salary_structure_id, monthly_wage, effective_from)
  values
  (v_e1_emp_id, v_structure_id, 80000.00, '2026-01-15'),
  (v_e2_emp_id, v_structure_id, 75000.00, '2026-02-01'),
  (v_e3_emp_id, v_structure_id, 90000.00, '2026-03-10'),
  (v_e4_emp_id, v_structure_id, 60000.00, '2026-04-01'),
  (v_e5_emp_id, v_structure_id, 70000.00, '2026-05-15');

  -- 7. Seed Attendance records (excluding leaves which will be seeded via leave approval sync)
  for v_seed_emp in select id, first_name from public.employees loop
    v_idx := 1;
    foreach v_date in array v_dates loop
      -- Let's build a deterministic mix of Present/Half-day/Absent for the 12 workdays
      if v_seed_emp.id = v_e1_emp_id and v_date = '2026-08-11'::date then
        -- We will leave John Doe's Aug 11 as a leave day, and seed it via leave request approval
        v_idx := v_idx + 1;
        continue;
      end if;
      if v_seed_emp.id = v_e2_emp_id and v_date in ('2026-08-18'::date, '2026-08-19'::date) then
        -- Leave days for Jane Smith
        v_idx := v_idx + 1;
        continue;
      end if;
      
      if v_idx % 6 = 0 then
        -- Absent
        insert into public.attendance (employee_id, date, status, work_hours, extra_hours)
        values (v_seed_emp.id, v_date, 'Absent', 0.00, 0.00);
      elsif v_idx % 5 = 0 then
        -- Half-day
        v_check_in := (v_date || ' 09:00:00+00')::timestamptz;
        v_check_out := (v_date || ' 13:45:00+00')::timestamptz;
        insert into public.attendance (employee_id, date, check_in, check_out, status, work_hours, extra_hours)
        values (v_seed_emp.id, v_date, v_check_in, v_check_out, 'Half-day', 4.75, 0.00);
      else
        -- Present (normal 9 hrs with 1 extra hour)
        v_check_in := (v_date || ' 09:00:00+00')::timestamptz;
        v_check_out := (v_date || ' 18:00:00+00')::timestamptz;
        insert into public.attendance (employee_id, date, check_in, check_out, status, work_hours, extra_hours)
        values (v_seed_emp.id, v_date, v_check_in, v_check_out, 'Present', 9.00, 1.00);
      end if;
      
      v_idx := v_idx + 1;
    end loop;
  end loop;

  -- 8. Seed Leave Requests with mixed status (includes triggers firing)
  
  -- John Doe Sick Leave: Aug 11 (1 day) - Approved
  insert into public.leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status, admin_comment)
  values (v_e1_emp_id, v_sick_type_id, '2026-08-11', '2026-08-11', 'Dental checkup', 'Approved', 'Approved by HR');

  -- Jane Smith PTO: Aug 18 to Aug 19 (2 days) - Approved
  insert into public.leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status, admin_comment)
  values (v_e2_emp_id, v_pto_type_id, '2026-08-18', '2026-08-19', 'Family function trip', 'Approved', 'Have a safe trip');

  -- Bob Johnson Unpaid Leave: Aug 25 to Aug 27 (3 days) - Pending
  insert into public.leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status, admin_comment)
  values (v_e3_emp_id, v_unpaid_type_id, '2026-08-25', '2026-08-27', 'Personal emergency travel', 'Pending', null);

  -- Charlie Brown Sick Leave: Aug 20 (1 day) - Rejected
  insert into public.leave_requests (employee_id, leave_type_id, start_date, end_date, reason, status, admin_comment)
  values (v_e5_emp_id, v_sick_type_id, '2026-08-20', '2026-08-20', 'Feeling feverish', 'Rejected', 'No medical certificate uploaded');

end;
$$;
