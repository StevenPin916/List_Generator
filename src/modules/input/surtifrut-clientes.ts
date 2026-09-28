import { claveCliente, type Cliente, type ClientesDelDia } from '../../domain';
import type { AdaptadorEntrada, Libro } from './contract';
import { buscarEncabezado, columna, fechaDelTitulo, textoDelTitulo, texto } from './tabla';

/** Reporte "Ventas Por Vendedor Por Cliente": Vendedor, Cliente, Sucursal, Teléfonos, Dirección… */
export const surtifrutClientes: AdaptadorEntrada = {
  id: 'surtifrut-clientes',
  descripcion: 'Ventas por vendedor por cliente',
  tipo: 'clientes',

  detectar(libro: Libro): number {
    const hoja = libro.hojas[0];
    if (!hoja) return 0;
    const enc = buscarEncabezado(hoja, ['Cliente', 'Sucursal']);
    if (!enc || enc.columnas.has('DOCUMENTO')) return 0;
    return textoDelTitulo(hoja).includes('POR CLIENTE') ? 1 : 0.8;
  },

  leer(libro: Libro): ClientesDelDia {
    const hoja = libro.hojas[0];
    const enc = buscarEncabezado(hoja, ['Cliente', 'Sucursal'])!;
    const cCli = columna(enc, 'Cliente')!;
    const cSuc = columna(enc, 'Sucursal')!;
    const vistos = new Set<string>();
    const clientes: Cliente[] = [];
    for (const fila of hoja.filas.slice(enc.fila + 1)) {
      const nombre = texto(fila[cCli]);
      if (!nombre) continue;
      const sucursal = texto(fila[cSuc]);
      const k = claveCliente(nombre, sucursal);
      if (vistos.has(k)) continue;
      vistos.add(k);
      clientes.push({ nombre, sucursal });
    }
    return { tipo: 'clientes', archivo: libro.archivo, fecha: fechaDelTitulo(hoja), clientes };
  },
};
