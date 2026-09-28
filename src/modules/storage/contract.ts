/**
 * Datos que la app recuerda entre sesiones, solo en este equipo.
 * La sesión del día (archivos y asignaciones) NUNCA se guarda: cada apertura arranca en ceros.
 */
export interface Preferencias {
  alias: Record<string, { cliente: string; sucursal: string; alias: string }>;
  carpeta: string | null;
  tema: 'claro' | 'oscuro';
}

export const PREFERENCIAS_INICIALES: Preferencias = { alias: {}, carpeta: null, tema: 'claro' };

export interface AlmacenPreferencias {
  cargar(): Promise<Preferencias>;
  guardar<K extends keyof Preferencias>(clave: K, valor: Preferencias[K]): Promise<void>;
}
