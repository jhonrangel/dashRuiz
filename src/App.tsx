import React, { useState, useEffect, useMemo } from 'react';
import { WmsSubprocessItem, ViewTab, SimulatorConfig, FilterState } from './types/wms';
import { INITIAL_WMS_DATA } from './data/initialData';
import { calculateSummaryKPIs } from './utils/calculations';
import { Header } from './components/Header';
import { KpiSummary } from './components/KpiSummary';
import { AdvancedFilterBar } from './components/AdvancedFilterBar';
import { ExecutiveCharts } from './components/ExecutiveCharts';
import { BottleneckAlerts } from './components/BottleneckAlerts';
import { WhatIfSimulator } from './components/WhatIfSimulator';
import { DataTable } from './components/DataTable';
import { ProcessDetailModal } from './components/ProcessDetailModal';
import { EditRowModal } from './components/EditRowModal';
import { DataManagementModal } from './components/DataManagementModal';
import { parseExcelOrCsv, exportWmsToExcel } from './utils/excel';
import { CheckCircle2, FileSpreadsheet, X, Sparkles, Layers, Box, TrendingUp } from 'lucide-react';

const STORAGE_KEY = 'wms_operations_data_v2';
const CONFIG_KEY = 'wms_operations_config_v2';

export default function App() {
  // 1. Data state
  const [items, setItems] = useState<WmsSubprocessItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Error loading saved WMS data", e);
    }
    return INITIAL_WMS_DATA;
  });

  // 2. Simulator config
  const [config, setConfig] = useState<SimulatorConfig>(() => {
    try {
      const saved = localStorage.getItem(CONFIG_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Error loading config", e);
    }
    return {
      costPerHour: 18.5,
      targetOee: 0.85,
      targetVolumeMultiplier: 1.0,
    };
  });

  // 3. Filter state (Multiple comprehensive filters)
  const [filterState, setFilterState] = useState<FilterState>({
    selectedMonths: [],
    selectedProcesses: [],
    searchTerm: '',
    hoursDeviation: 'ALL',
    oeeBracket: 'ALL',
    effectiveness: 'ALL',
    quality: 'ALL',
    minVolume: 0,
    maxVolume: 0,
    minHours: 0,
    maxHours: 0,
    onlyTopBottlenecks: false,
  });

  // 4. Navigation View Tab
  const [currentView, setCurrentView] = useState<ViewTab>('dashboard');

  // 5. Toast / Notification message
  const [notification, setNotification] = useState<{ type: 'success' | 'info'; title: string; subtitle: string } | null>(null);

  // 6. Modals
  const [inspectItem, setInspectItem] = useState<WmsSubprocessItem | null>(null);
  const [editItem, setEditItem] = useState<WmsSubprocessItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  // Persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Error saving data", e);
    }
  }, [items]);

  useEffect(() => {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    } catch (e) {
      console.error("Error saving config", e);
    }
  }, [config]);

  // Distinct process list
  const availableProcesses = useMemo(() => {
    return Array.from(new Set(items.map(i => i.proceso)));
  }, [items]);

  // Distinct month list
  const availableMonths = useMemo(() => {
    return Array.from(new Set(items.map(i => i.mes || 'Octubre 2026')));
  }, [items]);

  // Count by process
  const countsByProcess = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.proceso] = (counts[item.proceso] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Count by month
  const countsByMonth = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const m = item.mes || 'Octubre 2026';
      counts[m] = (counts[m] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Multi-Filter execution
  const filteredData = useMemo(() => {
    return items.filter(item => {
      // 0. Month filter
      if (filterState.selectedMonths.length > 0 && !filterState.selectedMonths.includes(item.mes || 'Octubre 2026')) {
        return false;
      }

      // 1. Process filter
      if (filterState.selectedProcesses.length > 0 && !filterState.selectedProcesses.includes(item.proceso)) {
        return false;
      }

      // 2. Search term
      if (filterState.searchTerm.trim()) {
        const term = filterState.searchTerm.toLowerCase();
        const matches =
          item.subproceso.toLowerCase().includes(term) ||
          item.proceso.toLowerCase().includes(term);
        if (!matches) return false;
      }

      // 3. Hours Deviation filter
      if (filterState.hoursDeviation === 'OVERRUN' && item.dif <= 0) return false;
      if (filterState.hoursDeviation === 'SAVED' && item.dif >= 0) return false;
      if (filterState.hoursDeviation === 'NEUTRAL' && item.dif !== 0) return false;

      // 4. OEE Bracket filter
      if (filterState.oeeBracket === 'EXCELLENT' && item.oee < 1.0) return false;
      if (filterState.oeeBracket === 'OPTIMAL' && (item.oee < 0.85 || item.oee >= 1.0)) return false;
      if (filterState.oeeBracket === 'WARNING' && (item.oee < 0.70 || item.oee >= 0.85)) return false;
      if (filterState.oeeBracket === 'CRITICAL' && item.oee >= 0.70) return false;

      // 5. Effectiveness filter
      if (filterState.effectiveness === 'MET' && item.efect < 1.0) return false;
      if (filterState.effectiveness === 'UNMET' && item.efect >= 1.0) return false;

      // 6. Quality filter
      if (filterState.quality === 'PERFECT' && (item.cal > 0 || item.pCal < 1.0)) return false;
      if (filterState.quality === 'ISSUES' && (item.cal === 0 && item.pCal === 1.0)) return false;

      // 7. Volume min
      if (filterState.minVolume > 0 && item.vol < filterState.minVolume) return false;

      // 8. Hours min
      if (filterState.minHours > 0 && item.horas < filterState.minHours) return false;

      // 9. Bottleneck preset
      if (filterState.onlyTopBottlenecks && item.dif <= 50) return false;

      return true;
    });
  }, [items, filterState]);

  // Calculate KPIs on filtered data
  const summaryKpis = useMemo(() => {
    return calculateSummaryKPIs(filteredData, config);
  }, [filteredData, config]);

  // Quick file upload handler (Header or drag)
  const handleQuickUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const result = parseExcelOrCsv(buffer);
        if (result.success && result.data && result.data.length > 0) {
          setItems(result.data);
          // Redirect immediately to dashboard
          setCurrentView('dashboard');
          // Reset filters to show full new dataset
          handleResetFilters();
          // Trigger celebratory banner
          const autoFixed = (result as any).autoCorrectedEfectCount || 0;
          const fixedNote = autoFixed > 0 ? ` ¡Se reparó automáticamente el bug de 1% de Excel en ${autoFixed} subprocesos!` : '';
          setNotification({
            type: 'success',
            title: '¡Archivo Cargado con Éxito!',
            subtitle: `Se procesaron ${result.data.length} subprocesos.${fixedNote} El dashboard ha sido actualizado automáticamente.`
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          alert(result.error || 'No se pudieron extraer datos válidos del archivo.');
        }
      } catch (err: any) {
        alert(err?.message || 'Error al procesar archivo.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleRecalculateEffectiveness = () => {
    let correctedCount = 0;
    const updated = items.map(item => {
      const expectedEfect = item.prod > 0 ? Number((item.prod2 / item.prod).toFixed(4)) : 1.0;
      const expectedRend = item.prodLm > 0 ? Number((item.vol / item.prodLm).toFixed(4)) : item.rend;
      const expectedOee = Number((expectedRend * expectedEfect * item.pCal).toFixed(4));

      if (Math.abs(item.efect - expectedEfect) > 0.03 || item.efect <= 0.05) {
        correctedCount++;
      }

      return {
        ...item,
        efect: expectedEfect,
        rend: expectedRend,
        oee: expectedOee,
      };
    });

    setItems(updated);
    setNotification({
      type: 'success',
      title: '¡Efectividades WMS Recalculadas con Éxito!',
      subtitle: correctedCount > 0
        ? `Se normalizaron ${correctedCount} subprocesos cruzando Productividad Real / Meta (reparando celdas con 1% o fórmulas rotas de Excel).`
        : `Los ${items.length} subprocesos ya tenían la efectividad matemática exacta correspondiente.`
    });
  };

  const handleResetFilters = () => {
    setFilterState({
      selectedMonths: [],
      selectedProcesses: [],
      searchTerm: '',
      hoursDeviation: 'ALL',
      oeeBracket: 'ALL',
      effectiveness: 'ALL',
      quality: 'ALL',
      minVolume: 0,
      maxVolume: 0,
      minHours: 0,
      maxHours: 0,
      onlyTopBottlenecks: false,
    });
  };

  const handleResetToDefaultData = () => {
    if (window.confirm("¿Restablecer los datos originales de ejemplo del WMS?")) {
      setItems(INITIAL_WMS_DATA);
      handleResetFilters();
      setCurrentView('dashboard');
      setNotification({
        type: 'info',
        title: 'Dataset de Ejemplo Restaurado',
        subtitle: 'Se cargaron los 33 subprocesos oficiales de referencia.'
      });
    }
  };

  const handleSaveItem = (saved: WmsSubprocessItem) => {
    const exists = items.some(i => i.id === saved.id);
    if (exists) {
      setItems(prev => prev.map(i => i.id === saved.id ? saved : i));
    } else {
      setItems(prev => [saved, ...prev]);
    }
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm("¿Eliminar este sub-proceso de la matriz operativa?")) {
      setItems(prev => prev.filter(i => i.id !== id));
      if (inspectItem?.id === id) setInspectItem(null);
    }
  };

  const handleAddNew = () => {
    setEditItem(null);
    setIsEditModalOpen(true);
  };

  const handleEditRow = (item: WmsSubprocessItem) => {
    setEditItem(item);
    setIsEditModalOpen(true);
  };

  const activeFilterTitle = useMemo(() => {
    const monthText = filterState.selectedMonths.length === 0
      ? 'Todos los Meses'
      : filterState.selectedMonths.join(', ');
    const procText = filterState.selectedProcesses.length === 0
      ? 'Todos los Procesos'
      : filterState.selectedProcesses.length === 1
      ? filterState.selectedProcesses[0]
      : `${filterState.selectedProcesses.length} Procesos`;
    return `${monthText} · ${procText}`;
  }, [filterState.selectedMonths, filterState.selectedProcesses]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col font-sans selection:bg-[#004b87] selection:text-white">
      
      {/* Top Header */}
      <Header
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenDataModal={() => setIsDataModalOpen(true)}
        onQuickUpload={handleQuickUpload}
        onResetData={handleResetToDefaultData}
        itemsCount={items.length}
      />

      {/* Upload Notification Banner */}
      {notification && (
        <div className="bg-[#004b87] text-white py-3 px-4 shadow-md animate-in slide-in-from-top duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
              <div>
                <strong className="text-sm font-bold block">{notification.title}</strong>
                <span className="text-xs text-blue-100">{notification.subtitle}</span>
              </div>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        
        {/* Advanced Multi-Filters Component */}
        <AdvancedFilterBar
          filterState={filterState}
          onFilterChange={setFilterState}
          availableProcesses={availableProcesses}
          countsByProcess={countsByProcess}
          availableMonths={availableMonths}
          countsByMonth={countsByMonth}
          totalItems={items.length}
          filteredCount={filteredData.length}
          onResetFilters={handleResetFilters}
        />

        {/* Executive KPI Summary Cards Strip */}
        <KpiSummary
          kpis={summaryKpis}
          activeFilterTitle={activeFilterTitle}
        />

        {/* View 1: Main Dashboard (Default) */}
        {currentView === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Operational Bottlenecks Diagnosed - Master Facility Diagnostics (no se altera con filtro de mes) */}
            <BottleneckAlerts
              items={items}
              onSelectSubprocess={setInspectItem}
            />

            {/* Visual Charts Suite */}
            <ExecutiveCharts
              data={filteredData}
              allData={items}
            />

            {/* Excel Styled Table below charts */}
            <div className="pt-2">
              <DataTable
                data={filteredData}
                onSelectRow={setInspectItem}
                onEditRow={handleEditRow}
                onDeleteRow={handleDeleteItem}
                onAddNew={handleAddNew}
                onExportExcel={() => exportWmsToExcel(filteredData)}
                onRecalculateEffectiveness={handleRecalculateEffectiveness}
              />
            </div>
          </div>
        )}

        {/* View 2: Detailed Charts & Pareto */}
        {currentView === 'charts' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <ExecutiveCharts
              data={filteredData}
              allData={items}
            />

            <div className="pt-2">
              <DataTable
                data={filteredData}
                onSelectRow={setInspectItem}
                onEditRow={handleEditRow}
                onDeleteRow={handleDeleteItem}
                onAddNew={handleAddNew}
                onExportExcel={() => exportWmsToExcel(filteredData)}
                onRecalculateEffectiveness={handleRecalculateEffectiveness}
              />
            </div>
          </div>
        )}

        {/* View 3: 3D Floor Map Digital Twin */}
        {currentView === 'digital_twin' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <div className="card-3d-elevated p-8 rounded-3xl bg-gradient-to-br from-white via-blue-50/20 to-slate-50 border border-slate-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[#004b87] text-white flex items-center justify-center shadow-lg">
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-[#004b87]">
                    Mapa Digital 3D de Procesos del Centro de Distribución
                  </h2>
                  <p className="text-xs text-slate-500">
                    Navegación espacial interactiva por las áreas de Inbound, Almacenaje, Picking y Despacho
                  </p>
                </div>
              </div>

              {/* Floor Plan Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {availableProcesses.map((proc, idx) => {
                  const procItems = items.filter(i => i.proceso === proc);
                  const totalVol = procItems.reduce((acc, c) => acc + c.vol, 0);
                  const totalHoras = procItems.reduce((acc, c) => acc + c.horas, 0);
                  const avgOee = procItems.length > 0 ? (procItems.reduce((acc, c) => acc + (c.oee * c.vol), 0) / (totalVol || 1)) * 100 : 0;
                  const totalDif = procItems.reduce((acc, c) => acc + c.dif, 0);

                  return (
                    <div
                      key={proc}
                      onClick={() => {
                        setFilterState(prev => ({ ...prev, selectedProcesses: [proc] }));
                        setCurrentView('dashboard');
                      }}
                      className="card-3d p-5 rounded-2xl cursor-pointer hover:border-[#004b87] hover:-translate-y-1 transition-all group"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-extrabold text-sm text-[#004b87] group-hover:underline">
                          {idx + 1}. {proc}
                        </span>
                        <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                          avgOee >= 100 ? 'bg-blue-100 text-[#004b87]' : avgOee >= 70 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {avgOee.toFixed(0)}% OEE
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Subprocesos:</span>
                          <span className="font-mono font-bold text-slate-800">{procItems.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Volumen SCMS:</span>
                          <span className="font-mono font-bold text-slate-800">{totalVol.toLocaleString()} uds</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Horas Reales:</span>
                          <span className="font-mono font-bold text-slate-800">{totalHoras.toLocaleString()}h</span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-slate-100">
                          <span className="text-slate-400">Desviación:</span>
                          <span className={`font-mono font-bold ${totalDif > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                            {totalDif > 0 ? `+${totalDif}` : totalDif} hrs
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-[#004b87] font-semibold">
                        <span>Ver análisis detallado</span>
                        <span>→</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* View 4: What-If Simulator */}
        {currentView === 'simulator' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <WhatIfSimulator
              items={filteredData}
              config={config}
              onUpdateConfig={setConfig}
            />

            <div className="pt-2">
              <DataTable
                data={filteredData}
                onSelectRow={setInspectItem}
                onEditRow={handleEditRow}
                onDeleteRow={handleDeleteItem}
                onAddNew={handleAddNew}
                onExportExcel={() => exportWmsToExcel(filteredData)}
                onRecalculateEffectiveness={handleRecalculateEffectiveness}
              />
            </div>
          </div>
        )}

        {/* View 5: Table Focused Matrix */}
        {currentView === 'table' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            <DataTable
              data={filteredData}
              onSelectRow={setInspectItem}
              onEditRow={handleEditRow}
              onDeleteRow={handleDeleteItem}
              onAddNew={handleAddNew}
              onExportExcel={() => exportWmsToExcel(filteredData)}
              onRecalculateEffectiveness={handleRecalculateEffectiveness}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img
              src="/assets/aistudio/knlogo_318c2222.png"
              alt="Logo"
              className="w-5 h-5 object-contain"
              referrerPolicy="no-referrer"
            />
            <span className="font-bold text-slate-800">WMS Operations Hub</span>
            <span>· Control Operativo & Productividad WMS</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            {items.length} subprocesos monitoreados · Total SCMS: {summaryKpis.totalVol.toLocaleString()} uds
          </span>
        </div>
      </footer>

      {/* Modals */}
      <ProcessDetailModal
        item={inspectItem}
        onClose={() => setInspectItem(null)}
        onEdit={(item) => {
          setInspectItem(null);
          handleEditRow(item);
        }}
        costPerHour={config.costPerHour}
      />

      <EditRowModal
        item={editItem}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditItem(null);
        }}
        onSave={handleSaveItem}
        existingProcesses={availableProcesses}
      />

      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        data={items}
        onDataLoaded={(newData, message) => {
          setItems(newData);
          handleResetFilters();
          setCurrentView('dashboard'); // Auto redirect to dashboard
          setNotification({
            type: 'success',
            title: 'Archivo Cargado con Éxito',
            subtitle: message,
          });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onResetToDefault={handleResetToDefaultData}
      />

    </div>
  );
}
