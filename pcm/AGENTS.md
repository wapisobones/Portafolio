# AGENTS.md

## Proyecto

PCM - Plano Corte Madera es una aplicacion web estatica para calcular y visualizar si piezas rectangulares de madera caben en una sola plancha.

## Stack permitido

- HTML.
- CSS.
- JavaScript puro.
- SVG para la visualizacion.
- `localStorage` para persistir el ultimo proyecto.
- jsPDF por CDN para exportacion PDF local en el navegador.

No se deben agregar frameworks, backend, base de datos, dependencias externas ni herramientas de build obligatorias.

## Estructura esperada

```text
pcm/
+-- index.html
+-- README.md
+-- AGENTS.md
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

## Responsabilidades

- `index.html`: estructura de la interfaz, formularios, resumen, tabla y contenedor del plano.
- `assets/styles/main.css`: layout, estilos visuales, tema oscuro, estados y responsive.
- `js/main.js`: estado de la app, eventos, coordinacion de modulos y render de UI.
- `js/pieces.js`: creacion, normalizacion, expansion y duplicacion de piezas.
- `js/cuttingAlgorithm.js`: algoritmo de espacios libres / MaxRects simple y metricas de distribucion.
- `js/renderBoard.js`: dibujo SVG de la plancha y las piezas ubicadas.
- `js/pdfExport.js`: conversion de SVG a imagen y descarga PDF con jsPDF.
- `js/storage.js`: lectura, escritura y limpieza de `localStorage`.
- `js/validations.js`: validaciones de plancha, piezas y proyecto.

## Reglas de desarrollo

- Mantener separacion clara entre UI, calculo, almacenamiento, validacion y renderizado.
- Trabajar internamente en milimetros.
- Mantener textos visibles en espanol y nombres de funciones/variables en ingles.
- Considerar el espesor de corte como separacion reservada entre piezas.
- La rotacion se define por pieza.
- La veta se define para plancha y para cada pieza.
- En esta version MVP, las piezas con veta horizontal o vertical no se rotan automaticamente.
- Comentar solo la logica importante.
- Mantener compatibilidad con Live Server / Go Live y publicacion estatica.

## Algoritmo MVP

El algoritmo actual es MaxRects simple con espacios libres:

1. Expande piezas segun cantidad.
2. Ordena por area de mayor a menor.
3. Prueba orientacion normal y rotada cuando la pieza lo permite.
4. Respeta la veta: solo piezas con veta indiferente pueden rotar.
5. Elige el rectangulo libre con menor desperdicio de area.
6. Reserva espesor de corte hacia derecha y abajo.
7. Divide los espacios libres afectados por la nueva pieza.
8. Elimina rectangulos libres redundantes.
9. Marca como no ubicadas las piezas que no entren.

No convertir este motor en una optimizacion industrial avanzada sin documentar la razon.

## Que no hacer en esta version

- No implementar multiples planchas.
- No implementar login ni usuarios.
- No implementar base de datos.
- No implementar acomodo manual por arrastre.
- No agregar generacion real de PDF con librerias.
- No introducir dependencias externas.

## Validacion de cambios

- Abrir `index.html` con Live Server / Go Live.
- Configurar plancha y espesor de corte.
- Agregar piezas con cantidad mayor a 1.
- Editar, duplicar y eliminar piezas.
- Calcular un caso exitoso y otro fallido.
- Confirmar que el SVG se renderiza.
- Guardar, recargar y cargar el ultimo proyecto desde `localStorage`.
