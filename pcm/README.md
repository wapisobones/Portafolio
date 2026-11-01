# PCM - Plano Corte Madera

PCM es una aplicacion web estatica para calcular si un conjunto de piezas rectangulares de madera cabe dentro de una plancha, considerando medidas, cantidad, rotacion permitida y espesor de corte.

El objetivo de esta version es entregar una herramienta visual: el usuario configura la plancha, administra piezas, calcula una distribucion inicial y revisa un plano SVG con metricas de aprovechamiento.

## Tecnologias

- HTML.
- CSS.
- JavaScript puro.
- SVG para el plano visual.
- `localStorage` para guardar el ultimo proyecto.
- jsPDF desde CDN para exportar PDF en el navegador.

No usa backend, base de datos ni frameworks. La exportacion PDF usa jsPDF del lado cliente y no envia datos a servicios externos.

## Como ejecutar localmente

Abre `pcm/index.html` con Live Server / Go Live desde el editor, o directamente en el navegador.

La app funciona como sitio estatico y puede publicarse en GitHub Pages, Netlify o Vercel sin proceso de build.

## Estructura

```text
pcm/
+-- index.html
+-- README.md
+-- assets/
|   +-- styles/
|       +-- main.css
+-- js/
    +-- main.js
    +-- pieces.js
    +-- cuttingAlgorithm.js
    +-- renderBoard.js
    +-- storage.js
    +-- validations.js
```

## Funcionalidades

- Configuracion de plancha en milimetros.
- Material o nombre opcional del proyecto.
- Espesor de corte en milimetros.
- Agregar, editar, duplicar, eliminar y limpiar piezas.
- Rotacion configurable por pieza.
- Direccion de veta de la plancha: horizontal o vertical.
- Direccion de veta por pieza: indiferente, horizontal o vertical.
- Validaciones claras para plancha y piezas.
- Calculo de distribucion en una plancha.
- Plano visual SVG con posiciones reales `x/y`, patrones de veta e indicadores de rotacion.
- Resumen de estado, piezas ubicadas, area usada, aprovechamiento y perdida.
- Guardar, cargar y limpiar el ultimo proyecto desde `localStorage`.
- Exportar el plano a PDF con resumen, imagen del plano y lista de piezas.
- Diseno oscuro con estilo tecnico similar al portafolio.

## Algoritmo usado

La version actual usa un algoritmo MVP de **espacios libres / MaxRects simple** con estrategia **Best Area Fit**:

1. Crea un rectangulo libre inicial del tamano completo de la plancha.
2. Expande las piezas segun su cantidad.
3. Ordena piezas de mayor a menor area.
4. En caso de empate, prioriza la pieza con mayor lado maximo.
5. Para cada pieza, recorre los espacios libres disponibles.
6. Prueba orientacion normal y, si la pieza lo permite, orientacion rotada.
7. Elige el espacio que deja menor desperdicio de area.
8. Reserva separacion por espesor de corte hacia derecha y abajo.
9. Divide los espacios libres afectados y elimina rectangulos redundantes.
10. Marca como no ubicadas las piezas que no entran.

El plano dibuja la pieza en su tamano real, mientras el calculo reserva el espacio adicional del corte para evitar solapamientos.

## Veta y rotacion

La plancha tiene direccion de veta `horizontal` o `vertical`.

Cada pieza puede tener veta:

- `indiferente`: puede rotarse si `allowRotation` esta activo.
- `horizontal`: no se rota automaticamente en esta version MVP.
- `vertical`: no se rota automaticamente en esta version MVP.

Esta regla conserva una interpretacion simple y segura: si una pieza tiene veta definida, el algoritmo intenta ubicarla solo con su orientacion original. Si la unica forma de hacerla entrar rompe la direccion de veta, queda como no ubicada.

## Exportacion PDF

El boton `Exportar PDF` genera un archivo local con nombre:

```text
pcm-plano-corte-YYYYMMDD-HHmm.pdf
```

El PDF incluye:

- titulo del proyecto,
- datos de la plancha,
- resumen de resultados,
- imagen del plano SVG,
- lista de piezas,
- fecha de generacion.

La conversion del SVG a imagen se hace en el navegador usando `canvas`; luego jsPDF inserta esa imagen en un A4 horizontal.

## Limitaciones actuales

- Es un algoritmo MVP, no una optimizacion industrial perfecta.
- La restriccion de veta es basica en esta version.
- Las piezas con veta horizontal o vertical no se rotan automaticamente.
- Solo calcula una plancha.
- No soporta multiples planchas todavia.
- No implementa cortes tipo guillotina reales.
- No permite mover piezas manualmente.
- La exportacion PDF depende de que el CDN de jsPDF este disponible.
- No calcula costos todavia.
- La perdida por corte es una estimacion.

## Roadmap

- Multiples planchas.
- Optimizacion avanzada.
- Cortes tipo guillotina.
- Exportar a PDF.
- Exportar imagen del plano.
- Imprimir plano.
- Presets de materiales.
- Calculo de costos.
- Guardar multiples proyectos.
