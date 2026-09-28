import type { Factura, LineaVenta } from './types';

/** Agrupa las líneas por documento y ordena por serie y número. */
export function agruparFacturas(lineas: readonly LineaVenta[]): Factura[] {
  const porId = new Map<string, Factura>();
  for (const l of lineas) {
    let f = porId.get(l.documento);
    if (!f) {
      const m = l.documento.match(/^(.*?)(\d+)\s*$/);
      f = {
        id: l.documento,
        prefijo: m ? m[1].trim() : l.documento,
        numero: m ? Number(m[2]) : 0,
        dias: l.dias,
        lineas: [],
        total: 0,
        negativa: false,
        clienteDelERP: l.cliente,
      };
      porId.set(l.documento, f);
    }
    f.lineas.push(l);
    f.total += l.total;
    if (l.cantidad < 0) f.negativa = true;
  }
  return [...porId.values()].sort(
    (a, b) => a.prefijo.localeCompare(b.prefijo) || a.numero - b.numero,
  );
}
