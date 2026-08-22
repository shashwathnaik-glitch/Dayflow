// Computes salary details on-demand; never cached in the employee state.
export function computeSalary(monthlyWage) {
  if (!monthlyWage || monthlyWage <= 0) {
    return {
      basic: 0,
      hra: 0,
      standardAllowance: 0,
      performanceBonus: 0,
      lta: 0,
      fixedAllowance: 0,
      gross: 0,
      pf: 0,
      professionalTax: 0,
      net: 0
    };
  }
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
