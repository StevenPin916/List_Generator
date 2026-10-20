/** Mayúsculas, sin tildes y con espacios simples: para comparar, nunca para mostrar. */
export function normalizar(texto: unknown): string {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Clave estable de un cliente con su sucursal. */
export function claveCliente(nombre: string, sucursal: string): string {
  return `${normalizar(nombre)}|${normalizar(sucursal)}`;
}

/** "FV FE26580" y "FV FE 26580" son la misma factura en los dos reportes del ERP. */
export function claveDocumento(documento: string): string {
  return normalizar(documento).replace(/ /g, '');
}

/** "08 AGRAZ" → "AGRAZ". Respeta los espacios internos ("PIMENTON  ROJO"). */
export function quitarCodigo(descripcion: string): string {
  return String(descripcion).replace(/^\s*\d+\s+/, '').trim();
}

export function redondear(n: number, decimales = 3): number {
  const f = 10 ** decimales;
  return Math.round(n * f) / f;
}

/** Orden alfabético en español (Ñ en su sitio, sin distinguir tildes). */
export function compararEs(a: string, b: string): number {
  return a.localeCompare(b, 'es', { sensitivity: 'base', numeric: true });
}
