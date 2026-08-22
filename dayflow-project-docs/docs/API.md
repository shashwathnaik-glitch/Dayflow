# Dayflow — API / Data Operations

Dayflow may use Supabase client/database operations instead of a separate REST server.

## Auth

- `signIn(emailOrLoginId, password)`
- `signOut()`
- `getCurrentUser()`

If login ID is supported, resolve it to the associated authentication email through a secure mechanism rather than exposing unnecessary user data.

## Employees

- `listEmployees()`
- `getEmployee(id)`
- `createEmployee(input)` — Admin
- `updateEmployee(id, input)` — Admin / permitted self-edit
- `generateEmployeeLoginId(input)` — Admin workflow

## Attendance

- `getMyAttendance(range)`
- `getAllAttendance(range)` — Admin
- `checkIn()`
- `checkOut()`

## Time Off

- `getLeaveTypes()`
- `getMyAllocations()`
- `getMyRequests()`
- `createLeaveRequest(input)`
- `getAllLeaveRequests()` — Admin
- `approveLeaveRequest(id, comment)`
- `rejectLeaveRequest(id, comment)`

## Payroll

- `getMyPayroll()` — read-only
- `getEmployeePayroll(id)` — Admin
- `updateEmployeeSalary(id, input)` — Admin
- `calculateSalary(input)`

## Dashboard

- `getEmployeeDashboard()`
- `getAdminDashboard()`

## Implementation rule

Do not invent a separate backend API layer if direct Supabase operations are sufficient for the hackathon. Keep sensitive operations protected by RLS and trusted server-side code where necessary.
