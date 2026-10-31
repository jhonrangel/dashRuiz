import { WmsSubprocessItem, WmsSummaryKPIs, SimulatorConfig } from '../types/wms';

export function calculateSummaryKPIs(
  items: WmsSubprocessItem[],
  config: SimulatorConfig = { costPerHour: 18.5, targetOee: 0.85, targetVolumeMultiplier: 1.0 }
): WmsSummaryKPIs {
  if (items.length === 0) {
    return {
      totalVol: 0,
      totalVolLm: 0,
      volGrowth: 0,
      totalHoras: 0,
      totalHrsLm: 0,
      totalDifHoras: 0,
      weightedOee: 0,
      averageOee: 0,
      weightedCalidad: 0,
      avgProductividadReal: 0,
      avgProductividadMeta: 0,
      costoDesviacion: 0,
      procesosCriticosCount: 0,
      procesosSuperioresCount: 0,
      totalErroresCalidad: 0,
    };
  }

  const totalVol = items.reduce((acc, curr) => acc + curr.vol, 0);
  const totalVolLm = items.reduce((acc, curr) => acc + curr.prodLm, 0);
  const totalHoras = items.reduce((acc, curr) => acc + curr.horas, 0);
  const totalHrsLm = items.reduce((acc, curr) => acc + curr.hrsLm, 0);
  const totalDifHoras = items.reduce((acc, curr) => acc + curr.dif, 0);

  const volGrowth = totalVolLm > 0 ? ((totalVol - totalVolLm) / totalVolLm) * 100 : 0;

  // Weighted OEE by volume for accurate operational evaluation
  const weightedOeeNumerator = items.reduce((acc, curr) => acc + (curr.oee * curr.vol), 0);
  const weightedOee = totalVol > 0 ? (weightedOeeNumerator / totalVol) : 0;

  // Arithmetic average OEE
  const averageOee = items.reduce((acc, curr) => acc + curr.oee, 0) / items.length;

  // Weighted Quality
  const weightedCalNumerator = items.reduce((acc, curr) => acc + (curr.pCal * curr.vol), 0);
  const weightedCalidad = totalVol > 0 ? (weightedCalNumerator / totalVol) : 1;

  // Productivities
  const avgProductividadReal = totalHoras > 0 ? totalVol / totalHoras : 0;
  const avgProductividadMeta = items.reduce((acc, curr) => acc + curr.prod, 0) / items.length;

  // Financial impact of hours deviation
  const costoDesviacion = totalDifHoras * config.costPerHour;

  // Operational categorizations
  const procesosCriticosCount = items.filter(i => i.dif > 50 || i.oee < 0.65).length;
  const procesosSuperioresCount = items.filter(i => i.oee >= 1.0).length;
  const totalErroresCalidad = items.reduce((acc, curr) => acc + curr.cal, 0);

  return {
    totalVol,
    totalVolLm,
    volGrowth,
    totalHoras,
    totalHrsLm,
    totalDifHoras,
    weightedOee,
    averageOee,
    weightedCalidad,
    avgProductividadReal,
    avgProductividadMeta,
    costoDesviacion,
    procesosCriticosCount,
    procesosSuperioresCount,
    totalErroresCalidad,
  };
}

export function groupDataByProcess(items: WmsSubprocessItem[]) {
  const map = new Map<string, {
    proceso: string;
    vol: number;
    horas: number;
    dif: number;
    cal: number;
    subprocesosCount: number;
    weightedOeeSum: number;
  }>();

  for (const item of items) {
    if (!map.has(item.proceso)) {
      map.set(item.proceso, {
        proceso: item.proceso,
        vol: 0,
        horas: 0,
        dif: 0,
        cal: 0,
        subprocesosCount: 0,
        weightedOeeSum: 0,
      });
    }
    const curr = map.get(item.proceso)!;
    curr.vol += item.vol;
    curr.horas += item.horas;
    curr.dif += item.dif;
    curr.cal += item.cal;
    curr.subprocesosCount += 1;
    curr.weightedOeeSum += item.oee * item.vol;
  }

  return Array.from(map.values()).map(p => ({
    ...p,
    avgOee: p.vol > 0 ? (p.weightedOeeSum / p.vol) * 100 : 0,
    prodReal: p.horas > 0 ? Math.round(p.vol / p.horas) : 0,
  }));
}

export function getParetoHourDeviation(items: WmsSubprocessItem[]) {
  // Sort descending by hour deviation
  const sorted = [...items].sort((a, b) => b.dif - a.dif);
  const positiveDeviations = sorted.filter(s => s.dif > 0);
  const totalPositiveDif = positiveDeviations.reduce((acc, curr) => acc + curr.dif, 0);

  let cumulative = 0;
  return positiveDeviations.map(item => {
    cumulative += item.dif;
    const share = totalPositiveDif > 0 ? (item.dif / totalPositiveDif) * 100 : 0;
    const cumulativeShare = totalPositiveDif > 0 ? (cumulative / totalPositiveDif) * 100 : 0;
    return {
      subproceso: item.subproceso,
      proceso: item.proceso,
      dif: item.dif,
      share: Number(share.toFixed(1)),
      cumulativeShare: Number(cumulativeShare.toFixed(1)),
    };
  });
}

export function formatNumber(val: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(val);
}

export function formatDecimal(val: number, digits = 1): string {
  return new Intl.NumberFormat('es-CO', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(val);
}

export function formatPercent(val: number, digits = 1): string {
  return `${formatDecimal(val * 100, digits)}%`;
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(val);
}
