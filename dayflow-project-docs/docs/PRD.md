# Dayflow — Product Requirements Document

## 1. Product

**Name:** Dayflow  
**Tagline:** Every workday, perfectly aligned.

Dayflow is a Human Resource Management System that digitizes core HR operations including employee onboarding/profile management, attendance tracking, time-off management, approval workflows and payroll/salary visibility.

## 2. Problem

HR operations are often fragmented across manual processes. Dayflow brings employee records, attendance, leave and salary information into one role-aware workspace.

## 3. Users

### Admin / HR Officer
Needs to:
- manage employees
- view employee information
- view attendance
- manage time-off requests
- approve/reject requests
- view/manage salary information
- see workforce summaries

### Employee
Needs to:
- access their own profile
- view/edit permitted profile fields
- check in/out
- view their own attendance
- request time off
- view request status
- view permitted payroll information

## 4. Goals

### P0
- Authentication
- RBAC
- Admin-created employee onboarding
- Employee login
- Employee dashboard
- Check In / Check Out
- Attendance records
- Time-off request
- HR approval/rejection
- Employee list

### P1
- Rich profile
- Leave allocations
- Salary structure
- Payroll summary
- Basic analytics

### P2
- Notifications
- Advanced reports
- Optional AI assistant

## 5. Non-goals for the hackathon

- Full statutory payroll/tax compliance
- Bank integrations
- Enterprise email infrastructure
- Complex leave accrual engine
- Microservices
- Complex scheduling engine
- Large-scale document management

## 6. Success criteria

The demo should prove a complete workflow:

Admin creates employee → login ID is generated → employee logs in → checks in → employee requests leave → HR approves → employee sees updated status → Admin views salary/payroll.

## 7. Product principles

- Working > complex
- End-to-end > isolated screens
- Consistent > flashy
- Real data > static mockups
- Database-enforced permissions > frontend-only hiding
