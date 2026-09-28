// Modelo del negocio. No conoce Excel, Tauri ni React.

export interface Cliente {
  nombre: string;
  sucursal: string;
}

export interface LineaVenta {
  documento: string;
  descripcion: string;
  dias: number;
  cantidad: number;
  valorUnit: number;
  total: number;
  /** Solo si el reporte del ERP trae la columna de cliente. */
  cliente?: Cliente;
}

export interface ClientesDelDia {
  tipo: 'clientes';
  archivo: string;
  fecha: string | null;
  clientes: Cliente[];
}

export interface VentasDelDia {
  tipo: 'ventas';
  archivo: string;
  fecha: string | null;
  lineas: LineaVenta[];
  /** El TOTAL GENERAL que reporta el ERP, para verificar que no se perdió nada. */
  totalERP: number | null;
}

export type DatosDeEntrada = ClientesDelDia | VentasDelDia;

export interface Factura {
  id: string;
  prefijo: string;
  numero: number;
  dias: number;
  lineas: LineaVenta[];
  total: number;
  /** Cotización o devolución: cantidades negativas. */
  negativa: boolean;
  clienteDelERP?: Cliente;
}

export type Asignacion =
  | { tipo: 'cliente'; clave: string }
  | { tipo: 'personalizado'; nombre: string };

export interface Alias {
  cliente: string;
  sucursal: string;
  alias: string;
}

/** Diccionario de alias: clave de cliente → alias. */
export type DiccionarioAlias = ReadonlyMap<string, Alias>;
