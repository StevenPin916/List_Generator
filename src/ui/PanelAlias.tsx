import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useAppApi } from '../app/contexto';
import { compararEs, normalizar } from '../domain';
import { IconoBuscar, IconoCerrar, IconoFlecha } from './iconos';
import { EASE } from './movimiento';

interface Fila { clave: string; cliente: string; sucursal: string; hoy: boolean }

export function PanelAlias({ abierto, onCerrar }: { abierto: boolean; onCerrar: () => void }) {
  const { clientesDelDia, prefs, editarAlias } = useAppApi();
  const [q, setQ] = useState('');
  const [verRevisados, setVerRevisados] = useState(false);
  const buscador = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!abierto) return;
    setQ('');
    setVerRevisados(false);
    const t = setTimeout(() => buscador.current?.focus(), 120);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar();
    window.addEventListener('keydown', esc);
    return () => { clearTimeout(t); window.removeEventListener('keydown', esc); };
  }, [abierto, onCerrar]);

  // Foto del orden y de las secciones al abrir el panel: escribir un alias nunca mueve su fila.
  // Lo que edites en "Por revisar" pasa a "Revisados" la próxima vez que abras el panel.
  const foto = useMemo(() => {
    const hoy: Fila[] = clientesDelDia.map((c) => ({ clave: c.clave, cliente: c.nombre, sucursal: c.sucursal, hoy: true }));
    const vistos = new Set(hoy.map((f) => f.clave));
    const otros: Fila[] = Object.entries(prefs.alias)
      .filter(([k]) => !vistos.has(k))
      .map(([clave, a]) => ({ clave, cliente: a.cliente, sucursal: a.sucursal, hoy: false }));
    const orden = (a: Fila, b: Fila) => Number(b.hoy) - Number(a.hoy) || compararEs(a.cliente, b.cliente);
    const nuevos = new Set(clientesDelDia.filter((c) => c.nuevo).map((c) => c.clave));
    return {
      porRevisar: hoy.filter((f) => nuevos.has(f.clave)).sort(orden),
      revisados: [...hoy.filter((f) => !nuevos.has(f.clave)), ...otros].sort(orden),
    };
  }, [abierto]);

  // Valores en vivo (el alias que ves siempre es el actual).
  const aliasActual = (clave: string) =>
    clientesDelDia.find((c) => c.clave === clave)?.alias ?? prefs.alias[clave]?.alias ?? '';
  const esSugerido = (clave: string) => !prefs.alias[clave];

  const nq = normalizar(q);
  const coincide = (f: Fila) => !nq || normalizar(`${f.cliente} ${f.sucursal} ${aliasActual(f.clave)}`).includes(nq);
  const porRevisar = foto.porRevisar.filter(coincide);
  const revisados = foto.revisados.filter(coincide);
  const mostrarRevisados = verRevisados || (!!nq && revisados.length > 0);

  const fila = (f: Fila) => (
    <div className="arow" key={f.clave}>
      <div style={{ minWidth: 0 }}>
        <div className="cn">{f.cliente}</div>
        <div className="sc">
          {f.sucursal || 'Sin sucursal'}
          {esSugerido(f.clave)
            ? <span className="chip new" style={{ height: 22, fontSize: 12 }}>sugerido</span>
            : <span className="chip ok" style={{ height: 22, fontSize: 12 }}>guardado</span>}
          {!f.hoy && <span className="chip" style={{ height: 22, fontSize: 12 }}>no pidió hoy</span>}
        </div>
      </div>
      <input
        defaultValue={aliasActual(f.clave)}
        maxLength={14}
        aria-label={`Alias de ${f.cliente} ${f.sucursal}`}
        onChange={(e) => editarAlias(f.clave, e.target.value.trim())}
      />
    </div>
  );

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
              {foto.porRevisar.length > 0 && <div className="label group-label" style={{ paddingInline: 12 }}>Por revisar · {porRevisar.length}</div>}
              {porRevisar.map(fila)}
              {foto.porRevisar.length > 0 && !porRevisar.length && nq && <div className="empty-msg">Ninguno por revisar coincide.</div>}

              {foto.revisados.length > 0 && (
                <button type="button" className="fold inline" aria-expanded={mostrarRevisados} onClick={() => setVerRevisados((v) => !v)} style={{ marginTop: 8 }}>
                  <IconoFlecha className="chev" /> Revisados <span className="chip count">{revisados.length}</span>
                </button>
              )}
              <AnimatePresence initial={false}>
                {mostrarRevisados && (
                  <motion.div
                    key="revisados"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    style={{ overflow: 'hidden' }}
                  >
                    {revisados.map(fila)}
                  </motion.div>
                )}
              </AnimatePresence>

              {!foto.porRevisar.length && !foto.revisados.length && (
                <div className="empty-msg">Todavía no hay alias. Aparecen cuando cargas el archivo de clientes.</div>
              )}
              {!foto.porRevisar.length && foto.revisados.length > 0 && !mostrarRevisados && (
                <div className="empty-msg">Todos los alias están revisados. Ábrelos arriba si necesitas cambiar alguno.</div>
              )}
            </div>
            <footer>Se guarda mientras escribes. Lo que edites pasa a "Revisados" la próxima vez que abras este panel.</footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
