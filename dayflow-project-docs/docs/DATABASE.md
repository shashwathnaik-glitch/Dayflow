# Dayflow — Database Design

## 1. Database

PostgreSQL through Supabase.

## 2. Core entities

- `profiles`
- `employees`
- `departments`
- `job_positions`
- `attendance`
- `attendance_schedules`
- `leave_types`
- `leave_allocations`
- `leave_requests`
- `salary_structures`
- `salary_components`
- `employee_salary`
- `documents`
- `skills`
- `employee_skills`

## 3. Relationship model

```text
auth.users
    |
    v
profiles
    |
    v
employees
 |     |       |        |
 v     v       v        v
attendance  leave   salary   documents
            |       |
            v       v
       leave_types  salary_components
```

## 4. Important constraints

- One employee maps to one profile/user.
- Employee attendance belongs to an employee.
- Leave requests belong to an employee and leave type.
- Allocations belong to an employee and leave type.
- Salary records belong to an employee.
- Salary components belong to a salary structure.
- Employees must not read another employee's protected data.
- Admin can manage all records.

## 5. Demo seed

Seed:
- 1 Admin
- 4–8 Employees
- multiple attendance records
- leave allocations
- pending/approved/rejected requests
- salary structures

Use obviously fake development data.
