import { AnimatePresence, motion } from 'motion/react';
import { useEffect } from 'react';
import { useAppApi } from '../app/contexto';
import { IconoAlerta, IconoCheck } from './iconos';

export function Capas() {
  const { pregunta, avisos, cerrarAviso } = useAppApi();

  useEffect(() => {
    if (!pregunta) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && pregunta.resolver(null);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [pregunta]);

  return (
    <>
      <AnimatePresence>
        {pregunta && (
          <>
            <motion.div key="scrim" className="scrim" style={{ zIndex: 30 }} onClick={() => pregunta.resolver(null)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <div key="modal" className="modal-wrap">
              <motion.div
                className="modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-titulo"
                initial={{ opacity: 0, scale: 0.94, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 360, damping: 28 }}
              >
                <h2 id="modal-titulo">{pregunta.titulo}</h2>
                <p className="sub">{pregunta.texto}</p>
                <div className="actions">
                  {pregunta.opciones.map((o) => (
                    <button key={o.id} autoFocus={o.principal} className={`btn ${o.principal ? 'primary' : o.id === 'cancelar' ? 'ghost' : ''}`} type="button" onClick={() => pregunta.resolver(o.id)}>
                      {o.etiqueta}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
      <div className="toasts" role="status" aria-live="polite">
        <AnimatePresence initial={false}>
          {avisos.map((a) => (
            <motion.div
              key={a.id}
              layout
              className={`toast ${a.tono ?? ''}`}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            >
              {a.tono === 'ok' && <span className="ic"><IconoCheck /></span>}
              {a.tono === 'error' && <span className="ic"><IconoAlerta /></span>}
              <span className="t">{a.texto}</span>
              {a.acciones?.map((x) => (
                <button key={x.etiqueta} className="btn sm" type="button" onClick={() => { x.accion(); cerrarAviso(a.id); }}>{x.etiqueta}</button>
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
