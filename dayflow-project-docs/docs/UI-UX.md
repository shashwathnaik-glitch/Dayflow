# Dayflow — UI/UX

## Visual direction

Modern professional HR SaaS.

Use:
- clean sidebar
- clear page headers
- cards
- tables
- status badges
- dialogs/forms
- avatars
- search/filter
- responsive layouts
- subtle borders/shadows
- consistent spacing and typography

## Shared components

Prefer reusable:
- `AppShell`
- `Sidebar`
- `Topbar`
- `PageHeader`
- `DashboardCard`
- `EmployeeCard`
- `StatusBadge`
- `DataTable`
- `SearchBar`
- `FilterBar`
- `FormField`
- `Modal/Dialog`
- `Toast`
- `EmptyState`
- `LoadingState`
- `ErrorState`

## Status language

Attendance:
- 🟢 Present
- 🟡 Absent
- 🔵 Half-day
- ✈️ On Leave

Time Off:
- 🟡 Pending
- 🟢 Approved
- 🔴 Rejected

## Reference-design details

Employee cards show profile image/basic information and a work status icon in the top-right.

Avatar dropdown:
- My Profile
- Log Out

Profile is form-view style.
Admin's Salary Info is separate/protected.
Attendance supports prominent Check In/Check Out.
Time Off supports allocations and request/approval views.

## Lovable rule

Members 2–4 may use Lovable for rapid UI generation, but all generated screens must be integrated into the single shared application and follow this document. Do not create separate products.
