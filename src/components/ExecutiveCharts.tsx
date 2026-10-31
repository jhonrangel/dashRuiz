import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ComposedChart,
  Area,
  AreaChart
} from 'recharts';
import { WmsSubprocessItem } from '../types/wms';
import { groupDataByProcess, getParetoHourDeviation, formatNumber, formatPercent } from '../utils/calculations';
import {
  BarChart3,
  TrendingUp,
  PieChart as PieIcon,
  ArrowUpDown,
  Layers,
  Activity,
  CheckCircle2,
  Box,
  Truck,
  RotateCcw,
  ShieldCheck,
  Zap
} from 'lucide-react';

interface ExecutiveChartsProps {
  data: WmsSubprocessItem[];
  allData: WmsSubprocessItem[];
}

const BLUE_PALETTE = [
  '#004b87', // Primary Brand Blue
  '#0284c7', // Sky Blue
  '#0369a1', // Deep Cyan Blue
  '#1d4ed8', // Royal Blue
  '#3b82f6', // Light Royal Blue
  '#0f766e', // Teal Slate
  '#6366f1', // Indigo Blue
  '#475569', // Slate Steel
];

export const ExecutiveCharts: React.FC<ExecutiveChartsProps> = ({
  data,
  allData,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'oee' | 'deviation' | 'pareto' | 'distribution' | 'volume'>('all');
  const [itemLimit, setItemLimit] = useState<number>(14);

  // Slice items for high legibility
  const displayItems = data.slice(0, itemLimit);

  // Grouped by parent process for macro charts (responds dynamically to month filter)
  const groupedData = groupDataByProcess(data.length > 0 ? data : allData);

  // 1. Grouped Bar Chart Data (Rendimiento, OEE, Efectividad)
  const multiBarData = displayItems.map(item => ({
    name: item.subproceso.length > 15 ? item.subproceso.slice(0, 14) + '…' : item.subproceso,
    fullName: item.subproceso,
    proceso: item.proceso,
    rendimiento: Math.round(item.rend * 100),
    oee: Math.round(item.oee * 100),
    efectividad: Math.round(item.efect * 100),
    vol: item.vol,
    horas: item.horas,
    dif: item.dif,
  }));

  // 2. Diverging Bar Chart Data (Hours deviation)
  const deviationData = displayItems.map(item => ({
    name: item.subproceso.length > 15 ? item.subproceso.slice(0, 14) + '…' : item.subproceso,
    fullName: item.subproceso,
    dif: item.dif,
    horas: item.horas,
    hrsLm: item.hrsLm,
  }));

  // 3. Pareto 80/20 data (responds dynamically to month filter)
  const paretoData = getParetoHourDeviation(data.length > 0 ? data : allData).slice(0, 10);

  // 4. Pie data for Volume & Hours
  const pieVolumeData = groupedData.map((g, idx) => ({
    name: g.proceso,
    value: g.vol,
    color: BLUE_PALETTE[idx % BLUE_PALETTE.length],
  }));

  const pieHoursData = groupedData.map((g, idx) => ({
    name: g.proceso,
    value: g.horas,
    color: BLUE_PALETTE[idx % BLUE_PALETTE.length],
  }));

  // 5. Volume Actual vs Produc Total LM
  const volumeGrowthData = displayItems.map(item => ({
    name: item.subproceso.length > 13 ? item.subproceso.slice(0, 12) + '…' : item.subproceso,
    fullName: item.subproceso,
    volActual: item.vol,
    volLm: item.prodLm,
  }));

  // Custom tooltips
  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
          <div className="font-bold text-[#004b87] border-b border-slate-100 pb-1">
            {d.fullName}
          </div>
          <div className="text-slate-500">Macro Proceso: <span className="font-semibold text-slate-700">{d.proceso}</span></div>
          <div className="flex justify-between gap-4">
            <span className="text-[#004b87] font-medium">OEE Global:</span>
            <span className="font-mono tabular-nums font-bold text-slate-800">{d.oee}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-blue-600 font-medium">Rendimiento:</span>
            <span className="font-mono tabular-nums font-bold text-slate-800">{d.rendimiento}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-indigo-600 font-medium">% Efectividad:</span>
            <span className="font-mono tabular-nums font-bold text-slate-800">{d.efectividad}%</span>
          </div>
          <div className="flex justify-between gap-4 pt-1 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Vol: {formatNumber(d.vol)} uds</span>
            <span>Horas: {d.horas}h</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDeviationTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1.5 z-50">
          <div className="font-bold text-slate-900 border-b border-slate-100 pb-1">
            {d.fullName}
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Desviación:</span>
            <span className={`font-mono tabular-nums font-bold ${d.dif > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {d.dif > 0 ? `+${d.dif}` : d.dif} horas
            </span>
          </div>
          <div className="flex justify-between gap-4 text-slate-500">
            <span>Horas Reales:</span>
            <span className="font-mono tabular-nums text-slate-800">{d.horas}h</span>
          </div>
          <div className="flex justify-between gap-4 text-slate-500">
            <span>Horas Meta (LM):</span>
            <span className="font-mono tabular-nums text-slate-800">{d.hrsLm}h</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      
      {/* Chart Navigation Tabs & Limit Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Vista Integral Multigráfica
          </button>
          <button
            onClick={() => setActiveTab('oee')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'oee'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Rendimiento vs OEE
          </button>
          <button
            onClick={() => setActiveTab('deviation')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'deviation'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Desviación de Horas
          </button>
          <button
            onClick={() => setActiveTab('pareto')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'pareto'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Pareto 80/20 Horas
          </button>
          <button
            onClick={() => setActiveTab('distribution')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'distribution'
                ? 'bg-[#004b87] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Distribución Vol / Horas
          </button>
        </div>

        {data.length > 8 && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <span>Mostrar:</span>
            <button
              onClick={() => setItemLimit(10)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono ${
                itemLimit === 10 ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
              }`}
            >
              Top 10
            </button>
            <button
              onClick={() => setItemLimit(20)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono ${
                itemLimit === 20 ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
              }`}
            >
              Top 20
            </button>
            <button
              onClick={() => setItemLimit(data.length)}
              className={`px-2 py-1 rounded-md text-[11px] font-mono ${
                itemLimit >= data.length ? 'bg-slate-200 text-slate-900 font-bold' : 'hover:bg-slate-100'
              }`}
            >
              Todos ({data.length})
            </button>
          </div>
        )}
      </div>

      {/* Grid of Main Charts */}
      {(activeTab === 'all' || activeTab === 'oee') && (
        <div className="card-3d p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="font-bold text-sm text-[#004b87] flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#004b87]" />
                Rendimiento vs. OEE vs. % Efectividad por Sub-Proceso
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Comparación multi-métrica con meta industrial de referencia (100%)
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-[#004b87] font-semibold">
                <span className="w-3 h-3 rounded-sm bg-[#004b87]"></span> Rendimiento
              </span>
              <span className="flex items-center gap-1.5 text-teal-600 font-semibold">
                <span className="w-3 h-3 rounded-sm bg-[#0d9488]"></span> OEE
              </span>
              <span className="flex items-center gap-1.5 text-indigo-600 font-semibold">
                <span className="w-3 h-3 rounded-sm bg-[#4f46e5]"></span> Efectividad
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={multiBarData} margin={{ top: 10, right: 10, left: -15, bottom: 45 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  angle={-30}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" domain={[0, 'auto']} />
                <Tooltip content={<CustomBarTooltip />} />
                <ReferenceLine y={100} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Meta 100%', fill: '#10b981', fontSize: 10, position: 'right' }} />
                <Bar dataKey="rendimiento" name="Rendimiento" fill="#004b87" radius={[4, 4, 0, 0]} />
                <Bar dataKey="oee" name="OEE" fill="#0d9488" radius={[4, 4, 0, 0]} />
                <Bar dataKey="efectividad" name="% Efectividad" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Row 2: Diverging Bar Chart (Desviación Horas) & Pareto 80/20 */}
      {(activeTab === 'all' || activeTab === 'deviation' || activeTab === 'pareto') && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Diverging Bar Chart */}
          <div className="card-3d p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-[#004b87]" />
                  Desviación de Horas (Dif Horas)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sobreuso en rojo (+hrs) vs. Ahorro de horas en verde (-hrs)
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-red-700 font-mono font-bold text-[11px] bg-red-50 px-2 py-0.5 rounded border border-red-200">+ Exceso</span>
                <span className="text-emerald-700 font-mono font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">- Ahorro</span>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deviationData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="h" />
                  <Tooltip content={<CustomDeviationTooltip />} />
                  <ReferenceLine y={0} stroke="#94a3b8" />
                  <Bar dataKey="dif" name="Diferencia de Horas" radius={[4, 4, 0, 0]}>
                    {deviationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.dif > 0 ? '#dc2626' : '#16a34a'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pareto 80/20 Chart */}
          <div className="card-3d p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <ArrowUpDown className="w-4 h-4 text-amber-600" />
                  Análisis Pareto 80/20 de Sobrecosto en Horas
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Subprocesos que generan el 80% de horas extraordinarias
                </p>
              </div>
              <span className="text-[11px] font-mono text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Regla 80/20 WMS
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={paretoData} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis
                    dataKey="subproceso"
                    stroke="#64748b"
                    fontSize={10}
                    tickLine={false}
                    angle={-30}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis yAxisId="left" stroke="#64748b" fontSize={10} tickLine={false} unit="h" />
                  <YAxis yAxisId="right" orientation="right" stroke="#d97706" fontSize={10} tickLine={false} unit="%" domain={[0, 100]} />
                  <Tooltip
                    formatter={(val: any, name: any) => [
                      name === 'share' ? `${val}%` : name === 'cumulativeShare' ? `${val}% acumulado` : `${val} hrs`,
                      name === 'dif' ? 'Horas Extra' : name === 'cumulativeShare' ? '% Acumulado' : '% Participación'
                    ]}
                  />
                  <ReferenceLine yAxisId="right" y={80} stroke="#ea580c" strokeDasharray="3 3" label={{ value: '80% Umbral', fill: '#ea580c', fontSize: 10, position: 'left' }} />
                  <Bar yAxisId="left" dataKey="dif" name="Horas Extra" fill="#004b87" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="cumulativeShare" name="% Acumulado" stroke="#d97706" strokeWidth={2.5} dot={{ r: 3, fill: '#d97706' }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}

      {/* Row 3: 3D Donut Charts (Volumen y Horas) & Historical LM Comparison */}
      {(activeTab === 'all' || activeTab === 'distribution' || activeTab === 'volume') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Donut 1: Volumen por Proceso */}
          <div className="card-3d p-5">
            <div className="mb-3">
              <h3 className="font-bold text-sm text-[#004b87] flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#004b87]" />
                Distribución de Volumen SCMS
              </h3>
              <p className="text-xs text-slate-500">
                Participación porcentual en unidades
              </p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieVolumeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieVolumeData.map((entry, index) => (
                      <Cell key={`cell-v-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${formatNumber(Number(val))} uds`, 'Volumen']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 mt-1">
              {pieVolumeData.slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Donut 2: Horas por Proceso */}
          <div className="card-3d p-5">
            <div className="mb-3">
              <h3 className="font-bold text-sm text-[#004b87] flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#0284c7]" />
                Distribución de Horas Ejecutadas
              </h3>
              <p className="text-xs text-slate-500">
                Carga horaria por macroproceso
              </p>
            </div>

            <div className="h-56 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieHoursData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieHoursData.map((entry, index) => (
                      <Cell key={`cell-h-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${formatNumber(Number(val))} hrs`, 'Horas']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 mt-1">
              {pieHoursData.slice(0, 6).map((item) => (
                <div key={item.name} className="flex items-center gap-1.5 truncate">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }}></span>
                  <span className="truncate">{item.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 3: Historical Volume SCMS vs Produc Total LM */}
          <div className="card-3d p-5">
            <div className="mb-3">
              <h3 className="font-bold text-sm text-[#004b87] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#004b87]" />
                Volumen SCMS Actual vs LM
              </h3>
              <p className="text-xs text-slate-500">
                Cumplimiento de volumen respecto al histórico
              </p>
            </div>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeGrowthData} margin={{ top: 5, right: 5, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={9} tickLine={false} tickFormatter={(val) => `${Math.round(val / 1000)}k`} />
                  <Tooltip
                    formatter={(val: any) => [formatNumber(Number(val)), 'Unidades']}
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="volActual" name="Volumen Actual" stroke="#004b87" fill="#004b87" fillOpacity={0.2} strokeWidth={2} />
                  <Area type="monotone" dataKey="volLm" name="Volumen LM" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="3 3" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-[#004b87]"></span> SCMS Real
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-1 bg-slate-400"></span> Produc Total LM
              </span>
            </div>
          </div>

        </div>
      )}

      {/* Interactive 3D Warehouse Process Flow Floor Map */}
      <div className="card-3d-elevated p-6 rounded-2xl bg-gradient-to-br from-white via-slate-50 to-blue-50/40 border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#004b87] text-white flex items-center justify-center shadow-md">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#004b87]">
                Mapa de Flujo Logístico WMS (Digital Twin Operativo)
              </h3>
              <p className="text-xs text-slate-500">
                Visualización tridimensional por zonas de proceso en el Centro de Distribución
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-100 text-[#004b87] border border-blue-200">
            {groupedData.length} Macroprocesos Activos
          </span>
        </div>

        {/* 3D Isometric Process Floor Nodes - Dynamic by Filtered Month & Dataset */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4">
          {groupedData.map((g, idx) => {
            const oeeVal = Math.round(g.avgOee);
            let oeeBadgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
            if (oeeVal >= 100) {
              oeeBadgeColor = 'text-[#004b87] bg-blue-50 border-blue-200';
            } else if (oeeVal < 70) {
              oeeBadgeColor = 'text-red-700 bg-red-50 border-red-200';
            }

            const lower = g.proceso.toLowerCase();
            const Icon = lower.includes('inbound') || lower.includes('ship') 
              ? Truck 
              : lower.includes('dev') 
              ? RotateCcw 
              : lower.includes('b2b') 
              ? Layers 
              : lower.includes('b2c') 
              ? Zap 
              : lower.includes('ira') 
              ? ShieldCheck 
              : Box;

            return (
              <div 
                key={g.proceso}
                className="bg-white/95 p-4 rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1 gap-1">
                  <span className="flex items-center gap-1.5 text-[#004b87] truncate">
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{idx + 1}. {g.proceso}</span>
                  </span>
                  <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded border font-bold shrink-0 ${oeeBadgeColor}`}>
                    OEE {oeeVal}%
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {g.subprocesosCount} subprocesos monitoreados
                </div>
                <div className="mt-2 text-xs font-mono font-bold text-slate-800 flex items-center justify-between">
                  <span>{formatNumber(g.vol)} <span className="text-[10px] text-slate-400 font-normal">uds</span></span>
                  <span className="text-slate-500 font-normal">{formatNumber(g.horas)}h</span>
                </div>
                <div className="mt-1 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-400">Desv Horas:</span>
                  <span className={`font-mono font-bold ${g.dif > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {g.dif > 0 ? `+${formatNumber(g.dif)}h` : `${formatNumber(g.dif)}h`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
