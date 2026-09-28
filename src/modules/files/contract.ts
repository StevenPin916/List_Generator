/** Operaciones de archivos del sistema. La app nunca toca el disco por otro camino. */
export interface ServicioArchivos {
  /** Diálogo para elegir la carpeta de listas. null si se cancela. */
  elegirCarpeta(titulo: string): Promise<string | null>;
  unir(carpeta: string, nombre: string): string;
  existe(ruta: string): Promise<boolean>;
  escribir(ruta: string, datos: Uint8Array): Promise<void>;
  abrir(ruta: string): Promise<void>;
  mostrarEnCarpeta(ruta: string): Promise<void>;
}

/** El archivo está abierto en Excel u otro programa. */
export class ArchivoEnUso extends Error {}
