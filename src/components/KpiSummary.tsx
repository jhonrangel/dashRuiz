import React from 'react';
import { WmsSummaryKPIs } from '../types/wms';
import { formatNumber, formatPercent, formatCurrency } from '../utils/calculations';
import { Boxes, Clock, Activity, ShieldCheck, TrendingUp, AlertTriangle } from 'lucide-react';

interface KpiSummaryProps {
  kpis: WmsSummaryKPIs;
  activeFilterTitle: string;
}

export const KpiSummary: React.FC<KpiSummaryProps> = ({ kpis, activeFilterTitle }) => {
  const isDeviationNegative = kpis.totalDifHoras <= 0;

  return (
    <div className="space-y-3">
      {/* Scope sub-header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 px-1 gap-1">
        <div className="flex items-center gap-2">
          <span>Vista analítica:</span>
          <span className="text-[#004b87] font-bold">
            {activeFilterTitle}
          </span>
        </div>
        <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
          <span>Meta Base OEE: 85%</span>
          <span aria-hidden="true">·</span>
          <span>Costo Base: $18.5/h</span>
        </div>
      </div>

      {/* KPI Cards Grid with 3D elevation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Volumen SCMS */}
        <div className="card-3d p-5 flex flex-col justify-between border-t-2 border-t-[#004b87]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Volumen SCMS Total
              </span>
              <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                {formatNumber(kpis.totalVol)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#004b87] border border-blue-200">
              <Boxes className="w-5 h-5" />
            </div>
          </div>
          
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-800 font-mono tabular-nums font-bold">
                {formatNumber(kpis.totalVolLm)}
              </span>
              <span>Produc LM</span>
            </div>
            <span className={`font-mono tabular-nums font-bold ${kpis.volGrowth >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {kpis.volGrowth >= 0 ? '+' : ''}{kpis.volGrowth.toFixed(1)}% vs LM
            </span>
          </div>
        </div>

        {/* Card 2: Horas Ejecutadas */}
        <div className="card-3d p-5 flex flex-col justify-between border-t-2 border-t-[#0284c7]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Horas Ejecutadas
              </span>
              <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                {formatNumber(kpis.totalHoras)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-sky-50 text-[#0284c7] border border-sky-200">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className={`font-mono tabular-nums font-extrabold ${isDeviationNegative ? 'text-emerald-600' : 'text-red-600'}`}>
                {kpis.totalDifHoras > 0 ? `+${formatNumber(kpis.totalDifHoras)}` : formatNumber(kpis.totalDifHoras)} hrs
              </span>
              <span>dif neta</span>
            </div>
            <span className="text-slate-600 font-mono tabular-nums text-[11px]">
              {formatNumber(kpis.totalHrsLm)} hrs plan
            </span>
          </div>
        </div>

        {/* Card 3: OEE Promedio */}
        <div className="card-3d p-5 flex flex-col justify-between border-t-2 border-t-[#004b87]">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                OEE Ponderado WMS
              </span>
              <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                {formatPercent(kpis.weightedOee)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#004b87] border border-blue-200">
              <Activity className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>Promedio simple:</span>
              <span className="text-slate-800 font-mono tabular-nums font-bold">
                {formatPercent(kpis.averageOee)}
              </span>
            </div>
            <span className={`font-bold ${kpis.weightedOee >= 0.85 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {kpis.weightedOee >= 0.85 ? 'Meta Lograda' : 'Bajo Meta 85%'}
            </span>
          </div>
        </div>

        {/* Card 4: Calidad Operativa */}
        <div className="card-3d p-5 flex flex-col justify-between border-t-2 border-t-amber-500">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                % Calidad Promedio
              </span>
              <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
                {formatPercent(kpis.weightedCalidad, 1)}
              </div>
            </div>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5">
              <span>Discrepancias:</span>
              <span className="text-slate-900 font-mono tabular-nums font-bold">
                {formatNumber(kpis.totalErroresCalidad)} uds
              </span>
            </div>
            <span className="text-emerald-600 font-semibold font-mono text-[11px]">
              Impacto: {formatCurrency(kpis.costoDesviacion)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
