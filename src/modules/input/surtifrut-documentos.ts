import { claveCliente, normalizar, quitarCodigo, type Cliente, type ClientesDelDia } from '../../domain';
import type { AdaptadorEntrada, Libro } from './contract';
import { buscarEncabezado, columna, fechaDelTitulo, textoDelTitulo, texto } from './tabla';

const REQUERIDAS = ['Cliente', 'Documento'];

/**
 * Reporte "Ventas Por Documento": CC/Nit, Cliente, Sucursal, Fecha, Documento, Venta Bruta…
 * Una fila por factura con su cliente, así que reemplaza al reporte de clientes y
 * además dice de quién es cada factura. No trae productos (eso sigue en el de ventas).
 */
export const surtifrutDocumentos: AdaptadorEntrada = {
  id: 'surtifrut-documentos',
  descripcion: 'Ventas por documento (factura y cliente)',
  tipo: 'clientes',

  detectar(libro: Libro): number {
    const hoja = libro.hojas[0];
    if (!hoja) return 0;
    const enc = buscarEncabezado(hoja, REQUERIDAS);
    if (!enc || enc.columnas.has('DESCRIPCION')) return 0;
    return textoDelTitulo(hoja).includes('POR DOCUMENTO') ? 1 : 0.9;
  },

  leer(libro: Libro): ClientesDelDia {
    const hoja = libro.hojas[0];
    const enc = buscarEncabezado(hoja, REQUERIDAS)!;
    const cCli = columna(enc, 'Cliente')!;
    const cDoc = columna(enc, 'Documento')!;
    const cSuc = columna(enc, 'Sucursal');
    const vistos = new Set<string>();
    const clientes: Cliente[] = [];
    const documentos: { documento: string; cliente: Cliente }[] = [];
    for (const fila of hoja.filas.slice(enc.fila + 1)) {
      const nombre = texto(fila[cCli]);
      const documento = texto(fila[cDoc]).replace(/\s+/g, ' ');
      if (!nombre || !documento || normalizar(nombre) === 'TOTAL GENERAL') continue;
      // "3 CENTRO INTERNACIONAL" → "CENTRO INTERNACIONAL", igual que en el reporte de clientes,
      // para que los alias ya recordados sigan sirviendo.
      const sucursal = cSuc !== undefined ? quitarCodigo(texto(fila[cSuc])) : '';
      const cliente = { nombre, sucursal };
      documentos.push({ documento, cliente });
      const k = claveCliente(nombre, sucursal);
      if (vistos.has(k)) continue;
      vistos.add(k);
      clientes.push(cliente);
    }
    return { tipo: 'clientes', archivo: libro.archivo, fecha: fechaDelTitulo(hoja, enc.fila), clientes, documentos };
  },
};
