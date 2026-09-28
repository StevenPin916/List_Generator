# List Generator

App de escritorio para Windows que toma los dos Excel del día que exporta el ERP y genera la **Salida** de alistamiento:

1. **Cargar**: sueltas el reporte de clientes y el de ventas por documento. La app reconoce sola cuál es cuál y verifica que las ventas cuadren con el TOTAL GENERAL.
2. **Asignar**: dices de quién es cada factura (cliente del día o nombre personalizado). Si un nombre se repite, las facturas quedan `TX`, `TX 2`, `TX 3` por orden de factura.
3. **Generar**: un Excel con 3 hojas:
   - **Items A-Z**: el formato de la Salida manual (Descripcion, Cant, Val, Clientes).
   - **Por cliente**: el pedido de cada factura con subtotal.
   - **Clientes**: quién pidió hoy, con alias, factura y total.

Cada vez que se abre, la app arranca en ceros. Solo recuerda, **en ese PC**, los alias de los clientes, la carpeta de listas y el tema. No hay nube ni datos precargados, así que otra instalación empieza vacía.

## Descargar el .exe

Cada cambio compila la app en GitHub Actions (workflow **Windows**). En la ejecución, sección *Artifacts*, descarga `List-Generator-Windows`:

- `List Generator_x.y.z_x64-setup.exe`: instalador (no pide administrador).
- `List Generator (portable).exe`: se ejecuta sin instalar.

La app no está firmada, así que la primera vez Windows SmartScreen puede decir "Windows protegió su PC". Para abrirla: **Más información → Ejecutar de todas formas**.

## Arquitectura modular

```
src/
  domain/        Reglas del negocio puras: facturas, numeración TX/TX 2, alias sugerido, modelo de la Salida.
                 No conoce Excel, Tauri ni React.
  modules/
    input/       MÓDULO DE ENTRADA. Un adaptador por formato de reporte del ERP.
    output/      MÓDULO DE SALIDA. Convierte el modelo en el Excel de 3 hojas.
    storage/     Dónde se guardan alias, carpeta y tema (Tauri / navegador / memoria).
    files/       Elegir carpeta, escribir, abrir (Tauri / navegador).
    platform.ts  Arma los módulos según dónde corre la app.
  app/           Estado de la sesión y casos de uso (cargar, asignar, deshacer, guardar).
  ui/            React: solo habla con app/.
src-tauri/       Caparazón de Windows (Rust): ventana, diálogos y escritura de archivos.
```

Las dependencias van en una sola dirección: `ui → app → domain`, y `app` usa los módulos solo por sus contratos (`contract.ts`).

### Si el Excel del ERP cambia

Solo se toca `src/modules/input/`:

1. Edita el adaptador (`surtifrut-clientes.ts` o `surtifrut-ventas.ts`) o crea uno nuevo que cumpla `AdaptadorEntrada` (`detectar` + `leer`).
2. Si es nuevo, agrégalo a la lista de `registry.ts`.
3. Ajusta su fixture en `tests/fixtures/erp.ts` y corre `npm test`.

El dominio, la interfaz y la salida no cambian. Si el reporte de ventas trae una columna **Cliente/Tercero**, el adaptador ya la lee y el paso de asignar se salta solo.

## Desarrollo

```bash
npm install
npm run dev        # interfaz en el navegador (guardar = descargar)
npm test           # pruebas del dominio y los módulos
npm run typecheck
npm run tauri dev  # la app de escritorio (requiere Rust)
npm run tauri build
```

Las pruebas usan libros sintéticos con la misma estructura del ERP. El repositorio es público: **nunca** subas los Excel reales de clientes (la carpeta `private/` y los `*.local.xlsx` están en `.gitignore`).
