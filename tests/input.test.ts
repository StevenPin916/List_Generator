import { describe, expect, it } from 'vitest';
import { leerArchivo, ErrorDeEntrada } from '../src/modules/input/registry';
import type { ClientesDelDia, VentasDelDia } from '../src/domain';
import { LINEAS, TOTAL, libroClientes, libroDesconocido, libroVentas } from './fixtures/erp';

describe('módulo de entrada', () => {
  it('reconoce el reporte de clientes y lo lee sin repetidos', async () => {
    const d = (await leerArchivo('clientes.xlsx', await libroClientes())) as ClientesDelDia;
    expect(d.tipo).toBe('clientes');
    expect(d.fecha).toBe('28/09/2026');
    expect(d.clientes).toHaveLength(4);
    expect(d.clientes[1]).toEqual({ nombre: 'HOTEL CENTRAL SAS', sucursal: 'CENTRO INTERNACIONAL' });
  });

  it('reconoce el reporte de ventas, normaliza el documento y cuadra con el TOTAL GENERAL', async () => {
    const d = (await leerArchivo('ventas.xlsx', await libroVentas())) as VentasDelDia;
    expect(d.tipo).toBe('ventas');
    expect(d.fecha).toBe('28/09/2026');
    expect(d.lineas).toHaveLength(LINEAS.length);
    expect(d.lineas[0].documento).toBe('COT 100');
    expect(d.lineas[0].cantidad).toBe(-3);
    expect(d.totalERP).toBe(TOTAL);
    expect(d.lineas.reduce((t, l) => t + l.total, 0)).toBeCloseTo(TOTAL, 6);
    expect(d.lineas.every((l) => l.cliente === undefined)).toBe(true);
  });

  it('lee la columna de cliente cuando el ERP la trae', async () => {
    const d = (await leerArchivo('ventas.xlsx', await libroVentas({ conCliente: true }))) as VentasDelDia;
    const l = d.lineas.find((x) => x.documento === 'FV FE 201')!;
    expect(l.cliente).toEqual({ nombre: 'HOTEL CENTRAL SAS', sucursal: 'NORTE' });
  });

  it('rechaza un Excel que no es de ningún formato conocido', async () => {
    await expect(leerArchivo('otro.xlsx', await libroDesconocido())).rejects.toBeInstanceOf(ErrorDeEntrada);
  });

  it('rechaza algo que no es un .xlsx', async () => {
    await expect(leerArchivo('x.xlsx', new TextEncoder().encode('hola'))).rejects.toThrow(/no se pudo abrir/);
  });
});
