import type { Asignacion, ClientesDelDia, Factura, LineaVenta } from './types';
import { claveCliente, claveDocumento } from './texto';

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

/**
 * Cliente de cada factura según el ERP: la columna de cliente del reporte de ventas
 * o, si no la trae, el reporte que relaciona cada documento con su cliente.
 * Las facturas que no aparecen en ninguno quedan para asignar a mano.
 */
export function asignacionesDelERP(facturas: readonly Factura[], clientes: ClientesDelDia | null): Map<string, Asignacion> {
  const porDocumento = new Map((clientes?.documentos ?? []).map((d) => [claveDocumento(d.documento), d.cliente]));
  const asignaciones = new Map<string, Asignacion>();
  for (const f of facturas) {
    const c = f.clienteDelERP ?? porDocumento.get(claveDocumento(f.id));
    if (c) asignaciones.set(f.id, { tipo: 'cliente', clave: claveCliente(c.nombre, c.sucursal) });
  }
  return asignaciones;
}
