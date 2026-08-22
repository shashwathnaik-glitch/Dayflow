# Dayflow — Core Workflows

## 1. Admin creates employee

```text
Admin
  -> Create Employee
  -> Enter employee information
  -> System generates Login ID
  -> System creates initial credential
  -> Employee record saved
  -> Employee can sign in
```

## 2. Employee login

```text
Login
 -> authenticate
 -> load profile/role
 -> employee dashboard
```

## 3. Attendance

```text
Employee
 -> Check In
 -> create/update today's attendance
 -> Present

Employee
 -> Check Out
 -> save checkout
 -> calculate work hours
```

## 4. Time Off

```text
Employee
 -> Request Time Off
 -> select type/date/reason
 -> submit
 -> Pending

Admin
 -> open request
 -> Approve OR Reject
 -> optional comment
 -> status persisted

Employee
 -> sees updated status
```

## 5. Employee status

For the dashboard/cards:
- current valid attendance => Present
- approved current leave => On Leave
- no qualifying attendance and not on leave => Absent

The exact business-day/timezone edge cases are not specified by the source; use a simple hackathon rule and document it in code.

## 6. Payroll

```text
Monthly Wage
 -> salary component calculation
 -> gross/earnings
 -> deductions
 -> net salary
```

Attendance can feed payable-day calculations.

For an MVP, keep payroll calculation deterministic and clearly labelled as a demonstration model.
