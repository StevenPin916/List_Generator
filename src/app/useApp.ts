import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  agruparFacturas, claveCliente, construirSalida, numerarRepetidos,
  type Asignacion, type Cliente, type ModeloSalida,
} from '../domain';
import { leerArchivo } from '../modules/input/registry';
import { ArchivoEnUso } from '../modules/files/contract';
import { PREFERENCIAS_INICIALES, type Preferencias } from '../modules/storage/contract';
import type { Plataforma } from '../modules/platform';
import { clientesConAlias, type ClienteDelDia } from './alias';
import { reducir, SESION_VACIA } from './sesion';

export interface Aviso {
  id: number;
  texto: string;
  tono?: 'normal' | 'error' | 'ok';
  acciones?: { etiqueta: string; accion: () => void }[];
  duracion?: number;
}

export interface Pregunta {
  titulo: string;
  texto: string;
  opciones: { id: string; etiqueta: string; principal?: boolean }[];
  resolver: (id: string | null) => void;
}

export function useApp(plataforma: Plataforma) {
  const [sesion, despachar] = useReducer(reducir, SESION_VACIA);
  const [prefs, setPrefs] = useState<Preferencias>(PREFERENCIAS_INICIALES);
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [pregunta, setPregunta] = useState<Pregunta | null>(null);
  const [guardando, setGuardando] = useState(false);
  const idAviso = useRef(0);

  useEffect(() => {
    plataforma.preferencias.cargar().then(setPrefs).catch(() => undefined);
  }, [plataforma]);

  const guardarPref = useCallback(
    <K extends keyof Preferencias>(k: K, v: Preferencias[K]) => {
      setPrefs((p) => ({ ...p, [k]: v }));
      plataforma.preferencias.guardar(k, v).catch(() => undefined);
    },
    [plataforma],
  );

  const avisar = useCallback((a: Omit<Aviso, 'id'>) => {
    const id = ++idAviso.current;
    setAvisos((l) => [...l.slice(-2), { ...a, id }]);
    setTimeout(() => setAvisos((l) => l.filter((x) => x.id !== id)), a.duracion ?? 3200);
  }, []);
  const cerrarAviso = useCallback((id: number) => setAvisos((l) => l.filter((x) => x.id !== id)), []);

  const preguntar = useCallback(
    (p: Omit<Pregunta, 'resolver'>) =>
      new Promise<string | null>((resolve) =>
        setPregunta({ ...p, resolver: (id) => { setPregunta(null); resolve(id); } }),
      ),
    [],
  );

  /* ---------- datos derivados ---------- */
  const facturas = useMemo(() => (sesion.ventas ? agruparFacturas(sesion.ventas.lineas) : []), [sesion.ventas]);

  const clientesDelDia: ClienteDelDia[] = useMemo(() => {
    const lista: Cliente[] = [...(sesion.clientes?.clientes ?? [])];
    const vistos = new Set(lista.map((c) => claveCliente(c.nombre, c.sucursal)));
    for (const f of facturas) {
      const c = f.clienteDelERP;
      if (c && !vistos.has(claveCliente(c.nombre, c.sucursal))) {
        vistos.add(claveCliente(c.nombre, c.sucursal));
        lista.push(c);
      }
    }
    return clientesConAlias(lista, prefs.alias);
  }, [sesion.clientes, facturas, prefs.alias]);

  const porClave = useMemo(() => new Map(clientesDelDia.map((c) => [c.clave, c])), [clientesDelDia]);

  const nombreBase = useCallback(
    (a: Asignacion) =>
      a.tipo === 'personalizado' ? a.nombre : (porClave.get(a.clave)?.alias ?? prefs.alias[a.clave]?.alias ?? '?'),
    [porClave, prefs.alias],
  );

  const nombres = useMemo(
    () => numerarRepetidos(facturas, sesion.asignaciones, nombreBase),
    [facturas, sesion.asignaciones, nombreBase],
  );

  const usados = useMemo(() => {
    const u = new Set<string>();
    sesion.asignaciones.forEach((a) => a.tipo === 'cliente' && u.add(a.clave));
    return u;
  }, [sesion.asignaciones]);

  const pendientes = useMemo(() => facturas.filter((f) => !sesion.asignaciones.has(f.id)), [facturas, sesion.asignaciones]);
  const fecha = sesion.ventas?.fecha ?? sesion.clientes?.fecha ?? null;
  const archivosListos = !!sesion.ventas && (!!sesion.clientes || pendientes.length === 0);
  const todoAsignado = archivosListos && facturas.length > 0 && pendientes.length === 0;

  const modelo: ModeloSalida | null = useMemo(() => {
    if (!todoAsignado) return null;
    return construirSalida(fecha, facturas, sesion.asignaciones, nombres, (a) => {
      if (a.tipo === 'personalizado') return { cliente: a.nombre, sucursal: '', personalizado: true };
      const c = porClave.get(a.clave);
      return { cliente: c?.nombre ?? '', sucursal: c?.sucursal ?? '', personalizado: false };
    });
  }, [todoAsignado, fecha, facturas, sesion.asignaciones, nombres, porClave]);

  /* ---------- acciones ---------- */
  const cargarArchivos = useCallback(
    async (lista: File[]) => {
      const excels = lista.filter((f) => /\.xlsx$/i.test(f.name));
      if (!excels.length) {
        avisar({ texto: 'Solo se aceptan archivos .xlsx', tono: 'error' });
        return;
      }
      const leidos: string[] = [];
      for (const f of excels) {
        try {
          const datos = await leerArchivo(f.name, await f.arrayBuffer());
          if (datos.tipo === 'ventas') {
            const fs = agruparFacturas(datos.lineas);
            const erp = new Map<string, Asignacion>();
            for (const x of fs) {
              if (x.clienteDelERP) erp.set(x.id, { tipo: 'cliente', clave: claveCliente(x.clienteDelERP.nombre, x.clienteDelERP.sucursal) });
            }
            despachar({ tipo: 'cargar', datos, asignacionesERP: erp, primera: fs.find((x) => !erp.has(x.id))?.id ?? null });
            leidos.push('ventas');
          } else {
            despachar({ tipo: 'cargar', datos, primera: null });
            leidos.push('clientes');
          }
        } catch (e) {
          avisar({ texto: e instanceof Error ? e.message : 'No se pudo leer el archivo.', tono: 'error', duracion: 6000 });
        }
      }
      if (leidos.length) avisar({ texto: `Cargado: ${leidos.join(' y ')}`, tono: 'ok' });
    },
    [avisar],
  );

  const asignar = useCallback(
    (id: string, asignacion: Asignacion | null) => {
      const pos = facturas.findIndex((f) => f.id === id);
      const libre = (i: number) => i !== pos && !sesion.asignaciones.has(facturas[i].id);
      let siguiente: string | null = null;
      for (let i = pos + 1; i < facturas.length && !siguiente; i++) if (libre(i)) siguiente = facturas[i].id;
      for (let i = 0; i < pos && !siguiente; i++) if (libre(i)) siguiente = facturas[i].id;
      despachar({ tipo: 'asignar', id, asignacion, siguiente });
    },
    [facturas, sesion.asignaciones],
  );

  const deshacer = useCallback(() => {
    if (!sesion.historial.length) {
      avisar({ texto: 'No hay nada para deshacer' });
      return;
    }
    despachar({ tipo: 'deshacer' });
  }, [sesion.historial.length, avisar]);

  const ir = useCallback((paso: 1 | 2 | 3) => despachar({ tipo: 'ir', paso }), []);
  const seleccionar = useCallback((id: string | null) => despachar({ tipo: 'seleccionar', id }), []);

  const editarAlias = useCallback(
    (clave: string, alias: string) => {
      const c = porClave.get(clave) ?? (prefs.alias[clave] && { nombre: prefs.alias[clave].cliente, sucursal: prefs.alias[clave].sucursal });
      if (!c) return;
      guardarPref('alias', { ...prefs.alias, [clave]: { cliente: c.nombre, sucursal: c.sucursal, alias: alias.toUpperCase() } });
    },
    [porClave, prefs.alias, guardarPref],
  );

  const cambiarTema = useCallback(() => guardarPref('tema', prefs.tema === 'oscuro' ? 'claro' : 'oscuro'), [prefs.tema, guardarPref]);

  const elegirCarpeta = useCallback(async () => {
    const c = await plataforma.archivos.elegirCarpeta('Carpeta donde se guardan las listas de cada día');
    if (c) guardarPref('carpeta', c);
    return c;
  }, [plataforma, guardarPref]);

  const guardarSalida = useCallback(async () => {
    if (!modelo || guardando) return;
    const { archivos, salida } = plataforma;
    let carpeta = prefs.carpeta;
    if (!carpeta) {
      const r = await preguntar({
        titulo: '¿Dónde guardo las listas de cada día?',
        texto: 'Elige una carpeta una sola vez. De ahí en adelante cada Salida se guarda directo ahí, con la fecha en el nombre.',
        opciones: [{ id: 'cancelar', etiqueta: 'Cancelar' }, { id: 'elegir', etiqueta: 'Elegir carpeta…', principal: true }],
      });
      if (r !== 'elegir') return;
      carpeta = await elegirCarpeta();
      if (!carpeta) return;
    }
    setGuardando(true);
    try {
      let nombre = salida.nombreArchivo(modelo.fecha, 1);
      let ruta = archivos.unir(carpeta, nombre);
      if (await archivos.existe(ruta)) {
        let v = 2;
        while (await archivos.existe(archivos.unir(carpeta, salida.nombreArchivo(modelo.fecha, v)))) v++;
        const r = await preguntar({
          titulo: 'Ya guardaste la Salida de este día',
          texto: `En la carpeta ya existe «${nombre}». ¿Qué hago con esta?`,
          opciones: [
            { id: 'cancelar', etiqueta: 'Cancelar' },
            { id: 'version', etiqueta: `Guardar como versión ${v}` },
            { id: 'reemplazar', etiqueta: 'Reemplazar', principal: true },
          ],
        });
        if (r === 'version') {
          nombre = salida.nombreArchivo(modelo.fecha, v);
          ruta = archivos.unir(carpeta, nombre);
        } else if (r !== 'reemplazar') return;
      }
      const bytes = await salida.escribir(modelo);
      await archivos.escribir(ruta, bytes);

      // Los alias usados en una Salida guardada quedan recordados en este PC.
      const alias = { ...prefs.alias };
      sesion.asignaciones.forEach((a) => {
        const c = a.tipo === 'cliente' ? porClave.get(a.clave) : undefined;
        if (c) alias[c.clave] = { cliente: c.nombre, sucursal: c.sucursal, alias: c.alias };
      });
      guardarPref('alias', alias);

      avisar({
        texto: `Guardado en ${ruta}`,
        tono: 'ok',
        duracion: 9000,
        acciones: plataforma.esEscritorio
          ? [
              { etiqueta: 'Abrir archivo', accion: () => void archivos.abrir(ruta) },
              { etiqueta: 'Abrir carpeta', accion: () => void archivos.mostrarEnCarpeta(ruta) },
            ]
          : undefined,
      });
    } catch (e) {
      avisar({
        texto: e instanceof ArchivoEnUso
          ? 'La Salida está abierta en Excel. Ciérrala y vuelve a guardar.'
          : `No se pudo guardar: ${e instanceof Error ? e.message : String(e)}`,
        tono: 'error',
        duracion: 8000,
      });
    } finally {
      setGuardando(false);
    }
  }, [modelo, guardando, plataforma, prefs, preguntar, elegirCarpeta, sesion.asignaciones, porClave, guardarPref, avisar]);

  return {
    sesion, prefs, avisos, pregunta, guardando,
    facturas, pendientes, clientesDelDia, porClave, nombres, usados, fecha, archivosListos, todoAsignado, modelo,
    cargarArchivos, asignar, deshacer, ir, seleccionar, editarAlias, cambiarTema, elegirCarpeta, guardarSalida,
    avisar, cerrarAviso, esEscritorio: plataforma.esEscritorio,
  };
}

export type AppApi = ReturnType<typeof useApp>;
