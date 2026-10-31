import React, { useRef } from 'react';
import { ViewTab } from '../types/wms';
import { Download, UploadCloud, RefreshCw, Layers, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentView: ViewTab;
  onSelectView: (view: ViewTab) => void;
  onOpenDataModal: () => void;
  onQuickUpload: (file: File) => void;
  onResetData: () => void;
  itemsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onSelectView,
  onOpenDataModal,
  onQuickUpload,
  onResetData,
  itemsCount,
}) => {
  const quickInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onQuickUpload(file);
      if (quickInputRef.current) quickInputRef.current.value = '';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        
        {/* Zone 1: Brand Wordmark (White background with Official Logo) */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shadow-xs">
            <img
              src="/assets/aistudio/knlogo_318c2222.png"
              alt="Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-[#004b87] whitespace-nowrap block leading-tight">
              WMS Operations Hub
            </span>
            <span className="text-[10px] text-slate-500 font-medium tracking-wide">
              Productividad & Control Operativo
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links (Single-line, concise) */}
        <nav className="hidden md:flex items-center gap-1">
          <button
            onClick={() => onSelectView('dashboard')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              currentView === 'dashboard'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#004b87] hover:bg-slate-100'
            }`}
          >
            Panel Ejecutivo
          </button>
          <button
            onClick={() => onSelectView('charts')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              currentView === 'charts'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#004b87] hover:bg-slate-100'
            }`}
          >
            Gráficos & Pareto
          </button>
          <button
            onClick={() => onSelectView('digital_twin')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              currentView === 'digital_twin'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#004b87] hover:bg-slate-100'
            }`}
          >
            Mapa 3D de Planta
          </button>
          <button
            onClick={() => onSelectView('simulator')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              currentView === 'simulator'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#004b87] hover:bg-slate-100'
            }`}
          >
            Simulador de Metas
          </button>
          <button
            onClick={() => onSelectView('table')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              currentView === 'table'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#004b87] hover:bg-slate-100'
            }`}
          >
            Matriz Operativa ({itemsCount})
          </button>
        </nav>

        {/* Zone 3: Primary Action & Quick Tools */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onResetData}
            title="Restablecer datos originales de ejemplo"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Hidden quick input */}
          <input
            ref={quickInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
            id="quick-excel-input"
          />

          <label
            htmlFor="quick-excel-input"
            className="cursor-pointer hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-2xs hover:border-[#004b87]"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#004b87]" />
            <span>Cargar Excel</span>
          </label>
          
          <button
            onClick={onOpenDataModal}
            className="px-3.5 py-2 text-xs font-bold text-white bg-[#004b87] hover:bg-[#003865] rounded-xl shadow-xs transition-all flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Gestión Archivos</span>
          </button>
        </div>

      </div>

      {/* Mobile navigation strip */}
      <div className="flex md:hidden items-center gap-1 overflow-x-auto pt-2.5 pb-1 border-t border-slate-100 mt-2 scrollbar-none">
        <button
          onClick={() => onSelectView('dashboard')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
            currentView === 'dashboard' ? 'bg-[#004b87] text-white' : 'text-slate-600'
          }`}
        >
          Ejecutivo
        </button>
        <button
          onClick={() => onSelectView('charts')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
            currentView === 'charts' ? 'bg-[#004b87] text-white' : 'text-slate-600'
          }`}
        >
          Gráficos
        </button>
        <button
          onClick={() => onSelectView('digital_twin')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
            currentView === 'digital_twin' ? 'bg-[#004b87] text-white' : 'text-slate-600'
          }`}
        >
          Planta 3D
        </button>
        <button
          onClick={() => onSelectView('simulator')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
            currentView === 'simulator' ? 'bg-[#004b87] text-white' : 'text-slate-600'
          }`}
        >
          Simulador
        </button>
        <button
          onClick={() => onSelectView('table')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap ${
            currentView === 'table' ? 'bg-[#004b87] text-white' : 'text-slate-600'
          }`}
        >
          Matriz ({itemsCount})
        </button>
      </div>
    </header>
  );
};
