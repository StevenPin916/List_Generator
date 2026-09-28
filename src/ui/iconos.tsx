import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number };
const base = ({ size = 18, ...p }: P) => ({ width: size, height: size, fill: 'none', 'aria-hidden': true, ...p });

export const IconoBuscar = (p: P) => (
  <svg viewBox="0 0 16 16" {...base(p)}><circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" /><path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
);
export const IconoLapiz = (p: P) => (
  <svg viewBox="0 0 16 16" {...base(p)}><path d="M10.5 2.5l3 3L6 13H3v-3l7.5-7.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>
);
export const IconoFlecha = (p: P) => (
  <svg viewBox="0 0 16 16" {...base({ size: 14, ...p })}><path d="m6 3.5 4.5 4.5L6 12.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconoSubir = (p: P) => (
  <svg viewBox="0 0 24 24" {...base({ size: 26, ...p })}><path d="M12 15V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconoLista = (p: P) => (
  <svg viewBox="0 0 16 16" {...base(p)}><path d="M2.5 4.5h7M2.5 8h11M2.5 11.5h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
);
export const IconoCerrar = (p: P) => (
  <svg viewBox="0 0 16 16" {...base(p)}><path d="m4 4 8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
);
export const IconoCheck = (p: P) => (
  <svg viewBox="0 0 16 16" {...base({ size: 14, ...p })}><path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const IconoAlerta = (p: P) => (
  <svg viewBox="0 0 16 16" {...base({ size: 14, ...p })}><path d="M8 4.5v4.2M8 11.3v.2" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" /></svg>
);
export const IconoLogo = (p: P) => (
  <svg viewBox="0 0 16 16" {...base(p)}><path d="M4 4.5h8M4 8h8M4 11.5h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
);
export const IconoSol = (p: P) => (
  <svg viewBox="0 0 24 24" {...base({ size: 22, ...p })}><circle cx="12" cy="12" r="4.2" fill="currentColor" /><g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" /></g></svg>
);
export const IconoLuna = (p: P) => (
  <svg viewBox="0 0 24 24" {...base({ size: 20, ...p })}><path d="M20.5 14.6A8.5 8.5 0 0 1 9.4 3.5a8.5 8.5 0 1 0 11.1 11.1Z" fill="currentColor" /></svg>
);
