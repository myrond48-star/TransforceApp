export function computeAnalyticsData(
  employees: any[],
  month: string,
  site: string,
  project: string,
  hcType: string,
  sto: string,
  unit: string,
  periodMonths: number
) {
  // The 'month' comes in 'YYYY-MM'.
  const targetYear = parseInt(month.split('-')[0], 10);
  const targetMonth = parseInt(month.split('-')[1], 10);
  
  const endOfTargetMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);
  const startOfTargetMonth = new Date(targetYear, targetMonth - 1, 1);
  const startOfPriorMonth = new Date(targetYear, targetMonth - 2, 1);
  const endOfPriorMonth = new Date(targetYear, targetMonth - 1, 0, 23, 59, 59);

  // Apply filters that operate globally
  let filtered = employees || [];
  if (sto && sto !== 'all') filtered = filtered.filter(e => e.sto === sto);
  if (site && site !== 'all') filtered = filtered.filter(e => e.opg === site);
  if (project && project !== 'all') filtered = filtered.filter(e => e.project === project);
  if (unit && unit !== 'all') filtered = filtered.filter(e => e.unit_manager === unit);
  if (hcType && hcType !== 'all') {
    filtered = filtered.filter(e => {
      const isAgent = (e.position || '').toLowerCase() === 'agent';
      return hcType === 'agent' ? isAgent : !isAgent;
    });
  }

  // Parse dates safely
  const parseDate = (d: string | null | undefined) => d ? new Date(d) : null;

  // Extract resign date from remarks if missing, because HCManagementModule writes: `Resigned effective 2024-03-01.`
  const getResignDate = (emp: any) => {
    if (emp.resign_date) return parseDate(emp.resign_date);
    if (emp.status === 'Archived' && emp.remarks?.includes('Resigned effective')) {
      const match = emp.remarks.match(/effective (\d{4}-\d{2}-\d{2})/);
      if (match) return parseDate(match[1]);
    }
    return null;
  };
  
  const getJoinDate = (emp: any) => {
    return parseDate(emp.join_date_project_live || emp.join_date_tcid || emp.join_date_project || emp.join_date);
  };

  // Active definition for a given point in time:
  // join_date <= time AND (resign_date is null OR resign_date > time)
  const isActiveAt = (emp: any, time: Date) => {
    const joinDate = getJoinDate(emp);
    if (!joinDate || joinDate > time) return false;
    const resignDate = getResignDate(emp);
    if (resignDate && resignDate <= time) return false;
    return true;
  };

  const isAgent = (emp: any) => (emp.position || '').toLowerCase() === 'agent';

  // 1. Current Month BOM (Begin of Month = End of Prior Month)
  const bomTotal = filtered.filter(e => isActiveAt(e, endOfPriorMonth));
  const bomAgent = bomTotal.filter(isAgent).length;
  const bomSupport = bomTotal.length - bomAgent;

  // 2. Current Month EOM
  const eomTotal = filtered.filter(e => isActiveAt(e, endOfTargetMonth));
  const eomAgent = eomTotal.filter(isAgent).length;
  const eomSupport = eomTotal.length - eomAgent;

  // 3. Attrition Current Month
  const attrs = filtered.filter(e => {
    const d = getResignDate(e);
    return d && d >= startOfTargetMonth && d <= endOfTargetMonth;
  });
  const attTotal = attrs.length;
  const attAgent = attrs.filter(isAgent).length;
  const attSupport = attTotal - attAgent;

  // 4. Joiners Current Month
  const joins = filtered.filter(e => {
    const d = getJoinDate(e);
    return d && d >= startOfTargetMonth && d <= endOfTargetMonth;
  });
  
  // 5. Previous month stats (for prevailing trends)
  const prevEom = filtered.filter(e => isActiveAt(e, endOfPriorMonth)).length;
  const prevBom = filtered.filter(e => isActiveAt(e, new Date(targetYear, targetMonth - 2, 0, 23, 59, 59))).length;
  const prevAttrs = filtered.filter(e => {
    const d = getResignDate(e);
    return d && d >= startOfPriorMonth && d <= endOfPriorMonth;
  });
  const prevJoins = filtered.filter(e => {
    const d = getJoinDate(e);
    return d && d >= startOfPriorMonth && d <= endOfPriorMonth;
  });

  const monthsMap = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  // Trend 12m
  const trend_12m = [];
  const startTrendIndex = Math.max(0, periodMonths - 1);
  for (let i = startTrendIndex; i >= 0; i--) {
    let m = targetMonth - 1 - i;
    let y = targetYear;
    while (m < 0) { m += 12; y -= 1; }
    
    const eomT = new Date(y, m + 1, 0, 23, 59, 59);
    const bomT = new Date(y, m, 0, 23, 59, 59);
    
    const tBom = filtered.filter(e => isActiveAt(e, bomT)).length;
    const tEom = filtered.filter(e => isActiveAt(e, eomT)).length;
    
    const tAtt = filtered.filter(e => {
      const d = getResignDate(e);
      return d && d > bomT && d <= eomT;
    }).length;
    const tJoin = filtered.filter(e => {
      const d = getJoinDate(e);
      return d && d > bomT && d <= eomT;
    }).length;

    trend_12m.push({
      month: `${monthsMap[m]} ${y.toString().slice(2)}`,
      starting_hc: tBom,
      ending_hc: tEom,
      new_hire: tJoin,
      attrition: tAtt,
      attrition_pct: tBom > 0 ? (tAtt / tBom * 100) : 0,
      hc_growth_pct: tBom > 0 ? ((tEom - tBom) / tBom * 100) : 0,
    });
  }

  // Projects Breakdown (for the exact period selected)
  const projectsData: any[] = [];
  const projectNames = Array.from(new Set(filtered.map(e => e.project).filter(Boolean)));
  for (const p of projectNames) {
    const pEmps = filtered.filter(e => e.project === p);
    const opg = pEmps[0]?.opg || 'Unknown';
    const stoName = pEmps[0]?.sto || 'Unknown';
    
    // start is start of periodMonths ago
    let startM = targetMonth - 1 - periodMonths;
    let startY = targetYear;
    while(startM < 0) { startM += 12; startY -= 1; }
    const periodStart = new Date(startY, startM + 1, 0, 23, 59, 59);
    const periodEnd = endOfTargetMonth;
    
    const startHc = pEmps.filter(e => isActiveAt(e, periodStart)).length;
    const endHc = pEmps.filter(e => isActiveAt(e, periodEnd)).length;
    const newHires = pEmps.filter(e => {
      const d = getJoinDate(e); return d && d > periodStart && d <= periodEnd;
    }).length;
    const resigns = pEmps.filter(e => {
      const d = getResignDate(e); return d && d > periodStart && d <= periodEnd;
    }).length;
    
    if (startHc > 0 || endHc > 0 || newHires > 0 || resigns > 0) {
      projectsData.push({
        project: p as string,
        opg: opg as string,
        sto: stoName as string,
        starting_hc: startHc,
        ending_hc: endHc,
        new_hire: newHires,
        resign: resigns,
        net: endHc - startHc,
        attrition_pct: startHc > 0 ? (resigns / startHc * 100) : 0,
        prev_attrition_pct: 0 // Simplification for now
      });
    }
  }

  // Attributes / Attrition Data for pie
  // Collect reasons from all attrition over the selected period parameter (periodMonths)
  let startAttM = targetMonth - 1 - periodMonths;
  let startAttY = targetYear;
  while(startAttM < 0) { startAttM += 12; startAttY -= 1; }
  const periodStartAttr = new Date(startAttY, startAttM + 1, 0, 23, 59, 59);
  
  const attrPeriod = filtered.filter(e => {
    const d = getResignDate(e);
    return d && d > periodStartAttr && d <= endOfTargetMonth;
  });

  const attrReasons = new Map<string, number>();
  for (const a of attrPeriod) {
    const r = a.resign_reason || 'Notice - General Reason';
    attrReasons.set(r, (attrReasons.get(r) || 0) + 1);
  }
  const by_reason_typed = Array.from(attrReasons.entries()).map(([k,v]) => ({
    resign_type: k.toLowerCase().includes('invol') ? 'Involuntary' : 'Voluntary',
    reason: k,
    count: v
  }));

  const vol = by_reason_typed.filter(r => r.resign_type === 'Voluntary').reduce((a,b) => a+b.count, 0);
  const invol = attrPeriod.length - vol;

  const attrData = {
    summary: { voluntary: vol, involuntary: invol, total: attrPeriod.length },
    by_reason_typed
  };

  const v3Data = {
    period: { label: `${monthsMap[targetMonth-1]} '${targetYear.toString().slice(2)}`, prev_label: 'Prev', month: month, year: targetYear },
    bom: { agent: bomAgent, support: bomSupport, total: bomTotal.length },
    eom: { agent: eomAgent, support: eomSupport, total: eomTotal.length },
    attrition: { total: attTotal, agent: attAgent, support: attSupport },
    attrition_rate: { 
      all: bomTotal.length > 0 ? (attTotal/bomTotal.length)*100 : 0, 
      agent: bomAgent > 0 ? (attAgent/bomAgent)*100 : 0, 
      support: bomSupport > 0 ? (attSupport/bomSupport)*100 : 0 
    },
    joiner: { total: joins.length, new_hire: joins.length, transfer_in: 0 },
    net_hc_change: eomTotal.length - bomTotal.length,
    hc_growth_pct: bomTotal.length > 0 ? ((eomTotal.length - bomTotal.length)/bomTotal.length)*100 : 0,
    prev: { 
      eom_total: prevEom, 
      attrition: prevAttrs.length, 
      attrition_rate: prevBom > 0 ? (prevAttrs.length/prevBom)*100 : 0, 
      joiners: prevJoins.length 
    },
    ytd: { attrition: 0, attrition_rate: 0 }, // optional for now
    trend_12m,
    projects: projectsData,
    opg_rows: [],
    opg_options: [],
    project_options: []
  };

  return { v3Data, attrData };
}
