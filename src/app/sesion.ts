import type { Asignacion, ClientesDelDia, VentasDelDia } from '../domain';

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
  | { tipo: 'cargar'; datos: ClientesDelDia | VentasDelDia; asignacionesERP?: Map<string, Asignacion>; primera: string | null }
  | { tipo: 'ir'; paso: Sesion['paso'] }
  | { tipo: 'seleccionar'; id: string | null }
  | { tipo: 'asignar'; id: string; asignacion: Asignacion | null; siguiente: string | null }
  | { tipo: 'deshacer' };

export function reducir(s: Sesion, a: Accion): Sesion {
  switch (a.tipo) {
    case 'cargar': {
      const nueva: Sesion = {
        ...s,
        [a.datos.tipo]: a.datos,
        paso: 1,
        historial: [],
        asignaciones: a.datos.tipo === 'ventas' ? (a.asignacionesERP ?? new Map()) : s.asignaciones,
      };
      if (a.datos.tipo === 'ventas') nueva.seleccion = a.primera;
      return nueva;
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
