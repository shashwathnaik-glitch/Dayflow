# Dayflow — Requirements

## 1. Source material

This document is based on:
1. `Dayflow - Human Resource Management System.pdf`
2. `Human Resource Management System - 8 hours.excalidraw`

The PDF defines the broad requirements. The Excalidraw supplies additional detailed UI/interaction requirements.

## 2. Authentication

### Sign in
- Email/login ID + password
- Invalid credentials show an error
- Successful login redirects to the appropriate dashboard

### Employee onboarding decision
The PDF describes a general Sign Up flow. The Excalidraw additionally states that a normal user cannot register and that Admin/HR creates the employee, with an automatically generated Login ID and initial password.

**Hackathon implementation decision:** use Admin/HR-created employee onboarding. Do not build public employee registration unless the team explicitly decides it is necessary.

### Login ID
Reference format:
`OI` + first two letters of first name + first two letters of last name + joining year + joining serial number.

Example:
`OIJODO20220001`

The exact collision/sequence mechanism is not specified; implement a simple database-backed yearly serial.

## 3. Employee

Employee cards:
- profile picture
- basic employee information
- work/attendance status
- clickable
- open view-only employee information page

Status:
- Present
- On Leave
- Absent

Profile fields from the reference include:
- name
- mobile
- email
- department
- job position
- manager
- company
- location
- date of birth
- residing address
- personal email
- gender
- nationality
- marital status
- bank details
- resume
- skills
- certifications
- PAN
- UAN
- employee code

Employees can edit only permitted fields such as address, phone and profile picture. Admin can edit all employee details.

## 4. Attendance

Employee:
- Check In
- Check Out
- view own attendance

Admin/HR:
- view attendance for employees

Attendance record:
- date
- day
- employee
- check in
- check out
- work hours
- extra hours
- status

Statuses:
- Present
- Absent
- Half-day
- Leave

The reference states that attendance is a basis for payslip generation and payable-day calculation. Unpaid leave or missing attendance can reduce payable days during payroll computation.

## 5. Time Off

Types:
- Paid Time Off
- Sick Leave
- Unpaid Leave

Employee:
- view allocations
- request time off
- choose date range
- choose type
- add remarks
- attach sick-leave certificate where applicable
- view own requests

Admin/HR:
- view all requests
- approve
- reject
- add comments

Statuses:
- Pending
- Approved
- Rejected

## 6. Payroll / salary

Employee payroll view is read-only according to the PDF.

The Excalidraw specifies a `Salary Info` tab visible only to Admin and gives detailed salary-structure administration.

**Hackathon implementation decision:** Employees may receive a read-only payroll/summary view, while detailed salary configuration (`Salary Info`) is Admin-only.

Salary components referenced:
- Basic Salary
- House Rent Allowance
- Standard Allowance
- Performance Bonus
- Leave Travel Allowance
- Fixed Allowance
- Professional Tax
- Provident Fund

Reference examples:
- Basic may be a percentage of wage.
- HRA may be 50% of Basic.
- Fixed allowance is the residual after configured components.
- PF is based on Basic Salary.
- Professional Tax is represented as a configured deduction.

Do not represent these demo calculations as legal/tax advice.

## 7. Dashboard

Employee:
- Profile
- Attendance
- Leave/Time Off
- Logout
- recent activity/alerts

Admin/HR:
- employee list
- attendance records
- leave approvals
- workforce summary

## 8. Notifications and analytics

The PDF lists email/notification alerts and analytics/reports as future/optional enhancements.

Implement only if P0/P1 features are stable.

## 9. Non-functional requirements

- Responsive UI
- Consistent design system
- Loading states
- Error states
- Empty states
- Validation
- Secure authorization
- Database-level RLS for sensitive data
