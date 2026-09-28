import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppApi } from '../app/contexto';
import { compararEs, normalizar } from '../domain';
import { IconoBuscar, IconoCerrar } from './iconos';
import { EASE } from './movimiento';

interface Fila { clave: string; cliente: string; sucursal: string; alias: string; nuevo: boolean; hoy: boolean }

export function PanelAlias({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { clientesDelDia, prefs, editarAlias } = useAppApi();
  const [q, setQ] = useState('');
  const buscador = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const t = setTimeout(() => buscador.current?.focus(), 120);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    return () => { clearTimeout(t); window.removeEventListener('keydown', esc); };
  }, [abierto, onCerrar]);

  const filas: Fila[] = useMemo(() => {
    const hoy = clientesDelDia.map((c) => ({ clave: c.clave, cliente: c.nombre, sucursal: c.sucursal, alias: c.alias, nuevo: c.nuevo, hoy: true }));
    const vistos = new Set(hoy.map((f) => f.clave));
    const otros = Object.entries(prefs.alias)
      .filter(([k]) => !vistos.has(k))
      .map(([clave, a]) => ({ clave, cliente: a.cliente, sucursal: a.sucursal, alias: a.alias, nuevo: false, hoy: false }));
    const nq = normalizar(q);
    return [...hoy, ...otros]
      .filter((f) => !nq || normalizar(`${f.cliente} ${f.sucursal} ${f.alias}`).includes(nq))
      .sort((a, b) => Number(b.nuevo) - Number(a.nuevo) || Number(b.hoy) - Number(a.hoy) || compararEs(a.cliente, b.cliente));
  }, [clientesDelDia, prefs.alias, q]);

  return (
    <AnimatePresence>
      {abierto && (
        <>
          <motion.div className="scrim" onClick={onCerrar} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
          <motion.aside
            className="drawer"
            aria-label="Alias de clientes"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.34, ease: EASE }}
          >
            <header>
              <div className="grow">
                <h2>Alias de clientes</h2>
                <p className="sub">El nombre corto que sale en la columna Clientes. Se guarda solo en este PC.</p>
              </div>
              <button className="btn ghost sm" type="button" onClick={onCerrar} aria-label="Cerrar"><IconoCerrar /></button>
            </header>
            <div style={{ padding: '0 28px 8px' }}>
              <label className="search">
                <IconoBuscar />
                <input ref={buscador} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por cliente, sucursal o alias" aria-label="Buscar alias" />
              </label>
            </div>
            <div className="list">
              {filas.map((f) => (
                <div className="arow" key={f.clave}>
                  <div style={{ minWidth: 0 }}>
                    <div className="cn">{f.cliente}</div>
                    <div className="sc">
                      {f.sucursal || 'Sin sucursal'}
                      {f.nuevo && <span className="chip new" style={{ height: 22, fontSize: 12 }}>sugerido</span>}
                      {!f.hoy && <span className="chip" style={{ height: 22, fontSize: 12 }}>no pidió hoy</span>}
                    </div>
                  </div>
                  <input
                    defaultValue={f.alias}
                    maxLength={14}
                    aria-label={`Alias de ${f.cliente} ${f.sucursal}`}
                    onChange={(e) => editarAlias(f.clave, e.target.value.trim())}
                  />
                </div>
              ))}
              {!filas.length && <div className="empty-msg">{q ? 'Ningún cliente coincide con la búsqueda.' : 'Todavía no hay alias. Aparecen cuando cargas el archivo de clientes.'}</div>}
            </div>
            <footer>Se guarda mientras escribes. Los alias sugeridos quedan recordados al guardar la Salida.</footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
