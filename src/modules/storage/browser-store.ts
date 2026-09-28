import { PREFERENCIAS_INICIALES, type AlmacenPreferencias, type Preferencias } from './contract';

/** Para desarrollo en el navegador: localStorage. */
export function almacenNavegador(prefijo = 'list-generator:'): AlmacenPreferencias {
  return {
    async cargar() {
      const p: Preferencias = structuredClone(PREFERENCIAS_INICIALES);
      for (const k of Object.keys(p) as (keyof Preferencias)[]) {
        try {
          const v = localStorage.getItem(prefijo + k);
          if (v !== null) (p as unknown as Record<string, unknown>)[k] = JSON.parse(v);
        } catch {
          /* sin almacenamiento: se queda el valor inicial */
        }
      }
      return p;
    },
    async guardar(clave, valor) {
      try {
        localStorage.setItem(prefijo + clave, JSON.stringify(valor));
      } catch {
        /* sin almacenamiento disponible */
      }
    },
  };
}
