import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import type { ClienteDelDia } from '../../app/alias';
import { useAppApi } from '../../app/contexto';
import { normalizar, type Asignacion, type Factura } from '../../domain';
import { pesos, plural } from '../formato';
import { IconoBuscar, IconoFlecha, IconoLapiz } from '../iconos';
import { EASE, NumeroAnimado } from '../movimiento';

export function PasoAsignar() {
  const { facturas, pendientes, sesion, nombres, seleccionar, deshacer, ir, todoAsignado } = useAppApi();
  const [verAsignadas, setVerAsignadas] = useState(false);
  const asignadas = facturas.filter((f) => sesion.asignaciones.has(f.id));
  const actual = facturas.find((f) => f.id === sesion.seleccion) ?? null;

  // Siempre hay una factura seleccionada mientras queden pendientes.
  useEffect(() => {
    if (!actual && pendientes.length) seleccionar(pendientes[0].id);
  }, [actual, pendientes, seleccionar]);

  useEffect(() => {
    const tecla = (e: globalThis.KeyboardEvent) => {
      const t = e.target as HTMLInputElement;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'Enter') {
        if (todoAsignado) ir(3);
        e.preventDefault();
      } else if (mod && e.key.toLowerCase() === 'z' && !(t.tagName === 'INPUT' && t.value)) {
        e.preventDefault();
        deshacer();
      } else if (e.altKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && pendientes.length) {
        e.preventDefault();
        const i = pendientes.findIndex((f) => f.id === sesion.seleccion);
        const n = i < 0 ? 0 : Math.max(0, Math.min(pendientes.length - 1, i + (e.key === 'ArrowDown' ? 1 : -1)));
        seleccionar(pendientes[n].id);
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [todoAsignado, ir, deshacer, pendientes, sesion.seleccion, seleccionar]);

  const pct = facturas.length ? (asignadas.length / facturas.length) * 100 : 0;

  return (
    <>
      <div className="assign">
        <div className="docs">
          <div className="docs-head">
            <div className="row">
              <span><b><NumeroAnimado valor={asignadas.length} /></b> de {facturas.length} asignadas</span>
            </div>
            <div className="progress"><motion.i initial={false} animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 170, damping: 20 }} /></div>
          </div>

          <div className="label group-label">Pendientes · {pendientes.length}</div>
          <AnimatePresence initial={false}>
            {pendientes.map((f) => (
              <motion.button
                key={f.id}
                type="button"
                className="doc"
                aria-selected={f.id === sesion.seleccion}
                onClick={() => seleccionar(f.id)}
                layout="position"
                exit={{ opacity: 0, x: 48, height: 0, minHeight: 0, paddingTop: 0, paddingBottom: 0, borderBottomWidth: 0 }}
                transition={{ duration: 0.26, ease: EASE }}
              >
                <span className="id">{f.id}</span>
                <span className="tot">{pesos(f.total)}</span>
                <span className="meta">
                  {plural(f.lineas.length, 'línea', 'líneas')} · {f.dias} días
                  {f.negativa && <span className="chip neg" style={{ height: 24 }}>Negativa</span>}
                </span>
              </motion.button>
            ))}
          </AnimatePresence>
          {!pendientes.length && (
            <motion.div className="allset" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <strong>Todas las facturas tienen dueño</strong>
              <span>Revisa abajo o sigue a la salida.</span>
            </motion.div>
          )}

          <button className="fold" type="button" aria-expanded={verAsignadas} onClick={() => setVerAsignadas((v) => !v)}>
            <IconoFlecha className="chev" /> Asignadas <span className="chip count">{asignadas.length}</span>
          </button>
          <AnimatePresence initial={false}>
            {verAsignadas && asignadas.map((f) => (
              <FilaAsignada key={f.id} factura={f} asignacion={sesion.asignaciones.get(f.id)!} nombre={nombres.get(f.id) ?? ''} />
            ))}
          </AnimatePresence>
        </div>

        <div className="detail">
          <AnimatePresence mode="wait" initial={false}>
            {actual ? (
              <motion.div
                key={actual.id}
                style={{ display: 'flex', flexDirection: 'column', minHeight: 0, flex: 1 }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: EASE }}
              >
                <Detalle factura={actual} />
              </motion.div>
            ) : (
              <motion.div key="listo" className="allset" style={{ margin: 'auto' }} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <strong>Listo, {facturas.length} de {facturas.length} facturas asignadas</strong>
                <span>Puedes corregir cualquiera desde la lista de asignadas.</span>
                <button className="btn primary" type="button" style={{ marginTop: 12 }} onClick={() => ir(3)}>
                  Ver la salida <span className="kbd">Ctrl Enter</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="footer surface-t">
        <span className="hint keys">
          <span className="kbd">↑</span><span className="kbd">↓</span> elegir · <span className="kbd">Enter</span> asignar y seguir ·{' '}
          <span className="kbd">Ctrl Z</span> deshacer · <span className="kbd">Alt ↑↓</span> cambiar de factura
        </span>
        <span className="grow" />
        <button className="btn primary" type="button" disabled={!todoAsignado} onClick={() => ir(3)}>
          {todoAsignado ? 'Ver la salida' : `Faltan ${plural(pendientes.length, 'factura', 'facturas')}`} <span className="kbd">Ctrl Enter</span>
        </button>
      </div>
    </>
  );
}

// La asignación y el nombre llegan como props: mientras la fila anima su salida (al deshacer)
// conserva los últimos valores y nunca lee una asignación que ya no existe.
function FilaAsignada({ factura, asignacion, nombre }: { factura: Factura; asignacion: Asignacion; nombre: string }) {
  const { sesion, asignar, seleccionar } = useAppApi();
  return (
    <motion.div
      className="done-row"
      aria-selected={factura.id === sesion.seleccion}
      layout="position"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, height: 0, minHeight: 0, paddingTop: 0, paddingBottom: 0 }}
      transition={{ duration: 0.25, ease: EASE }}
    >
      <button type="button" className="id" title="Cambiar el cliente de esta factura" onClick={() => seleccionar(factura.id)}>{factura.id}</button>
      <span className={`name ${asignacion.tipo === 'personalizado' ? 'custom' : ''}`}>{nombre}</span>
      <button className="btn ghost sm" type="button" onClick={() => asignar(factura.id, null)}>Deshacer</button>
    </motion.div>
  );
}

type Opcion =
  | { tipo: 'cliente'; c: ClienteDelDia }
  | { tipo: 'libre'; nombre: string };

function Detalle({ factura }: { factura: Factura }) {
  const { sesion, nombres, clientesDelDia, usados, asignar } = useAppApi();
  const [q, setQ] = useState('');
  const [hi, setHi] = useState(0);
  const [verUsados, setVerUsados] = useState(false);
  const [personal, setPersonal] = useState('');
  const buscador = useRef<HTMLInputElement>(null);
  const actual = sesion.asignaciones.get(factura.id);

  useEffect(() => buscador.current?.focus({ preventScroll: true }), []);

  const { libres, yaUsados, libre } = useMemo(() => {
    const nq = normalizar(q);
    const coincide = (c: ClienteDelDia) => !nq || normalizar(`${c.nombre} ${c.sucursal} ${c.alias}`).includes(nq);
    const libres = clientesDelDia.filter((c) => !usados.has(c.clave) && coincide(c));
    const yaUsados = clientesDelDia.filter((c) => usados.has(c.clave) && coincide(c));
    const exacto = clientesDelDia.some((c) => normalizar(c.alias) === nq);
    return { libres, yaUsados, libre: nq && !exacto ? q.trim().toUpperCase() : '' };
  }, [q, clientesDelDia, usados]);

  const mostrarUsados = !!q || verUsados;
  const opciones: Opcion[] = [
    ...(libre && !libres.length && !yaUsados.length ? [{ tipo: 'libre', nombre: libre } as const] : []),
    ...libres.map((c) => ({ tipo: 'cliente', c }) as const),
    ...(mostrarUsados ? yaUsados.map((c) => ({ tipo: 'cliente', c }) as const) : []),
    ...(libre && (libres.length || yaUsados.length) ? [{ tipo: 'libre', nombre: libre } as const] : []),
  ];
  const indice = Math.min(hi, Math.max(0, opciones.length - 1));

  const elegir = (o: Opcion | undefined) => {
    if (!o) return;
    const a: Asignacion = o.tipo === 'libre' ? { tipo: 'personalizado', nombre: o.nombre } : { tipo: 'cliente', clave: o.c.clave };
    asignar(factura.id, a);
  };

  const teclas = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHi(Math.min(opciones.length - 1, indice + 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHi(Math.max(0, indice - 1)); }
    if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); elegir(opciones[indice]); }
  };

  const enviarPersonal = (e: FormEvent) => {
    e.preventDefault();
    const n = personal.trim().toUpperCase();
    if (n) asignar(factura.id, { tipo: 'personalizado', nombre: n });
  };

  // Solo al moverse con el teclado: al abrir la factura el buscador debe quedar a la vista.
  const indicePrevio = useRef(indice);
  useEffect(() => {
    if (indicePrevio.current === indice) return;
    indicePrevio.current = indice;
    document.querySelector('.opt[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [indice]);

  let i = -1;
  const pintar = (o: Opcion) => {
    i++;
    const sel = i === indice;
    const idx = i;
    if (o.tipo === 'libre') {
      return (
        <motion.button layout="position" key={`libre-${o.nombre}`} type="button" className="opt free" role="option" aria-selected={sel} onMouseEnter={() => setHi(idx)} onClick={() => elegir(o)}>
          <span className="cn">Usar «{o.nombre}» como nombre personalizado</span>
          <span className="al">{o.nombre}</span>
          <span className="sc">Solo para esta factura, no se guarda como alias</span>
        </motion.button>
      );
    }
    return (
      <motion.button
        layout="position"
        key={o.c.clave}
        type="button"
        className="opt"
        role="option"
        aria-selected={sel}
        onMouseEnter={() => setHi(idx)}
        onClick={() => elegir(o)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, height: 0, minHeight: 0, paddingTop: 0, paddingBottom: 0 }}
        transition={{ duration: 0.18, ease: EASE }}
      >
        <span className="cn">{o.c.nombre}{o.c.nuevo && <span className="chip new nuevo" style={{ height: 22 }}>alias sugerido</span>}</span>
        <span className="al">{o.c.alias}</span>
        <span className="sc">{o.c.sucursal || 'Sin sucursal'}</span>
      </motion.button>
    );
  };

  const opcionesLibres = opciones.filter((o) => o.tipo === 'cliente' && !usados.has(o.c.clave));
  const opcionesUsadas = opciones.filter((o) => o.tipo === 'cliente' && usados.has(o.c.clave));
  const libreArriba = opciones[0]?.tipo === 'libre' ? opciones[0] : null;
  const libreAbajo = opciones.length > 1 && opciones[opciones.length - 1].tipo === 'libre' ? opciones[opciones.length - 1] : null;

  return (
    <>
      <div className="dhead">
        <div style={{ flex: 1, minWidth: 220 }}>
          <div className="label" style={{ marginBottom: 6 }}>{actual ? 'Cambiar cliente de la factura' : 'Factura'}</div>
          <div className="id">{factura.id}</div>
          <div className="facts">
            <span>Total <b>{pesos(factura.total)}</b></span>
            <span><b>{factura.lineas.length}</b> {factura.lineas.length === 1 ? 'línea' : 'líneas'}</span>
            <span>Crédito <b>{factura.dias}</b> días</span>
          </div>
        </div>
        {factura.negativa && <span className="chip neg">Cantidades negativas: cotización o devolución</span>}
        {actual && <span className="chip ok"><span className="dot" />Ahora: {nombres.get(factura.id)}</span>}
      </div>
      <div className="picker">
        <div className="label">¿Para quién es esta factura?</div>
        <label className="search">
          <IconoBuscar />
          <input
            ref={buscador}
            value={q}
            onChange={(e) => { setQ(e.target.value); setHi(0); }}
            onKeyDown={teclas}
            placeholder="Busca el cliente por nombre, sucursal o alias"
            autoComplete="off"
            aria-label="Buscar cliente"
          />
        </label>
        <form className="custom" onSubmit={enviarPersonal}>
          <label htmlFor="personalizado"><IconoLapiz /> ¿No está en la lista? Ponle un nombre personalizado</label>
          <input id="personalizado" value={personal} onChange={(e) => setPersonal(e.target.value)} placeholder="Nombre personalizado, por ejemplo TX" maxLength={24} autoComplete="off" />
          <button className="btn sm" type="submit" disabled={!personal.trim()}>Asignar nombre</button>
        </form>
        <div className="opts" role="listbox" aria-label="Clientes">
          {libreArriba && pintar(libreArriba)}
          <AnimatePresence initial={false}>{opcionesLibres.map(pintar)}</AnimatePresence>
          {yaUsados.length > 0 && (q
            ? <div className="optgroup">Ya usados · {yaUsados.length}</div>
            : (
              <button type="button" className="fold inline" aria-expanded={verUsados} onClick={() => setVerUsados((v) => !v)}>
                <IconoFlecha className="chev" /> Ya usados · {yaUsados.length}
              </button>
            ))}
          <AnimatePresence initial={false}>{opcionesUsadas.map(pintar)}</AnimatePresence>
          {libreAbajo && pintar(libreAbajo)}
          {!opciones.length && (
            <div className="empty-msg">
              {clientesDelDia.length ? 'Todos los clientes ya están usados. Búscalos arriba o usa un nombre personalizado.' : 'No hay archivo de clientes. Usa un nombre personalizado.'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

