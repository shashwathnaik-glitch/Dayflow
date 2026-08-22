import React, { useState, useMemo, useRef, useEffect } from "react";
import * as timeoffApi from "./timeoffApi.js";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from "recharts";

/* =========================================================================
   DAYFLOW — HRMS PROTOTYPE
   "Every workday, perfectly aligned."

   PROTOTYPE NOTE: this is a client-only simulation for the hackathon demo.
   All data lives in React state and resets on refresh. In production every
   handler below (checkIn, approveLeave, createEmployee, etc.) would be an
   authenticated API call, and role checks would be re-verified server-side
   (RLS / middleware) rather than trusted from the client.
   ========================================================================= */

/* ---------------------------- Design tokens ----------------------------- */
const TOKENS = `
.df-app{
  --ink:#12151C; --ink-soft:#5B6272; --ink-faint:#9AA0AF;
  --paper:#F3F4F9; --surface:#FFFFFF; --line:#E4E6F0;
  --brand-deep:#1E2A52; --brand-deep-2:#293869;
  --brand-dawn:#FF7A45; --brand-dawn-soft:#FFE7DB;
  --brand-flow:#4C5FD6;
  --success:#188A66; --success-bg:#E4F5EE;
  --warn:#B9790A; --warn-bg:#FDF1DA;
  --danger:#C5392E; --danger-bg:#FBE7E5;
  --neutral-bg:#EEF0F6;
  --radius:14px; --radius-sm:9px;
  --font-display:'Space Grotesk',ui-sans-serif,system-ui,sans-serif;
  --font-body:'Inter',ui-sans-serif,system-ui,sans-serif;
  --font-mono:'IBM Plex Mono',ui-monospace,monospace;
  font-family:var(--font-body); color:var(--ink); background:var(--paper);
  min-height:100vh; -webkit-font-smoothing:antialiased;
}
.df-app *{box-sizing:border-box;}
.df-app h1,.df-app h2,.df-app h3,.df-app .df-display{font-family:var(--font-display); letter-spacing:-0.02em;}
.df-app .df-mono{font-family:var(--font-mono);}
.df-scrollbar::-webkit-scrollbar{width:8px;height:8px;}
.df-scrollbar::-webkit-scrollbar-thumb{background:#D6D9E8;border-radius:8px;}

/* Signature: the "flow ring" gradient — dawn to dusk */
.df-flow-grad{background:linear-gradient(90deg,var(--brand-dawn) 0%, var(--brand-flow) 55%, var(--brand-deep) 100%);}
.df-flow-ring-track{stroke:#E7E9F3; fill:none;}
.df-flow-ring-progress{stroke:url(#dfFlowGradient); fill:none; stroke-linecap:round; transition:stroke-dashoffset .6s ease;}

.df-btn{font-family:var(--font-body); font-weight:600; font-size:13.5px; border-radius:10px; padding:10px 16px; border:1px solid transparent; cursor:pointer; display:inline-flex; align-items:center; gap:8px; transition:all .15s ease;}
.df-btn:active{transform:scale(0.98);}
.df-btn-primary{background:var(--brand-deep); color:#fff;}
.df-btn-primary:hover{background:var(--brand-deep-2);}
.df-btn-dawn{background:var(--brand-dawn); color:#fff;}
.df-btn-dawn:hover{filter:brightness(0.95);}
.df-btn-ghost{background:transparent; color:var(--ink); border-color:var(--line);}
.df-btn-ghost:hover{background:var(--neutral-bg);}
.df-btn-danger{background:var(--danger-bg); color:var(--danger);}
.df-btn-danger:hover{filter:brightness(0.97);}
.df-btn-success{background:var(--success-bg); color:var(--success);}
.df-btn-success:hover{filter:brightness(0.97);}
.df-btn:disabled{opacity:0.45; cursor:not-allowed;}
.df-btn-sm{padding:7px 12px; font-size:12.5px; border-radius:8px;}

.df-card{background:var(--surface); border:1px solid var(--line); border-radius:var(--radius); }
.df-input, .df-select, .df-textarea{width:100%; font-family:var(--font-body); font-size:13.5px; padding:9px 11px; border:1px solid var(--line); border-radius:9px; background:#fff; color:var(--ink); outline:none;}
.df-input:focus, .df-select:focus, .df-textarea:focus{border-color:var(--brand-flow); box-shadow:0 0 0 3px rgba(76,95,214,0.12);}
.df-label{font-size:11.5px; font-weight:600; color:var(--ink-soft); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:5px; display:block;}

.df-badge{font-size:11px; font-weight:700; padding:3px 9px; border-radius:100px; display:inline-flex; align-items:center; gap:5px; white-space:nowrap; letter-spacing:0.02em;}
.df-badge-dot{width:6px;height:6px;border-radius:50%;}
.df-badge-present{background:var(--success-bg); color:var(--success);}
.df-badge-leave{background:var(--warn-bg); color:var(--warn);}
.df-badge-absent{background:var(--danger-bg); color:var(--danger);}
.df-badge-neutral{background:var(--neutral-bg); color:var(--ink-soft);}
.df-badge-pending{background:var(--warn-bg); color:var(--warn);}
.df-badge-approved{background:var(--success-bg); color:var(--success);}
.df-badge-rejected{background:var(--danger-bg); color:var(--danger);}

.df-nav-item{display:flex; align-items:center; gap:11px; padding:10px 14px; border-radius:10px; font-size:13.5px; font-weight:600; color:rgba(255,255,255,0.62); cursor:pointer; transition:all .15s;}
.df-nav-item:hover{background:rgba(255,255,255,0.06); color:#fff;}
.df-nav-item.active{background:rgba(255,255,255,0.12); color:#fff;}
.df-nav-item.active .df-nav-bar{opacity:1;}

.df-table{width:100%; border-collapse:collapse; font-size:13px;}
.df-table th{text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.05em; color:var(--ink-faint); font-weight:700; padding:0 12px 10px; border-bottom:1px solid var(--line);}
.df-table td{padding:12px; border-bottom:1px solid var(--line); vertical-align:middle;}
.df-table tr:last-child td{border-bottom:none;}
.df-table tr.clickable:hover{background:var(--neutral-bg); cursor:pointer;}

.df-modal-backdrop{position:fixed; inset:0; background:rgba(18,21,28,0.5); backdrop-filter:blur(2px); z-index:60; display:flex; align-items:center; justify-content:center; padding:20px; animation:dfFade .15s ease;}
.df-modal{background:#fff; border-radius:16px; max-width:560px; width:100%; max-height:88vh; overflow-y:auto; box-shadow:0 24px 60px rgba(18,21,28,0.25); animation:dfPop .18s ease;}
@keyframes dfFade{from{opacity:0} to{opacity:1}}
@keyframes dfPop{from{opacity:0; transform:translateY(8px) scale(0.98)} to{opacity:1; transform:translateY(0) scale(1)}}

.df-toast-wrap{position:fixed; top:18px; right:18px; z-index:80; display:flex; flex-direction:column; gap:8px;}
.df-toast{background:var(--ink); color:#fff; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:600; box-shadow:0 10px 26px rgba(0,0,0,0.22); display:flex; align-items:center; gap:10px; min-width:240px; animation:dfSlide .2s ease;}
@keyframes dfSlide{from{opacity:0; transform:translateX(16px)} to{opacity:1; transform:translateX(0)}}

.df-tab{padding:9px 4px; margin-right:22px; font-size:13.5px; font-weight:600; color:var(--ink-faint); border-bottom:2px solid transparent; cursor:pointer;}
.df-tab.active{color:var(--brand-deep); border-color:var(--brand-dawn);}

.df-avatar{border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-family:var(--font-display); color:#fff; flex-shrink:0;}
`;

/* ------------------------------ Utilities ------------------------------- */
const AVATAR_PALETTE = ["#1E2A52","#4C5FD6","#B9790A","#188A66","#C5392E","#293869","#7A4FD6"];
const avatarColor = (seed) => AVATAR_PALETTE[Math.abs(hashStr(seed)) % AVATAR_PALETTE.length];
function hashStr(s){ let h=0; for(let i=0;i<s.length;i++){h=(h<<5)-h+s.charCodeAt(i); h|=0;} return h; }
function initials(name){ return name.split(" ").map(p=>p[0]).slice(0,2).join("").toUpperCase(); }
function pad(n,len){ return String(n).padStart(len,"0"); }
function fmtDate(d){ return `${d.getFullYear()}-${pad(d.getMonth()+1,2)}-${pad(d.getDate(),2)}`; }
function dayName(d){ return d.toLocaleDateString("en-US",{weekday:"short"}); }
function prettyDate(d){ return d.toLocaleDateString("en-US",{month:"short", day:"numeric", year:"numeric"}); }
function isWeekend(d){ const day=d.getDay(); return day===0 || day===6; }
function fmtINR(n){ return "₹" + Math.round(n).toLocaleString("en-IN"); }
function fmtTime(d){ if(!d) return "—"; return d.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"}); }
function overlaps(dateStr, startStr, endStr){ return dateStr>=startStr && dateStr<=endStr; }

// Reusable login-ID generator: OI + first2(first) + first2(last) + joinYear + 4-digit sequence
function makeLoginIdFactory(){
  const seqByYear = {};
  return (firstName, lastName, joinYear) => {
    seqByYear[joinYear] = (seqByYear[joinYear] || 0) + 1;
    const serial = pad(seqByYear[joinYear], 4);
    const code = `OI${firstName.slice(0,2).toUpperCase()}${lastName.slice(0,2).toUpperCase()}${joinYear}${serial}`;
    return { code, serial };
  };
}
function makeTempPassword(){
  return "Day@" + Math.floor(1000 + Math.random()*9000);
}

// Reusable salary calculator — single source of truth for all payroll math.
// ASSUMPTION (undocumented in reference design, chosen for hackathon simplicity):
// Basic = 50% of Monthly Wage; HRA = 50% of Basic (per reference design);
// Standard Allowance = 10% of Basic; Performance Bonus = 8% of Basic;
// LTA = 8.33% of Basic (1/12); Fixed Allowance balances Gross back to Monthly Wage.
// PF (employee) = 12% of Basic; Professional Tax = flat ₹200/month (typical India slab).
function computeSalary(monthlyWage){
  const basic = Math.round(monthlyWage * 0.5);
  const hra = Math.round(basic * 0.5);
  const standardAllowance = Math.round(basic * 0.10);
  const performanceBonus = Math.round(basic * 0.08);
  const lta = Math.round(basic * 0.0833);
  const runningTotal = basic + hra + standardAllowance + performanceBonus + lta;
  const fixedAllowance = Math.max(monthlyWage - runningTotal, 0);
  const gross = basic + hra + standardAllowance + performanceBonus + lta + fixedAllowance;
  const pf = Math.round(basic * 0.12);
  const professionalTax = 200;
  const net = gross - pf - professionalTax;
  return { basic, hra, standardAllowance, performanceBonus, lta, fixedAllowance, gross, pf, professionalTax, net };
}

/* ------------------------------- Seed data ------------------------------- */
const DEPARTMENTS = ["Engineering","Design","Sales","Marketing","Support"];
const LEAVE_TYPES = [
  { id:"pto", name:"Paid Time Off", allocated:24 },
  { id:"sick", name:"Sick Leave", allocated:7 },
  { id:"unpaid", name:"Unpaid Leave", allocated:null },
];
const COMPANY = "Dayflow Inc.";
const LOCATIONS = ["Bengaluru HQ","Mumbai Office","Remote"];

const EMP_SEED = [
  { first:"Rohan", last:"Mehta", dept:"Engineering", role:"Engineering Manager", manager:"—", wage:145000, join:"2022", gender:"Male", nationality:"Indian", marital:"Married" },
  { first:"Priya", last:"Sharma", dept:"Engineering", role:"Software Engineer", manager:"Rohan Mehta", wage:98000, join:"2023", gender:"Female", nationality:"Indian", marital:"Single" },
  { first:"Ananya", last:"Iyer", dept:"Design", role:"Product Designer", manager:"Rohan Mehta", wage:92000, join:"2023", gender:"Female", nationality:"Indian", marital:"Single" },
  { first:"Neha", last:"Kapoor", dept:"Sales", role:"Sales Manager", manager:"—", wage:120000, join:"2022", gender:"Female", nationality:"Indian", marital:"Married" },
  { first:"Karan", last:"Verma", dept:"Sales", role:"Sales Executive", manager:"Neha Kapoor", wage:68000, join:"2024", gender:"Male", nationality:"Indian", marital:"Single" },
  { first:"Arjun", last:"Nair", dept:"Support", role:"Support Associate", manager:"Neha Kapoor", wage:52000, join:"2024", gender:"Male", nationality:"Indian", marital:"Single" },
  { first:"Simran", last:"Kaur", dept:"Marketing", role:"Marketing Associate", manager:"Rohan Mehta", wage:64000, join:"2023", gender:"Female", nationality:"Indian", marital:"Married" },
];

function buildSeed(){
  const genLoginId = makeLoginIdFactory();
  const today = new Date();
  const employees = [];
  const users = [
    { loginId:"admin@dayflow.com", password:"Admin@123", role:"admin", employeeId:null },
  ];

  EMP_SEED.forEach((e, idx) => {
    const { code, serial } = genLoginId(e.first, e.last, e.join);
    const id = "emp_" + (idx+1);
    const salary = computeSalary(e.wage);
    employees.push({
      id, loginId:code, serial,
      firstName:e.first, lastName:e.last, name:`${e.first} ${e.last}`,
      email:`${e.first.toLowerCase()}.${e.last.toLowerCase()}@dayflow.com`,
      personalEmail:`${e.first.toLowerCase()}${e.last.toLowerCase()}@gmail.com`,
      mobile:`+91 9${Math.floor(100000000+Math.random()*899999999)}`,
      department:e.dept, position:e.role, manager:e.manager, company:COMPANY,
      location:LOCATIONS[idx % LOCATIONS.length],
      dob:`19${88+(idx%8)}-0${(idx%9)+1}-1${idx%9}`,
      address:"—", gender:e.gender, nationality:e.nationality, maritalStatus:e.marital,
      joinYear:e.join, joinDate:`${e.join}-0${(idx%9)+1}-15`,
      privateInfo:{
        pan:`ABCDE${1000+idx}F`, uan:`10${1000000000+idx}`,
        bank:`HDFC •••• ${4000+idx}`, resume:`${e.first}_${e.last}_Resume.pdf`,
        skills: idx%2===0 ? ["Communication","Problem Solving","Ownership"] : ["Leadership","Stakeholder Mgmt","Analytics"],
        certifications: idx%3===0 ? ["PMP Foundations"] : [],
      },
      monthlyWage:e.wage, salary,
      active:true,
    });
    users.push({ loginId:code, password:"Welcome@2026", role:"employee", employeeId:id });
  });

  // Leave allocations
  const leaveAllocations = [];
  employees.forEach(emp => {
    LEAVE_TYPES.forEach(lt => {
      if (lt.allocated == null) return;
      leaveAllocations.push({ employeeId:emp.id, leaveTypeId:lt.id, allocated:lt.allocated, used: Math.floor(Math.random()* (lt.id==="sick"?3:6)) });
    });
  });

  // Attendance: last 12 calendar days excluding weekends, with slight variance.
  const attendance = [];
  for (let back = 12; back >= 1; back--) {
    const d = new Date(today); d.setDate(d.getDate()-back);
    if (isWeekend(d)) continue;
    const dateStr = fmtDate(d);
    employees.forEach((emp, idx) => {
      const roll = (hashStr(emp.id+dateStr) % 100 + 100) % 100;
      if (roll < 6) {
        attendance.push({ employeeId:emp.id, date:dateStr, day:dayName(d), checkIn:null, checkOut:null, workHours:0, extraHours:0, status:"Absent" });
        return;
      }
      const inHour = 9 + (roll % 3 === 0 ? 1 : 0);
      const inMin = (roll*7) % 60;
      const checkIn = new Date(d); checkIn.setHours(inHour, inMin, 0);
      const outHour = 18 + (roll % 4 === 0 ? 1 : 0);
      const outMin = (roll*11) % 60;
      const checkOut = new Date(d); checkOut.setHours(outHour, outMin, 0);
      const workHours = +(((checkOut - checkIn) / 3600000)).toFixed(1);
      const extraHours = +Math.max(0, workHours-8).toFixed(1);
      const status = workHours < 5 ? "Half-day" : "Present";
      attendance.push({ employeeId:emp.id, date:dateStr, day:dayName(d), checkIn, checkOut, workHours, extraHours, status });
    });
  }

  // Leave requests (seed a healthy mix of statuses)
  const leaveRequests = [];
  let reqId = 1;
  function addReq(empId, typeId, startOffset, days, status, reason, comment){
    const s = new Date(today); s.setDate(s.getDate()+startOffset);
    const en = new Date(s); en.setDate(en.getDate()+days-1);
    leaveRequests.push({
      id:"lr_"+(reqId++), employeeId:empId, leaveTypeId:typeId,
      startDate:fmtDate(s), endDate:fmtDate(en), reason, attachment:null,
      status, comment: comment||"", createdAt: fmtDate(new Date(today.getTime()-Math.abs(startOffset)*86400000-172800000)),
    });
  }
  addReq(employees[1].id, "sick", -6, 1, "Approved", "Fever, resting at home.", "Get well soon!");
  addReq(employees[2].id, "pto", -20, 3, "Approved", "Family trip to Goa.", "Approved, enjoy!");
  addReq(employees[4].id, "unpaid", 4, 2, "Pending", "Personal work — relocating apartment.", "");
  addReq(employees[5].id, "sick", 1, 1, "Pending", "Dental appointment.", "");
  addReq(employees[6].id, "pto", -10, 1, "Rejected", "Long weekend extension.", "Team has a launch that week — please pick another date.");
  addReq(employees[3].id, "pto", 10, 2, "Pending", "Sister's wedding.", "");

  // Today's status: give a few employees a live check-in already, leave one open for the demo
  const todayStr = fmtDate(today);
  [employees[0], employees[3]].forEach(emp => {
    const ci = new Date(); ci.setHours(9,20,0);
    attendance.push({ employeeId:emp.id, date:todayStr, day:dayName(today), checkIn:ci, checkOut:null, workHours:0, extraHours:0, status:"Present" });
  });

  return { employees, users, attendance, leaveAllocations, leaveRequests, genLoginId, todayStr };
}

/* --------------------------------- Icons --------------------------------- */
const Icon = {
  dashboard:(p)=><svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><rect x="11" y="2.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><rect x="2.5" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><rect x="11" y="11" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6"/></svg>,
  users:(p)=><svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}><circle cx="7" cy="6.5" r="2.6" stroke="currentColor" strokeWidth="1.6"/><path d="M2 16c0-2.8 2.2-4.5 5-4.5s5 1.7 5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="14.5" cy="7" r="2.1" stroke="currentColor" strokeWidth="1.6"/><path d="M12.7 11.7c2-.2 4.8 1 5.3 3.9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  clock:(p)=><svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}><circle cx="10" cy="10" r="7.3" stroke="currentColor" strokeWidth="1.6"/><path d="M10 6v4.3l2.8 1.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  calendar:(p)=><svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}><rect x="2.5" y="4" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  wallet:(p)=><svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}><rect x="2.5" y="5" width="15" height="11" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M2.5 8.5h15" stroke="currentColor" strokeWidth="1.6"/><circle cx="14" cy="12" r="1.2" fill="currentColor"/></svg>,
  user:(p)=><svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}><circle cx="10" cy="6.7" r="3.2" stroke="currentColor" strokeWidth="1.6"/><path d="M3.3 17c0-3.6 3-5.8 6.7-5.8s6.7 2.2 6.7 5.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  logout:(p)=><svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}><path d="M7.5 17.5H4.8a1.3 1.3 0 01-1.3-1.3V3.8a1.3 1.3 0 011.3-1.3h2.7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M13 14l4-4-4-4M17 10H7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  bell:(p)=><svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}><path d="M5 8a5 5 0 0110 0c0 4 1.5 5 1.5 5h-13S5 12 5 8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M8.2 15.5a1.9 1.9 0 003.6 0" stroke="currentColor" strokeWidth="1.6"/></svg>,
  spark:(p)=><svg viewBox="0 0 20 20" width="17" height="17" fill="none" {...p}><path d="M10 2.5l1.4 4.6 4.6 1.4-4.6 1.4L10 14.5l-1.4-4.6-4.6-1.4 4.6-1.4L10 2.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>,
  check:(p)=><svg viewBox="0 0 20 20" width="15" height="15" fill="none" {...p}><path d="M4 10.5l3.5 3.5L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  x:(p)=><svg viewBox="0 0 20 20" width="15" height="15" fill="none" {...p}><path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  plus:(p)=><svg viewBox="0 0 20 20" width="15" height="15" fill="none" {...p}><path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  chev:(p)=><svg viewBox="0 0 20 20" width="15" height="15" fill="none" {...p}><path d="M7.5 4.5L13 10l-5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>,
};

/* --------------------------------- Atoms ---------------------------------- */
function Badge({ tone="neutral", children }){
  return <span className={`df-badge df-badge-${tone}`}><span className="df-badge-dot" style={{background:"currentColor"}}/>{children}</span>;
}
function Avatar({ name, size=38 }){
  return <div className="df-avatar" style={{width:size,height:size,background:avatarColor(name),fontSize:size*0.36}}>{initials(name)}</div>;
}
function Modal({ onClose, children, width }){
  return (
    <div className="df-modal-backdrop" onMouseDown={(e)=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="df-modal" style={width?{maxWidth:width}:{}}>{children}</div>
    </div>
  );
}
function ModalHeader({ title, subtitle, onClose }){
  return (
    <div style={{padding:"20px 24px 14px", borderBottom:"1px solid var(--line)", display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
      <div>
        <h3 style={{fontSize:18, margin:0}}>{title}</h3>
        {subtitle && <p style={{margin:"4px 0 0", fontSize:13, color:"var(--ink-soft)"}}>{subtitle}</p>}
      </div>
      <button className="df-btn df-btn-ghost df-btn-sm" onClick={onClose} style={{padding:6}}><Icon.x/></button>
    </div>
  );
}
function StatCard({ label, value, tone, icon }){
  return (
    <div className="df-card" style={{padding:"18px 20px", flex:1, minWidth:150}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
        <span style={{fontSize:11.5, fontWeight:700, color:"var(--ink-faint)", textTransform:"uppercase", letterSpacing:"0.05em"}}>{label}</span>
        {icon && <div style={{color: tone||"var(--ink-faint)"}}>{icon}</div>}
      </div>
      <div className="df-display" style={{fontSize:30, marginTop:8, color: tone||"var(--ink)"}}>{value}</div>
    </div>
  );
}
function EmptyState({ title, subtitle }){
  return (
    <div style={{textAlign:"center", padding:"40px 20px", color:"var(--ink-faint)"}}>
      <div className="df-display" style={{fontSize:15, color:"var(--ink-soft)", marginBottom:4}}>{title}</div>
      <div style={{fontSize:13}}>{subtitle}</div>
    </div>
  );
}
function LeaveStatusBadge({ status }){
  const tone = status==="Approved"?"approved":status==="Rejected"?"rejected":"pending";
  return <Badge tone={tone}>{status}</Badge>;
}
function AttendanceBadge({ status }){
  const tone = status==="Present"?"present":status==="On Leave"?"leave":status==="Half-day"?"leave":status==="Absent"?"absent":"neutral";
  return <Badge tone={tone}>{status}</Badge>;
}

/* ------------------------------- Flow Ring -------------------------------- */
function FlowRing({ checkedIn, checkedOut, size=132 }){
  const r = (size-14)/2, c = 2*Math.PI*r;
  const now = new Date();
  const progress = Math.min(1, Math.max(0, (now.getHours()*60+now.getMinutes()-480)/600)); // 8am-18am window
  const dash = checkedOut ? c : c*(checkedIn?progress:0.02);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <linearGradient id="dfFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF7A45"/>
          <stop offset="55%" stopColor="#4C5FD6"/>
          <stop offset="100%" stopColor="#1E2A52"/>
        </linearGradient>
      </defs>
      <circle className="df-flow-ring-track" cx={size/2} cy={size/2} r={r} strokeWidth="10"/>
      <circle className="df-flow-ring-progress" cx={size/2} cy={size/2} r={r} strokeWidth="10"
        strokeDasharray={c} strokeDashoffset={c-dash}
        transform={`rotate(-90 ${size/2} ${size/2})`} />
      <text x="50%" y="46%" textAnchor="middle" fontFamily="var(--font-display)" fontSize="13" fontWeight="700" fill="var(--ink)">
        {checkedOut ? "Wrapped up" : checkedIn ? "In flow" : "Not started"}
      </text>
      <text x="50%" y="62%" textAnchor="middle" fontFamily="var(--font-mono)" fontSize="11" fill="var(--ink-faint)">
        {checkedOut ? "day complete" : checkedIn ? "since " + fmtTime(checkedIn) : "check in to begin"}
      </text>
    </svg>
  );
}

/* ================================ APP ==================================== */
export default function DayflowApp(){
  const seedRef = useRef(null);
  if (!seedRef.current) seedRef.current = buildSeed();
  const seed = seedRef.current;

  const [employees, setEmployees] = useState(seed.employees);
  const [users, setUsers] = useState(seed.users);
  const [attendance, setAttendance] = useState(seed.attendance);
  const [leaveAllocations, setLeaveAllocations] = useState(seed.leaveAllocations);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLeaveLoading, setIsLeaveLoading] = useState(false);
  const todayStr = seed.todayStr;
  const today = new Date();

  const [session, setSession] = useState(null); // { role, employeeId }

  const refreshLeaveData = async (sess = session) => {
    if (!sess) return;
    setIsLeaveLoading(true);
    try {
      const requests = await timeoffApi.fetchLeaveRequests(sess);
      setLeaveRequests(requests);
    } catch (err) {
      toast(err.message || "Failed to load leave requests", "err");
    } finally {
      setIsLeaveLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      refreshLeaveData(session);
    }
  }, [session]);
  const [toasts, setToasts] = useState([]);
  function toast(msg, tone="ok"){
    const id = Math.random().toString(36).slice(2);
    setToasts(t=>[...t, {id, msg, tone}]);
    setTimeout(()=> setToasts(t=>t.filter(x=>x.id!==id)), 3200);
  }

  function login(loginId, password){
    const u = users.find(u => u.loginId.toLowerCase()===String(loginId).trim().toLowerCase());
    if (!u || u.password !== password){
      return { ok:false, error:"Incorrect login ID or password. Please try again." };
    }
    setSession({ role:u.role, employeeId:u.employeeId });
    return { ok:true };
  }
  function logout(){ setSession(null); }

  /* ------------------------------ Derived data ------------------------------ */
  function getTodayAttendance(empId){ return attendance.find(a=>a.employeeId===empId && a.date===todayStr); }
  function getEmpLeaveToday(empId){
    return leaveRequests.find(r => r.employeeId===empId && r.status==="Approved" && overlaps(todayStr, r.startDate, r.endDate));
  }
  function getTodayStatus(empId){
    if (getEmpLeaveToday(empId)) return "On Leave";
    const a = getTodayAttendance(empId);
    if (a && a.checkIn) return "Present";
    return "Not Checked In";
  }
  function getAllocations(empId){
    return timeoffApi.getAllocations(empId);
  }
  function empAttendanceHistory(empId){
    return attendance.filter(a=>a.employeeId===empId).sort((a,b)=> a.date<b.date?1:-1);
  }
  function empLeaveHistory(empId){
    return leaveRequests.filter(r=>r.employeeId===empId).sort((a,b)=> a.createdAt<b.createdAt?1:-1);
  }

  /* ------------------------------- Actions (RBAC-guarded) ------------------------------- */
  function checkIn(empId){
    if (!(session && (session.role==="admin" || session.employeeId===empId))) return toast("Not authorized.","err");
    if (getTodayAttendance(empId)) return toast("Already checked in today.","err");
    const rec = { employeeId:empId, date:todayStr, day:dayName(today), checkIn:new Date(), checkOut:null, workHours:0, extraHours:0, status:"Present" };
    setAttendance(a=>[...a, rec]);
    toast("Checked in — have a great day!");
  }
  function checkOut(empId){
    if (!(session && (session.role==="admin" || session.employeeId===empId))) return toast("Not authorized.","err");
    setAttendance(list => list.map(a => {
      if (a.employeeId!==empId || a.date!==todayStr) return a;
      const checkOut = new Date();
      const workHours = +(((checkOut - a.checkIn)/3600000)).toFixed(1);
      const extraHours = +Math.max(0, workHours-8).toFixed(1);
      return { ...a, checkOut, workHours, extraHours, status: workHours<5?"Half-day":"Present" };
    }));
    toast("Checked out. See you tomorrow!");
  }
  async function submitLeaveRequest(empId, payload){
    if (!(session && (session.role==="admin" || session.employeeId===empId))) {
      toast("Not authorized.","err");
      throw new Error("Not authorized.");
    }
    const res = await timeoffApi.submitLeaveRequest(empId, payload);
    await refreshLeaveData();
    toast("Time off request submitted.");
    return res;
  }
  async function decideLeave(reqId, decision, comment){
    if (!(session && session.role==="admin")) {
      toast("Only Admin/HR can approve or reject requests.","err");
      throw new Error("Only Admin/HR can approve or reject requests.");
    }
    const res = await timeoffApi.decideLeave(reqId, decision, comment);
    await refreshLeaveData();
    toast(`Request ${decision.toLowerCase()}.`, decision==="Rejected"?"err":"ok");
    return res;
  }
  function createEmployee(payload){
    if (!(session && session.role==="admin")) return toast("Only Admin/HR can create employees.","err");
    const joinYear = String(new Date().getFullYear());
    const { code, serial } = seed.genLoginId(payload.firstName, payload.lastName, joinYear);
    const tempPassword = makeTempPassword();
    const id = "emp_" + (employees.length+1) + "_" + Math.random().toString(36).slice(2,5);
    const salary = computeSalary(payload.monthlyWage);
    const emp = {
      id, loginId:code, serial,
      firstName:payload.firstName, lastName:payload.lastName, name:`${payload.firstName} ${payload.lastName}`,
      email: payload.email || `${payload.firstName.toLowerCase()}.${payload.lastName.toLowerCase()}@dayflow.com`,
      personalEmail:"", mobile:payload.mobile||"—",
      department:payload.department, position:payload.position, manager:payload.manager||"—",
      company:COMPANY, location:payload.location||LOCATIONS[0],
      dob:"—", address:"—", gender:payload.gender||"—", nationality:"Indian", maritalStatus:"—",
      joinYear, joinDate:fmtDate(today),
      privateInfo:{ pan:"—", uan:"—", bank:"—", resume:"—", skills:[], certifications:[] },
      monthlyWage:payload.monthlyWage, salary, active:true,
    };
    setEmployees(list=>[...list, emp]);
    setUsers(list=>[...list, { loginId:code, password:tempPassword, role:"employee", employeeId:id }]);
    setLeaveAllocations(list=>[...list,
      { employeeId:id, leaveTypeId:"pto", allocated:24, used:0 },
      { employeeId:id, leaveTypeId:"sick", allocated:7, used:0 },
    ]);
    toast(`Employee created — Login ID ${code}`);
    return { employee:emp, loginId:code, tempPassword };
  }

  /* --------------------------------- Render --------------------------------- */
  if (!session){
    return <div className="df-app df-scrollbar"><style>{TOKENS}</style><LoginScreen onLogin={login} employees={employees}/></div>;
  }

  return (
    <div className="df-app df-scrollbar">
      <style>{TOKENS}</style>
      <div className="df-toast-wrap">
        {toasts.map(t=>(
          <div key={t.id} className="df-toast" style={t.tone==="err"?{background:"var(--danger)"}:{}}>
            {t.tone==="err" ? <Icon.x style={{flexShrink:0}}/> : <Icon.check style={{flexShrink:0}}/>}
            {t.msg}
          </div>
        ))}
      </div>
      {session.role==="admin"
        ? <AdminShell
            employees={employees} users={users} attendance={attendance} leaveRequests={leaveRequests}
            leaveAllocations={leaveAllocations} todayStr={todayStr}
            getTodayStatus={getTodayStatus} getAllocations={getAllocations}
            empAttendanceHistory={empAttendanceHistory} empLeaveHistory={empLeaveHistory}
            createEmployee={createEmployee} decideLeave={decideLeave} onLogout={logout}
            switchToEmployee={(empId)=>setSession({role:"employee", employeeId:empId})}
          />
        : <EmployeeShell
            me={employees.find(e=>e.id===session.employeeId)}
            employees={employees}
            attendance={attendance} leaveRequests={leaveRequests}
            getTodayAttendance={getTodayAttendance} getTodayStatus={getTodayStatus} getAllocations={getAllocations}
            empAttendanceHistory={empAttendanceHistory} empLeaveHistory={empLeaveHistory}
            checkIn={checkIn} checkOut={checkOut} submitLeaveRequest={submitLeaveRequest}
            onLogout={logout}
          />
      }
    </div>
  );
}

/* =============================== LOGIN =================================== */
function LoginScreen({ onLogin, employees }){
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function submit(e){
    e.preventDefault();
    const res = onLogin(loginId, password);
    if (!res.ok) setError(res.error);
  }
  function quick(id, pw){ setLoginId(id); setPassword(pw); setError(""); const res=onLogin(id,pw); if(!res.ok) setError(res.error); }

  return (
    <div style={{minHeight:"100vh", display:"grid", gridTemplateColumns:"1.1fr 1fr"}}>
      <div className="df-flow-grad" style={{padding:"52px 56px", display:"flex", flexDirection:"column", justifyContent:"space-between", color:"#fff"}}>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <div style={{width:34,height:34,borderRadius:9,background:"rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon.clock/>
          </div>
          <span className="df-display" style={{fontSize:19, fontWeight:700}}>Dayflow</span>
        </div>
        <div style={{maxWidth:420}}>
          <h1 style={{fontSize:42, lineHeight:1.08, margin:"0 0 16px"}}>Every workday,<br/>perfectly aligned.</h1>
          <p style={{fontSize:15, opacity:0.85, lineHeight:1.6}}>
            One workspace for attendance, time off, and payroll — where employees manage their day and HR manages the workforce.
          </p>
        </div>
        <div style={{fontSize:12.5, opacity:0.65, fontFamily:"var(--font-mono)"}}>Dayflow HRMS · Hackathon Prototype</div>
      </div>

      <div style={{display:"flex", alignItems:"center", justifyContent:"center", padding:32}}>
        <div style={{width:"100%", maxWidth:360}}>
          <h2 style={{fontSize:23, margin:"0 0 6px"}}>Sign in</h2>
          <p style={{color:"var(--ink-soft)", fontSize:13.5, margin:"0 0 26px"}}>Use your Login ID and password.</p>

          <form onSubmit={submit}>
            <div style={{marginBottom:14}}>
              <label className="df-label">Login ID or email</label>
              <input className="df-input df-mono" placeholder="e.g. admin@dayflow.com" value={loginId} onChange={e=>setLoginId(e.target.value)} />
            </div>
            <div style={{marginBottom:6}}>
              <label className="df-label">Password</label>
              <input className="df-input" type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} />
            </div>
            {error && <div style={{color:"var(--danger)", fontSize:12.5, margin:"10px 0"}}>{error}</div>}
            <button className="df-btn df-btn-primary" type="submit" style={{width:"100%", justifyContent:"center", marginTop:16, padding:"11px 16px"}}>Sign in</button>
          </form>

          <div style={{margin:"26px 0 14px", display:"flex", alignItems:"center", gap:10}}>
            <div style={{flex:1, height:1, background:"var(--line)"}}/>
            <span style={{fontSize:11, color:"var(--ink-faint)", fontWeight:700, letterSpacing:"0.05em"}}>QUICK DEMO ACCESS</span>
            <div style={{flex:1, height:1, background:"var(--line)"}}/>
          </div>
          <div style={{display:"flex", flexDirection:"column", gap:8}}>
            <button className="df-btn df-btn-ghost" onClick={()=>quick("admin@dayflow.com","Admin@123")} style={{justifyContent:"space-between"}}>
              <span>Continue as Admin / HR</span><Icon.chev/>
            </button>
            <button className="df-btn df-btn-ghost" onClick={()=>quick(employees[1].loginId,"Welcome@2026")} style={{justifyContent:"space-between"}}>
              <span>Continue as {employees[1].name} (Employee)</span><Icon.chev/>
            </button>
          </div>
          <p style={{fontSize:11.5, color:"var(--ink-faint)", marginTop:22, lineHeight:1.6}}>
            Prototype note: passwords are shown here only to make the demo self-serve. Employee accounts are created by Admin/HR, which generates the Login ID and a temporary password.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============================== ADMIN SHELL ================================ */
function AdminShell(props){
  const { employees, attendance, leaveRequests, todayStr, getTodayStatus, getAllocations,
    empAttendanceHistory, empLeaveHistory, createEmployee, decideLeave, onLogout, switchToEmployee } = props;
  const [page, setPage] = useState("dashboard");
  const [selectedEmpId, setSelectedEmpId] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [credsModal, setCredsModal] = useState(null);

  const nav = [
    { id:"dashboard", label:"Dashboard", icon:Icon.dashboard },
    { id:"employees", label:"Employees", icon:Icon.users },
    { id:"timeoff", label:"Time Off", icon:Icon.calendar },
    { id:"payroll", label:"Payroll", icon:Icon.wallet },
    { id:"ask", label:"Ask Dayflow", icon:Icon.spark },
  ];

  function openEmployee(id){ setSelectedEmpId(id); setPage("employee-detail"); }

  return (
    <div style={{display:"flex"}}>
      <Sidebar nav={nav} page={page==="employee-detail"?"employees":page} setPage={(p)=>{setPage(p); setSelectedEmpId(null);}}
        title="Dayflow" roleLabel="Admin / HR" name="HR Admin" onLogout={onLogout}/>
      <div style={{flex:1, minWidth:0, padding:"28px 34px", maxHeight:"100vh", overflowY:"auto"}}>
        {page==="dashboard" && (
          <AdminDashboard employees={employees} attendance={attendance} leaveRequests={leaveRequests}
            todayStr={todayStr} getTodayStatus={getTodayStatus} onOpenEmployee={openEmployee}
            onGoTimeoff={()=>setPage("timeoff")} />
        )}
        {page==="employees" && (
          <EmployeeListPage employees={employees} getTodayStatus={getTodayStatus}
            onOpen={openEmployee} onCreate={()=>setCreateOpen(true)} />
        )}
        {page==="employee-detail" && selectedEmpId && (
          <EmployeeDetailPage
            emp={employees.find(e=>e.id===selectedEmpId)} isAdmin
            getTodayStatus={getTodayStatus} getAllocations={getAllocations}
            attendanceHistory={empAttendanceHistory(selectedEmpId)}
            leaveHistory={empLeaveHistory(selectedEmpId)}
            onBack={()=>setPage("employees")}
            onLoginAs={()=>switchToEmployee(selectedEmpId)}
          />
        )}
        {page==="timeoff" && (
          <AdminTimeOffPage leaveRequests={leaveRequests} employees={employees} decideLeave={decideLeave} isLoading={isLeaveLoading}/>
        )}
        {page==="payroll" && (
          <AdminPayrollPage employees={employees} attendance={attendance} todayStr={todayStr}/>
        )}
        {page==="ask" && <AskDayflow employees={employees} attendance={attendance} leaveRequests={leaveRequests} getTodayStatus={getTodayStatus}/>}
      </div>

      {createOpen && (
        <CreateEmployeeModal
          onClose={()=>setCreateOpen(false)}
          onCreate={(payload)=>{
            const result = createEmployee(payload);
            setCreateOpen(false);
            setCredsModal(result);
          }}
        />
      )}
      {credsModal && (
        <CredentialsModal result={credsModal} onClose={()=>setCredsModal(null)}
          onLoginAs={()=>{ switchToEmployee(credsModal.employee.id); setCredsModal(null); }}
        />
      )}
    </div>
  );
}

function Sidebar({ nav, page, setPage, title, roleLabel, name, onLogout }){
  return (
    <div style={{width:230, flexShrink:0, background:"var(--brand-deep)", minHeight:"100vh", padding:"22px 14px", display:"flex", flexDirection:"column"}}>
      <div style={{display:"flex", alignItems:"center", gap:9, padding:"0 8px 24px"}}>
        <div style={{width:28,height:28,borderRadius:8,background:"rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff"}}><Icon.clock/></div>
        <span className="df-display" style={{color:"#fff", fontSize:16.5, fontWeight:700}}>{title}</span>
      </div>
      <div style={{display:"flex", flexDirection:"column", gap:2, flex:1}}>
        {nav.map(n=>(
          <div key={n.id} className={`df-nav-item ${page===n.id?"active":""}`} onClick={()=>setPage(n.id)}>
            <n.icon/> {n.label}
          </div>
        ))}
      </div>
      <div style={{borderTop:"1px solid rgba(255,255,255,0.12)", paddingTop:14, marginTop:14}}>
        <div style={{display:"flex", alignItems:"center", gap:9, padding:"0 8px 10px"}}>
          <Avatar name={name} size={30}/>
          <div style={{minWidth:0}}>
            <div style={{color:"#fff", fontSize:12.5, fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{name}</div>
            <div style={{color:"rgba(255,255,255,0.5)", fontSize:11}}>{roleLabel}</div>
          </div>
        </div>
        <div className="df-nav-item" onClick={onLogout}><Icon.logout/> Log out</div>
      </div>
    </div>
  );
}

function AdminDashboard({ employees, attendance, leaveRequests, todayStr, getTodayStatus, onOpenEmployee, onGoTimeoff }){
  const total = employees.length;
  const presentToday = employees.filter(e=>getTodayStatus(e.id)==="Present").length;
  const onLeaveToday = employees.filter(e=>getTodayStatus(e.id)==="On Leave").length;
  const notCheckedIn = total - presentToday - onLeaveToday;
  const pending = leaveRequests.filter(r=>r.status==="Pending");

  const last7 = useMemo(()=>{
    const days = [];
    for (let i=6;i>=0;i--){
      const d = new Date(); d.setDate(d.getDate()-i);
      if (isWeekend(d)) continue;
      const ds = fmtDate(d);
      const present = attendance.filter(a=>a.date===ds && a.checkIn).length;
      const absent = attendance.filter(a=>a.date===ds && a.status==="Absent").length;
      days.push({ day: d.toLocaleDateString("en-US",{weekday:"short"}), Present:present, Absent:absent });
    }
    return days;
  },[attendance]);

  const leaveByType = useMemo(()=>{
    const map = {};
    leaveRequests.filter(r=>r.status==="Approved").forEach(r=>{
      const label = LEAVE_TYPES.find(t=>t.id===r.leaveTypeId)?.name || r.leaveTypeId;
      map[label] = (map[label]||0)+1;
    });
    return Object.entries(map).map(([name,value])=>({name,value}));
  },[leaveRequests]);
  const PIE_COLORS = ["#4C5FD6","#FF7A45","#188A66","#B9790A"];

  return (
    <div>
      <PageHeader title="Good to see you, Admin" subtitle={prettyDate(new Date())}/>
      <div style={{display:"flex", gap:14, flexWrap:"wrap", marginBottom:22}}>
        <StatCard label="Total Employees" value={total} icon={<Icon.users/>}/>
        <StatCard label="Present Today" value={presentToday} tone="var(--success)" icon={<Icon.check/>}/>
        <StatCard label="Not Checked In" value={notCheckedIn} tone="var(--ink-soft)" icon={<Icon.clock/>}/>
        <StatCard label="On Leave" value={onLeaveToday} tone="var(--warn)" icon={<Icon.calendar/>}/>
        <StatCard label="Pending Requests" value={pending.length} tone="var(--brand-dawn)" icon={<Icon.bell/>}/>
      </div>

      <div style={{display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16, marginBottom:16}}>
        <div className="df-card" style={{padding:20}}>
          <h3 style={{fontSize:14.5, margin:"0 0 14px"}}>Attendance overview · last 7 working days</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={last7} barGap={4}>
              <CartesianGrid vertical={false} stroke="#EEF0F6"/>
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:12, fill:"#9AA0AF"}}/>
              <YAxis axisLine={false} tickLine={false} tick={{fontSize:12, fill:"#9AA0AF"}} allowDecimals={false}/>
              <Tooltip cursor={{fill:"#F3F4F9"}} contentStyle={{borderRadius:10, border:"1px solid #E4E6F0", fontSize:12}}/>
              <Bar dataKey="Present" fill="#188A66" radius={[5,5,0,0]}/>
              <Bar dataKey="Absent" fill="#C5392E" radius={[5,5,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="df-card" style={{padding:20}}>
          <h3 style={{fontSize:14.5, margin:"0 0 14px"}}>Approved leave by type</h3>
          {leaveByType.length===0 ? <EmptyState title="No approved leave yet" subtitle="Approved time off will show up here."/> :
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={leaveByType} dataKey="value" nameKey="name" innerRadius={48} outerRadius={76} paddingAngle={3}>
                {leaveByType.map((e,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
              </Pie>
              <Tooltip contentStyle={{borderRadius:10, border:"1px solid #E4E6F0", fontSize:12}}/>
            </PieChart>
          </ResponsiveContainer>}
          <div style={{display:"flex", flexWrap:"wrap", gap:"6px 14px", marginTop:6}}>
            {leaveByType.map((e,i)=>(
              <div key={i} style={{display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--ink-soft)"}}>
                <span style={{width:8,height:8,borderRadius:2,background:PIE_COLORS[i%PIE_COLORS.length]}}/>{e.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="df-card" style={{padding:20}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
          <h3 style={{fontSize:14.5, margin:0}}>Pending time-off requests</h3>
          <button className="df-btn df-btn-ghost df-btn-sm" onClick={onGoTimeoff}>View all <Icon.chev/></button>
        </div>
        {pending.length===0 ? <EmptyState title="All caught up" subtitle="No pending requests right now."/> : (
          <table className="df-table">
            <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Reason</th></tr></thead>
            <tbody>
              {pending.slice(0,5).map(r=>{
                const emp = employees.find(e=>e.id===r.employeeId);
                return (
                  <tr key={r.id} className="clickable" onClick={()=>onOpenEmployee(emp.id)}>
                    <td><div style={{display:"flex",alignItems:"center",gap:8}}><Avatar name={emp.name} size={26}/>{emp.name}</div></td>
                    <td>{LEAVE_TYPES.find(t=>t.id===r.leaveTypeId)?.name}</td>
                    <td className="df-mono" style={{fontSize:12}}>{r.startDate} → {r.endDate}</td>
                    <td style={{color:"var(--ink-soft)"}}>{r.reason}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function PageHeader({ title, subtitle, action }){
  return (
    <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:22}}>
      <div>
        <h1 style={{fontSize:24, margin:0}}>{title}</h1>
        {subtitle && <p style={{color:"var(--ink-soft)", fontSize:13.5, margin:"4px 0 0"}}>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmployeeListPage({ employees, getTodayStatus, onOpen, onCreate }){
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const filtered = employees.filter(e =>
    (dept==="All" || e.department===dept) &&
    (e.name.toLowerCase().includes(q.toLowerCase()) || e.position.toLowerCase().includes(q.toLowerCase()))
  );
  return (
    <div>
      <PageHeader title="Employees" subtitle={`${employees.length} people across ${DEPARTMENTS.length} departments`}
        action={<button className="df-btn df-btn-dawn" onClick={onCreate}><Icon.plus/> Create employee</button>} />
      <div style={{display:"flex", gap:10, marginBottom:18}}>
        <input className="df-input" style={{maxWidth:280}} placeholder="Search by name or role…" value={q} onChange={e=>setQ(e.target.value)}/>
        <select className="df-select" style={{maxWidth:180}} value={dept} onChange={e=>setDept(e.target.value)}>
          <option>All</option>
          {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
        </select>
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(240px,1fr))", gap:14}}>
        {filtered.map(e=>{
          const status = getTodayStatus(e.id);
          return (
            <div key={e.id} className="df-card" onClick={()=>onOpen(e.id)}
              style={{padding:16, cursor:"pointer", transition:"box-shadow .15s"}}
              onMouseEnter={ev=>ev.currentTarget.style.boxShadow="0 8px 20px rgba(18,21,28,0.08)"}
              onMouseLeave={ev=>ev.currentTarget.style.boxShadow="none"}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start"}}>
                <div style={{display:"flex", gap:10}}>
                  <Avatar name={e.name}/>
                  <div>
                    <div style={{fontWeight:700, fontSize:14}}>{e.name}</div>
                    <div style={{fontSize:12.5, color:"var(--ink-soft)"}}>{e.position}</div>
                  </div>
                </div>
                <AttendanceBadge status={status}/>
              </div>
              <div style={{display:"flex", justifyContent:"space-between", marginTop:14, fontSize:12, color:"var(--ink-faint)"}}>
                <span>{e.department}</span>
                <span className="df-mono">{e.loginId}</span>
              </div>
            </div>
          );
        })}
        {filtered.length===0 && <EmptyState title="No employees match" subtitle="Try a different search or department filter."/>}
      </div>
    </div>
  );
}

function EmployeeDetailPage({ emp, isAdmin, getTodayStatus, getAllocations, attendanceHistory, leaveHistory, onBack, onLoginAs, onEditable, canEditBasic, onSaveBasic }){
  const [tab, setTab] = useState("basic");
  if (!emp) return null;
  const status = getTodayStatus(emp.id);
  const allocations = getAllocations(emp.id);

  return (
    <div>
      <button className="df-btn df-btn-ghost df-btn-sm" onClick={onBack} style={{marginBottom:16}}>
        <span style={{transform:"rotate(180deg)", display:"inline-flex"}}><Icon.chev/></span> Back to employees
      </button>

      <div className="df-card" style={{padding:22, marginBottom:18, display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:14}}>
        <div style={{display:"flex", gap:16, alignItems:"center"}}>
          <Avatar name={emp.name} size={56}/>
          <div>
            <h2 style={{fontSize:20, margin:0}}>{emp.name}</h2>
            <p style={{margin:"3px 0 0", color:"var(--ink-soft)", fontSize:13.5}}>{emp.position} · {emp.department}</p>
            <p className="df-mono" style={{margin:"6px 0 0", fontSize:12, color:"var(--ink-faint)"}}>{emp.loginId}</p>
          </div>
        </div>
        <div style={{display:"flex", alignItems:"center", gap:10}}>
          <AttendanceBadge status={status}/>
          {isAdmin && <button className="df-btn df-btn-ghost df-btn-sm" onClick={onLoginAs}>View as employee</button>}
        </div>
      </div>

      <div style={{display:"flex", borderBottom:"1px solid var(--line)", marginBottom:20}}>
        {["basic","private","salary","attendance","timeoff"].map(t=>(
          <div key={t} className={`df-tab ${tab===t?"active":""}`} onClick={()=>setTab(t)} style={{textTransform:"capitalize"}}>
            {t==="timeoff"?"Time Off":t}
          </div>
        ))}
      </div>

      {tab==="basic" && <BasicInfoGrid emp={emp}/>}
      {tab==="private" && (isAdmin ? <PrivateInfoGrid emp={emp}/> : <RestrictedNotice text="Private information is visible to Admin/HR only."/>)}
      {tab==="salary" && <SalaryBreakdown emp={emp}/>}
      {tab==="attendance" && <AttendanceTable rows={attendanceHistory}/>}
      {tab==="timeoff" && <LeaveHistoryTable rows={leaveHistory} allocations={allocations}/>}
    </div>
  );
}

function RestrictedNotice({ text }){
  return (
    <div className="df-card" style={{padding:24, display:"flex", alignItems:"center", gap:12, background:"var(--neutral-bg)", border:"none"}}>
      <div style={{color:"var(--ink-faint)"}}><Icon.user/></div>
      <span style={{fontSize:13.5, color:"var(--ink-soft)"}}>{text}</span>
    </div>
  );
}

function InfoField({ label, value }){
  return (
    <div>
      <div className="df-label" style={{marginBottom:3}}>{label}</div>
      <div style={{fontSize:13.5}}>{value || "—"}</div>
    </div>
  );
}
function InfoGrid({ children }){
  return <div className="df-card" style={{padding:22, display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"18px 20px"}}>{children}</div>;
}
function BasicInfoGrid({ emp }){
  return (
    <InfoGrid>
      <InfoField label="Full name" value={emp.name}/>
      <InfoField label="Mobile" value={emp.mobile}/>
      <InfoField label="Work email" value={emp.email}/>
      <InfoField label="Department" value={emp.department}/>
      <InfoField label="Job position" value={emp.position}/>
      <InfoField label="Manager" value={emp.manager}/>
      <InfoField label="Company" value={emp.company}/>
      <InfoField label="Location" value={emp.location}/>
      <InfoField label="Date of birth" value={emp.dob}/>
      <InfoField label="Personal email" value={emp.personalEmail}/>
      <InfoField label="Gender" value={emp.gender}/>
      <InfoField label="Nationality" value={emp.nationality}/>
      <InfoField label="Marital status" value={emp.maritalStatus}/>
      <InfoField label="Joining date" value={emp.joinDate}/>
      <InfoField label="Address" value={emp.address}/>
    </InfoGrid>
  );
}
function PrivateInfoGrid({ emp }){
  const p = emp.privateInfo;
  return (
    <InfoGrid>
      <InfoField label="PAN" value={p.pan}/>
      <InfoField label="UAN" value={p.uan}/>
      <InfoField label="Bank details" value={p.bank}/>
      <InfoField label="Resume" value={p.resume}/>
      <InfoField label="Skills" value={p.skills.join(", ") || "—"}/>
      <InfoField label="Certifications" value={p.certifications.join(", ") || "—"}/>
    </InfoGrid>
  );
}
function SalaryBreakdown({ emp, employeeView }){
  const s = emp.salary;
  return (
    <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:16}}>
      <div className="df-card" style={{padding:22}}>
        <h3 style={{fontSize:14, margin:"0 0 14px"}}>Earnings</h3>
        {[["Basic Salary",s.basic],["HRA",s.hra],["Standard Allowance",s.standardAllowance],
          ["Performance Bonus",s.performanceBonus],["Leave Travel Allowance",s.lta],["Fixed Allowance",s.fixedAllowance]]
          .map(([label,val])=>(
          <div key={label} style={{display:"flex", justifyContent:"space-between", padding:"7px 0", fontSize:13.5, borderBottom:"1px solid var(--line)"}}>
            <span style={{color:"var(--ink-soft)"}}>{label}</span><span className="df-mono">{fmtINR(val)}</span>
          </div>
        ))}
        <div style={{display:"flex", justifyContent:"space-between", padding:"12px 0 0", fontSize:14, fontWeight:700}}>
          <span>Gross Salary</span><span className="df-mono">{fmtINR(s.gross)}</span>
        </div>
      </div>
      <div className="df-card" style={{padding:22}}>
        <h3 style={{fontSize:14, margin:"0 0 14px"}}>Deductions</h3>
        {[["Provident Fund",s.pf],["Professional Tax",s.professionalTax]].map(([label,val])=>(
          <div key={label} style={{display:"flex", justifyContent:"space-between", padding:"7px 0", fontSize:13.5, borderBottom:"1px solid var(--line)"}}>
            <span style={{color:"var(--ink-soft)"}}>{label}</span><span className="df-mono">−{fmtINR(val)}</span>
          </div>
        ))}
        <div style={{display:"flex", justifyContent:"space-between", padding:"12px 0 0", fontSize:16, fontWeight:700, color:"var(--success)"}}>
          <span>Net Salary / month</span><span className="df-mono">{fmtINR(s.net)}</span>
        </div>
        <p style={{fontSize:11.5, color:"var(--ink-faint)", marginTop:14, lineHeight:1.5}}>
          Wage type: Monthly · {fmtINR(emp.monthlyWage)}/mo. Figures are a hackathon demonstration of salary structure, not statutory payroll advice.
        </p>
      </div>
    </div>
  );
}
function AttendanceTable({ rows }){
  if (rows.length===0) return <EmptyState title="No attendance records yet" subtitle="Records appear once check-ins begin."/>;
  return (
    <div className="df-card df-scrollbar" style={{padding:"6px 20px 14px", maxHeight:420, overflowY:"auto"}}>
      <table className="df-table">
        <thead><tr><th>Date</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Work Hrs</th><th>Extra Hrs</th><th>Status</th></tr></thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={i}>
              <td className="df-mono" style={{fontSize:12}}>{r.date}</td>
              <td>{r.day}</td>
              <td>{fmtTime(r.checkIn)}</td>
              <td>{fmtTime(r.checkOut)}</td>
              <td>{r.workHours || "—"}</td>
              <td>{r.extraHours || "—"}</td>
              <td><AttendanceBadge status={r.status}/></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function LeaveHistoryTable({ rows, allocations, empId }){
  const [allocState, setAllocState] = useState(allocations || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (empId) {
      setLoading(true);
      timeoffApi.getAllocations(empId)
        .then(res => setAllocState(res))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else if (allocations) {
      setAllocState(allocations);
    }
  }, [empId, allocations, rows]);

  return (
    <div>
      {loading ? (
        <div style={{padding:20, textAlign:"center", color:"var(--ink-faint)"}}>Loading allocation balances...</div>
      ) : allocState && allocState.length > 0 && (
        <div style={{display:"flex", gap:14, marginBottom:18}}>
          {allocState.map(a=>(
            <div key={a.id} className="df-card" style={{padding:16, flex:1}}>
              <div style={{fontSize:12.5, color:"var(--ink-soft)", fontWeight:600}}>{a.name}</div>
              <div className="df-display" style={{fontSize:22, margin:"4px 0"}}>{a.remaining} <span style={{fontSize:12, color:"var(--ink-faint)", fontFamily:"var(--font-body)"}}>days left</span></div>
              <div style={{fontSize:11.5, color:"var(--ink-faint)"}}>{a.used} used of {a.allocated}</div>
            </div>
          ))}
        </div>
      )}
      {rows.length===0 ? <EmptyState title="No time-off requests" subtitle="Requests will show up here."/> : (
        <div className="df-card" style={{padding:"6px 20px 14px"}}>
          <table className="df-table">
            <thead><tr><th>Type</th><th>Dates</th><th>Reason</th><th>Attachment</th><th>Status</th><th>Comment</th></tr></thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id}>
                  <td>{LEAVE_TYPES.find(t=>t.id===r.leaveTypeId)?.name}</td>
                  <td className="df-mono" style={{fontSize:12}}>{r.startDate} → {r.endDate}</td>
                  <td style={{color:"var(--ink-soft)"}}>{r.reason}</td>
                  <td><AttachmentViewer path={r.attachmentUrl || r.attachment}/></td>
                  <td><LeaveStatusBadge status={r.status}/></td>
                  <td style={{color:"var(--ink-faint)", fontSize:12.5}}>{r.admin_comment || r.comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function AdminTimeOffPage({ leaveRequests, employees, decideLeave, isLoading }){
  const [filter, setFilter] = useState("Pending");
  const [decisionModal, setDecisionModal] = useState(null);
  const rows = leaveRequests.filter(r=> filter==="All" || r.status===filter)
    .sort((a,b)=> a.createdAt<b.createdAt?1:-1);

  return (
    <div>
      <PageHeader title="Time Off" subtitle="Review, approve, and comment on requests across the workforce."/>
      <div style={{display:"flex", gap:8, marginBottom:16}}>
        {["Pending","Approved","Rejected","All"].map(f=>(
          <button key={f} className={`df-btn df-btn-sm ${filter===f?"df-btn-primary":"df-btn-ghost"}`} onClick={()=>setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="df-card" style={{padding:"6px 20px 14px"}}>
        {isLoading ? (
          <div style={{padding:"40px 20px", textAlign:"center", color:"var(--ink-soft)"}}>Loading time off requests...</div>
        ) : rows.length===0 ? <EmptyState title="Nothing here" subtitle="No requests match this filter."/> : (
          <table className="df-table">
            <thead><tr><th>Employee</th><th>Type</th><th>Dates</th><th>Reason</th><th>Attachment</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {rows.map(r=>{
                const emp = employees.find(e=>e.id===r.employeeId);
                return (
                  <tr key={r.id}>
                    <td><div style={{display:"flex",alignItems:"center",gap:8}}><Avatar name={emp?.name || r.employeeId} size={26}/>{emp?.name || r.employeeId}</div></td>
                    <td>{LEAVE_TYPES.find(t=>t.id===r.leaveTypeId)?.name}</td>
                    <td className="df-mono" style={{fontSize:12}}>{r.startDate} → {r.endDate}</td>
                    <td style={{maxWidth:220, color:"var(--ink-soft)"}}>{r.reason}</td>
                    <td><AttachmentViewer path={r.attachmentUrl || r.attachment}/></td>
                    <td><LeaveStatusBadge status={r.status}/></td>
                    <td>
                      {r.status==="Pending" ? (
                        <div style={{display:"flex", gap:6}}>
                          <button className="df-btn df-btn-success df-btn-sm" onClick={()=>setDecisionModal({req:r, emp, decision:"Approved"})}><Icon.check/></button>
                          <button className="df-btn df-btn-danger df-btn-sm" onClick={()=>setDecisionModal({req:r, emp, decision:"Rejected"})}><Icon.x/></button>
                        </div>
                      ) : <span style={{fontSize:12, color:"var(--ink-faint)"}}>{r.admin_comment || r.comment || "—"}</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {decisionModal && (
        <DecisionModal data={decisionModal} onClose={()=>setDecisionModal(null)}
          onConfirm={async (comment)=>{
            await decideLeave(decisionModal.req.id, decisionModal.decision, comment);
            setDecisionModal(null);
          }}/>
      )}
    </div>
  );
}

function DecisionModal({ data, onClose, onConfirm }){
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const approve = data.decision==="Approved";

  async function handleConfirm() {
    setErrorMsg("");
    setIsSubmitting(true);
    try {
      await onConfirm(comment);
    } catch (err) {
      setErrorMsg(err.message || "Action failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal onClose={onClose} width={460}>
      <ModalHeader title={`${data.decision} request`} subtitle={`${data.emp?.name} · ${LEAVE_TYPES.find(t=>t.id===data.req.leaveTypeId)?.name}`} onClose={onClose}/>
      <div style={{padding:22}}>
        <p style={{fontSize:13, color:"var(--ink-soft)", marginTop:0}}>{data.req.startDate} → {data.req.endDate} · "{data.req.reason}"</p>
        {(data.req.attachmentUrl || data.req.attachment) && (
          <div style={{fontSize:12.5, color:"var(--brand-flow)", marginBottom:12, display:"flex", alignItems:"center", gap:6}}>
            <span>Attachment:</span>
            <AttachmentViewer path={data.req.attachmentUrl || data.req.attachment}/>
          </div>
        )}
        {errorMsg && (
          <div style={{background:"var(--danger-bg)", color:"var(--danger)", padding:"10px 14px", borderRadius:8, fontSize:12.5, marginBottom:14, fontWeight:600}}>
            {errorMsg}
          </div>
        )}
        <label className="df-label">Comment (optional)</label>
        <textarea className="df-textarea" rows={3} placeholder={approve?"e.g. Approved, enjoy your time off!":"Let them know why."} value={comment} onChange={e=>setComment(e.target.value)}/>
      </div>
      <div style={{padding:"0 22px 22px", display:"flex", gap:10, justifyContent:"flex-end"}}>
        <button className="df-btn df-btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
        <button className={`df-btn ${approve?"df-btn-success":"df-btn-danger"}`} onClick={handleConfirm} disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : `Confirm ${data.decision.toLowerCase()}`}
        </button>
      </div>
    </Modal>
  );
}

function RequestTimeOffModal({ allocations, onClose, onSubmit }){
  const [form, setForm] = useState({ leaveTypeId:"pto", startDate:"", endDate:"", reason:"", attachmentFile:null, attachment:"" });
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  function set(k,v){ setForm(f=>({...f,[k]:v})); }

  async function submit(e){
    e.preventDefault();
    setErr("");
    if (!form.startDate || !form.endDate || !form.reason){
      setErr("Start date, end date, and reason are required.");
      return;
    }
    if (form.endDate < form.startDate){
      setErr("End date cannot be before start date.");
      return;
    }
    const isSick = form.leaveTypeId === "sick";
    if (isSick && !form.attachmentFile){
      setErr("Medical document/certificate attachment is required for Sick Leave.");
      return;
    }

    let storagePath = null;
    if (isSick && form.attachmentFile) {
      setUploading(true);
      try {
        const res = await timeoffApi.uploadLeaveAttachment(form.attachmentFile);
        if (res.error || !res.data?.path) {
          setErr(res.error?.message || "Attachment upload failed. Please try again.");
          setUploading(false);
          return;
        }
        storagePath = res.data.path;
      } catch (uploadErr) {
        setErr(uploadErr.message || "Attachment upload failed. Please try again.");
        setUploading(false);
        return;
      } finally {
        setUploading(false);
      }
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        attachmentUrl: storagePath,
      });
    } catch (error) {
      setErr(error.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  const isSickSelected = form.leaveTypeId === "sick";

  return (
    <Modal onClose={onClose} width={460}>
      <ModalHeader title="Request time off" onClose={onClose}/>
      <form onSubmit={submit}>
        <div style={{padding:22, display:"flex", flexDirection:"column", gap:14}}>
          {err && (
            <div style={{background:"var(--danger-bg)", color:"var(--danger)", padding:"10px 14px", borderRadius:9, fontSize:12.5, fontWeight:600}}>
              {err}
            </div>
          )}
          <div>
            <label className="df-label">Time-off type</label>
            <select className="df-select" value={form.leaveTypeId} onChange={e=>set("leaveTypeId",e.target.value)}>
              {LEAVE_TYPES.map(t=>{
                const bal = (allocations || []).find(a=>a.id===t.id);
                return <option key={t.id} value={t.id}>{t.name}{bal?` (${bal.remaining} left)`:""}</option>;
              })}
            </select>
          </div>
          <div style={{display:"flex", gap:12}}>
            <div style={{flex:1}}><label className="df-label">Start date</label><input className="df-input" type="date" value={form.startDate} onChange={e=>set("startDate",e.target.value)}/></div>
            <div style={{flex:1}}><label className="df-label">End date</label><input className="df-input" type="date" value={form.endDate} onChange={e=>set("endDate",e.target.value)}/></div>
          </div>
          <div>
            <label className="df-label">Reason / remarks</label>
            <textarea className="df-textarea" rows={3} value={form.reason} onChange={e=>set("reason",e.target.value)}/>
          </div>
          <div>
            <label className="df-label">
              Attach document {isSickSelected ? <span style={{color:"var(--danger)"}}>* (Required for Sick Leave)</span> : "(optional)"}
            </label>
            <input className="df-input" type="file" onChange={e=>{
              const file = e.target.files[0];
              setForm(f=>({...f, attachmentFile:file, attachment: file ? file.name : ""}));
            }}/>
          </div>
        </div>
        <div style={{padding:22, display:"flex", gap:10, justifyContent:"flex-end", borderTop:"1px solid var(--line)"}}>
          <button type="button" className="df-btn df-btn-ghost" onClick={onClose} disabled={uploading || submitting}>Cancel</button>
          <button type="submit" className="df-btn df-btn-dawn" disabled={uploading || submitting}>
            {uploading ? "Uploading..." : submitting ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AdminPayrollPage({ employees, attendance, todayStr }){
  const totalGross = employees.reduce((s,e)=>s+e.salary.gross,0);
  const totalNet = employees.reduce((s,e)=>s+e.salary.net,0);
  const byDept = useMemo(()=>{
    const map = {};
    employees.forEach(e=>{ map[e.department]=(map[e.department]||0)+e.salary.gross; });
    return Object.entries(map).map(([name,value])=>({name, value:Math.round(value/1000)}));
  },[employees]);

  return (
    <div>
      <PageHeader title="Payroll" subtitle="Salary structure and monthly payroll summary across the company."/>
      <div style={{display:"flex", gap:14, marginBottom:20}}>
        <StatCard label="Monthly Gross (all)" value={fmtINR(totalGross)} tone="var(--brand-flow)"/>
        <StatCard label="Monthly Net (all)" value={fmtINR(totalNet)} tone="var(--success)"/>
        <StatCard label="Headcount" value={employees.length}/>
      </div>
      <div className="df-card" style={{padding:20, marginBottom:20}}>
        <h3 style={{fontSize:14.5, margin:"0 0 14px"}}>Gross payroll by department (₹ thousands)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={byDept}>
            <CartesianGrid vertical={false} stroke="#EEF0F6"/>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:12, fill:"#9AA0AF"}}/>
            <YAxis axisLine={false} tickLine={false} tick={{fontSize:12, fill:"#9AA0AF"}}/>
            <Tooltip contentStyle={{borderRadius:10, border:"1px solid #E4E6F0", fontSize:12}} formatter={(v)=>`₹${v}k`}/>
            <Bar dataKey="value" fill="#1E2A52" radius={[6,6,0,0]}/>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="df-card" style={{padding:"6px 20px 14px"}}>
        <table className="df-table">
          <thead><tr><th>Employee</th><th>Department</th><th>Monthly Wage</th><th>Gross</th><th>Deductions</th><th>Net</th></tr></thead>
          <tbody>
            {employees.map(e=>(
              <tr key={e.id}>
                <td><div style={{display:"flex",alignItems:"center",gap:8}}><Avatar name={e.name} size={26}/>{e.name}</div></td>
                <td>{e.department}</td>
                <td className="df-mono">{fmtINR(e.monthlyWage)}</td>
                <td className="df-mono">{fmtINR(e.salary.gross)}</td>
                <td className="df-mono" style={{color:"var(--danger)"}}>−{fmtINR(e.salary.pf+e.salary.professionalTax)}</td>
                <td className="df-mono" style={{fontWeight:700, color:"var(--success)"}}>{fmtINR(e.salary.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AskDayflow({ employees, attendance, leaveRequests, getTodayStatus }){
  const [q, setQ] = useState("");
  const [log, setLog] = useState([
    { role:"assistant", text:"Ask me things like \"who had the most absences this month?\" or \"summarize pending leave requests.\" I answer only from Dayflow's own data." }
  ]);

  function ask(question){
    const text = question.toLowerCase();
    let answer;
    if (text.includes("absen")){
      const counts = {};
      attendance.filter(a=>a.status==="Absent").forEach(a=>{ counts[a.employeeId]=(counts[a.employeeId]||0)+1; });
      const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]);
      if (sorted.length===0) answer = "No absences recorded in the current window — great attendance!";
      else {
        const [empId,count] = sorted[0];
        const emp = employees.find(e=>e.id===empId);
        answer = `${emp?.name || "Unknown"} has the most absences: ${count} day(s) in the tracked window.`;
      }
    } else if (text.includes("pending")){
      const pending = leaveRequests.filter(r=>r.status==="Pending");
      if (pending.length===0) answer = "No pending time-off requests right now — inbox zero.";
      else {
        const lines = pending.map(r=>{
          const emp = employees.find(e=>e.id===r.employeeId);
          return `${emp?.name} — ${LEAVE_TYPES.find(t=>t.id===r.leaveTypeId)?.name} (${r.startDate} → ${r.endDate})`;
        });
        answer = `${pending.length} pending request(s): ${lines.join("; ")}.`;
      }
    } else if (text.includes("present") || text.includes("today")){
      const present = employees.filter(e=>getTodayStatus(e.id)==="Present").length;
      answer = `${present} of ${employees.length} employees are checked in today.`;
    } else if (text.includes("payroll") || text.includes("salary") || text.includes("gross") || text.includes("net")){
      const totalNet = employees.reduce((s,e)=>s+e.salary.net,0);
      answer = `Total monthly net payroll across ${employees.length} employees is ${fmtINR(totalNet)}.`;
    } else if (text.includes("leave") && text.includes("most")){
      const map = {};
      leaveRequests.filter(r=>r.status==="Approved").forEach(r=>{ map[r.employeeId]=(map[r.employeeId]||0)+1; });
      const sorted = Object.entries(map).sort((a,b)=>b[1]-a[1]);
      if (sorted.length===0) answer = "No approved leave on record yet.";
      else { const emp = employees.find(e=>e.id===sorted[0][0]); answer = `${emp?.name} has taken the most approved leave requests (${sorted[0][1]}).`; }
    } else {
      answer = "I can answer questions about absences, pending requests, today's attendance, and payroll — try one of the suggestions below.";
    }
    setLog(l=>[...l, { role:"user", text:question }, { role:"assistant", text:answer }]);
    setQ("");
  }

  const suggestions = ["Who had the most absences this month?","Summarize pending leave requests.","How many people are present today?","What's total net payroll?"];

  return (
    <div>
      <PageHeader title="Ask Dayflow" subtitle="A lightweight assistant that answers from your own HR data. Optional differentiator — not a dependency for core HR workflows."/>
      <div className="df-card" style={{padding:20, maxWidth:680}}>
        <div style={{display:"flex", flexDirection:"column", gap:12, maxHeight:340, overflowY:"auto", marginBottom:16}} className="df-scrollbar">
          {log.map((m,i)=>(
            <div key={i} style={{alignSelf: m.role==="user"?"flex-end":"flex-start", maxWidth:"85%"}}>
              <div style={{
                background: m.role==="user" ? "var(--brand-deep)" : "var(--neutral-bg)",
                color: m.role==="user" ? "#fff" : "var(--ink)",
                padding:"9px 13px", borderRadius:12, fontSize:13.5, lineHeight:1.5,
              }}>{m.text}</div>
            </div>
          ))}
        </div>
        <div style={{display:"flex", flexWrap:"wrap", gap:6, marginBottom:12}}>
          {suggestions.map(s=><button key={s} className="df-btn df-btn-ghost df-btn-sm" onClick={()=>ask(s)}>{s}</button>)}
        </div>
        <form onSubmit={e=>{e.preventDefault(); if(q.trim()) ask(q.trim());}} style={{display:"flex", gap:8}}>
          <input className="df-input" placeholder="Ask about attendance, leave, or payroll…" value={q} onChange={e=>setQ(e.target.value)}/>
          <button className="df-btn df-btn-dawn" type="submit">Ask</button>
        </form>
      </div>
    </div>
  );
}

function CreateEmployeeModal({ onClose, onCreate }){
  const [form, setForm] = useState({
    firstName:"", lastName:"", email:"", mobile:"", department:DEPARTMENTS[0], position:"",
    manager:"", location:LOCATIONS[0], gender:"", monthlyWage:60000,
  });
  const [err, setErr] = useState("");
  function set(k,v){ setForm(f=>({...f,[k]:v})); }
  function submit(e){
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.position || !form.monthlyWage){
      setErr("First name, last name, position, and monthly wage are required.");
      return;
    }
    onCreate({ ...form, monthlyWage:Number(form.monthlyWage) });
  }
  return (
    <Modal onClose={onClose} width={560}>
      <ModalHeader title="Create employee" subtitle="Dayflow generates the Login ID and a temporary password." onClose={onClose}/>
      <form onSubmit={submit}>
        <div style={{padding:22, display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>
          <div><label className="df-label">First name *</label><input className="df-input" value={form.firstName} onChange={e=>set("firstName",e.target.value)}/></div>
          <div><label className="df-label">Last name *</label><input className="df-input" value={form.lastName} onChange={e=>set("lastName",e.target.value)}/></div>
          <div><label className="df-label">Work email</label><input className="df-input" placeholder="auto-generated if blank" value={form.email} onChange={e=>set("email",e.target.value)}/></div>
          <div><label className="df-label">Mobile</label><input className="df-input" value={form.mobile} onChange={e=>set("mobile",e.target.value)}/></div>
          <div><label className="df-label">Department</label>
            <select className="df-select" value={form.department} onChange={e=>set("department",e.target.value)}>
              {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label className="df-label">Job position *</label><input className="df-input" value={form.position} onChange={e=>set("position",e.target.value)}/></div>
          <div><label className="df-label">Manager</label><input className="df-input" placeholder="Optional" value={form.manager} onChange={e=>set("manager",e.target.value)}/></div>
          <div><label className="df-label">Location</label>
            <select className="df-select" value={form.location} onChange={e=>set("location",e.target.value)}>
              {LOCATIONS.map(d=><option key={d}>{d}</option>)}
            </select>
          </div>
          <div><label className="df-label">Gender</label><input className="df-input" placeholder="Optional" value={form.gender} onChange={e=>set("gender",e.target.value)}/></div>
          <div><label className="df-label">Monthly wage (₹) *</label><input className="df-input" type="number" min="0" value={form.monthlyWage} onChange={e=>set("monthlyWage",e.target.value)}/></div>
        </div>
        {err && <div style={{padding:"0 22px", color:"var(--danger)", fontSize:12.5}}>{err}</div>}
        <div style={{padding:22, display:"flex", gap:10, justifyContent:"flex-end", borderTop:"1px solid var(--line)"}}>
          <button type="button" className="df-btn df-btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="df-btn df-btn-dawn">Create employee</button>
        </div>
      </form>
    </Modal>
  );
}

function CredentialsModal({ result, onClose, onLoginAs }){
  const { employee, loginId, tempPassword } = result;
  return (
    <Modal onClose={onClose} width={440}>
      <ModalHeader title="Employee created" subtitle={`${employee.name} can now sign in to Dayflow.`} onClose={onClose}/>
      <div style={{padding:22}}>
        <div className="df-card" style={{padding:16, background:"var(--neutral-bg)", border:"none"}}>
          <div style={{marginBottom:12}}>
            <div className="df-label">Login ID</div>
            <div className="df-mono" style={{fontSize:16, fontWeight:700}}>{loginId}</div>
          </div>
          <div>
            <div className="df-label">Temporary password</div>
            <div className="df-mono" style={{fontSize:16, fontWeight:700}}>{tempPassword}</div>
          </div>
        </div>
        <p style={{fontSize:12, color:"var(--ink-faint)", marginTop:12, lineHeight:1.6}}>
          Employee will be asked to change this password after their first login. In this prototype, credentials are surfaced here for demo purposes only.
        </p>
      </div>
      <div style={{padding:"0 22px 22px", display:"flex", gap:10, justifyContent:"flex-end"}}>
        <button className="df-btn df-btn-ghost" onClick={onClose}>Done</button>
        <button className="df-btn df-btn-primary" onClick={onLoginAs}>Log in as {employee.firstName} now</button>
      </div>
    </Modal>
  );
}

/* ============================= EMPLOYEE SHELL ============================== */
function EmployeeShell({ me, employees, attendance, leaveRequests, getTodayAttendance, getTodayStatus, getAllocations,
  empAttendanceHistory, empLeaveHistory, checkIn, checkOut, submitLeaveRequest, onLogout }){
  const [page, setPage] = useState("dashboard");
  const [requestOpen, setRequestOpen] = useState(false);
  const [allocations, setAllocations] = useState([]);
  const [loadingAlloc, setLoadingAlloc] = useState(false);

  useEffect(() => {
    if (me) {
      setLoadingAlloc(true);
      timeoffApi.getAllocations(me.id)
        .then(res => setAllocations(res))
        .catch(() => {})
        .finally(() => setLoadingAlloc(false));
    }
  }, [me, leaveRequests]);

  if (!me) return null;

  const nav = [
    { id:"dashboard", label:"Dashboard", icon:Icon.dashboard },
    { id:"profile", label:"Profile", icon:Icon.user },
    { id:"attendance", label:"Attendance", icon:Icon.clock },
    { id:"timeoff", label:"Time Off", icon:Icon.calendar },
    { id:"payroll", label:"Payroll", icon:Icon.wallet },
  ];
  const todayA = getTodayAttendance(me.id);
  const myLeave = empLeaveHistory(me.id);

  return (
    <div style={{display:"flex"}}>
      <Sidebar nav={nav} page={page} setPage={setPage} title="Dayflow" roleLabel="Employee" name={me.name} onLogout={onLogout}/>
      <div style={{flex:1, minWidth:0, padding:"28px 34px", maxHeight:"100vh", overflowY:"auto"}}>
        {page==="dashboard" && (
          <EmployeeDashboard me={me} todayA={todayA} allocations={allocations} myLeave={myLeave}
            checkIn={()=>checkIn(me.id)} checkOut={()=>checkOut(me.id)}
            onRequestTimeOff={()=>setRequestOpen(true)} onGoTo={setPage}/>
        )}
        {page==="profile" && (
          <div>
            <PageHeader title="My Profile" subtitle="View your details. Private and salary info is managed by HR."/>
            <div style={{display:"flex", borderBottom:"1px solid var(--line)", marginBottom:20}}>
              <div className="df-tab active">Basic Information</div>
            </div>
            <BasicInfoGrid emp={me}/>
          </div>
        )}
        {page==="attendance" && (
          <div>
            <PageHeader title="My Attendance" subtitle="Your check-in history."/>
            <AttendanceTable rows={empAttendanceHistory(me.id)}/>
          </div>
        )}
        {page==="timeoff" && (
          <div>
            <PageHeader title="My Time Off" subtitle="Track balances and request new time off."
              action={<button className="df-btn df-btn-dawn" onClick={()=>setRequestOpen(true)}><Icon.plus/> Request time off</button>} />
            <LeaveHistoryTable rows={myLeave} allocations={allocations} empId={me.id}/>
          </div>
        )}
        {page==="payroll" && (
          <div>
            <PageHeader title="My Payroll" subtitle="Your salary structure for this month."/>
            <SalaryBreakdown emp={me} employeeView/>
          </div>
        )}
      </div>
      {requestOpen && (
        <RequestTimeOffModal allocations={allocations} onClose={()=>setRequestOpen(false)}
          onSubmit={(payload)=>{ submitLeaveRequest(me.id, payload); setRequestOpen(false); }} />
      )}
    </div>
  );
}

function EmployeeDashboard({ me, todayA, allocations, myLeave, checkIn, checkOut, onRequestTimeOff, onGoTo }){
  const checkedIn = !!(todayA && todayA.checkIn);
  const checkedOut = !!(todayA && todayA.checkOut);
  const recentLeave = myLeave.slice(0,3);

  return (
    <div>
      <PageHeader title={`Hey, ${me.firstName} 👋`} subtitle={prettyDate(new Date())}/>
      <div style={{display:"grid", gridTemplateColumns:"1fr 1.6fr", gap:16, marginBottom:16}}>
        <div className="df-card" style={{padding:22, display:"flex", flexDirection:"column", alignItems:"center", textAlign:"center"}}>
          <FlowRing checkedIn={checkedIn} checkedOut={checkedOut}/>
          <div style={{display:"flex", gap:10, marginTop:16, width:"100%"}}>
            <button className="df-btn df-btn-primary" style={{flex:1, justifyContent:"center"}} disabled={checkedIn} onClick={checkIn}>Check In</button>
            <button className="df-btn df-btn-ghost" style={{flex:1, justifyContent:"center"}} disabled={!checkedIn || checkedOut} onClick={checkOut}>Check Out</button>
          </div>
          {checkedIn && <p style={{fontSize:11.5, color:"var(--ink-faint)", marginTop:10}}>Checked in at {fmtTime(todayA.checkIn)}{checkedOut ? ` · out at ${fmtTime(todayA.checkOut)}` : ""}</p>}
        </div>

        <div style={{display:"flex", flexDirection:"column", gap:14}}>
          <div style={{display:"flex", gap:14}}>
            {allocations.map(a=>(
              <div key={a.id} className="df-card" style={{padding:16, flex:1}}>
                <div style={{fontSize:12.5, color:"var(--ink-soft)", fontWeight:600}}>{a.name}</div>
                <div className="df-display" style={{fontSize:24, margin:"4px 0"}}>{a.remaining}<span style={{fontSize:12, fontFamily:"var(--font-body)", color:"var(--ink-faint)"}}> days available</span></div>
              </div>
            ))}
            <button className="df-card" style={{padding:16, flex:1, border:"1px dashed var(--line)", background:"transparent", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, color:"var(--brand-deep)", fontWeight:700, fontSize:13}} onClick={onRequestTimeOff}>
              <Icon.plus/> Request time off
            </button>
          </div>
          <div className="df-card" style={{padding:20, flex:1}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10}}>
              <h3 style={{fontSize:14, margin:0}}>Recent time-off requests</h3>
              <button className="df-btn df-btn-ghost df-btn-sm" onClick={()=>onGoTo("timeoff")}>View all</button>
            </div>
            {recentLeave.length===0 ? <EmptyState title="No requests yet" subtitle="Your submitted requests will appear here."/> : (
              <div style={{display:"flex", flexDirection:"column", gap:10}}>
                {recentLeave.map(r=>(
                  <div key={r.id} style={{display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13}}>
                    <div>
                      <div style={{fontWeight:600}}>{LEAVE_TYPES.find(t=>t.id===r.leaveTypeId)?.name}</div>
                      <div className="df-mono" style={{fontSize:11.5, color:"var(--ink-faint)"}}>{r.startDate} → {r.endDate}</div>
                    </div>
                    <LeaveStatusBadge status={r.status}/>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{display:"flex", gap:14}}>
        <div className="df-card" style={{padding:20, flex:1, cursor:"pointer"}} onClick={()=>onGoTo("profile")}>
          <Icon.user/><div style={{fontWeight:700, fontSize:13.5, marginTop:8}}>Profile</div>
          <div style={{fontSize:12, color:"var(--ink-faint)"}}>{me.position} · {me.department}</div>
        </div>
        <div className="df-card" style={{padding:20, flex:1, cursor:"pointer"}} onClick={()=>onGoTo("payroll")}>
          <Icon.wallet/><div style={{fontWeight:700, fontSize:13.5, marginTop:8}}>Payroll</div>
          <div style={{fontSize:12, color:"var(--ink-faint)"}}>Net pay: {fmtINR(me.salary.net)}/mo</div>
        </div>
        <div className="df-card" style={{padding:20, flex:1, cursor:"pointer"}} onClick={()=>onGoTo("attendance")}>
          <Icon.clock/><div style={{fontWeight:700, fontSize:13.5, marginTop:8}}>Attendance</div>
          <div style={{fontSize:12, color:"var(--ink-faint)"}}>View your full history</div>
        </div>
      </div>
    </div>
  );
}

function RequestTimeOffModal({ allocations, onClose, onSubmit }){
  const [form, setForm] = useState({ leaveTypeId:"pto", startDate:"", endDate:"", reason:"", attachment:"" });
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function set(k,v){ setForm(f=>({...f,[k]:v})); }

  async function submit(e){
    e.preventDefault();
    setErr("");
    if (!form.startDate || !form.endDate || !form.reason){
      setErr("Start date, end date, and reason are required.");
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch (error) {
      setErr(error.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  }

  const isSickSelected = form.leaveTypeId === "sick";

  return (
    <Modal onClose={onClose} width={460}>
      <ModalHeader title="Request time off" onClose={onClose}/>
      <form onSubmit={submit}>
        <div style={{padding:22, display:"flex", flexDirection:"column", gap:14}}>
          {err && (
            <div style={{background:"var(--danger-bg)", color:"var(--danger)", padding:"10px 14px", borderRadius:9, fontSize:12.5, fontWeight:600}}>
              {err}
            </div>
          )}
          <div>
            <label className="df-label">Time-off type</label>
            <select className="df-select" value={form.leaveTypeId} onChange={e=>set("leaveTypeId",e.target.value)}>
              {LEAVE_TYPES.map(t=>{
                const bal = (allocations || []).find(a=>a.id===t.id);
                return <option key={t.id} value={t.id}>{t.name}{bal?` (${bal.remaining} left)`:""}</option>;
              })}
            </select>
          </div>
          <div style={{display:"flex", gap:12}}>
            <div style={{flex:1}}><label className="df-label">Start date</label><input className="df-input" type="date" value={form.startDate} onChange={e=>set("startDate",e.target.value)}/></div>
            <div style={{flex:1}}><label className="df-label">End date</label><input className="df-input" type="date" value={form.endDate} onChange={e=>set("endDate",e.target.value)}/></div>
          </div>
          <div>
            <label className="df-label">Reason / remarks</label>
            <textarea className="df-textarea" rows={3} value={form.reason} onChange={e=>set("reason",e.target.value)}/>
          </div>
          <div>
            <label className="df-label">
              Attach document {isSickSelected ? <span style={{color:"var(--danger)"}}>* (Required for Sick Leave)</span> : "(optional)"}
            </label>
            <input className="df-input" type="file" onChange={e=>set("attachment", e.target.files[0]?.name || "")}/>
          </div>
        </div>
        <div style={{padding:22, display:"flex", gap:10, justifyContent:"flex-end", borderTop:"1px solid var(--line)"}}>
          <button type="button" className="df-btn df-btn-ghost" onClick={onClose} disabled={submitting}>Cancel</button>
          <button type="submit" className="df-btn df-btn-dawn" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit request"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
