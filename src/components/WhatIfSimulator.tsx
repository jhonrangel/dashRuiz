import React, { useState } from 'react';
import { WmsSubprocessItem, SimulatorConfig } from '../types/wms';
import { formatNumber, formatCurrency, formatPercent } from '../utils/calculations';
import { Calculator, DollarSign, Sliders, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface WhatIfSimulatorProps {
  items: WmsSubprocessItem[];
  config: SimulatorConfig;
  onUpdateConfig: (config: SimulatorConfig) => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({
  items,
  config,
  onUpdateConfig,
}) => {
  const [targetOeePercent, setTargetOeePercent] = useState<number>(Math.round(config.targetOee * 100));
  const [costPerHour, setCostPerHour] = useState<number>(config.costPerHour);
  const [volumeMultiplier, setVolumeMultiplier] = useState<number>(100);
  const [neutralizeTopBottlenecks, setNeutralizeTopBottlenecks] = useState<boolean>(true);

  const totalVol = items.reduce((acc, curr) => acc + curr.vol, 0);
  const totalHoras = items.reduce((acc, curr) => acc + curr.horas, 0);
  const totalDifHoras = items.reduce((acc, curr) => acc + curr.dif, 0);

  // Top positive overruns
  const topOverruns = [...items].filter(i => i.dif > 0).sort((a, b) => b.dif - a.dif).slice(0, 5);
  const top5OverrunHours = topOverruns.reduce((acc, curr) => acc + curr.dif, 0);

  // Hours saved if bottlenecks are neutralized
  const hoursSavedFromBottlenecks = neutralizeTopBottlenecks ? top5OverrunHours : 0;
  
  // Current net financial cost of extra hours
  const currentOverrunCost = totalDifHoras * costPerHour;
  
  // If we reach target OEE efficiency improvement
  const currentWeightedOee = totalVol > 0 ? items.reduce((acc, curr) => acc + (curr.oee * curr.vol), 0) / totalVol : 0.85;
  const targetOeeRatio = targetOeePercent / 100;
  const oeeEfficiencyDelta = targetOeeRatio - currentWeightedOee;
  
  const estimatedHoursDeltaOee = oeeEfficiencyDelta > 0 
    ? Math.round(totalHoras * (oeeEfficiencyDelta / (currentWeightedOee || 1)) * 0.45)
    : 0;

  const totalProjectedSavingsHours = hoursSavedFromBottlenecks + (estimatedHoursDeltaOee > 0 ? estimatedHoursDeltaOee : 0);
  const totalProjectedSavingsDollars = totalProjectedSavingsHours * costPerHour;

  return (
    <div className="card-3d p-6 space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h3 className="font-bold text-base text-[#004b87] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#004b87]" />
            Simulador de Metas y Escenarios Operativos WMS
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Estima ahorros financieros y optimización de horas modificando variables clave
          </p>
        </div>
        <div className="text-xs text-slate-600 flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-xl border border-red-200">
          <span>Horas actuales en sobreuso:</span>
          <span className="font-mono text-red-600 font-extrabold text-sm">+{formatNumber(totalDifHoras)} hrs</span>
        </div>
      </div>

      {/* Simulator Controls Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Slider 1: Tarifa Horaria Operador */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-700 font-bold">Costo por Hora Hombre ($)</span>
            <span className="font-mono text-[#004b87] font-extrabold text-sm">${costPerHour}/h</span>
          </div>
          <input
            type="range"
            min="10"
            max="45"
            step="0.5"
            value={costPerHour}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setCostPerHour(v);
              onUpdateConfig({ ...config, costPerHour: v });
            }}
            className="w-full accent-[#004b87] cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>$10/h</span>
            <span>Base: $18.5/h</span>
            <span>$45/h</span>
          </div>
        </div>

        {/* Slider 2: Meta OEE Objetivo */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-700 font-bold">Meta OEE Objetivo</span>
            <span className="font-mono text-emerald-600 font-extrabold text-sm">{targetOeePercent}%</span>
          </div>
          <input
            type="range"
            min="65"
            max="120"
            step="1"
            value={targetOeePercent}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              setTargetOeePercent(v);
              onUpdateConfig({ ...config, targetOee: v / 100 });
            }}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>65% (Crítico)</span>
            <span>85% (Base)</span>
            <span>120% (Alto Rendimiento)</span>
          </div>
        </div>

        {/* Slider 3: Carga de Volumen Simulado */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-700 font-bold">Proyección de Volumen WMS</span>
            <span className="font-mono text-indigo-600 font-extrabold text-sm">{volumeMultiplier}%</span>
          </div>
          <input
            type="range"
            min="70"
            max="160"
            step="5"
            value={volumeMultiplier}
            onChange={(e) => setVolumeMultiplier(parseInt(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>-30% Valle</span>
            <span>100% Actual</span>
            <span>+60% Temporada Alta</span>
          </div>
        </div>

      </div>

      {/* Toggles & Levers */}
      <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <label className="flex items-center gap-3 cursor-pointer text-xs text-slate-700 font-medium">
          <input
            type="checkbox"
            checked={neutralizeTopBottlenecks}
            onChange={(e) => setNeutralizeTopBottlenecks(e.target.checked)}
            className="w-4 h-4 rounded text-[#004b87] focus:ring-0 bg-white border-slate-300"
          />
          <span>
            Simular eliminación de sobrecostos en los <strong className="text-[#004b87]">Top 5 Cuellos de Botella</strong> (Ubicación RP, FTW picking, Miss units, B2C single, Forklift RPL)
          </span>
        </label>
        
        <span className="text-xs font-mono text-slate-600 shrink-0">
          Ahorro potencial: <strong className="text-emerald-600 font-bold">+{formatNumber(top5OverrunHours)} hrs</strong>
        </span>
      </div>

      {/* Simulation Outcomes Output */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Sobrecosto Actual por Desviación</span>
          <div className="text-2xl font-bold font-mono text-red-600 mt-1 tabular-nums">
            {formatCurrency(currentOverrunCost)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{formatNumber(totalDifHoras)} hrs extra a ${costPerHour}/h</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Ahorro Horas Proyectado</span>
          <div className="text-2xl font-bold font-mono text-[#004b87] mt-1 tabular-nums">
            {formatNumber(totalProjectedSavingsHours)} hrs
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Por balanceo de carga y control OEE</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-xs text-slate-500 font-medium">Beneficio Económico Proyectado</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 mt-1 tabular-nums">
            {formatCurrency(totalProjectedSavingsDollars)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Reducción directa de nómina extraordinaria</p>
        </div>

      </div>

    </div>
  );
};
