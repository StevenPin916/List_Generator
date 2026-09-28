import { claveCliente, sugerirAlias, type Cliente } from '../domain';
import type { Preferencias } from '../modules/storage/contract';

export type AliasGuardados = Preferencias['alias'];

export interface ClienteDelDia extends Cliente {
  clave: string;
  alias: string;
  /** Nunca se ha guardado un alias para este cliente: el alias es una sugerencia. */
  nuevo: boolean;
}

/** Une los clientes del día con los alias recordados en este PC. */
export function clientesConAlias(clientes: readonly Cliente[], guardados: AliasGuardados): ClienteDelDia[] {
  return clientes.map((c) => {
    const clave = claveCliente(c.nombre, c.sucursal);
    const g = guardados[clave];
    return { ...c, clave, alias: g?.alias ?? sugerirAlias(c.nombre, c.sucursal), nuevo: !g };
  });
}
