import { animate, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

export const EASE = [0.22, 0.8, 0.26, 1] as const;
export const RESORTE = { type: 'spring', stiffness: 380, damping: 30 } as const;

/** Número que cuenta hasta su nuevo valor. */
export function NumeroAnimado({ valor }: { valor: number }) {
  const [mostrado, setMostrado] = useState(valor);
  const previo = useRef(valor);
  useEffect(() => {
    const c = animate(previo.current, valor, { duration: 0.45, ease: EASE, onUpdate: (v) => setMostrado(Math.round(v)) });
    previo.current = valor;
    return () => c.stop();
  }, [valor]);
  return <>{mostrado}</>;
}

/** Visto que se dibuja. */
export function CheckDibujado({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <motion.path
        d="M5.5 12.5l4.2 4.2L18.5 8"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.45, delay: 0.25, ease: EASE }}
      />
    </svg>
  );
}
