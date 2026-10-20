import { agruparFacturas, asignacionesDelERP, type Asignacion, type ClientesDelDia, type VentasDelDia } from '../domain';

/** Estado de la sesión del día. Vive solo en memoria: cada apertura arranca en ceros. */
export interface Sesion {
  paso: 1 | 2 | 3;
  clientes: ClientesDelDia | null;
  ventas: VentasDelDia | null;
  asignaciones: ReadonlyMap<string, Asignacion>;
  historial: readonly { id: string; previa?: Asignacion }[];
  seleccion: string | null;
}

export const SESION_VACIA: Sesion = {
  paso: 1,
  clientes: null,
  ventas: null,
  asignaciones: new Map(),
  historial: [],
  seleccion: null,
};

export type Accion =
  | { tipo: 'cargar'; datos: ClientesDelDia | VentasDelDia }
  | { tipo: 'ir'; paso: Sesion['paso'] }
  | { tipo: 'seleccionar'; id: string | null }
  | { tipo: 'asignar'; id: string; asignacion: Asignacion | null; siguiente: string | null }
  | { tipo: 'deshacer' };

export function reducir(s: Sesion, a: Accion): Sesion {
  switch (a.tipo) {
    case 'cargar': {
      const nueva: Sesion = { ...s, [a.datos.tipo]: a.datos, paso: 1, historial: [] };
      if (!nueva.ventas) return nueva;
      // Ventas nuevas arrancan en ceros; un reporte de clientes nuevo respeta lo ya asignado a mano.
      // En ambos casos el ERP pone el cliente de cada factura que conozca, en el orden que lleguen.
      const facturas = agruparFacturas(nueva.ventas.lineas);
      const asignaciones = new Map(a.datos.tipo === 'ventas' ? [] : s.asignaciones);
      asignacionesDelERP(facturas, nueva.clientes).forEach((v, id) => asignaciones.set(id, v));
      return { ...nueva, asignaciones, seleccion: facturas.find((f) => !asignaciones.has(f.id))?.id ?? null };
    }
    case 'ir':
      return { ...s, paso: a.paso };
    case 'seleccionar':
      return { ...s, seleccion: a.id };
    case 'asignar': {
      const asignaciones = new Map(s.asignaciones);
      if (a.asignacion) asignaciones.set(a.id, a.asignacion);
      else asignaciones.delete(a.id);
      return {
        ...s,
        asignaciones,
        historial: [...s.historial, { id: a.id, previa: s.asignaciones.get(a.id) }],
        seleccion: a.asignacion ? a.siguiente : a.id,
      };
    }
    case 'deshacer': {
      const ultimo = s.historial[s.historial.length - 1];
      if (!ultimo) return s;
      const asignaciones = new Map(s.asignaciones);
      if (ultimo.previa) asignaciones.set(ultimo.id, ultimo.previa);
      else asignaciones.delete(ultimo.id);
      return { ...s, asignaciones, historial: s.historial.slice(0, -1), seleccion: ultimo.id };
    }
  }
}
