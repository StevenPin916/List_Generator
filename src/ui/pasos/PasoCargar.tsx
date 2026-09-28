import { motion } from 'motion/react';
import { useEffect, useState, type DragEvent, type ReactNode } from 'react';
import { useAppApi } from '../../app/contexto';
import { agruparFacturas } from '../../domain';
import { pesos, plural } from '../formato';
import { IconoSubir } from '../iconos';
import { CheckDibujado, EASE } from '../movimiento';

export function PasoCargar({ onAbrirSelector }: { onAbrirSelector: () => void }) {
  const { sesion, cargarArchivos, archivosListos, todoAsignado, ir, clientesDelDia } = useAppApi();
  const { clientes, ventas } = sesion;
  const [arrastrando, setArrastrando] = useState(false);

  const soltar = (e: DragEvent) => {
    e.preventDefault();
    setArrastrando(false);
    void cargarArchivos([...e.dataTransfer.files]);
  };
  const continuar = () => ir(todoAsignado ? 3 : 2);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && archivosListos && !(e.target as HTMLElement).closest('button,input')) continuar();
    };
    window.addEventListener('keydown', tecla);
    return () => window.removeEventListener('keydown', tecla);
  });

  let tarjetaVentas: ReactNode = null;
  if (ventas) {
    const facturas = agruparFacturas(ventas.lineas);
    const suma = ventas.lineas.reduce((t, l) => t + l.total, 0);
    const cuadra = ventas.totalERP === null || Math.abs(suma - ventas.totalERP) < 1;
    tarjetaVentas = (
      <>
        <div className="stats">
          <Dato v={facturas.length} l="facturas" />
          <Dato v={ventas.lineas.length} l="líneas" />
          <Dato v={pesos(suma)} l="total ventas" />
        </div>
        <div className="foot">
          {ventas.totalERP !== null &&
            (cuadra
              ? <span className="chip ok"><span className="dot" />Cuadra con el TOTAL GENERAL</span>
              : <span className="chip neg">No cuadra: el ERP dice {pesos(ventas.totalERP)}</span>)}
          {ventas.fecha && <span className="chip">{ventas.fecha}</span>}
          {facturas.some((f) => f.negativa) && <span className="chip warn">Incluye cotizaciones o devoluciones</span>}
          {facturas.some((f) => f.clienteDelERP) && <span className="chip ok">Trae el cliente de cada factura</span>}
        </div>
      </>
    );
  }
  let tarjetaClientes: ReactNode = null;
  if (clientes) {
    const nuevos = clientesDelDia.filter((c) => c.nuevo).length;
    tarjetaClientes = (
      <>
        <div className="stats">
          <Dato v={clientes.clientes.length} l="clientes y sucursales" />
          <Dato v={clientesDelDia.length - nuevos} l="con alias recordado" />
        </div>
        <div className="foot">
          {clientes.fecha && <span className="chip">{clientes.fecha}</span>}
          {nuevos > 0
            ? <span className="chip new">{plural(nuevos, 'cliente nuevo', 'clientes nuevos')}, alias sugerido</span>
            : <span className="chip ok"><span className="dot" />Todos los alias recordados</span>}
        </div>
      </>
    );
  }

  const zona = {
    onDragOver: (e: DragEvent) => { e.preventDefault(); setArrastrando(true); },
    onDragLeave: (e: DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setArrastrando(false); },
    onDrop: soltar,
  };

  return (
    <>
      <div className={`load ${arrastrando ? 'dragging' : ''}`} {...zona}>
        {archivosListos ? (
          <div className="loaded-head">
            <motion.div className="okmark" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 320, damping: 16 }}>
              <CheckDibujado />
            </motion.div>
            <div className="grow">
              <h2>Archivos cargados</h2>
              <p className="sub">Todo listo{ventas?.fecha ? ` para el ${ventas.fecha}` : ''}. Revisa los números y continúa.</p>
            </div>
            <button className="btn" type="button" onClick={onAbrirSelector}>Cambiar archivos</button>
          </div>
        ) : (
          <>
            <div>
              <h2>Carga los dos Excel del día</h2>
              <p className="sub">Suéltalos juntos. La app reconoce sola cuál es el de clientes y cuál el de ventas.</p>
            </div>
            <motion.button
              type="button"
              className={`drop surface-t ${clientes || ventas ? '' : 'big'}`}
              onClick={onAbrirSelector}
              whileTap={{ scale: 0.99 }}
              layout
            >
              <span className="ico"><IconoSubir /></span>
              <strong>Suelta aquí los archivos .xlsx</strong>
              <span>o haz clic para buscarlos &nbsp;<span className="kbd">Ctrl O</span></span>
            </motion.button>
          </>
        )}
        {(clientes || ventas) && (
          <div className="files">
            <Tarjeta indice={0} tipo="Clientes" archivo={clientes?.archivo}>{tarjetaClientes}</Tarjeta>
            <Tarjeta indice={1} tipo="Ventas por documento" archivo={ventas?.archivo}>{tarjetaVentas}</Tarjeta>
          </div>
        )}
      </div>
      <div className="footer surface-t">
        <span className="hint">
          {archivosListos
            ? todoAsignado ? 'El ERP trajo el cliente de cada factura: pasas directo a la salida' : 'Siguiente: decir de quién es cada factura'
            : clientes || ventas ? 'Falta el otro archivo' : 'Empieza cargando los archivos del día'}
        </span>
        <span className="grow" />
        <motion.button
          className="btn primary"
          type="button"
          disabled={!archivosListos}
          onClick={continuar}
          animate={archivosListos ? { boxShadow: ['0 0 0 0 rgba(255,127,87,.55)', '0 0 0 14px rgba(255,127,87,0)'] } : undefined}
          transition={{ duration: 1.3, repeat: 1, ease: EASE, delay: 0.5 }}
        >
          Continuar <span className="kbd">Enter</span>
        </motion.button>
      </div>
    </>
  );
}

function Dato({ v, l }: { v: ReactNode; l: string }) {
  return <div className="stat"><div className="v">{v}</div><div className="l">{l}</div></div>;
}

function Tarjeta({ indice, tipo, archivo, children }: { indice: number; tipo: string; archivo?: string; children: ReactNode }) {
  if (!archivo) {
    return <div className="fcard empty"><div className="label">{tipo}</div><div>Todavía no has cargado este archivo</div></div>;
  }
  return (
    <motion.div
      className="fcard surface-t"
      key={archivo}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE, delay: indice * 0.08 }}
    >
      <div className="top">
        <span className="xl">XLS</span>
        <div style={{ minWidth: 0 }}>
          <div className="label">{tipo}</div>
          <div className="name" title={archivo}>{archivo}</div>
        </div>
        <span className="chip ok"><span className="dot" />Detectado</span>
      </div>
      {children}
    </motion.div>
  );
}
