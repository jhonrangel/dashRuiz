import React, { useState } from 'react';
import { FilterState } from '../types/wms';
import {
  Search,
  Filter,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Activity,
  Boxes,
  CheckCircle2,
  Calendar,
  CalendarDays,
  X
} from 'lucide-react';

interface AdvancedFilterBarProps {
  filterState: FilterState;
  onFilterChange: (newFilters: FilterState) => void;
  availableProcesses: string[];
  countsByProcess: Record<string, number>;
  availableMonths: string[];
  countsByMonth: Record<string, number>;
  totalItems: number;
  filteredCount: number;
  onResetFilters: () => void;
}

export const AdvancedFilterBar: React.FC<AdvancedFilterBarProps> = ({
  filterState,
  onFilterChange,
  availableProcesses,
  countsByProcess,
  availableMonths,
  countsByMonth,
  totalItems,
  filteredCount,
  onResetFilters,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Toggle single month in multi-select
  const handleToggleMonth = (month: string) => {
    let next: string[];
    if (filterState.selectedMonths.includes(month)) {
      next = filterState.selectedMonths.filter(m => m !== month);
    } else {
      next = [...filterState.selectedMonths, month];
    }
    onFilterChange({ ...filterState, selectedMonths: next });
  };

  const handleSelectAllMonths = () => {
    onFilterChange({ ...filterState, selectedMonths: [] });
  };

  const handleSelectSingleMonth = (month: string) => {
    onFilterChange({ ...filterState, selectedMonths: [month] });
  };

  // Toggle single process in multi-select
  const handleToggleProcess = (proc: string) => {
    let next: string[];
    if (filterState.selectedProcesses.includes(proc)) {
      next = filterState.selectedProcesses.filter(p => p !== proc);
    } else {
      next = [...filterState.selectedProcesses, proc];
    }
    onFilterChange({ ...filterState, selectedProcesses: next });
  };

  const handleSelectAllProcesses = () => {
    onFilterChange({ ...filterState, selectedProcesses: [] });
  };

  // Quick preset handlers
  const applyPreset = (preset: string) => {
    switch (preset) {
      case 'bottlenecks':
        onFilterChange({
          ...filterState,
          hoursDeviation: 'OVERRUN',
          oeeBracket: 'ALL',
          effectiveness: 'ALL',
          quality: 'ALL',
          onlyTopBottlenecks: true,
        });
        break;
      case 'critical_oee':
        onFilterChange({
          ...filterState,
          oeeBracket: 'CRITICAL',
          hoursDeviation: 'ALL',
          effectiveness: 'ALL',
          quality: 'ALL',
          onlyTopBottlenecks: false,
        });
        break;
      case 'savings':
        onFilterChange({
          ...filterState,
          hoursDeviation: 'SAVED',
          oeeBracket: 'ALL',
          effectiveness: 'ALL',
          quality: 'ALL',
          onlyTopBottlenecks: false,
        });
        break;
      case 'champions':
        onFilterChange({
          ...filterState,
          oeeBracket: 'EXCELLENT',
          hoursDeviation: 'ALL',
          onlyTopBottlenecks: false,
        });
        break;
      default:
        break;
    }
  };

  // Active filter count
  const activeFiltersCount =
    (filterState.selectedMonths.length > 0 ? 1 : 0) +
    (filterState.selectedProcesses.length > 0 ? 1 : 0) +
    (filterState.searchTerm ? 1 : 0) +
    (filterState.hoursDeviation !== 'ALL' ? 1 : 0) +
    (filterState.oeeBracket !== 'ALL' ? 1 : 0) +
    (filterState.effectiveness !== 'ALL' ? 1 : 0) +
    (filterState.quality !== 'ALL' ? 1 : 0) +
    (filterState.minVolume > 0 ? 1 : 0) +
    (filterState.minHours > 0 ? 1 : 0) +
    (filterState.onlyTopBottlenecks ? 1 : 0);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-5 space-y-4 transition-all">
      
      {/* Row 1: Search and Primary Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search input with clean icon */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por sub-proceso, macroproceso, mes, tarea..."
            value={filterState.searchTerm}
            onChange={(e) => onFilterChange({ ...filterState, searchTerm: e.target.value })}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#004b87] focus:ring-2 focus:ring-[#004b87]/10 transition-all font-medium"
          />
          {filterState.searchTerm && (
            <button
              onClick={() => onFilterChange({ ...filterState, searchTerm: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 mr-1">
            Filtros Rápidos:
          </span>
          <button
            onClick={() => applyPreset('bottlenecks')}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <Clock className="w-3 h-3 text-rose-600" />
            <span>Sobreuso Horas</span>
          </button>
          <button
            onClick={() => applyPreset('critical_oee')}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <AlertTriangle className="w-3 h-3 text-red-600" />
            <span>OEE Crítico &lt;70%</span>
          </button>
          <button
            onClick={() => applyPreset('savings')}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Ahorro Horas</span>
          </button>
          <button
            onClick={() => applyPreset('champions')}
            className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-50 text-[#004b87] hover:bg-blue-100 border border-blue-200 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1"
          >
            <Activity className="w-3 h-3 text-[#004b87]" />
            <span>OEE &ge;100%</span>
          </button>
        </div>

        {/* Advanced Filter Toggle & Reset */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-3 py-2 text-xs font-medium rounded-xl border transition-colors flex items-center gap-1.5 ${
              isExpanded || activeFiltersCount > 0
                ? 'bg-[#004b87] text-white border-[#004b87] shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filtros Avanzados</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white text-[#004b87] text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            {isExpanded ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
          </button>

          {activeFiltersCount > 0 && (
            <button
              onClick={onResetFilters}
              title="Restablecer todos los filtros"
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>

      {/* Row 2: Month Range & Multi-Month Selector Requested by User */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#004b87]" />
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Filtrar por Mes / Rango de Meses:
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            {filterState.selectedMonths.length === 0
              ? 'Todos los meses activos'
              : `${filterState.selectedMonths.length} ${filterState.selectedMonths.length === 1 ? 'mes seleccionado' : 'meses seleccionados'}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={handleSelectAllMonths}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              filterState.selectedMonths.length === 0
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Todos los Meses</span>
            <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
              filterState.selectedMonths.length === 0 ? 'bg-blue-900 text-blue-100' : 'bg-slate-200 text-slate-600'
            }`}>
              {totalItems}
            </span>
          </button>

          {availableMonths.map((month) => {
            const isSelected = filterState.selectedMonths.includes(month);
            const count = countsByMonth[month] || 0;
            return (
              <button
                key={month}
                onClick={() => handleToggleMonth(month)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#004b87] text-white shadow-xs ring-2 ring-[#004b87]/30'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <Calendar className="w-3 h-3 opacity-70" />
                <span>{month}</span>
                <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-blue-900 text-blue-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 3: Process Multi-Pills Selector */}
      <div className="pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
            Macro Procesos ({availableProcesses.length}):
          </span>
          <span className="text-[11px] text-slate-500 font-medium">
            {filterState.selectedProcesses.length === 0
              ? 'Todos seleccionados'
              : `${filterState.selectedProcesses.length} seleccionados`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={handleSelectAllProcesses}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              filterState.selectedProcesses.length === 0
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>Todos los Procesos</span>
            <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
              filterState.selectedProcesses.length === 0 ? 'bg-blue-900 text-blue-100' : 'bg-slate-200 text-slate-600'
            }`}>
              {totalItems}
            </span>
          </button>

          {availableProcesses.map((proc) => {
            const isSelected = filterState.selectedProcesses.includes(proc);
            const count = countsByProcess[proc] || 0;
            return (
              <button
                key={proc}
                onClick={() => handleToggleProcess(proc)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-[#004b87] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                }`}
              >
                <span>{proc}</span>
                <span className={`text-[10px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
                  isSelected ? 'bg-blue-900 text-blue-100' : 'bg-slate-200 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 4: Expanded Advanced Filters Drawer */}
      {isExpanded && (
        <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-150">
          
          {/* Filter 1: Desviación de Horas */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Desviación de Horas (Dif)
            </label>
            <select
              value={filterState.hoursDeviation}
              onChange={(e) => onFilterChange({ ...filterState, hoursDeviation: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#004b87]"
            >
              <option value="ALL">Todas las Horas</option>
              <option value="OVERRUN">🔴 Sobreuso de Horas (Dif &gt; 0)</option>
              <option value="SAVED">🟢 Ahorro de Horas (Dif &lt; 0)</option>
              <option value="NEUTRAL">⚪ Sin Desviación (Dif = 0)</option>
            </select>
          </div>

          {/* Filter 2: OEE Rango */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Efectividad Global OEE
            </label>
            <select
              value={filterState.oeeBracket}
              onChange={(e) => onFilterChange({ ...filterState, oeeBracket: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#004b87]"
            >
              <option value="ALL">Todos los OEE</option>
              <option value="EXCELLENT">🔵 Excelente (&ge; 100%)</option>
              <option value="OPTIMAL">🟢 En Meta (85% - 99%)</option>
              <option value="WARNING">🟡 Advertencia (70% - 84%)</option>
              <option value="CRITICAL">🔴 Crítico (&lt; 70%)</option>
            </select>
          </div>

          {/* Filter 3: Efectividad % */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Cumplimiento % Efectividad
            </label>
            <select
              value={filterState.effectiveness}
              onChange={(e) => onFilterChange({ ...filterState, effectiveness: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#004b87]"
            >
              <option value="ALL">Cualquier Efectividad</option>
              <option value="MET">Cumple Meta (&ge; 100%)</option>
              <option value="UNMET">Bajo Meta (&lt; 100%)</option>
            </select>
          </div>

          {/* Filter 4: Calidad Operativa */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Calidad y Errores
            </label>
            <select
              value={filterState.quality}
              onChange={(e) => onFilterChange({ ...filterState, quality: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#004b87]"
            >
              <option value="ALL">Todos los estados</option>
              <option value="PERFECT">100% Precisión Sin Errores</option>
              <option value="ISSUES">Con Discrepancias / Errores (&gt;0)</option>
            </select>
          </div>

        </div>
      )}

      {/* Results Status Line */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span>Mostrando:</span>
          <strong className="text-[#004b87] font-mono tabular-nums font-bold">
            {filteredCount} de {totalItems} subprocesos
          </strong>
          {activeFiltersCount > 0 && (
            <span className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md font-medium border border-amber-200">
              {activeFiltersCount} filtros activos
            </span>
          )}
        </div>
        
        {filteredCount < totalItems && (
          <button
            onClick={onResetFilters}
            className="text-xs text-[#004b87] hover:underline font-semibold"
          >
            Ver todos los datos
          </button>
        )}
      </div>

    </div>
  );
};
