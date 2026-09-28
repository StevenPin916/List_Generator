import { createContext, useContext, type ReactNode } from 'react';
import type { Plataforma } from '../modules/platform';
import { useApp, type AppApi } from './useApp';

const Ctx = createContext<AppApi | null>(null);

export function ProveedorApp({ plataforma, children }: { plataforma: Plataforma; children: ReactNode }) {
  const api = useApp(plataforma);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAppApi(): AppApi {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppApi fuera de ProveedorApp');
  return v;
}
