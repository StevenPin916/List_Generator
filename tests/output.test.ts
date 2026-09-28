import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import { agruparFacturas, construirSalida, numerarRepetidos, type Asignacion } from '../src/domain';
import { salidaAlistamiento } from '../src/modules/output/salida-alistamiento';
import { leerArchivo } from '../src/modules/input/registry';
import type { VentasDelDia } from '../src/domain';
import { TOTAL, libroVentas } from './fixtures/erp';

async function generar() {
  const v = (await leerArchivo('ventas.xlsx', await libroVentas())) as VentasDelDia;
  const facturas = agruparFacturas(v.lineas);
  const asig = new Map<string, Asignacion>(
    facturas.map((f, i) => [f.id, { tipo: 'personalizado', nombre: i < 2 ? 'TX' : `C${i}` }]),
  );
  const base = (a: Asignacion) => (a.tipo === 'personalizado' ? a.nombre : '');
  const nombres = numerarRepetidos(facturas, asig, base);
  const modelo = construirSalida(v.fecha, facturas, asig, nombres, () => ({ cliente: '', sucursal: '', personalizado: true }));
  const bytes = await salidaAlistamiento.escribir(modelo);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes as unknown as ArrayBuffer);
  return { wb, modelo };
}

describe('formato de salida', () => {
  it('nombra el archivo con la fecha y la versión', () => {
    expect(salidaAlistamiento.nombreArchivo('28/09/2026', 1)).toBe('Salida 28-09-2026.xlsx');
    expect(salidaAlistamiento.nombreArchivo('28/09/2026', 2)).toBe('Salida 28-09-2026 (2).xlsx');
  });

  it('crea las 3 hojas', async () => {
    const { wb } = await generar();
    expect(wb.worksheets.map((w) => w.name)).toEqual(['Items A-Z', 'Por cliente', 'Clientes']);
  });

  it('la hoja Items A-Z respeta el formato de la Salida manual', async () => {
    const { wb, modelo } = await generar();
    const ws = wb.getWorksheet('Items A-Z')!;
    expect(ws.getRow(1).values).toEqual([, 'Descripcion', 'Cant', 'Val', 'Clientes']);
    const h = ws.getCell('A1');
    expect(h.font.bold).toBe(true);
    expect(h.font.color?.argb).toBe('FF000080');
    expect(h.alignment.horizontal).toBe('center');
    expect(ws.getColumn(1).width).toBeCloseTo(30.22, 2);
    expect(ws.getColumn(4).width).toBeCloseTo(11.22, 2);
    expect(ws.rowCount).toBe(modelo.items.length + 1);
    const b2 = ws.getCell('B2');
    expect(b2.numFmt).toBe('#,##0.00');
    expect(ws.getCell('C2').numFmt).toBe('#,##0');
    expect(b2.border.top?.style).toBe('thin');
    expect(ws.getRow(2).height).toBe(18);
    expect(ws.getCell('A2').value).toBe('AGRAZ');
    expect(ws.getCell('B2').value).toBe(-3);
    expect(ws.getCell('D2').value).toBe('TX');
    expect(ws.autoFilter).toBe(`A1:D${modelo.items.length + 1}`);
    expect(ws.pageSetup.paperSize).toBe(9);
    expect(ws.pageSetup.orientation).toBe('portrait');
  });

  it('la hoja Por cliente separa cada factura con subtotal', async () => {
    const { wb, modelo } = await generar();
    const ws = wb.getWorksheet('Por cliente')!;
    const cabeceras: number[] = [];
    ws.eachRow((r, n) => { if (String(r.getCell(1).value).includes('  ·  ')) cabeceras.push(n); });
    expect(cabeceras).toHaveLength(modelo.bloques.length);
    expect(modelo.bloques.map((b) => b.nombre)).toEqual(['C2', 'C3', 'C4', 'TX', 'TX 2']);

    const fTX = cabeceras[3];
    expect(ws.getCell(fTX, 1).value).toBe('TX  ·  COT 100  ·  2 ítems');
    expect(ws.getCell(fTX, 1).isMerged).toBe(true);
    expect(ws.getRow(fTX + 1).values).toEqual([, 'Descripcion', 'Cant', 'Val', 'Total']);
    const sub = ws.getRow(fTX + 4);
    expect(sub.getCell(1).value).toBe('Subtotal');
    expect(sub.getCell(4).value).toMatchObject({ formula: `SUM(D${fTX + 2}:D${fTX + 3})`, result: -3 * 24800 - 1.5 * 7800 });
    expect(ws.getCell(cabeceras[4], 1).value).toBe('TX 2  ·  FV FE 200  ·  3 ítems');
  });

  it('la hoja Clientes lista cada factura y cuadra con el TOTAL GENERAL', async () => {
    const { wb, modelo } = await generar();
    const ws = wb.getWorksheet('Clientes')!;
    expect(ws.getRow(1).values).toEqual([, '#', 'Alias', 'Cliente', 'Sucursal', 'Factura', 'Ítems', 'Total']);
    expect(ws.rowCount).toBe(modelo.bloques.length + 2);
    const tot = ws.getRow(ws.rowCount).getCell(7).value as { result: number };
    expect(tot.result).toBeCloseTo(TOTAL, 6);
  });
});
