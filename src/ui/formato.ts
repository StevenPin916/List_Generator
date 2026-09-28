export const pesos = (n: number) => `$ ${Math.round(n).toLocaleString('es-CO')}`;
export const entero = (n: number) => Math.round(n).toLocaleString('es-CO');
export const cantidad = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 3 });
export const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;
