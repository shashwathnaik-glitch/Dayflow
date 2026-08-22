-- Dayflow MVP — Supabase/PostgreSQL foundation
-- Review before applying to an existing project.
-- This schema intentionally keeps the hackathon MVP simple.

create extension if not exists pgcrypto;

create type public.app_role as enum ('admin', 'employee');
create type public.attendance_status as enum ('present', 'absent', 'half_day', 'leave');
create type public.leave_status as enum ('pending', 'approved', 'rejected');
create type public.leave_category as enum ('paid', 'sick', 'unpaid');

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'employee',
  employee_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.job_positions (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  login_id text unique,
  employee_code text unique,
  first_name text not null,
  last_name text,
  email text,
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
  pan_no text,
  uan_no text,
  about text,
  job_love text,
  interests text,
  bank_account_number text,
  bank_name text,
  bank_ifsc text,
  status text not null default 'active',
  joining_serial integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_employee_id_fkey;

alter table public.profiles
  add constraint profiles_employee_id_fkey
  foreign key (employee_id) references public.employees(id) on delete set null;

create table if not exists public.attendance_schedules (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  working_days integer not null default 5,
  start_time time,
  end_time time,
  break_minutes integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  schedule_id uuid references public.attendance_schedules(id) on delete set null,
  attendance_date date not null,
  check_in timestamptz,
  check_out timestamptz,
  work_hours numeric(6,2) not null default 0,
  extra_hours numeric(6,2) not null default 0,
  status public.attendance_status not null default 'absent',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, attendance_date)
);

create table if not exists public.leave_types (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category public.leave_category not null,
  requires_attachment boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.leave_allocations (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete cascade,
  allocated_days numeric(6,2) not null default 0,
  used_days numeric(6,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id, leave_type_id)
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  leave_type_id uuid not null references public.leave_types(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  reason text,
  attachment_url text,
  status public.leave_status not null default 'pending',
  admin_comment text,
  reviewed_by uuid references public.employees(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_leave_dates check (end_date >= start_date)
);

create table if not exists public.salary_structures (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  wage_type text not null default 'fixed',
  created_at timestamptz not null default now()
);

create table if not exists public.salary_components (
  id uuid primary key default gen_random_uuid(),
  salary_structure_id uuid not null references public.salary_structures(id) on delete cascade,
  name text not null,
  computation_type text not null default 'fixed',
  value numeric(12,4) not null default 0,
  base_component text,
  is_deduction boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_salary (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  salary_structure_id uuid references public.salary_structures(id) on delete set null,
  monthly_wage numeric(12,2) not null default 0,
  effective_from date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(employee_id)
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  name text not null,
  document_type text,
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.employee_skills (
  employee_id uuid not null references public.employees(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  primary key(employee_id, skill_id)
);

create index if not exists idx_attendance_employee_date
  on public.attendance(employee_id, attendance_date);

create index if not exists idx_leave_requests_employee
  on public.leave_requests(employee_id);

create index if not exists idx_leave_requests_status
  on public.leave_requests(status);

create index if not exists idx_leave_requests_dates
  on public.leave_requests(start_date, end_date);

create index if not exists idx_employee_department
  on public.employees(department_id);

create index if not exists idx_employee_salary_employee
  on public.employee_salary(employee_id);

-- Seed reference data.
insert into public.leave_types(name, category, requires_attachment)
values
  ('Paid Time Off', 'paid', false),
  ('Sick Leave', 'sick', true),
  ('Unpaid Leave', 'unpaid', false)
on conflict (name) do nothing;

-- Seed demo departments/positions.
insert into public.departments(name)
values ('Engineering'), ('Human Resources'), ('Design'), ('Finance')
on conflict (name) do nothing;

insert into public.job_positions(title)
values ('Software Engineer'), ('HR Officer'), ('Product Designer'), ('Finance Analyst')
on conflict (title) do nothing;

-- RLS
alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.attendance enable row level security;
alter table public.leave_types enable row level security;
alter table public.leave_allocations enable row level security;
alter table public.leave_requests enable row level security;
alter table public.salary_structures enable row level security;
alter table public.salary_components enable row level security;
alter table public.employee_salary enable row level security;
alter table public.documents enable row level security;
alter table public.skills enable row level security;
alter table public.employee_skills enable row level security;

-- Helper functions.
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

-- Profiles.
drop policy if exists "profiles_self_or_admin_select" on public.profiles;
create policy "profiles_self_or_admin_select"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

-- Employees.
drop policy if exists "employees_self_or_admin_select" on public.employees;
create policy "employees_self_or_admin_select"
on public.employees for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists "employees_admin_insert" on public.employees;
create policy "employees_admin_insert"
on public.employees for insert
with check (public.is_admin());

drop policy if exists "employees_admin_update" on public.employees;
create policy "employees_admin_update"
on public.employees for update
using (public.is_admin())
with check (public.is_admin());

-- Attendance.
drop policy if exists "attendance_self_or_admin_select" on public.attendance;
create policy "attendance_self_or_admin_select"
on public.attendance for select
using (employee_id = public.current_employee_id() or public.is_admin());

drop policy if exists "attendance_self_insert" on public.attendance;
create policy "attendance_self_insert"
on public.attendance for insert
with check (employee_id = public.current_employee_id() or public.is_admin());

drop policy if exists "attendance_self_or_admin_update" on public.attendance;
create policy "attendance_self_or_admin_update"
on public.attendance for update
using (employee_id = public.current_employee_id() or public.is_admin())
with check (employee_id = public.current_employee_id() or public.is_admin());

-- Leave types.
drop policy if exists "leave_types_authenticated_select" on public.leave_types;
create policy "leave_types_authenticated_select"
on public.leave_types for select
using (auth.uid() is not null);

-- Allocations.
drop policy if exists "allocations_self_or_admin_select" on public.leave_allocations;
create policy "allocations_self_or_admin_select"
on public.leave_allocations for select
using (employee_id = public.current_employee_id() or public.is_admin());

drop policy if exists "allocations_admin_manage" on public.leave_allocations;
create policy "allocations_admin_manage"
on public.leave_allocations for all
using (public.is_admin())
with check (public.is_admin());

-- Leave requests.
drop policy if exists "leave_requests_self_or_admin_select" on public.leave_requests;
create policy "leave_requests_self_or_admin_select"
on public.leave_requests for select
using (employee_id = public.current_employee_id() or public.is_admin());

drop policy if exists "leave_requests_self_insert" on public.leave_requests;
create policy "leave_requests_self_insert"
on public.leave_requests for insert
with check (employee_id = public.current_employee_id());

drop policy if exists "leave_requests_admin_update" on public.leave_requests;
create policy "leave_requests_admin_update"
on public.leave_requests for update
using (public.is_admin())
with check (public.is_admin());

-- Salary.
drop policy if exists "employee_salary_self_or_admin_select" on public.employee_salary;
create policy "employee_salary_self_or_admin_select"
on public.employee_salary for select
using (employee_id = public.current_employee_id() or public.is_admin());

drop policy if exists "employee_salary_admin_manage" on public.employee_salary;
create policy "employee_salary_admin_manage"
on public.employee_salary for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "salary_structures_admin_select" on public.salary_structures;
create policy "salary_structures_admin_select"
on public.salary_structures for select
using (public.is_admin());

drop policy if exists "salary_structures_admin_manage" on public.salary_structures;
create policy "salary_structures_admin_manage"
on public.salary_structures for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "salary_components_admin_select" on public.salary_components;
create policy "salary_components_admin_select"
on public.salary_components for select
using (public.is_admin());

drop policy if exists "salary_components_admin_manage" on public.salary_components;
create policy "salary_components_admin_manage"
on public.salary_components for all
using (public.is_admin())
with check (public.is_admin());

-- Documents/skills.
drop policy if exists "documents_self_or_admin_select" on public.documents;
create policy "documents_self_or_admin_select"
on public.documents for select
using (employee_id = public.current_employee_id() or public.is_admin());

drop policy if exists "documents_admin_manage" on public.documents;
create policy "documents_admin_manage"
on public.documents for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "skills_authenticated_select" on public.skills;
create policy "skills_authenticated_select"
on public.skills for select
using (auth.uid() is not null);

drop policy if exists "employee_skills_self_or_admin_select" on public.employee_skills;
create policy "employee_skills_self_or_admin_select"
on public.employee_skills for select
using (employee_id = public.current_employee_id() or public.is_admin());

drop policy if exists "employee_skills_admin_manage" on public.employee_skills;
create policy "employee_skills_admin_manage"
on public.employee_skills for all
using (public.is_admin())
with check (public.is_admin());

-- NOTE:
-- Auth user creation and secure initial-password handling should be performed
-- through trusted server-side/admin tooling, not by exposing the Supabase
-- service-role key to the browser.
