# Dayflow — Architecture

## 1. Architecture

```text
Browser
  |
  v
React / Next.js UI
  |
  +--> Shared UI components
  |
  +--> Supabase client
          |
          +--> Supabase Auth
          |
          +--> PostgreSQL
          |
          +--> Storage (only where needed)
```

## 2. Principles

- One application
- One repository
- One Supabase project
- One shared component/design system
- Keep backend simple
- Enforce authorization server/database side
- Reuse existing components

## 3. Major domains

```text
Identity
  └── users/profiles

People
  ├── employees
  ├── departments
  ├── job_positions
  ├── documents
  └── skills

Attendance
  ├── attendance
  └── attendance_schedules

Time Off
  ├── leave_types
  ├── leave_allocations
  └── leave_requests

Payroll
  ├── salary_structures
  ├── salary_components
  └── employee_salary
```

## 4. Frontend routing concept

### Employee
- `/login`
- `/dashboard`
- `/profile`
- `/attendance`
- `/time-off`
- `/payroll`

### Admin
- `/admin/dashboard`
- `/admin/employees`
- `/admin/employees/:id`
- `/admin/attendance`
- `/admin/time-off`
- `/admin/payroll`
- `/admin/analytics`

Actual routes may differ; keep one consistent routing convention.

## 5. Integration rule

Feature owners may modify their module, but shared schema/auth/navigation changes should be coordinated with Member 1.
