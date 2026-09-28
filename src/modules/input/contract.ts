import type { DatosDeEntrada } from '../../domain';

/** Representación genérica de un libro de Excel ya abierto. */
export type Celda = string | number | boolean | Date | null;

export interface Hoja {
  nombre: string;
  /** filas[i][j]: fila i, columna j, ambas desde 0. */
  filas: Celda[][];
}

export interface Libro {
  archivo: string;
  hojas: Hoja[];
}

/**
 * Un adaptador sabe reconocer y leer UN formato de reporte.
 * Si el ERP cambia su exporte, se escribe o edita un adaptador y se registra
 * en registry.ts. Nada más del código cambia.
 */
export interface AdaptadorEntrada {
  id: string;
  descripcion: string;
  tipo: DatosDeEntrada['tipo'];
  /** 0 = no es este formato; 1 = seguro que sí. */
  detectar(libro: Libro): number;
  leer(libro: Libro): DatosDeEntrada;
}

export class ErrorDeEntrada extends Error {}
