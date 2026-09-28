import ExcelJS from 'exceljs';
import type { Celda, Libro } from './contract';
import { ErrorDeEntrada } from './contract';

/** Abre un .xlsx y lo convierte en un Libro genérico (solo valores). */
export async function abrirExcel(archivo: string, datos: ArrayBuffer | Uint8Array): Promise<Libro> {
  const wb = new ExcelJS.Workbook();
  try {
    const buf = datos instanceof Uint8Array ? datos : new Uint8Array(datos);
    await wb.xlsx.load(buf as unknown as ArrayBuffer);
  } catch {
    throw new ErrorDeEntrada(`«${archivo}» no se pudo abrir. Verifica que sea un .xlsx válido.`);
  }
  return {
    archivo,
    hojas: wb.worksheets.map((ws) => {
      const filas: Celda[][] = [];
      ws.eachRow({ includeEmpty: true }, (row, n) => {
        const valores = (row.values as unknown[]).slice(1).map(valorDeCelda);
        filas[n - 1] = valores;
      });
      for (let i = 0; i < filas.length; i++) filas[i] ??= [];
      return { nombre: ws.name, filas };
    }),
  };
}

function valorDeCelda(v: unknown): Celda {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') return v;
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (Array.isArray(o.richText)) return (o.richText as { text: string }[]).map((r) => r.text).join('');
    if ('result' in o) return valorDeCelda(o.result);
    if ('formula' in o || 'sharedFormula' in o) return null;
    if (typeof o.text === 'string') return o.text;
    if ('error' in o) return null;
  }
  return String(v);
}
