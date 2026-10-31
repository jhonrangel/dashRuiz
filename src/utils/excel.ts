import * as XLSX from 'xlsx';
import { WmsSubprocessItem } from '../types/wms';

export function parseExcelOrCsv(fileData: ArrayBuffer): {
  success: boolean;
  data?: WmsSubprocessItem[];
  error?: string;
  autoCorrectedEfectCount?: number;
} {
  try {
    const uint8 = new Uint8Array(fileData);
    const workbook = XLSX.read(uint8, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, error: "El archivo no contiene hojas legibles." };
    }

    const worksheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json<any>(worksheet, { header: 1 });

    if (!rawRows || rawRows.length < 2) {
      return { success: false, error: "El archivo no contiene suficientes filas de datos." };
    }

    // Inspect headers
    const headerRow = (rawRows[0] as any[]).map(c => String(c || '').trim().toLowerCase());

    const findIndex = (names: string[]) => {
      return headerRow.findIndex(h => names.some(n => h.includes(n)));
    };

    const mesIdx = findIndex(['mes', 'month', 'periodo', 'period', 'fecha']);
    const pIdx = findIndex(['proceso', 'process', 'area']);
    const spIdx = findIndex(['sub-proceso', 'subproceso', 'sub proceso', 'tarea', 'actividad']);
    const prodIdx = findIndex(['productividad2', 'prod2', 'productividad real']) !== -1 
      ? findIndex(['productividad', 'prod meta', 'prod1', 'estandar'])
      : findIndex(['productividad', 'prod']);
    const volIdx = findIndex(['volumen scms', 'volumen', 'scms', 'vol']);
    const horasIdx = findIndex(['horas ejecutadas', 'horas', 'hrs ejec', 'hrs']);
    const prod2Idx = findIndex(['productividad2', 'prod2', 'productividad real', 'prod_real']);
    const efectIdx = findIndex(['% efectividad', 'efectividad', 'efect']);
    const prodLmIdx = findIndex(['produc total lm', 'prod lm', 'volumen lm', 'prodlm']);
    const rendIdx = findIndex(['rendimiento', 'rend', '% rend']);
    const hrsLmIdx = findIndex(['hrs lm', 'horas lm', 'hrslm']);
    const difIdx = findIndex(['dif horas', 'dif', 'desviacion']);
    const calIdx = findIndex(['calidad', 'errores', 'defectos', 'discrepancias']);
    const pCalIdx = findIndex(['% calidad', 'pcal', 'p cal']);
    const oeeIdx = findIndex(['oee', '% oee']);

    // Numeric cleaner that parses European dots/commas & percentages
    const parseFormattedNumber = (val: any, fallback = 0): number => {
      if (typeof val === 'number') return isNaN(val) ? fallback : val;
      if (!val) return fallback;
      let s = String(val).trim();
      if (s.toUpperCase() === 'FALSO' || s.toUpperCase() === 'FALSE') return 0;
      if (s.toUpperCase() === 'VERDADERO' || s.toUpperCase() === 'TRUE') return 1;
      
      // Excel error codes (#DIV/0!, #N/A, #REF!, #VALOR!, etc.)
      if (s.startsWith('#') || s.toUpperCase().includes('DIV') || s.toUpperCase().includes('PAILAS')) {
        return fallback;
      }

      // If formatted like '56.805' or '197.140' (thousands dot)
      if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else if (s.includes(',') && !s.includes('.')) {
        // '144,9' -> '144.9'
        s = s.replace(',', '.');
      }
      
      const isPercent = s.includes('%');
      s = s.replace('%', '').trim();
      const num = parseFloat(s);
      if (isNaN(num)) return fallback;
      if (isPercent) return num / 100;
      return num;
    };

    const parsePercentValue = (val: any, fallback = 1.0): number => {
      if (val === null || val === undefined || val === '') return fallback;
      if (typeof val === 'number') {
        if (isNaN(val)) return fallback;
        return val > 1.05 && val <= 100 ? val / 100 : val;
      }
      const s = String(val).trim();
      if (s.toUpperCase() === 'FALSO' || s.toUpperCase() === 'FALSE') return 0;
      if (s.startsWith('#') || s.toUpperCase().includes('DIV') || s.toUpperCase().includes('PAILAS')) {
        return fallback;
      }

      const parsed = parseFormattedNumber(val, fallback);
      return parsed > 1.05 && parsed <= 100 ? parsed / 100 : parsed;
    };

    const items: WmsSubprocessItem[] = [];
    let autoCorrectedEfectCount = 0;

    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || row.length === 0) continue;

      const mesVal = mesIdx !== -1 && row[mesIdx] ? String(row[mesIdx]).trim() : 'Octubre 2026';
      const procesoVal = String(row[pIdx !== -1 ? pIdx : 0] || '').trim();
      const subprocesoVal = String(row[spIdx !== -1 ? spIdx : 1] || '').trim();

      if (!procesoVal && !subprocesoVal) continue;

      const prod = Math.round(parseFormattedNumber(row[prodIdx !== -1 ? prodIdx : 2], 50));
      const vol = Math.round(parseFormattedNumber(row[volIdx !== -1 ? volIdx : 3], 0));
      const horas = Math.round(parseFormattedNumber(row[horasIdx !== -1 ? horasIdx : 4], 0));
      const prod2 = Math.round(parseFormattedNumber(row[prod2Idx !== -1 ? prod2Idx : 5], horas > 0 ? (vol / horas) : 0));

      // Calculate the true mathematical WMS effectiveness (Productividad Real / Productividad Meta)
      const expectedEfect = prod > 0 ? Number((prod2 / prod).toFixed(4)) : 1.0;
      const rawEfectCell = row[efectIdx !== -1 ? efectIdx : 6];
      let efect = parsePercentValue(rawEfectCell, expectedEfect);

      // HEURISTIC / AUTO-CORRECTION FOR EXCEL "1%" BUG & BROKEN CROSS FORMULAS:
      // In Excel, when users enter "1" into a cell formatted as percentage, or when a VLOOKUP/cross-formula
      // fails or divides twice by 100, it results in 0.01 ("1%").
      // If the parsed effectiveness is <= 5% (0.05) or the raw string was "1%" or error "#DIV/0!",
      // while the actual mathematical ratio (prod2 / prod) is >= 20% (0.20),
      // we automatically heal it with the exact operational cross-check.
      const rawEfectStr = String(rawEfectCell ?? '').trim();
      const isSuspiciousOnePercent = (efect <= 0.05 || rawEfectStr === '1%' || rawEfectStr === '1') && expectedEfect >= 0.20;
      const isExcelFormulaError = rawEfectStr.startsWith('#') || rawEfectStr.toUpperCase().includes('DIV') || rawEfectStr.toUpperCase().includes('REF') || rawEfectStr.toUpperCase().includes('PAILAS');

      if (isSuspiciousOnePercent || isExcelFormulaError) {
        efect = expectedEfect;
        autoCorrectedEfectCount++;
      }

      const prodLm = Math.round(parseFormattedNumber(row[prodLmIdx !== -1 ? prodLmIdx : 7], vol));
      const expectedRend = prodLm > 0 ? Number((vol / prodLm).toFixed(4)) : 1.0;
      let rend = parsePercentValue(row[rendIdx !== -1 ? rendIdx : 8], expectedRend);
      if (rend <= 0.05 && expectedRend >= 0.20) {
        rend = expectedRend;
      }

      const hrsLm = Math.round(parseFormattedNumber(row[hrsLmIdx !== -1 ? hrsLmIdx : 9], prod > 0 ? (vol / prod) : horas));
      const dif = Math.round(parseFormattedNumber(row[difIdx !== -1 ? difIdx : 10], horas - hrsLm));
      const cal = Math.round(parseFormattedNumber(row[calIdx !== -1 ? calIdx : 11], 0));
      const pCal = parsePercentValue(row[pCalIdx !== -1 ? pCalIdx : 12], 1.0);

      const expectedOee = Number((rend * efect * pCal).toFixed(4));
      let oee = parsePercentValue(row[oeeIdx !== -1 ? oeeIdx : 13], expectedOee);
      if (oee <= 0.05 && expectedOee >= 0.20) {
        oee = expectedOee;
      }

      items.push({
        id: `row-${r}-${Date.now().toString(36)}`,
        mes: mesVal,
        proceso: procesoVal || 'Operaciones',
        subproceso: subprocesoVal || `Subproceso ${r}`,
        prod,
        vol,
        horas,
        prod2,
        efect,
        prodLm,
        rend,
        hrsLm,
        dif,
        cal,
        pCal,
        oee,
      });
    }

    if (items.length === 0) {
      return { success: false, error: "No se pudieron extraer registros válidos del archivo." };
    }

    return { success: true, data: items, autoCorrectedEfectCount };
  } catch (err: any) {
    return { success: false, error: err?.message || "Error al procesar el archivo Excel." };
  }
}

export function exportWmsToExcel(items: WmsSubprocessItem[], filename = 'Dashboard_WMS_Operaciones.xlsx') {
  const exportData = items.map(item => ({
    'Mes': item.mes || 'Octubre 2026',
    'Proceso': item.proceso,
    'Sub-Proceso': item.subproceso,
    'Productividad': item.prod,
    'Volumen SCMS': item.vol,
    'Horas Ejecutadas': item.horas,
    'Productividad2': item.prod2,
    '% Efectividad': `${Math.round(item.efect * 100)}%`,
    'Produc Total LM': item.prodLm,
    'Rendimiento': `${Math.round(item.rend * 100)}%`,
    'Hrs LM': item.hrsLm,
    'Dif Horas': item.dif,
    'Calidad': item.cal,
    '% Calidad': item.pCal === 0 ? 'FALSO' : `${(item.pCal * 100).toFixed(1)}%`,
    'OEE': `${Math.round(item.oee * 100)}%`,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'WMS Productividad');
  XLSX.writeFile(workbook, filename);
}

export function exportWmsToCsv(items: WmsSubprocessItem[], filename = 'Dashboard_WMS_Operaciones.csv') {
  const exportData = items.map(item => ({
    'Mes': item.mes || 'Octubre 2026',
    'Proceso': item.proceso,
    'Sub-Proceso': item.subproceso,
    'Productividad': item.prod,
    'Volumen SCMS': item.vol,
    'Horas Ejecutadas': item.horas,
    'Productividad2': item.prod2,
    '% Efectividad': item.efect,
    'Produc Total LM': item.prodLm,
    'Rendimiento': item.rend,
    'Hrs LM': item.hrsLm,
    'Dif Horas': item.dif,
    'Calidad': item.cal,
    '% Calidad': item.pCal,
    'OEE': item.oee,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
