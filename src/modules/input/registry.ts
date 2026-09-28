import type { DatosDeEntrada } from '../../domain';
import { ErrorDeEntrada, type AdaptadorEntrada, type Libro } from './contract';
import { abrirExcel } from './excel-reader';
import { surtifrutClientes } from './surtifrut-clientes';
import { surtifrutVentas } from './surtifrut-ventas';

/** Formatos de entrada conocidos. Para soportar un reporte nuevo, agrégalo aquí. */
export const adaptadores: readonly AdaptadorEntrada[] = [surtifrutClientes, surtifrutVentas];

export function identificar(libro: Libro): AdaptadorEntrada | null {
  let mejor: AdaptadorEntrada | null = null;
  let puntaje = 0.5;
  for (const a of adaptadores) {
    const p = a.detectar(libro);
    if (p > puntaje) {
      mejor = a;
      puntaje = p;
    }
  }
  return mejor;
}

/** Abre el archivo, reconoce su formato y devuelve los datos del día. */
export async function leerArchivo(archivo: string, datos: ArrayBuffer | Uint8Array): Promise<DatosDeEntrada> {
  const libro = await abrirExcel(archivo, datos);
  const adaptador = identificar(libro);
  if (!adaptador) {
    throw new ErrorDeEntrada(`«${archivo}» no parece el reporte de clientes ni el de ventas por documento.`);
  }
  const datosLeidos = adaptador.leer(libro);
  if (datosLeidos.tipo === 'ventas' && datosLeidos.lineas.length === 0) {
    throw new ErrorDeEntrada(`«${archivo}» no tiene líneas de venta.`);
  }
  if (datosLeidos.tipo === 'clientes' && datosLeidos.clientes.length === 0) {
    throw new ErrorDeEntrada(`«${archivo}» no tiene clientes.`);
  }
  return datosLeidos;
}

export { ErrorDeEntrada };
