import { describe, expect, it } from 'vitest';
import {
  agruparFacturas, claveCliente, construirSalida, numerarRepetidos, quitarCodigo, sugerirAlias,
  type Asignacion, type LineaVenta,
} from '../src/domain';

const linea = (documento: string, descripcion: string, cantidad = 1, valorUnit = 1000): LineaVenta => ({
  documento, descripcion, cantidad, valorUnit, dias: 0, total: cantidad * valorUnit,
});

describe('texto', () => {
  it('quita el código del producto y respeta los espacios internos', () => {
    expect(quitarCodigo('08 AGRAZ')).toBe('AGRAZ');
    expect(quitarCodigo('281 PIMENTON  ROJO')).toBe('PIMENTON  ROJO');
    expect(quitarCodigo('AGUACATE')).toBe('AGUACATE');
  });
});

describe('facturas', () => {
  it('agrupa por documento y ordena por serie y número', () => {
    const f = agruparFacturas([linea('FV FE 10', 'A'), linea('COT 5', 'B', -1), linea('FV FE 9', 'C'), linea('FV FE 10', 'D')]);
    expect(f.map((x) => x.id)).toEqual(['COT 5', 'FV FE 9', 'FV FE 10']);
    expect(f[0].negativa).toBe(true);
    expect(f[2].lineas).toHaveLength(2);
  });
});

describe('numeración de repetidos', () => {
  const facturas = agruparFacturas(['FV 26290', 'FV 26291', 'FV 26295', 'FV 26297'].map((d) => linea(d, 'X')));
  const base = (a: Asignacion) => (a.tipo === 'personalizado' ? a.nombre : a.clave);

  it('numera toda repetición por orden de factura, sea consecutiva o no', () => {
    const asig = new Map<string, Asignacion>([
      ['FV 26297', { tipo: 'personalizado', nombre: 'TX' }],
      ['FV 26290', { tipo: 'personalizado', nombre: 'TX' }],
      ['FV 26295', { tipo: 'personalizado', nombre: 'OTRO' }],
      ['FV 26291', { tipo: 'personalizado', nombre: 'tx' }],
    ]);
    const n = numerarRepetidos(facturas, asig, base);
    expect(n.get('FV 26290')).toBe('TX');
    expect(n.get('FV 26291')).toBe('tx 2');
    expect(n.get('FV 26297')).toBe('TX 3');
    expect(n.get('FV 26295')).toBe('OTRO');
  });

  it('renumera al quitar una asignación', () => {
    const asig = new Map<string, Asignacion>([
      ['FV 26291', { tipo: 'personalizado', nombre: 'TX' }],
      ['FV 26297', { tipo: 'personalizado', nombre: 'TX' }],
    ]);
    expect(numerarRepetidos(facturas, asig, base).get('FV 26297')).toBe('TX 2');
    asig.delete('FV 26291');
    expect(numerarRepetidos(facturas, asig, base).get('FV 26297')).toBe('TX');
  });
});

describe('alias sugerido', () => {
  it('usa la sucursal abreviada cuando existe', () => {
    expect(sugerirAlias('GRANJA MARINA SAS', 'CENTRO INTERNACIONAL')).toBe('C.INTERNAC');
    expect(sugerirAlias('X SAS', 'ALAMBRA')).toBe('ALAMBRA');
  });
  it('sin sucursal toma la palabra distintiva del nombre', () => {
    expect(sugerirAlias('MONTESSORI S.A.S', '')).toBe('MONTESSORI');
    expect(sugerirAlias('COLEGIO DE SAN PATRICIO SAS', '')).toBe('S.PATRICIO');
    expect(sugerirAlias('FIDEICOMISO G H BOGOTA- FIDUBOGOTA', '')).toBe('BOGOTA');
  });
});

describe('construir salida', () => {
  const facturas = agruparFacturas([
    linea('COT 1', '08 PLATANO', -2),
    linea('FV 2', '286 PIÑA GOLDEN', 1),
    linea('FV 2', '281 PIMENTON  ROJO', 38.700000000000003),
    linea('FV 3', '286 PIÑA GOLDEN', 3),
  ]);
  const k = claveCliente('HOTEL CENTRAL SAS', 'NORTE');
  const asig = new Map<string, Asignacion>([
    ['COT 1', { tipo: 'cliente', clave: k }],
    ['FV 2', { tipo: 'cliente', clave: k }],
    ['FV 3', { tipo: 'personalizado', nombre: 'TX' }],
  ]);
  const base = (a: Asignacion) => (a.tipo === 'personalizado' ? a.nombre : 'NORTE');
  const detalle = (a: Asignacion) =>
    a.tipo === 'personalizado'
      ? { cliente: a.nombre, sucursal: '', personalizado: true }
      : { cliente: 'HOTEL CENTRAL SAS', sucursal: 'NORTE', personalizado: false };
  const nombres = numerarRepetidos(facturas, asig, base);
  const m = construirSalida('28/09/2026', facturas, asig, nombres, detalle);

  it('ordena de A a Z en español, estable y con signos', () => {
    expect(m.items.map((i) => i.descripcion)).toEqual(['PIMENTON  ROJO', 'PIÑA GOLDEN', 'PIÑA GOLDEN', 'PLATANO']);
    expect(m.items[1].cliente).toBe('NORTE 2');
    expect(m.items[2].cliente).toBe('TX');
    expect(m.items[3].cantidad).toBe(-2);
    expect(m.items[0].cantidad).toBe(38.7);
  });

  it('arma un bloque por factura ordenado por nombre, con total', () => {
    expect(m.bloques.map((b) => b.nombre)).toEqual(['NORTE', 'NORTE 2', 'TX']);
    expect(m.bloques[2].personalizado).toBe(true);
    expect(m.total).toBeCloseTo(-2000 + 1000 + 38700 + 3000, 6);
  });

  it('no deja generar con facturas pendientes', () => {
    const incompleto = new Map(asig);
    incompleto.delete('FV 3');
    expect(() =>
      construirSalida(null, facturas, incompleto, numerarRepetidos(facturas, incompleto, base), detalle),
    ).toThrow(/FV 3/);
  });
});
