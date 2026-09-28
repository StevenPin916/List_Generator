import { PREFERENCIAS_INICIALES, type AlmacenPreferencias, type Preferencias } from './contract';

export function almacenEnMemoria(inicial: Partial<Preferencias> = {}): AlmacenPreferencias {
  const datos: Preferencias = { ...PREFERENCIAS_INICIALES, ...inicial };
  return {
    async cargar() {
      return structuredClone(datos);
    },
    async guardar(clave, valor) {
      datos[clave] = structuredClone(valor);
    },
  };
}
