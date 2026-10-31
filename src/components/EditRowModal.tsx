import React, { useState } from 'react';
import { WmsSubprocessItem } from '../types/wms';
import { X, Save, AlertCircle } from 'lucide-react';

interface EditRowModalProps {
  item: WmsSubprocessItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: WmsSubprocessItem) => void;
  existingProcesses: string[];
}

export const EditRowModal: React.FC<EditRowModalProps> = ({
  item,
  isOpen,
  onClose,
  onSave,
  existingProcesses,
}) => {
  if (!isOpen) return null;

  const isEditing = Boolean(item);

  const [mes, setMes] = useState(item?.mes || 'Octubre 2026');
  const [proceso, setProceso] = useState(item?.proceso || existingProcesses[0] || 'Inbound');
  const [subproceso, setSubproceso] = useState(item?.subproceso || '');
  const [prod, setProd] = useState<number>(item?.prod || 100);
  const [vol, setVol] = useState<number>(item?.vol || 10000);
  const [horas, setHoras] = useState<number>(item?.horas || 100);
  const [prodLm, setProdLm] = useState<number>(item?.prodLm || 10000);
  const [hrsLm, setHrsLm] = useState<number>(item?.hrsLm || 100);
  const [cal, setCal] = useState<number>(item?.cal || 0);
  const [pCal, setPCal] = useState<number>(item?.pCal ? item.pCal * 100 : 100);
  const [notas, setNotas] = useState(item?.notas || '');
  const [error, setError] = useState<string | null>(null);

  // Calculated previews
  const calcProd2 = horas > 0 ? Number((vol / horas).toFixed(1)) : 0;
  const calcEfect = prod > 0 ? Number((calcProd2 / prod).toFixed(2)) : 1.0;
  const calcRend = prodLm > 0 ? Number((vol / prodLm).toFixed(2)) : 1.0;
  const calcDif = horas - hrsLm;
  const calcOee = Number((calcEfect * calcRend * (pCal / 100)).toFixed(2));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subproceso.trim()) {
      setError('Por favor ingresa el nombre del sub-proceso.');
      return;
    }

    const savedItem: WmsSubprocessItem = {
      id: item?.id || `sub-${Date.now().toString(36)}`,
      mes: mes.trim() || 'Octubre 2026',
      proceso: proceso.trim(),
      subproceso: subproceso.trim(),
      prod: Number(prod),
      vol: Number(vol),
      horas: Number(horas),
      prod2: calcProd2,
      efect: calcEfect,
      prodLm: Number(prodLm),
      rend: calcRend,
      hrsLm: Number(hrsLm),
      dif: calcDif,
      cal: Number(cal),
      pCal: Number((pCal / 100).toFixed(4)),
      oee: calcOee,
      notas: notas.trim(),
    };

    onSave(savedItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-white">
          <h2 className="text-base font-bold text-[#004b87]">
            {isEditing ? `Editar Sub-Proceso: ${item?.subproceso}` : 'Agregar Nuevo Sub-Proceso'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mes / Período Operativo
              </label>
              <input
                type="text"
                required
                value={mes}
                onChange={(e) => setMes(e.target.value)}
                placeholder="Ej: Octubre 2026, Septiembre 2026"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#004b87]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Macro Proceso
              </label>
              <select
                value={proceso}
                onChange={(e) => setProceso(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#004b87]"
              >
                {existingProcesses.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
                <option value="Inbound">Inbound</option>
                <option value="Replenishment">Replenishment</option>
                <option value="Devoluciones">Devoluciones</option>
                <option value="B2B">B2B</option>
                <option value="B2C">B2C</option>
                <option value="Shipping">Shipping</option>
                <option value="IRA">IRA</option>
                <option value="Montacargas">Montacargas</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre de Sub-Proceso
              </label>
              <input
                type="text"
                required
                value={subproceso}
                onChange={(e) => setSubproceso(e.target.value)}
                placeholder="Ej: Put Away Pallets Rack"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#004b87]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Productividad Estándar / Meta (u/h)
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                required
                value={prod}
                onChange={(e) => setProd(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Volumen SCMS Real
              </label>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={vol}
                onChange={(e) => setVol(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Horas Reales Ejecutadas
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={horas}
                onChange={(e) => setHoras(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Horas Meta / LM (Hrs LM)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                required
                value={hrsLm}
                onChange={(e) => setHrsLm(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Produc Total LM (Meta Volumen)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={prodLm}
                onChange={(e) => setProdLm(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                % Calidad (0 - 100%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={pCal}
                onChange={(e) => setPCal(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Calidad (Unidades de error)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={cal}
                onChange={(e) => setCal(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Notas Operativas
              </label>
              <input
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observación o turno"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800"
              />
            </div>

          </div>

          {/* Calculated Preview Strip */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Productividad2:</span>
              <strong className="text-[#004b87] font-mono">{calcProd2} u/h</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">Dif Horas:</span>
              <strong className={`font-mono font-bold ${calcDif > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {calcDif > 0 ? `+${calcDif}` : calcDif} hrs
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[11px]">OEE Resultante:</span>
              <strong className="text-slate-900 font-mono font-bold">{(calcOee * 100).toFixed(0)}%</strong>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-[#004b87] hover:bg-[#003865] rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Guardar Cambios' : 'Crear Subproceso'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
