import type { ModeloSalida } from '../../domain';

/** Un formato de salida convierte el modelo del día en un archivo. */
export interface FormatoSalida {
  id: string;
  nombreArchivo(fecha: string | null, version: number): string;
  escribir(modelo: ModeloSalida): Promise<Uint8Array>;
}
