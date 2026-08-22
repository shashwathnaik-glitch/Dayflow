# Dayflow — RBAC

## Roles

- `admin`
- `employee`

## Permission matrix

| Capability | Admin | Employee |
|---|---:|---:|
| Login | Yes | Yes |
| View own profile | Yes | Yes |
| Edit own permitted fields | Yes | Yes |
| Edit any employee | Yes | No |
| View employee list | Yes | No |
| View own attendance | Yes | Yes |
| View all attendance | Yes | No |
| Check In/Out | Yes* | Yes |
| Create time-off request | Yes* | Yes |
| View own requests | Yes | Yes |
| View all requests | Yes | No |
| Approve/reject | Yes | No |
| Manage leave allocations | Yes | No |
| View payroll summary | Yes | Yes (read-only) |
| Manage salary structure | Yes | No |
| View detailed Salary Info | Yes | No |
| Admin dashboard | Yes | No |

`*` Optional for Admin if the final UI supports it; employee Check In/Out is the core workflow.

## Security rules

Frontend hiding is not sufficient.

Use Supabase RLS so:
- employees can select/update only their permitted rows
- employees cannot read other employees' private data
- employees cannot approve/reject requests
- employees cannot modify salary
- admins can manage required records

Never put service-role keys in the browser.
