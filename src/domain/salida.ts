import type { Asignacion, Factura } from './types';
import { compararEs, quitarCodigo, redondear } from './texto';

export interface FilaItem {
  descripcion: string;
  cantidad: number;
  valor: number;
  cliente: string;
}

export interface ItemBloque {
  descripcion: string;
  cantidad: number;
  valor: number;
  total: number;
}

export interface BloqueCliente {
  /** Nombre final (TX, TX 2…). */
  nombre: string;
  factura: string;
  cliente: string;
  sucursal: string;
  personalizado: boolean;
  items: ItemBloque[];
  total: number;
}

/** Todo lo que necesita un formato de salida; no sabe nada de Excel. */
export interface ModeloSalida {
  fecha: string | null;
  /** Hoja "Items A-Z": una fila por línea de venta. */
  items: FilaItem[];
  /** Hojas "Por cliente" y "Clientes": un bloque por factura. */
  bloques: BloqueCliente[];
  total: number;
}

export interface DetalleAsignacion {
  cliente: string;
  sucursal: string;
  personalizado: boolean;
}

export function construirSalida(
  fecha: string | null,
  facturas: readonly Factura[],
  asignaciones: ReadonlyMap<string, Asignacion>,
  nombres: ReadonlyMap<string, string>,
  detalle: (a: Asignacion) => DetalleAsignacion,
): ModeloSalida {
  const pendientes = facturas.filter((f) => !nombres.has(f.id)).map((f) => f.id);
  if (pendientes.length) {
    throw new Error(`Faltan facturas por asignar: ${pendientes.join(', ')}`);
  }

  // El orden de las líneas en el archivo se conserva dentro de cada producto (sort estable).
  const lineas = facturas
    .flatMap((f) => f.lineas.map((l) => ({ l, cliente: nombres.get(f.id)! })))
    .map(({ l, cliente }) => ({
      descripcion: quitarCodigo(l.descripcion),
      cantidad: redondear(l.cantidad),
      valor: l.valorUnit,
      cliente,
    }));
  const items = [...lineas].sort((a, b) => compararEs(a.descripcion, b.descripcion));

  const bloques: BloqueCliente[] = facturas
    .map((f) => {
      const d = detalle(asignaciones.get(f.id)!);
      const its = f.lineas
        .map((l) => ({
          descripcion: quitarCodigo(l.descripcion),
          cantidad: redondear(l.cantidad),
          valor: l.valorUnit,
          total: redondear(l.total, 2),
        }))
        .sort((a, b) => compararEs(a.descripcion, b.descripcion));
      return {
        nombre: nombres.get(f.id)!,
        factura: f.id,
        cliente: d.cliente,
        sucursal: d.sucursal,
        personalizado: d.personalizado,
        items: its,
        total: redondear(its.reduce((t, i) => t + i.total, 0), 2),
      };
    })
    .sort((a, b) => compararEs(a.nombre, b.nombre));

  return {
    fecha,
    items,
    bloques,
    total: redondear(bloques.reduce((t, b) => t + b.total, 0), 2),
  };
}
