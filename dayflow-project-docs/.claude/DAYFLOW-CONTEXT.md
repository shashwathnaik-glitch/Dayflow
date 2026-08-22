# DAYFLOW — AI PROJECT CONTEXT

You are an AI engineering teammate working on **Dayflow — Human Resource Management System** for an 8-hour hackathon.

Read this file before making implementation decisions.

## Product

Dayflow digitizes:
- employee management
- profiles
- attendance
- time off/leave
- HR approval workflows
- salary/payroll visibility
- basic analytics

## Users

### Admin / HR
Manages employees, attendance, time off approvals, payroll/salary administration and workforce views.

### Employee
Views/manages permitted personal information, checks in/out, views own attendance, requests time off and views read-only payroll information.

## Critical rules

- One repository
- One application
- One Supabase project
- One database schema
- One design system
- No module-specific competing backends
- Database-level authorization is required

## Source hierarchy

1. Supplied problem statement: broad functional requirements.
2. Supplied Excalidraw: detailed UI/interaction behavior.
3. These repository docs: implementation decisions and shared engineering contract.
4. New AI suggestions: lowest priority and must not silently override the above.

If a requirement is ambiguous, state the ambiguity and choose the simplest hackathon-safe implementation. Do not silently invent major features.

## Key Excalidraw requirements

- Employee cards show profile/basic information and status.
- Status icons: Present, On Leave, Absent.
- Employee card opens view-only employee information.
- My Profile contains basic/private/profile information.
- Salary Info tab is Admin-only.
- Employee Check In/Check Out.
- Attendance has date/day/employee/check-in/check-out/work-hours/extra-hours.
- Time Off has Paid Time Off, Sick Leave and Unpaid Leave.
- Time-off requests have Pending/Approved/Rejected states.
- Admin/HR can approve/reject and comment.
- Sick leave may include a certificate attachment.
- Admin/HR creates employees; normal users do not self-register in the detailed reference.
- Login ID follows OI + name initials + joining year + serial pattern.
- Initial password is generated for new employees; employee can change it.
- Salary components include Basic, HRA, Standard Allowance, Performance Bonus, LTA, Fixed Allowance, Professional Tax and PF.
- Salary component values update from wage/configuration.
- Attendance can affect payable days/payslip computation.

## Key source ambiguity decisions

### Public sign-up
The broad problem statement includes Sign Up, while the detailed Excalidraw says normal users cannot register and Admin/HR creates users.

For this hackathon, use Admin/HR-created employee onboarding unless the team explicitly changes the decision.

### Employee salary visibility
The problem statement says employee payroll is read-only; the Excalidraw says detailed Salary Info is Admin-only.

For this MVP:
- employee: read-only payroll/summary if implemented
- admin: detailed Salary Info/configuration

## P0

- authentication
- RBAC
- employee creation/login
- employee dashboard
- Check In/Out
- attendance
- time-off request
- approval/rejection
- employee list

## P1

- profile
- allocations
- salary structure
- payroll summary
- analytics

## P2

- notifications
- advanced reports
- optional AI assistant

## Shared stack

Prefer:
- React/Next.js
- Tailwind
- shadcn/ui
- Supabase Auth/Postgres
- Recharts
- GitHub
- Vercel

## AI tools

- Antigravity: main coding/integration
- Claude: deep coding/debugging/review
- Lovable: UI acceleration
- Replit: optional experiments
- ChatGPT: planning/architecture/debugging/demo

## Team

1. Tech Lead / Backend / Integration
2. Employee Experience / Attendance
3. Time Off / HR Workflow
4. Admin / Payroll / Analytics

## Coding behavior

Before coding:
- inspect existing code
- identify affected files
- identify dependencies
- preserve shared architecture

During coding:
- reuse components
- use existing schema
- validate inputs
- handle errors/loading/empty states
- make the smallest complete change

After coding:
- test the affected flow
- list changed files
- list assumptions
- mention integration risks

Never break P0 functionality for a secondary feature.
