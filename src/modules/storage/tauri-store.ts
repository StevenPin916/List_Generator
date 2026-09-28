import { load, type Store } from '@tauri-apps/plugin-store';
import { PREFERENCIAS_INICIALES, type AlmacenPreferencias, type Preferencias } from './contract';

/** %APPDATA%\com.listgenerator.app\preferencias.json: solo en este PC. */
export function almacenTauri(): AlmacenPreferencias {
  let store: Promise<Store> | null = null;
  const abrir = () => (store ??= load('preferencias.json', { defaults: {}, autoSave: 200 }));
  return {
    async cargar() {
      const s = await abrir();
      const p: Preferencias = structuredClone(PREFERENCIAS_INICIALES);
      for (const k of Object.keys(p) as (keyof Preferencias)[]) {
        const v = await s.get(k);
        if (v !== undefined && v !== null) (p as unknown as Record<string, unknown>)[k] = v;
      }
      return p;
    },
    async guardar(clave, valor) {
      const s = await abrir();
      await s.set(clave, valor);
    },
  };
}
