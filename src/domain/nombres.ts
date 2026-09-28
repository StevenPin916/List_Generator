import type { Asignacion, Factura } from './types';
import { normalizar } from './texto';

/**
 * Nombre final de cada factura. Si un nombre se repite en el día, la primera
 * factura lo lleva solo y las siguientes "NOMBRE 2", "NOMBRE 3"… por orden de
 * factura. "tx" y "TX" cuentan como el mismo nombre.
 */
export function numerarRepetidos(
  facturas: readonly Factura[],
  asignaciones: ReadonlyMap<string, Asignacion>,
  nombreBase: (a: Asignacion) => string,
): Map<string, string> {
  const vistos = new Map<string, number>();
  const nombres = new Map<string, string>();
  for (const f of facturas) {
    const a = asignaciones.get(f.id);
    if (!a) continue;
    const base = nombreBase(a).trim();
    const k = normalizar(base);
    const n = (vistos.get(k) ?? 0) + 1;
    vistos.set(k, n);
    nombres.set(f.id, n === 1 ? base : `${base} ${n}`);
  }
  return nombres;
}

const PALABRAS_VACIAS = new Set([
  'SAS', 'S.A.S', 'S.A.S.', 'SA', 'S.A', 'S.A.', 'LTDA', 'CORPORACION', 'FUNDACION',
  'INVERSIONES', 'ORGANIZACION', 'EDUCATIVA', 'COLEGIO', 'CLUB', 'CAMPESTRE',
  'DE', 'LA', 'LAS', 'LOS', 'EL', 'DEL', 'Y', 'FIDEICOMISO', 'G', 'H',
]);

/**
 * Alias sugerido para un cliente nuevo. Con sucursal: "CENTRO INTERNACIONAL" → "C.INTERNAC".
 * Sin sucursal: la palabra más distintiva del nombre. Máximo 10 caracteres.
 */
export function sugerirAlias(nombre: string, sucursal: string): string {
  const armar = (p: string[], conSucursal: boolean): string => {
    if (p.length > 1 && p[0].length <= 3) return `${p[0][0]}.${p[1]}`.slice(0, 10);
    if (p.length > 1 && conSucursal) return `${p[0][0]}.${p.slice(1).join('')}`.slice(0, 10);
    return (p[0] ?? '').slice(0, 10);
  };
  if (normalizar(sucursal)) return armar(normalizar(sucursal).split(' '), true);
  const palabras = normalizar(nombre)
    .replace(/[^A-Z0-9. ]/g, ' ')
    .split(' ')
    .filter((w) => w && !PALABRAS_VACIAS.has(w) && !/^\d+$/.test(w));
  return armar(palabras.length ? palabras : normalizar(nombre).split(' '), false);
}
