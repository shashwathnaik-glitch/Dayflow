import { computeSalary } from "../../src/lib/salary";

export async function listEmployees(filters?: any) {
  return [];
}

export async function getAllAttendance(dateRange?: any, filters?: any) {
  return [];
}

export async function getAllLeaveRequests(filters?: any) {
  return [];
}

export async function reviewLeaveRequest(requestId: string, status: string, adminComment?: string) {
  return { id: requestId, status, adminComment };
}

export async function createEmployee(payload: any) {
  return { id: "emp_mock", ...payload };
}

export async function getEmployeeSalary(employeeId: string) {
  return computeSalary(100000);
}

export function calculateSalaryPreview(monthlyWage: number) {
  return computeSalary(monthlyWage);
}
