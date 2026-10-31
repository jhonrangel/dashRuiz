import React from 'react';

interface ProcessFilterTabsProps {
  processes: string[];
  selectedProcess: string;
  onSelectProcess: (process: string) => void;
  countsByProcess: Record<string, number>;
}

export const ProcessFilterTabs: React.FC<ProcessFilterTabsProps> = ({
  processes,
  selectedProcess,
  onSelectProcess,
  countsByProcess,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-900 scrollbar-none">
      <button
        onClick={() => onSelectProcess('ALL')}
        className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
          selectedProcess === 'ALL'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800/70'
        }`}
      >
        <span>Todos los Procesos</span>
        <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
          selectedProcess === 'ALL' ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
        }`}>
          {Object.values(countsByProcess).reduce((a, b) => a + b, 0)}
        </span>
      </button>

      {processes.map((proc) => {
        const count = countsByProcess[proc] || 0;
        const isActive = selectedProcess === proc;
        return (
          <button
            key={proc}
            onClick={() => onSelectProcess(proc)}
            className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              isActive
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800/70'
            }`}
          >
            <span>{proc}</span>
            <span className={`text-[11px] font-mono tabular-nums px-1.5 py-0.2 rounded ${
              isActive ? 'bg-blue-700 text-blue-100' : 'bg-slate-800 text-slate-400'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
