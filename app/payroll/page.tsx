'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  Avatar, 
  StatCard, 
  EmptyState, 
  Icon 
} from '@/components/SharedAtoms';
import { 
  listEmployees, 
  getMySalary, 
  getCurrentUser 
} from '@/lib/dayflow-api';
import { supabase } from '@/lib/supabaseClient';
import { mapEmployeeDbToUi } from '@/lib/dataMappers';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';

function fmtINR(n: number) {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}

export default function PayrollPage() {
  const { user, role } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<Record<string, any>>({});
  const [employeeSalary, setEmployeeSalary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const dashboardLink = role === 'admin' ? '/admin/dashboard' : '/dashboard';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        if (role === 'admin') {
          // Fetch employees and all salaries
          const [empRes, salRes] = await Promise.all([
            listEmployees(),
            supabase.from('v_employee_salary_components').select('*')
          ]);

          const mappedEmployees = (empRes.data || []).map(mapEmployeeDbToUi);
          setEmployees(mappedEmployees);

          const salaryMap: Record<string, any> = {};
          (salRes.data || []).forEach((s: any) => {
            salaryMap[s.employee_id] = {
              basic: s.basic,
              hra: s.hra,
              standardAllowance: s.standard_allowance,
              performanceBonus: s.performance_bonus,
              lta: s.lta,
              fixedAllowance: s.fixed_allowance,
              pf: s.pf,
              professionalTax: s.professional_tax,
              gross: s.gross,
              net: s.net
            };
          });
          setSalaries(salaryMap);
        } else {
          // Fetch logged in employee's salary details
          const res = await getMySalary();
          if (res.data) {
            setEmployeeSalary({
              basic: res.data.basic,
              hra: res.data.hra,
              standardAllowance: res.data.standard_allowance,
              performanceBonus: res.data.performance_bonus,
              lta: res.data.lta,
              fixedAllowance: res.data.fixed_allowance,
              pf: res.data.pf,
              professionalTax: res.data.professional_tax,
              gross: res.data.gross,
              net: res.data.net
            });
          }
        }
      } catch (err) {
        console.error("Error loading payroll data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [role]);

  // Calculations for Admin view
  const employeesWithSalary = useMemo(() => {
    return employees.map(e => ({
      ...e,
      salary: salaries[e.id] || { gross: 0, net: 0, pf: 0, professionalTax: 0 }
    }));
  }, [employees, salaries]);

  const totalGross = useMemo(() => employeesWithSalary.reduce((s, e) => s + e.salary.gross, 0), [employeesWithSalary]);
  const totalNet = useMemo(() => employeesWithSalary.reduce((s, e) => s + e.salary.net, 0), [employeesWithSalary]);

  const grossByDept = useMemo(() => {
    const map: Record<string, number> = {};
    employeesWithSalary.forEach(e => { 
      map[e.department] = (map[e.department] || 0) + e.salary.gross; 
    });
    return Object.entries(map).map(([name, value]) => ({
      name, 
      value: Math.round(value / 1000) // ₹ thousands
    }));
  }, [employeesWithSalary]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <p style={{ color: "var(--ink-soft)", fontSize: "15px" }}>Loading Payroll module...</p>
      </div>
    );
  }

  // Render Admin View
  if (role === 'admin') {
    return (
      <div style={{ padding: 40, maxWidth: 1140, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 24 }}>
          <div>
            <div style={{ marginBottom: 12 }}>
              <a href={dashboardLink} className="df-btn df-btn-ghost df-btn-sm" style={{ textDecoration: 'none', padding: "6px 12px" }}>
                <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon.chev /></span> Back to Dashboard
              </a>
            </div>
            <h1 className="df-display" style={{ fontSize: 24, margin: 0, fontWeight: 700, color: 'var(--ink)' }}>Payroll Summary</h1>
            <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
              Salary structure and monthly payroll summary across the company.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
          <StatCard label="Monthly Gross (all)" value={fmtINR(totalGross)} tone="var(--brand-flow)" />
          <StatCard label="Monthly Net (all)" value={fmtINR(totalNet)} tone="var(--success)" />
          <StatCard label="Headcount" value={employees.length} />
        </div>

        {/* Bar chart */}
        <div className="df-card" style={{ padding: 20, marginBottom: 20 }}>
          <h3 style={{ fontSize: 14.5, margin: "0 0 14px" }}>Gross payroll by department (₹ thousands)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={grossByDept}>
              <CartesianGrid vertical={false} stroke="#EEF0F6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9AA0AF" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9AA0AF" }} />
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #E4E6F0", fontSize: 12 }} formatter={(v) => `₹${v}k`} />
              <Bar dataKey="value" fill="#1E2A52" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Payroll Table */}
        <div className="df-card" style={{ padding: "6px 20px 14px" }}>
          <table className="df-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Monthly Wage</th>
                <th>Gross</th>
                <th>Deductions</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              {employeesWithSalary.map(e => (
                <tr key={e.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={e.name} size={26} url={e.profile_image_url} />
                      {e.name}
                    </div>
                  </td>
                  <td>{e.department}</td>
                  <td className="df-mono">{fmtINR(e.monthlyWage)}</td>
                  <td className="df-mono">{fmtINR(e.salary.gross)}</td>
                  <td className="df-mono" style={{ color: "var(--danger)" }}>
                    −{fmtINR(e.salary.pf + e.salary.professionalTax)}
                  </td>
                  <td className="df-mono" style={{ fontWeight: 700, color: "var(--success)" }}>
                    {fmtINR(e.salary.net)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Render Employee View (Read-Only)
  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 24 }}>
        <div>
          <div style={{ marginBottom: 12 }}>
            <a href={dashboardLink} className="df-btn df-btn-ghost df-btn-sm" style={{ textDecoration: 'none', padding: "6px 12px" }}>
              <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon.chev /></span> Back to Dashboard
            </a>
          </div>
          <h1 className="df-display" style={{ fontSize: 24, margin: 0, fontWeight: 700, color: 'var(--ink)' }}>My Payroll & Salary</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13.5, color: 'var(--ink-soft)' }}>
            Wage details and salary component breakdown.
          </p>
        </div>
      </div>

      {employeeSalary ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
          {/* Earnings card */}
          <div className="df-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, margin: "0 0 14px" }}>Earnings</h3>
            {[
              ["Basic Salary", employeeSalary.basic],
              ["HRA", employeeSalary.hra],
              ["Standard Allowance", employeeSalary.standardAllowance],
              ["Performance Bonus", employeeSalary.performanceBonus],
              ["Leave Travel Allowance", employeeSalary.lta],
              ["Fixed Allowance", employeeSalary.fixedAllowance]
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13.5, borderBottom: "1px solid var(--line)" }}>
                <span style={{ color: "var(--ink-soft)" }}>{label}</span>
                <span className="df-mono">{fmtINR(val || 0)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: 14, fontWeight: 700 }}>
              <span>Gross Salary</span>
              <span className="df-mono">{fmtINR(employeeSalary.gross || 0)}</span>
            </div>
          </div>

          {/* Deductions card */}
          <div className="df-card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 14, margin: "0 0 14px" }}>Deductions</h3>
            {[
              ["Provident Fund", employeeSalary.pf],
              ["Professional Tax", employeeSalary.professionalTax]
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", fontSize: 13.5, borderBottom: "1px solid var(--line)" }}>
                <span style={{ color: "var(--ink-soft)" }}>{label}</span>
                <span className="df-mono" style={{ color: "var(--danger)" }}>−{fmtINR(val || 0)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0 0", fontSize: 16, fontWeight: 700, color: "var(--success)" }}>
              <span>Net Salary / month</span>
              <span className="df-mono">{fmtINR(employeeSalary.net || 0)}</span>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 14, lineHeight: 1.5 }}>
              Wage type: Monthly. Figures represent your monthly payslip compensation breakdown. For payroll adjustments, contact HR.
            </p>
          </div>
        </div>
      ) : (
        <EmptyState title="No payroll data available" subtitle="Compensation summaries will show up once configured by HR." />
      )}
    </div>
  );
}
