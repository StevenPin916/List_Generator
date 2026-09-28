import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppApi } from '../app/contexto';
import { BarraSuperior } from './BarraSuperior';
import { Capas } from './Capas';
import { PanelAlias } from './PanelAlias';
import { PasoAsignar } from './pasos/PasoAsignar';
import { PasoCargar } from './pasos/PasoCargar';
import { PasoGenerar } from './pasos/PasoGenerar';
import { EASE } from './movimiento';

export function App() {
  const { sesion, prefs, cargarArchivos } = useAppApi();
  const [aliasAbierto, setAliasAbierto] = useState(false);
  const selector = useRef<HTMLInputElement>(null);
  const pasoPrevio = useRef(sesion.paso);
  const direccion = sesion.paso >= pasoPrevio.current ? 1 : -1;
  useEffect(() => { pasoPrevio.current = sesion.paso; }, [sesion.paso]);

  useEffect(() => {
    document.documentElement.dataset.theme = prefs.tema === 'oscuro' ? 'dark' : 'light';
  }, [prefs.tema]);

  const abrirSelector = useCallback(() => selector.current?.click(), []);
  const abrirAlias = useCallback(() => setAliasAbierto(true), []);
  const cerrarAlias = useCallback(() => setAliasAbierto(false), []);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        abrirSelector();
      }
    };
    window.addEventListener('keydown', tecla);
    // Soltar un archivo fuera de la zona no debe hacer que la ventana lo abra.
    const evitar = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', evitar);
    window.addEventListener('drop', evitar);
    return () => {
      window.removeEventListener('keydown', tecla);
      window.removeEventListener('dragover', evitar);
      window.removeEventListener('drop', evitar);
    };
  }, [abrirSelector]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="app">
        <BarraSuperior onAlias={abrirAlias} />
        <main>
          <AnimatePresence mode="wait" initial={false} custom={direccion}>
            <motion.section
              key={sesion.paso}
              className="view"
              custom={direccion}
              variants={{
                entra: (d: number) => ({ opacity: 0, x: 32 * d }),
                quieto: { opacity: 1, x: 0 },
                sale: (d: number) => ({ opacity: 0, x: -24 * d }),
              }}
              initial="entra"
              animate="quieto"
              exit="sale"
              transition={{ duration: 0.28, ease: EASE }}
            >
              {sesion.paso === 1 && <PasoCargar onAbrirSelector={abrirSelector} />}
              {sesion.paso === 2 && <PasoAsignar />}
              {sesion.paso === 3 && <PasoGenerar onAlias={abrirAlias} />}
            </motion.section>
          </AnimatePresence>
        </main>
        <PanelAlias abierto={aliasAbierto} onCerrar={cerrarAlias} />
        <Capas />
        <input
          ref={selector}
          type="file"
          accept=".xlsx"
          multiple
          hidden
          onChange={(e) => {
            const f = [...(e.target.files ?? [])];
            e.target.value = '';
            if (f.length) void cargarArchivos(f);
          }}
        />
      </div>
    </MotionConfig>
  );
}
