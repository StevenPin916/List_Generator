import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-dialog';
import { ArchivoEnUso, type ServicioArchivos } from './contract';

export function archivosTauri(): ServicioArchivos {
  return {
    async elegirCarpeta(titulo) {
      const r = await open({ directory: true, multiple: false, title: titulo });
      return typeof r === 'string' ? r : null;
    },
    unir(carpeta, nombre) {
      const sep = carpeta.includes('/') && !carpeta.includes('\\') ? '/' : '\\';
      return carpeta.replace(/[\\/]+$/, '') + sep + nombre;
    },
    existe(ruta) {
      return invoke<boolean>('existe_ruta', { ruta });
    },
    async escribir(ruta, datos) {
      try {
        await invoke('escribir_archivo', { ruta, datos: Array.from(datos) });
      } catch (e) {
        if (String(e).includes('EN_USO')) throw new ArchivoEnUso(ruta);
        throw new Error(String(e));
      }
    },
    abrir(ruta) {
      return invoke('abrir_ruta', { ruta });
    },
    mostrarEnCarpeta(ruta) {
      return invoke('mostrar_en_carpeta', { ruta });
    },
  };
}
