'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthProvider';
import {
  listEmployees,
  getAllAttendance,
  getAllLeaveRequests,
  getEmployeeSalary,
  createEmployee as createEmployeeApi,
  getMyAttendance,
  getMyLeaveRequests,
  getMySalary,
  getEmployee
} from '@/lib/dayflow-api';
import { supabase } from '@/lib/supabaseClient';
import { checkInApi, checkOutApi, isUuid } from '@/services/attendanceService';
import * as timeoffApi from '@/timeoffApi';
import { fmtDate } from '@/dayflow-prototype.jsx';

interface DayflowDataContextType {
  employees: any[];
  attendance: any[];
  leaveRequests: any[];
  salaries: Record<string, any>;
  loading: boolean;
  me: any | null;
  todayStr: string;
  refreshData: () => Promise<void>;
  checkIn: (empId: string) => Promise<void>;
  checkOut: (empId: string) => Promise<void>;
  submitLeaveRequest: (empId: string, payload: any) => Promise<any>;
  decideLeave: (reqId: string, decision: string, comment: string) => Promise<any>;
  createEmployee: (payload: any) => Promise<any>;
  getTodayStatus: (empId: string) => string;
  getAllocations: (empId: string) => any[];
}
const DayflowDataContext = createContext<DayflowDataContextType | undefined>(undefined);

const mapEmployee = (e: any) => {
  if (!e) return null;
  return {
    ...e,
    name: `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Unknown Employee",
    department: e.department?.name || "No Department",
    position: e.job_position?.title || "No Position",
    monthlyWage: e.monthly_wage || 0
  };
};

export const DayflowDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, role } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const todayStr = fmtDate(new Date());

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (role === 'admin') {
        const [empRes, attRes, leaveRes, salaryRes] = await Promise.all([
          listEmployees(),
          getAllAttendance(),
          getAllLeaveRequests(),
          supabase.from('v_employee_salary_components').select('*')
        ]);

        const empList = empRes.data || [];
        const attList = attRes.data || [];
        const leaveList = leaveRes.data || [];
        const salaryList = salaryRes.data || [];

        const salaryMap: Record<string, any> = {};
        salaryList.forEach((s: any) => {
          salaryMap[s.employee_id] = s;
        });

        setEmployees(empList.map(mapEmployee).filter(Boolean));
        setAttendance(attList);
        setLeaveRequests(leaveList);
        setSalaries(salaryMap);
      } else {
        const employeeId = profile?.employee_id;
        if (!employeeId) {
          setEmployees([]);
          setAttendance([]);
          setLeaveRequests([]);
          setSalaries({});
          return;
        }

        const [empRes, attRes, leaveRes] = await Promise.all([
          getEmployee(employeeId),
          getMyAttendance(),
          getMyLeaveRequests()
        ]);

        const empData = empRes.data ? mapEmployee(empRes.data) : null;
        const attList = attRes.data || [];
        const leaveList = leaveRes.data || [];
        const mySalary = empRes.data?.salary || null;

        const salaryMap: Record<string, any> = {};
        if (mySalary) {
          salaryMap[employeeId] = mySalary;
        }

        setEmployees(empData ? [empData] : []);
        setAttendance(attList);
        setLeaveRequests(leaveList);
        setSalaries(salaryMap);
      }
    } catch (err) {
      console.error("Error loading database data:", err);
    } finally {
      setLoading(false);
    }
  }, [user, role, profile]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const me = profile?.employee_id && employees.length > 0 
    ? employees.find(e => e.id === profile.employee_id) || null
    : null;

  const getTodayStatus = (empId: string) => {
    const onLeave = leaveRequests.some(r => r.employeeId === empId && r.status === "Approved" && 
      (todayStr >= r.startDate && todayStr <= r.endDate));
    if (onLeave) return "On Leave";

    const a = attendance.find(x => x.employeeId === empId && x.date === todayStr);
    if (a) return a.status;
    return "Not Checked In";
  };

  const getAllocations = (empId: string) => {
    return [
      { id: "pto", name: "Paid Time Off", allocated: 24, used: 0, remaining: 24 },
      { id: "sick", name: "Sick Leave", allocated: 7, used: 0, remaining: 7 },
    ];
  };

  const checkIn = async (empId: string) => {
    if (isUuid(empId)) {
      const apiRes = await checkInApi(empId, todayStr);
      if (apiRes && apiRes.ok && apiRes.record) {
        setAttendance(a => [...a.filter(x => !(x.employeeId === empId && x.date === todayStr)), apiRes.record]);
        return;
      }
    }
    const rec = { employeeId: empId, date: todayStr, day: new Date().toLocaleDateString("en-US",{weekday:"short"}), checkIn: new Date(), checkOut: null, workHours: 0, extraHours: 0, status: "Present" };
    setAttendance(a => [...a, rec]);
  };

  const checkOut = async (empId: string) => {
    if (isUuid(empId)) {
      const apiRes = await checkOutApi(empId, todayStr);
      if (apiRes && apiRes.ok && apiRes.record) {
        setAttendance(list => list.map(a => (a.employeeId === empId && a.date === todayStr) ? apiRes.record : a));
        return;
      }
    }
    setAttendance(list => list.map(a => {
      if (a.employeeId !== empId || a.date !== todayStr) return a;
      const checkOutTime = new Date();
      const checkInTime = new Date(a.checkIn);
      const workHours = +(((checkOutTime.getTime() - checkInTime.getTime()) / 3600000)).toFixed(1);
      const extraHours = +Math.max(0, workHours - 8).toFixed(1);
      return { ...a, checkOut: checkOutTime, workHours, extraHours, status: workHours < 5 ? "Half-day" : "Present" };
    }));
  };

  const submitLeaveRequest = async (empId: string, payload: any) => {
    const res = await timeoffApi.submitLeaveRequest(empId, payload);
    const updatedLeavesRes = await getAllLeaveRequests();
    setLeaveRequests(updatedLeavesRes.data || []);
    return res.data || res;
  };

  const decideLeave = async (reqId: string, decision: string, comment: string) => {
    const res = await timeoffApi.decideLeave(reqId, decision, comment);
    const updatedLeavesRes = await getAllLeaveRequests();
    setLeaveRequests(updatedLeavesRes.data || []);
    return res.data || res;
  };

  const createEmployee = async (payload: any) => {
    const apiPayload = {
      firstName: payload.firstName,
      lastName: payload.lastName,
      personal_email: payload.email,
      department_id: payload.department_id || 'Engineering',
      job_position_id: payload.job_position_id || 'Software Engineer',
      joining_date: fmtDate(new Date()),
      monthly_wage: Number(payload.monthly_wage),
      mobile: payload.mobile || "—",
    };

    const newEmpRes = await createEmployeeApi(apiPayload as any);
    await loadData();
    return newEmpRes.data || newEmpRes;
  };

  return (
    <DayflowDataContext.Provider value={{
      employees,
      attendance,
      leaveRequests,
      salaries,
      loading,
      me,
      todayStr,
      refreshData: loadData,
      checkIn,
      checkOut,
      submitLeaveRequest,
      decideLeave,
      createEmployee,
      getTodayStatus,
      getAllocations
    }}>
      {children}
    </DayflowDataContext.Provider>
  );
};

export const useDayflowData = () => {
  const context = useContext(DayflowDataContext);
  if (context === undefined) {
    throw new Error('useDayflowData must be used within a DayflowDataProvider');
  }
  return context;
};
