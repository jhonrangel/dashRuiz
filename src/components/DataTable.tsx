import React, { useState, useMemo } from 'react';
import { WmsSubprocessItem } from '../types/wms';
import { formatNumber, formatPercent } from '../utils/calculations';
import {
  Search,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Eye,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Wand2,
  Info,
  X
} from 'lucide-react';

interface DataTableProps {
  data: WmsSubprocessItem[];
  onSelectRow: (item: WmsSubprocessItem) => void;
  onEditRow: (item: WmsSubprocessItem) => void;
  onDeleteRow: (id: string) => void;
  onAddNew: () => void;
  onExportExcel: () => void;
  onRecalculateEffectiveness?: () => void;
}

type SortField =
  | 'mes'
  | 'proceso'
  | 'subproceso'
  | 'prod'
  | 'vol'
  | 'horas'
  | 'prod2'
  | 'efect'
  | 'prodLm'
  | 'rend'
  | 'hrsLm'
  | 'dif'
  | 'cal'
  | 'pCal'
  | 'oee';

export const DataTable: React.FC<DataTableProps> = ({
  data,
  onSelectRow,
  onEditRow,
  onDeleteRow,
  onAddNew,
  onExportExcel,
  onRecalculateEffectiveness,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('dif');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Detect rows with suspicious 1% effectiveness from Excel formatting/formula bug
  const suspiciousRowsCount = useMemo(() => {
    return data.filter(item => {
      const ratio = item.prod > 0 ? (item.prod2 / item.prod) : 1;
      return item.efect <= 0.05 && ratio >= 0.20;
    }).length;
  }, [data]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        item =>
          item.subproceso.toLowerCase().includes(term) ||
          item.proceso.toLowerCase().includes(term)
      );
    }

    result.sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'string') {
        const comp = (valA as string).localeCompare(valB as string);
        return sortDirection === 'asc' ? comp : -comp;
      }

      const numA = Number(valA);
      const numB = Number(valB);
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });

    return result;
  }, [data, searchTerm, sortField, sortDirection]);

  // Paginated data
  const totalPages = Math.ceil(filteredAndSortedData.length / pageSize) || 1;
  const paginatedData = filteredAndSortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const SortIndicator = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-white/50 inline ml-1 opacity-40 group-hover:opacity-100" />;
    }
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 text-white inline ml-1 font-bold" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 text-white inline ml-1 font-bold" />
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
      
      {/* Table Toolbar Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white">
        
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-base text-[#004b87]">
              Matriz Detallada de Operaciones y Productividad WMS
            </h3>
            <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredAndSortedData.length} subprocesos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Estructura idéntica al Excel operativo con semaforización de OEE, rendimientos y desviaciones
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar tabla..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-[#004b87] w-48 sm:w-60"
            />
          </div>

          {onRecalculateEffectiveness && (
            <button
              onClick={onRecalculateEffectiveness}
              title="Cruza automáticamente Productividad Real / Productividad Meta para toda la matriz, corrigiendo fórmulas dañadas o el 1% de Excel"
              className="px-3 py-2 text-xs font-semibold text-[#004b87] hover:text-[#003865] bg-blue-50 hover:bg-blue-100 border border-blue-200 hover:border-blue-300 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#004b87]" />
              <span className="hidden sm:inline">Recalcular Cruce WMS</span>
              <span className="sm:hidden">Recalcular</span>
            </button>
          )}

          <button
            onClick={() => setShowHelpModal(true)}
            title="¿Por qué la efectividad a veces sale en 1% en Excel?"
            className="p-2 text-slate-500 hover:text-[#004b87] hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onExportExcel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-[#004b87] bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#004b87]" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={onAddNew}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-[#004b87] hover:bg-[#003865] rounded-xl transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Fila</span>
          </button>
        </div>

      </div>

      {/* Warning Banner if suspicious 1% rows are detected from Excel */}
      {suspiciousRowsCount > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-3 text-xs text-amber-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Atención:</strong> Se detectaron <strong>{suspiciousRowsCount} subprocesos</strong> donde el Excel traía Efectividad en <strong>1%</strong> debido a un fallo en el formato o cruce de fórmulas.
            </span>
          </div>
          {onRecalculateEffectiveness && (
            <button
              onClick={onRecalculateEffectiveness}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors shrink-0 flex items-center gap-1 shadow-xs"
            >
              <Wand2 className="w-3 h-3" />
              <span>Corregir al 100% WMS Ahora</span>
            </button>
          )}
        </div>
      )}

      {/* Excel Table Styled Container */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse text-xs">
          
          {/* Exact Excel Royal Blue Header */}
          <thead>
            <tr className="bg-[#004b87] text-white uppercase text-[11px] tracking-wider border-b border-[#003366] select-none sticky top-0 z-10 shadow-sm">
              <th
                onClick={() => handleSort('mes')}
                className="p-3 font-bold cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Mes <SortIndicator field="mes" />
              </th>
              <th
                onClick={() => handleSort('proceso')}
                className="p-3 font-bold cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Proceso <SortIndicator field="proceso" />
              </th>
              <th
                onClick={() => handleSort('subproceso')}
                className="p-3 font-bold cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Sub-Proceso <SortIndicator field="subproceso" />
              </th>
              <th
                onClick={() => handleSort('prod')}
                className="p-3 font-bold text-right cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Productividad <SortIndicator field="prod" />
              </th>
              <th
                onClick={() => handleSort('vol')}
                className="p-3 font-bold text-right cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Volumen SCMS <SortIndicator field="vol" />
              </th>
              <th
                onClick={() => handleSort('horas')}
                className="p-3 font-bold text-right cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Horas Ejecutadas <SortIndicator field="horas" />
              </th>
              <th
                onClick={() => handleSort('prod2')}
                className="p-3 font-bold text-right cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Productividad2 <SortIndicator field="prod2" />
              </th>
              <th
                onClick={() => handleSort('efect')}
                className="p-3 font-bold text-right cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                % Efectividad <SortIndicator field="efect" />
              </th>
              <th
                onClick={() => handleSort('prodLm')}
                className="p-3 font-bold text-right cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Produc Total LM <SortIndicator field="prodLm" />
              </th>
              <th
                onClick={() => handleSort('rend')}
                className="p-3 font-bold text-right cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Rendimiento <SortIndicator field="rend" />
              </th>
              <th
                onClick={() => handleSort('hrsLm')}
                className="p-3 font-bold text-right cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Hrs LM <SortIndicator field="hrsLm" />
              </th>
              <th
                onClick={() => handleSort('dif')}
                className="p-3 font-bold text-right cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Dif Horas <SortIndicator field="dif" />
              </th>
              <th
                onClick={() => handleSort('cal')}
                className="p-3 font-bold text-right cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                Calidad <SortIndicator field="cal" />
              </th>
              <th
                onClick={() => handleSort('pCal')}
                className="p-3 font-bold text-right cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                % Calidad <SortIndicator field="pCal" />
              </th>
              <th
                onClick={() => handleSort('oee')}
                className="p-3 font-bold text-center cursor-pointer hover:bg-[#003865] transition-colors whitespace-nowrap group"
              >
                OEE <SortIndicator field="oee" />
              </th>
              <th className="p-3 text-center font-bold whitespace-nowrap w-24">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 text-slate-700 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={15} className="p-10 text-center text-slate-400">
                  No se encontraron subprocesos con los filtros actuales.
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const isOverrun = item.dif > 0;
                const isEfectLow = item.efect < 0.9;
                const isRendLow = item.rend < 0.85;

                // OEE conditional color formatting matching user image
                let oeeStyle = 'bg-[#f59e0b] text-slate-900 font-bold'; // default 70-99%
                if (item.oee >= 1.0) {
                  oeeStyle = 'bg-[#004b87] text-white font-bold'; // >= 100% Royal Blue
                } else if (item.oee < 0.70) {
                  oeeStyle = 'bg-[#dc2626] text-white font-bold'; // < 70% Bright Red
                }

                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50/60 transition-colors cursor-pointer ${
                      index % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'
                    }`}
                    onClick={() => onSelectRow(item)}
                  >
                    {/* Mes */}
                    <td className="p-3 font-semibold whitespace-nowrap border-r border-slate-100">
                      <span className="bg-blue-50 text-[#004b87] px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border border-blue-200">
                        {item.mes || 'Octubre 2026'}
                      </span>
                    </td>

                    {/* Proceso */}
                    <td className="p-3 font-bold text-slate-900 whitespace-nowrap border-r border-slate-100">
                      {item.proceso}
                    </td>

                    {/* Sub-Proceso */}
                    <td className="p-3 font-medium text-slate-800 whitespace-nowrap border-r border-slate-100">
                      {item.subproceso}
                    </td>

                    {/* Productividad (Meta) */}
                    <td className="p-3 text-right font-mono tabular-nums text-slate-600 border-r border-slate-100">
                      {item.prod}
                    </td>

                    {/* Volumen SCMS */}
                    <td className="p-3 text-right font-mono tabular-nums text-slate-900 font-semibold border-r border-slate-100">
                      {formatNumber(item.vol)}
                    </td>

                    {/* Horas Ejecutadas */}
                    <td className="p-3 text-right font-mono tabular-nums text-slate-800 border-r border-slate-100">
                      {formatNumber(item.horas)}
                    </td>

                    {/* Productividad2 (Real) */}
                    <td className="p-3 text-right font-mono tabular-nums font-semibold text-[#004b87] border-r border-slate-100">
                      {formatNumber(item.prod2)}
                    </td>

                    {/* % Efectividad */}
                    <td className={`p-3 text-right font-mono tabular-nums font-medium border-r border-slate-100 ${
                      isEfectLow ? 'text-red-600 font-bold' : 'text-slate-800'
                    }`}>
                      {formatPercent(item.efect, 0)}
                    </td>

                    {/* Produc Total LM */}
                    <td className="p-3 text-right font-mono tabular-nums text-slate-600 border-r border-slate-100">
                      {formatNumber(item.prodLm)}
                    </td>

                    {/* Rendimiento */}
                    <td className={`p-3 text-right font-mono tabular-nums font-medium border-r border-slate-100 ${
                      isRendLow ? 'text-red-600 font-bold' : 'text-slate-800'
                    }`}>
                      {formatPercent(item.rend, 0)}
                    </td>

                    {/* Hrs LM */}
                    <td className="p-3 text-right font-mono tabular-nums text-slate-600 border-r border-slate-100">
                      {formatNumber(item.hrsLm)}
                    </td>

                    {/* Dif Horas */}
                    <td className="p-3 text-right font-mono tabular-nums border-r border-slate-100">
                      <span className={`font-bold ${isOverrun ? 'text-red-600' : 'text-emerald-600'}`}>
                        {item.dif > 0 ? `${item.dif}` : item.dif}
                      </span>
                    </td>

                    {/* Calidad (Errores) */}
                    <td className="p-3 text-right font-mono tabular-nums border-r border-slate-100">
                      <span className={item.cal > 0 ? 'text-red-600 font-semibold' : 'text-slate-500'}>
                        {item.cal}
                      </span>
                    </td>

                    {/* % Calidad */}
                    <td className="p-3 text-right font-mono tabular-nums border-r border-slate-100">
                      {item.pCal === 0 ? (
                        <span className="text-red-600 font-bold">FALSO</span>
                      ) : (
                        <span className="text-slate-800">{formatPercent(item.pCal, 1)}</span>
                      )}
                    </td>

                    {/* OEE Conditional Badge */}
                    <td className="p-2 text-center border-r border-slate-100">
                      <span className={`inline-block w-full py-1 px-2 rounded font-mono tabular-nums text-xs shadow-2xs ${oeeStyle}`}>
                        {formatPercent(item.oee, 0)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-2.5 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onSelectRow(item)}
                          title="Ver detalle"
                          className="p-1 text-slate-400 hover:text-[#004b87] hover:bg-blue-50 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditRow(item)}
                          title="Editar fila"
                          className="p-1 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteRow(item.id)}
                          title="Eliminar fila"
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer with Summary & Pagination */}
      <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-3">
        <div className="flex items-center gap-4">
          <span>Mostrando <strong>{paginatedData.length}</strong> de <strong>{filteredAndSortedData.length}</strong> registros</span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-2">
            <span>Filas por página:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-0.5 text-xs text-slate-700"
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs disabled:opacity-40 hover:bg-slate-100"
            >
              Anterior
            </button>
            <span className="px-2 font-mono">{currentPage} / {totalPages}</span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded text-xs disabled:opacity-40 hover:bg-slate-100"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* Educational Guide Modal: Why Excel shows 1% and how to fix it */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#004b87] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  %
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#004b87]">
                    ¿Por qué en Excel a veces la Efectividad sale en 1%?
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Causas habituales de cruce en plantillas de WMS y solución en la plataforma
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700 leading-relaxed overflow-y-auto max-h-[70vh]">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-1">
                <p className="font-bold text-amber-900 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  ¿Por qué ocurre este error en Excel?
                </p>
                <p className="text-amber-800 text-[11px]">
                  En logística WMS, la efectividad es <strong className="font-mono">Productividad Real / Productividad Meta</strong>. Si tu meta es 145 y ejecutaste 144,9, tu efectividad real es <strong>~100%</strong>. Sin embargo, en Excel suele verse "1%" por 3 motivos típicos:
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#004b87] font-bold text-[11px] flex items-center justify-center shrink-0">1</span>
                  <div>
                    <h4 className="font-bold text-slate-900">El engaño de formato de Excel (1 vs 100%)</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Si una celda ya tiene formato de porcentaje (%) y alguien teclea el número <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">1</code> pensando en "100%", Excel internamente guarda <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">0.01</code> y muestra <strong>1%</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#004b87] font-bold text-[11px] flex items-center justify-center shrink-0">2</span>
                  <div>
                    <h4 className="font-bold text-slate-900">Fórmula de cruce fallida o rota</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Al cruzar hojas con BUSCARV / XLOOKUP o hacer <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">=F2/C2</code>, si una celda tenía texto, coma decimal en formato texto, o error <code className="bg-slate-200 px-1 py-0.5 rounded text-[10px]">#DIV/0!</code>, a veces le colocan un 1 de relleno que queda formateado como 1%.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#004b87] font-bold text-[11px] flex items-center justify-center shrink-0">3</span>
                  <div>
                    <h4 className="font-bold text-slate-900">División duplicada entre 100</h4>
                    <p className="text-slate-600 text-[11px] mt-0.5">
                      Si la fórmula en Excel dividió explícitamente entre 100 y luego se le aplicó el botón de porcentaje (%), se divide por 100 dos veces, dejando el resultado en 0.01 (1%).
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 space-y-2">
                <p className="font-bold text-[#004b87] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#004b87] shrink-0" />
                  ¿Cómo lo soluciona nuestra plataforma automáticamente?
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px]">
                  <li><strong>Autocorrección al Cargar:</strong> Detecta si el archivo trae "1%" pero el cruce real da &gt; 20%, y lo repara automáticamente.</li>
                  <li><strong>Botón Recalcular Cruce WMS:</strong> Aplica la fórmula oficial <code className="bg-white px-1 rounded border border-blue-200 text-[#004b87]">Productividad Real / Meta</code> a todas las filas con 1 solo clic y recalcula el OEE.</li>
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-500 font-medium">
                Fórmula WMS: Efectividad = Prod2 / Prod
              </span>
              <div className="flex items-center gap-2">
                {onRecalculateEffectiveness && (
                  <button
                    onClick={() => {
                      onRecalculateEffectiveness();
                      setShowHelpModal(false);
                    }}
                    className="px-4 py-2 bg-[#004b87] hover:bg-[#003865] text-white font-semibold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Recalcular Todas Ahora</span>
                  </button>
                )}
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
