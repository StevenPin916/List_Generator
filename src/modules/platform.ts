import type { ServicioArchivos } from './files/contract';
import type { AlmacenPreferencias } from './storage/contract';
import type { FormatoSalida } from './output/contract';
import { salidaAlistamiento } from './output/salida-alistamiento';

export interface Plataforma {
  preferencias: AlmacenPreferencias;
  archivos: ServicioArchivos;
  salida: FormatoSalida;
  esEscritorio: boolean;
}

/** Arma los módulos según dónde corre la app: ventana de Windows (Tauri) o navegador (desarrollo). */
export async function crearPlataforma(): Promise<Plataforma> {
  const esEscritorio = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  if (esEscritorio) {
    const [{ almacenTauri }, { archivosTauri }] = await Promise.all([
      import('./storage/tauri-store'),
      import('./files/tauri-files'),
    ]);
    return { preferencias: almacenTauri(), archivos: archivosTauri(), salida: salidaAlistamiento, esEscritorio };
  }
  const [{ almacenNavegador }, { archivosNavegador }] = await Promise.all([
    import('./storage/browser-store'),
    import('./files/browser-files'),
  ]);
  return { preferencias: almacenNavegador(), archivos: archivosNavegador(), salida: salidaAlistamiento, esEscritorio };
}
