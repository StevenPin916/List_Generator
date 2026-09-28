import type { ServicioArchivos } from './contract';

/** Para desarrollo en el navegador: guardar = descargar. */
export function archivosNavegador(): ServicioArchivos {
  return {
    async elegirCarpeta() {
      return 'Descargas';
    },
    unir(carpeta, nombre) {
      return `${carpeta}/${nombre}`;
    },
    async existe() {
      return false;
    },
    async escribir(ruta, datos) {
      const nombre = ruta.split('/').pop() ?? 'Salida.xlsx';
      const blob = new Blob([datos as BlobPart], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    async abrir() {},
    async mostrarEnCarpeta() {},
  };
}
