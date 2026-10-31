import React from 'react';
import { WmsSubprocessItem } from '../types/wms';
import { formatNumber, formatPercent, formatCurrency } from '../utils/calculations';
import { X, Clock, Boxes, Activity, ShieldAlert, Award, Edit2, TrendingUp, AlertCircle } from 'lucide-react';

interface ProcessDetailModalProps {
  item: WmsSubprocessItem | null;
  onClose: () => void;
  onEdit: (item: WmsSubprocessItem) => void;
  costPerHour: number;
}

export const ProcessDetailModal: React.FC<ProcessDetailModalProps> = ({
  item,
  onClose,
  onEdit,
  costPerHour,
}) => {
  if (!item) return null;

  const isOverrun = item.dif > 0;
  const financialImpact = item.dif * costPerHour;
  const oeeCategory =
    item.oee >= 1.0 ? 'Excelente (Supera Meta)' : item.oee >= 0.85 ? 'Óptimo' : item.oee >= 0.70 ? 'Advertencia' : 'Crítico';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Modal Header with Corporate Blue brand */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-blue-50/50 to-white">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="bg-blue-100 text-[#004b87] px-2 py-0.5 rounded font-mono font-bold text-[11px]">
                {item.mes || 'Octubre 2026'}
              </span>
              <span aria-hidden="true">·</span>
              <span>Macro Proceso</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#004b87] font-bold uppercase tracking-wider">{item.proceso}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{item.subproceso}</h2>
            {item.notas && (
              <p className="text-xs text-slate-500 mt-1 max-w-lg">{item.notas}</p>
            )}
          </div>
          
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Status Strip */}
          <div className="flex flex-wrap items-center gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Estado OEE:</span>
              <span className={`font-bold font-mono px-2 py-0.5 rounded ${
                item.oee >= 1.0
                  ? 'bg-blue-100 text-[#004b87]'
                  : item.oee >= 0.85
                  ? 'bg-emerald-100 text-emerald-800'
                  : item.oee >= 0.70
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {oeeCategory} ({formatPercent(item.oee, 0)})
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Balance de Horas:</span>
              <span className={`font-mono font-bold ${isOverrun ? 'text-red-600' : 'text-emerald-600'}`}>
                {item.dif > 0 ? `+${item.dif} hrs exceso` : `${Math.abs(item.dif)} hrs ahorradas`}
              </span>
            </div>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Impacto Costo:</span>
              <span className="font-mono text-slate-900 font-bold">
                {formatCurrency(financialImpact)}
              </span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Volumen SCMS</span>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatNumber(item.vol)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                LM: {formatNumber(item.prodLm)}
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Horas Reales Ejec.</span>
              <div className="text-lg font-bold text-slate-900 font-mono tabular-nums mt-1">
                {formatNumber(item.horas)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Plan: {formatNumber(item.hrsLm)} hrs
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Productividad Real</span>
              <div className="text-lg font-bold text-[#004b87] font-mono tabular-nums mt-1">
                {item.prod2} <span className="text-xs text-slate-400 font-normal">u/h</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Meta: {item.prod} u/h
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] text-slate-500 font-medium">Calidad & Defectos</span>
              <div className="text-lg font-bold text-amber-600 font-mono tabular-nums mt-1">
                {item.pCal === 0 ? 'FALSO' : formatPercent(item.pCal, 1)}
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {item.cal} incidencias
              </div>
            </div>

          </div>

          {/* Diagnostic & Operational Recommendations */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2.5">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              {isOverrun ? (
                <AlertCircle className="w-4 h-4 text-red-600" />
              ) : (
                <Award className="w-4 h-4 text-emerald-600" />
              )}
              <span>Diagnóstico de Ingeniería WMS</span>
            </h4>

            {isOverrun ? (
              <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <p>
                  El subproceso presenta un sobreuso de <strong className="text-red-600 font-bold">+{item.dif} horas</strong> hombre.
                  La productividad alcanzada ({item.prod2} u/h) frente a la meta ({item.prod} u/h) arrojó una efectividad del {(item.efect * 100).toFixed(0)}%.
                </p>
                <p className="text-slate-500">
                  <strong>Acción Correctiva:</strong> Evaluar tiempos de espera por radiofrecuencia (RF), congestión de pasillos y balanceo en turnos con mayor afluencia de pedidos.
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
                <p>
                  El subproceso operó eficientemente por debajo de las horas presupuestadas con un ahorro neto de <strong className="text-emerald-600 font-bold">{Math.abs(item.dif)} horas</strong> y un OEE del {(item.oee * 100).toFixed(0)}%.
                </p>
                <p className="text-slate-500">
                  <strong>Buenas Prácticas:</strong> Procedimiento óptimo aplicable como estándar en los demás turnos.
                </p>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => {
              onClose();
              onEdit(item);
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Editar Valores</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-white bg-[#004b87] hover:bg-[#003865] rounded-xl transition-colors"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
  );
};
