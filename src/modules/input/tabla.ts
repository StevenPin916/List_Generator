import { normalizar } from '../../domain';
import type { Celda, Hoja } from './contract';

/** Utilidades compartidas por los adaptadores para leer tablas con títulos encima. */

export interface Encabezado {
  fila: number;
  /** nombre normalizado de la columna → índice */
  columnas: Map<string, number>;
}

export function buscarEncabezado(hoja: Hoja, requeridas: string[], maxFilas = 15): Encabezado | null {
  const req = requeridas.map(normalizar);
  for (let i = 0; i < Math.min(maxFilas, hoja.filas.length); i++) {
    const cols = new Map<string, number>();
    hoja.filas[i].forEach((c, j) => {
      const n = normalizar(c);
      if (n && !cols.has(n)) cols.set(n, j);
    });
    if (req.every((r) => cols.has(r))) return { fila: i, columnas: cols };
  }
  return null;
}

export function columna(enc: Encabezado, ...nombres: string[]): number | undefined {
  for (const n of nombres) {
    const i = enc.columnas.get(normalizar(n));
    if (i !== undefined) return i;
  }
  return undefined;
}

export function texto(c: Celda | undefined): string {
  if (c === null || c === undefined) return '';
  if (c instanceof Date) return c.toLocaleDateString('es-CO');
  return String(c).replace(/_x000D_/g, '').trim();
}

export function numero(c: Celda | undefined): number {
  if (typeof c === 'number') return c;
  const n = Number(texto(c));
  return Number.isFinite(n) ? n : 0;
}

/** Busca la fecha del reporte en las filas de título ("Entre 28/09/2026 Y 28/09/2026"). */
export function fechaDelTitulo(hoja: Hoja, filas = 5): string | null {
  const t = hoja.filas.slice(0, filas).flat().map(texto).join(' ');
  const fechas = t.match(/\d{1,2}\/\d{1,2}\/\d{4}/g);
  if (!fechas) return null;
  const [d, m, a] = fechas[fechas.length - 1].split('/');
  return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${a}`;
}

export function textoDelTitulo(hoja: Hoja, filas = 4): string {
  return normalizar(hoja.filas.slice(0, filas).flat().map(texto).join(' '));
}
