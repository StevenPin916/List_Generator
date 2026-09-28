import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { useAppApi } from '../../app/contexto';
import { normalizar, type ModeloSalida } from '../../domain';
import { cantidad, entero, plural } from '../formato';
import { IconoBuscar } from '../iconos';
import { EASE } from '../movimiento';

type Pestana = 'items' | 'cliente' | 'clientes';

export function PasoGenerar({ onAlias }: { onAlias: () => void }) {
  const { modelo, prefs, guardarSalida, guardando, ir, elegirCarpeta, porClave, sesion, esEscritorio } = useAppApi();
  const [pestana, setPestana] = useState<Pestana>('items');
  const [q, setQ] = useState('');

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void guardarSalida();
      }
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  }, [guardarSalida]);

  const nuevos = useMemo(() => {
    const s = new Set<string>();
    sesion.asignaciones.forEach((a) => { if (a.tipo === 'cliente' && porClave.get(a.clave)?.nuevo) s.add(a.clave); });
    return s.size;
  }, [sesion.asignaciones, porClave]);

  if (!modelo) return null;
  const productos = new Set(modelo.items.map((i) => i.descripcion)).size;
  const negativas = modelo.items.filter((i) => i.cantidad < 0).length;
  const pestanas: [Pestana, string, number][] = [
    ['items', 'Items A-Z', modelo.items.length],
    ['cliente', 'Por cliente', modelo.bloques.length],
    ['clientes', 'Clientes', modelo.bloques.length],
  ];

  return (
    <>
      <div className="gen">
        <div className="gtool">
          <div className="tabs" role="tablist" aria-label="Hojas del Excel">
            {pestanas.map(([k, l, n]) => (
              <button key={k} type="button" role="tab" aria-selected={pestana === k} onClick={() => setPestana(k)}>
                {pestana === k && <motion.span layoutId="pestana" className="pill" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
                {l}<span className="tn">{n}</span>
              </button>
            ))}
          </div>
          <label className="search">
            <IconoBuscar />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar por producto o cliente" aria-label="Filtrar" />
          </label>
          <div className="sum">
            <span className="chip">{plural(productos, 'producto', 'productos')}</span>
            <span className="chip">{plural(modelo.bloques.length, 'factura', 'facturas')}</span>
            {negativas > 0 && <span className="chip neg">{negativas} negativas</span>}
            {nuevos > 0
              ? <button className="chip new" type="button" onClick={onAlias}>{plural(nuevos, 'alias sugerido', 'alias sugeridos')}: revísalos</button>
              : <span className="chip ok"><span className="dot" />Alias recordados</span>}
          </div>
        </div>
        <motion.div
          key={pestana}
          className={`sheet ${pestana === 'cliente' ? 'cli' : ''}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: EASE }}
        >
          {pestana === 'items' && <HojaItems modelo={modelo} q={q} />}
          {pestana === 'cliente' && <HojaPorCliente modelo={modelo} q={q} />}
          {pestana === 'clientes' && <HojaClientes modelo={modelo} q={q} />}
        </motion.div>
      </div>
      <div className="footer surface-t">
        {prefs.carpeta ? (
          <span className="folder">
            {esEscritorio ? 'Carpeta de listas' : 'Se descarga en'} <code title={prefs.carpeta}>{prefs.carpeta}</code>
            {esEscritorio && <button className="btn ghost sm" type="button" onClick={() => void elegirCarpeta()}>Cambiar</button>}
          </span>
        ) : (
          <span className="hint">La primera vez que guardes eliges la carpeta de listas</span>
        )}
        <span className="grow" />
        <span className="hint keys">Un Excel con 3 hojas</span>
        <button className="btn" type="button" onClick={() => ir(2)}>Volver a asignar</button>
        <button className="btn primary" type="button" onClick={() => void guardarSalida()} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar Salida'} <span className="kbd">Ctrl S</span>
        </button>
      </div>
    </>
  );
}

const Vacio = ({ columnas }: { columnas: number }) => (
  <tr><td colSpan={columnas} className="empty-msg">Nada coincide con el filtro.</td></tr>
);

function HojaItems({ modelo, q }: { modelo: ModeloSalida; q: string }) {
  const nq = normalizar(q);
  const filas = modelo.items.filter((r) => !nq || normalizar(`${r.descripcion} ${r.cliente}`).includes(nq));
  return (
    <table>
      <thead><tr><th className="rn">1</th><th>Descripcion</th><th>Cant</th><th>Val</th><th>Clientes</th></tr></thead>
      <tbody>
        {filas.map((r, i) => (
          <tr key={i} className={i > 0 && filas[i - 1].descripcion !== r.descripcion ? 'grp' : ''}>
            <td className="rn">{i + 2}</td>
            <td className="desc">{r.descripcion}</td>
            <td className={`c ${r.cantidad < 0 ? 'neg' : ''}`}>{cantidad(r.cantidad)}</td>
            <td className="c">{entero(r.valor)}</td>
            <td className="cli">{r.cliente}</td>
          </tr>
        ))}
        {!filas.length && <Vacio columnas={5} />}
      </tbody>
    </table>
  );
}

function HojaPorCliente({ modelo, q }: { modelo: ModeloSalida; q: string }) {
  const nq = normalizar(q);
  const bloques = modelo.bloques.filter(
    (b) => !nq || normalizar(`${b.nombre} ${b.cliente} ${b.items.map((i) => i.descripcion).join(' ')}`).includes(nq),
  );
  if (!bloques.length) return <p className="empty-msg">Nada coincide con el filtro.</p>;
  return (
    <>
      {bloques.map((b, i) => (
        <motion.table
          key={b.factura}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: EASE, delay: Math.min(i, 8) * 0.04 }}
        >
          <thead>
            <tr><th colSpan={4} className="bh"><span>{b.nombre}</span><span className="bm">{b.factura} · {plural(b.items.length, 'ítem', 'ítems')}</span></th></tr>
            <tr><th>Descripcion</th><th>Cant</th><th>Val</th><th>Total</th></tr>
          </thead>
          <tbody>
            {b.items.map((it, j) => (
              <tr key={j}>
                <td className="desc">{it.descripcion}</td>
                <td className={`c ${it.cantidad < 0 ? 'neg' : ''}`}>{cantidad(it.cantidad)}</td>
                <td className="c">{entero(it.valor)}</td>
                <td className="c">{entero(it.total)}</td>
              </tr>
            ))}
            <tr className="subt"><td colSpan={3}>Subtotal</td><td className="c">{entero(b.total)}</td></tr>
          </tbody>
        </motion.table>
      ))}
    </>
  );
}

function HojaClientes({ modelo, q }: { modelo: ModeloSalida; q: string }) {
  const nq = normalizar(q);
  const filas = modelo.bloques.filter((b) => !nq || normalizar(`${b.nombre} ${b.cliente} ${b.sucursal} ${b.factura}`).includes(nq));
  return (
    <table>
      <thead><tr><th>#</th><th>Alias</th><th>Cliente</th><th>Sucursal</th><th>Factura</th><th>Ítems</th><th>Total</th></tr></thead>
      <tbody>
        {filas.map((b, i) => (
          <tr key={b.factura}>
            <td className="c">{i + 1}</td>
            <td className="cli">{b.nombre}</td>
            <td>{b.personalizado ? '(nombre personalizado)' : b.cliente}</td>
            <td>{b.sucursal}</td>
            <td className="c mono" style={{ fontSize: 13 }}>{b.factura}</td>
            <td className="c">{b.items.length}</td>
            <td className="c">{entero(b.total)}</td>
          </tr>
        ))}
        {!filas.length && <Vacio columnas={7} />}
        <tr className="subt"><td colSpan={6}>TOTAL · {plural(modelo.bloques.length, 'factura', 'facturas')}</td><td className="c">{entero(modelo.total)}</td></tr>
      </tbody>
    </table>
  );
}
