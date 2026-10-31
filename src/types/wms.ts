export interface WmsSubprocessItem {
  id: string;
  mes: string;           // Campo Mes (ej: "Octubre", "Septiembre", "Agosto", o "2026-10")
  proceso: string;
  subproceso: string;
  prod: number;          // Productividad (Meta estándar u/h)
  vol: number;           // Volumen SCMS
  horas: number;         // Horas Ejecutadas
  prod2: number;         // Productividad2 (Real calculada)
  efect: number;         // % Efectividad (ej 1.0 = 100%)
  prodLm: number;        // Produc Total LM
  rend: number;          // Rendimiento (ej 0.67 = 67%)
  hrsLm: number;         // Hrs LM
  dif: number;           // Dif Horas
  cal: number;           // Calidad (Unidades de error)
  pCal: number;          // % Calidad (ej 1.0 = 100%, 0 = FALSO)
  oee: number;           // OEE (ej 0.67 = 67%)
  notas?: string;
}

export interface WmsSummaryKPIs {
  totalVol: number;
  totalVolLm: number;
  volGrowth: number;
  totalHoras: number;
  totalHrsLm: number;
  totalDifHoras: number;
  weightedOee: number;
  averageOee: number;
  weightedCalidad: number;
  avgProductividadReal: number;
  avgProductividadMeta: number;
  costoDesviacion: number;
  procesosCriticosCount: number;
  procesosSuperioresCount: number;
  totalErroresCalidad: number;
}

export type ViewTab = 'dashboard' | 'charts' | 'simulator' | 'digital_twin' | 'table';

export interface FilterState {
  selectedMonths: string[];
  selectedProcesses: string[];
  searchTerm: string;
  hoursDeviation: 'ALL' | 'OVERRUN' | 'SAVED' | 'NEUTRAL';
  oeeBracket: 'ALL' | 'EXCELLENT' | 'OPTIMAL' | 'WARNING' | 'CRITICAL';
  effectiveness: 'ALL' | 'MET' | 'UNMET';
  quality: 'ALL' | 'PERFECT' | 'ISSUES';
  minVolume: number;
  maxVolume: number;
  minHours: number;
  maxHours: number;
  onlyTopBottlenecks: boolean;
}

export interface SimulatorConfig {
  costPerHour: number;
  targetOee: number;
  targetVolumeMultiplier: number;
}
