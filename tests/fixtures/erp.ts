import ExcelJS from 'exceljs';

/**
 * Libros sintéticos con la MISMA estructura de los reportes del ERP
 * (títulos combinados, fila de encabezados, fila TOTAL GENERAL).
 * Los datos son inventados: el repositorio es público y no lleva datos reales de clientes.
 */

export const CLIENTES = [
  ['VENDEDOR UNO', 'RESTAURANTE EL FOGON SAS', ''],
  ['', 'HOTEL CENTRAL SAS', 'CENTRO INTERNACIONAL'],
  ['', 'HOTEL CENTRAL SAS', 'NORTE'],
  ['', 'COLEGIO DE SAN MARTIN SAS', ''],
  ['', 'COLEGIO DE SAN MARTIN SAS', ''], // repetido: se ignora
] as const;

// [documento, descripcion, dias, cantidad, valorUnit]
export const LINEAS: [string, string, number, number, number][] = [
  ['COT  100', '08 AGRAZ', 30, -3, 24800],
  ['COT  100', '105 CILANTRO', 30, -1.5, 7800],
  ['FV FE 200', '286 PIÑA GOLDEN', 0, 10, 5800],
  ['FV FE 200', '281 PIMENTON  ROJO', 0, 2, 6800],
  ['FV FE 200', '290 PLATANO MADURO EXTRA', 0, 38.7, 5500],
  ['FV FE 201', '105 CILANTRO', 30, 0.5, 7800],
  ['FV FE 201', '08 AGRAZ', 30, 1, 24800],
  ['FV FE 202', '346 ZANAHORIA', 45, 4, 2300],
  ['FV FE 205', '105 CILANTRO', 0, 2, 7800],
];

export const TOTAL = LINEAS.reduce((t, [, , , c, v]) => t + c * v, 0);

async function aBytes(wb: ExcelJS.Workbook): Promise<Uint8Array> {
  return new Uint8Array((await wb.xlsx.writeBuffer()) as ArrayBuffer);
}

export async function libroClientes(): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('ExportarAExcel');
  ws.addRow(['DISTRIBUIDORA EJEMPLO SAS']);
  ws.addRow(['Ventas Por Vendedor Por Cliente entre 28/09/2026 Y 28/09/2026']);
  ws.mergeCells('A1:G1');
  ws.mergeCells('A2:G2');
  ws.addRow(['Vendedor', 'Cliente', 'Sucursal', 'Telefonos', 'Direccion', 'Ciudad', 'Departamento']);
  for (const [v, c, s] of CLIENTES) ws.addRow([v, c, s, '3000000000', 'CALLE 1 # 2-3', 'BOGOTA', 'Bogota D.C.']);
  return aBytes(wb);
}

export async function libroVentas(opciones: { conCliente?: boolean } = {}): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('ExportarAExcel');
  ws.addRow(['DISTRIBUIDORA EJEMPLO SAS']);
  ws.addRow(['Ventas Por Producto Detallado por Documento']);
  ws.addRow(['Entre 28/09/2026 Y 28/09/2026']);
  ws.mergeCells('A1:K1');
  ws.mergeCells('A2:K2');
  ws.mergeCells('A3:K3');
  const enc = ['Documento', 'Fecha', 'Descripcion', 'Dias', 'Cantidad', 'Valor Unit', 'Venta Bruta', 'Descto', 'Venta Neta', 'IVA', 'GTotal'];
  ws.addRow(opciones.conCliente ? [...enc, 'Cliente', 'Sucursal'] : enc);
  for (const [doc, desc, dias, cant, val] of LINEAS) {
    const t = cant * val;
    const fila: (string | number)[] = [doc, 46293, desc, dias, cant, val, t, 0, t, 0, t];
    if (opciones.conCliente) fila.push(doc.includes('201') ? 'HOTEL CENTRAL SAS' : 'RESTAURANTE EL FOGON SAS', doc.includes('201') ? 'NORTE' : '');
    ws.addRow(fila);
  }
  const n = LINEAS.length + 4;
  ws.addRow(['TOTAL GENERAL', null, null, null, null, null, null, null, null, null, { formula: `SUM(K5:K${n})`, result: TOTAL }]);
  return aBytes(wb);
}

export async function libroDesconocido(): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.addWorksheet('Hoja1').addRow(['Nombre', 'Edad']);
  return aBytes(wb);
}
