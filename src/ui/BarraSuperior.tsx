import { AnimatePresence, motion } from 'motion/react';
import { useAppApi } from '../app/contexto';
import { IconoCheck, IconoLista, IconoLogo, IconoLuna, IconoSol } from './iconos';

export function BarraSuperior({ onAlias }: { onAlias: () => void }) {
  const { sesion, ir, archivosListos, todoAsignado, fecha, prefs, cambiarTema, clientesDelDia, sesion: { clientes, ventas } } = useAppApi();
  const pasos: [1 | 2 | 3, string, boolean, boolean][] = [
    [1, 'Cargar', true, archivosListos],
    [2, 'Asignar', archivosListos, todoAsignado],
    [3, 'Generar', todoAsignado, false],
  ];
  const nuevos = clientesDelDia.filter((c) => c.nuevo).length;
  const oscuro = prefs.tema === 'oscuro';
  const fechasDistintas = clientes?.fecha && ventas?.fecha && clientes.fecha !== ventas.fecha;

  return (
    <header className="bar surface-t">
      <div className="brand"><span className="logo"><IconoLogo /></span><span className="brand-name">List Generator</span></div>
      <ol className="steps">
        {pasos.map(([n, etiqueta, habilitado, hecho], i) => {
          const actual = sesion.paso === n;
          return (
            <li key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span className="sep" aria-hidden="true" />}
              <button type="button" disabled={!habilitado} onClick={() => ir(n)} className={hecho && !actual ? 'done' : ''} aria-current={actual ? 'step' : undefined}>
                <span className="n">{hecho && !actual ? <IconoCheck /> : n}</span>
                <span className="lbl">{etiqueta}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="right">
        {fecha && (
          <span className={`chip ${fechasDistintas ? 'warn' : ''}`}>
            {fechasDistintas ? `Fechas distintas: ${clientes!.fecha} y ${ventas!.fecha}` : <><span className="dot" />{fecha}</>}
          </span>
        )}
        <button className="btn ghost sm" type="button" onClick={onAlias}>
          <IconoLista /> <span className="alias-lbl">Alias</span>
          {nuevos > 0 && <span className="chip new">{nuevos} nuevos</span>}
        </button>
        <button className="theme surface-t" type="button" onClick={cambiarTema} aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'} title="Cambiar tema">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.span
              key={oscuro ? 'luna' : 'sol'}
              style={{ display: 'grid' }}
              initial={{ rotate: -90, scale: 0.3, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18 }}
            >
              {oscuro ? <IconoLuna className="moon" /> : <IconoSol className="sun" />}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}
