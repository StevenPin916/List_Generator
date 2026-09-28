import ExcelJS from 'exceljs';
import type { ModeloSalida } from '../../domain';
import type { FormatoSalida } from './contract';

/**
 * Libro con 3 hojas:
 *  1. "Items A-Z": el formato exacto de la Salida manual (Descripcion, Cant, Val, Clientes).
 *  2. "Por cliente": un bloque por factura con sus productos y subtotal.
 *  3. "Clientes": quién pidió hoy, con alias final, factura y total.
 */

const NEGRO = { argb: 'FF000000' };
const NAVY = { argb: 'FF000080' };
const FUENTE: Partial<ExcelJS.Font> = { name: 'Calibri', size: 11, family: 2, color: NEGRO };
const FUENTE_ENC: Partial<ExcelJS.Font> = { ...FUENTE, bold: true, color: NAVY };
const LINEA: Partial<ExcelJS.Border> = { style: 'thin', color: NEGRO };
const BORDE: Partial<ExcelJS.Borders> = { top: LINEA, left: LINEA, bottom: LINEA, right: LINEA };
const FONDO_BLOQUE: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
const MARGENES = { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
const ALTO = 18;
const FMT_CANT = '#,##0.00';
const FMT_PESOS = '#,##0';

function encabezado(row: ExcelJS.Row) {
  row.height = ALTO;
  row.eachCell((c) => {
    c.font = FUENTE_ENC;
    c.border = BORDE;
    c.numFmt = '@';
    c.alignment = { horizontal: 'center', vertical: 'middle' };
  });
}

function celdas(row: ExcelJS.Row, formatos: (string | null)[], centradas: boolean[]) {
  row.height = ALTO;
  formatos.forEach((fmt, i) => {
    const c = row.getCell(i + 1);
    c.font = FUENTE;
    c.border = BORDE;
    if (fmt) c.numFmt = fmt;
    c.alignment = { vertical: 'middle', horizontal: centradas[i] ? 'center' : undefined };
  });
}

function hojaItems(wb: ExcelJS.Workbook, m: ModeloSalida) {
  const ws = wb.addWorksheet('Items A-Z', {
    pageSetup: { paperSize: 9, orientation: 'portrait', margins: MARGENES, printTitlesRow: '1:1' },
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  ws.columns = [{ width: 30.21875 }, { width: 6.109375 }, { width: 6.5546875 }, { width: 11.21875 }];
  encabezado(ws.addRow(['Descripcion', 'Cant', 'Val', 'Clientes']));
  for (const it of m.items) {
    const r = ws.addRow([it.descripcion, it.cantidad, it.valor, it.cliente]);
    celdas(r, [null, FMT_CANT, FMT_PESOS, null], [false, true, true, false]);
    r.getCell(4).alignment = { vertical: 'middle', shrinkToFit: true };
  }
  ws.autoFilter = `A1:D${m.items.length + 1}`;
}

function hojaPorCliente(wb: ExcelJS.Workbook, m: ModeloSalida) {
  const ws = wb.addWorksheet('Por cliente', {
    pageSetup: { paperSize: 9, orientation: 'portrait', margins: MARGENES, fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  ws.columns = [{ width: 32 }, { width: 9 }, { width: 10 }, { width: 13 }];
  for (const b of m.bloques) {
    const cab = ws.addRow([`${b.nombre}  ·  ${b.factura}  ·  ${b.items.length} ${b.items.length === 1 ? 'ítem' : 'ítems'}`]);
    ws.mergeCells(cab.number, 1, cab.number, 4);
    cab.height = 22;
    const c = cab.getCell(1);
    c.font = { ...FUENTE_ENC, size: 12 };
    c.fill = FONDO_BLOQUE;
    c.border = BORDE;
    c.alignment = { vertical: 'middle' };

    encabezado(ws.addRow(['Descripcion', 'Cant', 'Val', 'Total']));
    const desde = ws.rowCount + 1;
    for (const it of b.items) {
      const r = ws.addRow([it.descripcion, it.cantidad, it.valor, it.total]);
      celdas(r, [null, FMT_CANT, FMT_PESOS, FMT_PESOS], [false, true, true, true]);
    }
    const hasta = ws.rowCount;
    const sub = ws.addRow(['Subtotal', null, null, { formula: `SUM(D${desde}:D${hasta})`, result: b.total }]);
    ws.mergeCells(sub.number, 1, sub.number, 3);
    celdas(sub, [null, null, null, FMT_PESOS], [false, false, false, true]);
    sub.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
    sub.eachCell((cell) => (cell.font = { ...FUENTE, bold: true }));
    ws.addRow([]);
  }
}

function hojaClientes(wb: ExcelJS.Workbook, m: ModeloSalida) {
  const ws = wb.addWorksheet('Clientes', {
    pageSetup: { paperSize: 9, orientation: 'landscape', margins: MARGENES, fitToPage: true, fitToWidth: 1, fitToHeight: 0, printTitlesRow: '1:1' },
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  ws.columns = [{ width: 5 }, { width: 14 }, { width: 42 }, { width: 22 }, { width: 14 }, { width: 8 }, { width: 14 }];
  encabezado(ws.addRow(['#', 'Alias', 'Cliente', 'Sucursal', 'Factura', 'Ítems', 'Total']));
  m.bloques.forEach((b, i) => {
    const r = ws.addRow([
      i + 1,
      b.nombre,
      b.personalizado ? '(nombre personalizado)' : b.cliente,
      b.sucursal,
      b.factura,
      b.items.length,
      b.total,
    ]);
    celdas(r, ['0', null, null, null, null, '0', FMT_PESOS], [true, false, false, false, true, true, true]);
  });
  const n = m.bloques.length;
  const tot = ws.addRow([`TOTAL · ${n} ${n === 1 ? 'factura' : 'facturas'}`, null, null, null, null, null, { formula: `SUM(G2:G${n + 1})`, result: m.total }]);
  ws.mergeCells(tot.number, 1, tot.number, 6);
  celdas(tot, [null, null, null, null, null, null, FMT_PESOS], [false, false, false, false, false, false, true]);
  tot.getCell(1).alignment = { horizontal: 'right', vertical: 'middle' };
  tot.eachCell((cell) => (cell.font = { ...FUENTE, bold: true }));
  ws.autoFilter = `A1:G${n + 1}`;
}

export const salidaAlistamiento: FormatoSalida = {
  id: 'salida-alistamiento',

  nombreArchivo(fecha, version) {
    const f = fecha ?? new Date().toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    return `Salida ${f.replace(/\//g, '-')}${version > 1 ? ` (${version})` : ''}.xlsx`;
  },

  async escribir(modelo) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'List Generator';
    wb.created = new Date();
    hojaItems(wb, modelo);
    hojaPorCliente(wb, modelo);
    hojaClientes(wb, modelo);
    const buf = await wb.xlsx.writeBuffer();
    return new Uint8Array(buf as ArrayBuffer);
  },
};
