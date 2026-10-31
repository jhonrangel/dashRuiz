import React from 'react';
import { WmsSubprocessItem } from '../types/wms';
import { AlertCircle, CheckCircle2, TrendingDown, Award, ArrowRight } from 'lucide-react';

interface BottleneckAlertsProps {
  items: WmsSubprocessItem[];
  onSelectSubprocess: (item: WmsSubprocessItem) => void;
}

export const BottleneckAlerts: React.FC<BottleneckAlertsProps> = ({
  items,
  onSelectSubprocess,
}) => {
  // Filter top critical overruns
  const topOverruns = [...items]
    .filter(i => i.dif > 50)
    .sort((a, b) => b.dif - a.dif)
    .slice(0, 3);

  // Filter lowest OEE with significant hours
  const lowestOee = [...items]
    .filter(i => i.horas > 5 && i.oee < 0.70)
    .sort((a, b) => a.oee - b.oee)
    .slice(0, 3);

  // Filter top performers
  const topPerformers = [...items]
    .filter(i => i.oee >= 1.4 && i.vol > 1000)
    .sort((a, b) => b.oee - a.oee)
    .slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      
      {/* Alert Block 1: Desviaciones Críticas de Horas */}
      <div className="card-3d p-4 sm:p-5 flex flex-col justify-between border-l-4 border-l-red-500">
        <div>
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-2 text-red-600 text-xs font-bold uppercase tracking-wider">
              <AlertCircle className="w-4 h-4" />
              <span>Mayor Desviación de Horas (Urgente)</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
              Diagnóstico Maestro
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Subprocesos con exceso severo de horas hombre respecto a meta.
          </p>

          <div className="space-y-2">
            {topOverruns.map(item => (
              <button
                key={item.id}
                onClick={() => onSelectSubprocess(item)}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-red-50/60 border border-slate-200/80 hover:border-red-200 transition-all flex items-center justify-between group"
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-bold text-slate-800 truncate">{item.subproceso}</div>
                  <div className="text-[11px] text-slate-500">{item.proceso} · {item.horas}h ejecutadas</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-extrabold text-red-600">+{item.dif}h</div>
                  <div className="text-[10px] text-slate-400 group-hover:text-[#004b87] font-medium flex items-center gap-0.5 justify-end">
                    <span>Ver</span> <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Block 2: OEE Crítico */}
      <div className="card-3d p-4 sm:p-5 flex flex-col justify-between border-l-4 border-l-amber-500">
        <div>
          <div className="flex items-center gap-2 text-amber-700 text-xs font-bold uppercase tracking-wider mb-1.5">
            <TrendingDown className="w-4 h-4" />
            <span>OEE Crítico &lt;70% (Cuellos de Botella)</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Efectividad deficiente con carga horaria operativa representativa.
          </p>

          <div className="space-y-2">
            {lowestOee.map(item => (
              <button
                key={item.id}
                onClick={() => onSelectSubprocess(item)}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200/80 hover:border-amber-200 transition-all flex items-center justify-between group"
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-bold text-slate-800 truncate">{item.subproceso}</div>
                  <div className="text-[11px] text-slate-500">{item.proceso} · Prod: {Math.round(item.prod2)} u/h</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-extrabold text-amber-700">{(item.oee * 100).toFixed(0)}% OEE</div>
                  <div className="text-[10px] text-slate-400 group-hover:text-[#004b87] font-medium flex items-center gap-0.5 justify-end">
                    <span>Ver</span> <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alert Block 3: Benchmark & Mejores Prácticas */}
      <div className="card-3d p-4 sm:p-5 flex flex-col justify-between border-l-4 border-l-[#004b87]">
        <div>
          <div className="flex items-center gap-2 text-[#004b87] text-xs font-bold uppercase tracking-wider mb-1.5">
            <Award className="w-4 h-4" />
            <span>Mejor Desempeño (Benchmark WMS)</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Estaciones con alta efectividad operativa (&gt;140% OEE).
          </p>

          <div className="space-y-2">
            {topPerformers.map(item => (
              <button
                key={item.id}
                onClick={() => onSelectSubprocess(item)}
                className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 hover:border-blue-200 transition-all flex items-center justify-between group"
              >
                <div className="truncate pr-2">
                  <div className="text-xs font-bold text-slate-800 truncate">{item.subproceso}</div>
                  <div className="text-[11px] text-slate-500">{item.proceso} · Ahorro: {Math.abs(item.dif)}h</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-extrabold text-[#004b87]">{(item.oee * 100).toFixed(0)}% OEE</div>
                  <div className="text-[10px] text-slate-400 group-hover:text-[#004b87] font-medium flex items-center gap-0.5 justify-end">
                    <span>Ver</span> <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
