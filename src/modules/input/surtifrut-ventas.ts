import { normalizar, type LineaVenta, type VentasDelDia } from '../../domain';
import type { AdaptadorEntrada, Libro } from './contract';
import { buscarEncabezado, columna, fechaDelTitulo, numero, textoDelTitulo, texto } from './tabla';

const REQUERIDAS = ['Documento', 'Descripcion', 'Cantidad'];

/**
 * Reporte "Ventas Por Producto Detallado por Documento":
 * Documento, Fecha, Descripcion, Dias, Cantidad, Valor Unit, …, GTotal y una fila TOTAL GENERAL.
 * Si trae una columna de cliente (Cliente / Tercero / Nombre Cliente), también la lee.
 */
export const surtifrutVentas: AdaptadorEntrada = {
  id: 'surtifrut-ventas',
  descripcion: 'Ventas por producto detallado por documento',
  tipo: 'ventas',

  detectar(libro: Libro): number {
    const hoja = libro.hojas[0];
    if (!hoja || !buscarEncabezado(hoja, REQUERIDAS)) return 0;
    return textoDelTitulo(hoja).includes('POR DOCUMENTO') ? 1 : 0.8;
  },

  leer(libro: Libro): VentasDelDia {
    const hoja = libro.hojas[0];
    const enc = buscarEncabezado(hoja, REQUERIDAS)!;
    const c = {
      doc: columna(enc, 'Documento')!,
      desc: columna(enc, 'Descripcion')!,
      cant: columna(enc, 'Cantidad')!,
      val: columna(enc, 'Valor Unit', 'Valor Unitario', 'Precio'),
      dias: columna(enc, 'Dias'),
      total: columna(enc, 'GTotal', 'Total', 'Venta Neta'),
      cli: columna(enc, 'Cliente', 'Tercero', 'Nombre Cliente', 'Razon Social'),
      suc: columna(enc, 'Sucursal'),
    };
    const lineas: LineaVenta[] = [];
    let totalERP: number | null = null;
    for (const fila of hoja.filas.slice(enc.fila + 1)) {
      const doc = texto(fila[c.doc]).replace(/\s+/g, ' ');
      if (!doc) continue;
      if (normalizar(doc) === 'TOTAL GENERAL') {
        if (c.total !== undefined) totalERP = numero(fila[c.total]);
        break;
      }
      const descripcion = texto(fila[c.desc]);
      if (!descripcion) continue;
      const cantidad = numero(fila[c.cant]);
      const valorUnit = c.val !== undefined ? numero(fila[c.val]) : 0;
      const nombreCli = c.cli !== undefined ? texto(fila[c.cli]) : '';
      lineas.push({
        documento: doc,
        descripcion,
        cantidad,
        valorUnit,
        dias: c.dias !== undefined ? numero(fila[c.dias]) : 0,
        total: c.total !== undefined ? numero(fila[c.total]) : cantidad * valorUnit,
        cliente: nombreCli
          ? { nombre: nombreCli, sucursal: c.suc !== undefined ? texto(fila[c.suc]) : '' }
          : undefined,
      });
    }
    return { tipo: 'ventas', archivo: libro.archivo, fecha: fechaDelTitulo(hoja), lineas, totalERP };
  },
};
