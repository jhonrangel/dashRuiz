import React, { useRef, useState } from 'react';
import { WmsSubprocessItem } from '../types/wms';
import { parseExcelOrCsv, exportWmsToExcel, exportWmsToCsv } from '../utils/excel';
import { X, Upload, Download, FileSpreadsheet, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: WmsSubprocessItem[];
  onDataLoaded: (newData: WmsSubprocessItem[], message: string) => void;
  onResetToDefault: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen,
  onClose,
  data,
  onDataLoaded,
  onResetToDefault,
}) => {
  if (!isOpen) return null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setErrorMessage(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        const result = parseExcelOrCsv(buffer);
        if (result.success && result.data && result.data.length > 0) {
          const autoFixed = (result as any).autoCorrectedEfectCount || 0;
          const fixNote = autoFixed > 0 ? ` (¡Se reparó el bug de 1% de Excel en ${autoFixed} filas!)` : '';
          onDataLoaded(result.data, `Archivo "${file.name}" cargado exitosamente (${result.data.length} filas procesadas${fixNote}).`);
          onClose(); // Auto close and redirect
        } else {
          setErrorMessage(result.error || 'No se pudieron extraer datos válidos del archivo.');
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Error al procesar el archivo seleccionado.');
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.onerror = () => {
      setLoading(false);
      setErrorMessage('Error de lectura de archivo.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleExportExcel = () => {
    exportWmsToExcel(data, `Dashboard_WMS_Operaciones_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleExportCsv = () => {
    exportWmsToCsv(data, `Dashboard_WMS_Operaciones_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center">
              <img
                src="/assets/aistudio/knlogo_318c2222.png"
                alt="Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#004b87]">Gestión de Archivos Excel & CSV</h2>
              <p className="text-xs text-slate-500">Carga tus turnos para actualizar automáticamente los dashboards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {errorMessage && (
            <div className="p-3.5 rounded-xl text-xs flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Upload Drop Zone */}
          <div className="border-2 border-dashed border-slate-200 hover:border-[#004b87] rounded-2xl p-6 text-center bg-slate-50/60 hover:bg-blue-50/30 transition-all">
            <Upload className="w-9 h-9 text-[#004b87] mx-auto mb-2 opacity-80" />
            <h3 className="text-sm font-bold text-slate-800">Cargar Archivo Excel o CSV</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Soporta las 14 columnas oficiales: Proceso, Sub-Proceso, Productividad, Volumen SCMS, Horas Ejecutadas, OEE, etc.
            </p>

            <div className="mt-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
                id="wms-excel-upload-modal"
              />
              <label
                htmlFor="wms-excel-upload-modal"
                className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 bg-[#004b87] hover:bg-[#003865] text-white rounded-xl text-xs font-bold transition-all shadow-sm ${
                  loading ? 'opacity-50 pointer-events-none' : ''
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{loading ? 'Procesando y cargando...' : 'Seleccionar Archivo (.xlsx / .csv)'}</span>
              </label>
            </div>
          </div>

          {/* Export Options */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Descargar Datos
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleExportExcel}
                className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all flex items-center justify-between group shadow-2xs"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#004b87]">
                    <Download className="w-4 h-4 text-[#004b87]" />
                    <span>Descargar Excel (.xlsx)</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Formato oficial con {data.length} filas</div>
                </div>
              </button>

              <button
                onClick={handleExportCsv}
                className="p-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition-all flex items-center justify-between group shadow-2xs"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 group-hover:text-[#004b87]">
                    <Download className="w-4 h-4 text-[#0284c7]" />
                    <span>Descargar CSV Plano</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Para ERP y sistemas externos</div>
                </div>
              </button>
            </div>
          </div>

          {/* Reset Action */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500">
              ¿Deseas volver a la base de datos de ejemplo?
            </div>
            <button
              onClick={() => {
                onResetToDefault();
                onClose();
              }}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restablecer Ejemplo</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
