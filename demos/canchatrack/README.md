# CanchaTrack: demostración estática interactiva

Demostración independiente de CanchaTrack con HTML, CSS y JavaScript puro.
Todos los nombres, ubicaciones, mediciones, reglas y alertas son ficticios.
CT-DEMO-001 a 004 incluyen navegación, consultas y registro simulado en memoria.

## Visualizar localmente

Desde la raíz del portafolio:

```sh
python -m http.server 5500
```

Abrir http://localhost:5500/demos/canchatrack/.
Utilizar HTTP, no file://, para cargar el JSON. GitHub Pages conserva las rutas
relativas dentro del repositorio publicado. No se instalan dependencias.

## Archivos

- index.html: estructura, aviso permanente y confirmación de restablecimiento.
- assets/styles/main.css: estilos propios, foco y diseño responsive.
- data/demo.json: datos ficticios originales; la aplicación nunca modifica este archivo.
- js/data.js: carga, validación, conjunto de sesión, evaluación ilustrativa y restablecimiento.
- js/views.js: Dashboard, Lotes, detalle, Alertas, Cancha visual y Reglas.
- js/main.js: navegación, filtros, formularios, foco, mensajes y acciones de sesión.

## Recorrido disponible

- #dashboard: totales del conjunto de sesión, lotes por última medición y alertas recientes.
- #lotes: tabla con búsqueda por código y filtro por cliente.
- #lotes/DEMO-LOT-002: detalle, mediciones, alertas, historial y formulario ficticio.
- #alertas: listado por fecha, filtro por estado y enlace al lote asociado.
- #cancha: ubicaciones por sector, filtros y alternativa en listado.
- #reglas: condiciones ilustrativas y limitaciones de evaluación por cliente.

Los filtros de Lotes, Cancha y Alertas son independientes y solo se conservan
durante la sesión. Los listados actualizan resultados sin reemplazar sus controles.
Las tablas se desplazan horizontalmente con teclado en pantallas pequeñas.

## Datos originales y única fuente de sesión

El JSON inicial contiene dos clientes ficticios, ocho lotes, ocho ubicaciones,
dieciséis mediciones, cuatro reglas y cuatro alertas relacionadas por identificadores.
La carga crea un único conjunto mutable en memoria compartido por las vistas.
Una copia inicial separada se reserva exclusivamente para restablecer el conjunto.

El formulario agrega mediciones SIM-MED-* y, cuando corresponde, alertas
SIM-ALE-*. No hay localStorage, cookies, IndexedDB, escrituras al JSON ni envío
de mediciones. La única petición es la lectura del JSON local al cargar.
Recargar la página elimina todos los cambios de sesión.

Los nuevos registros usan la hora actual del navegador, presentada en UTC.
Si el reloj no es posterior a la última medición del lote, el registro se rechaza
con un mensaje; no se adelantan ni inventan fechas. La humedad debe ser finita
y estar entre 0 y 100 %. No se modifica ningún registro anterior.

## Reglas ilustrativas utilizadas

Las condiciones actuales del JSON son:

| Cliente ficticio | Humedad | Antigüedad de medición |
| --- | --- | --- |
| A | Mayor que 9 % | Mayor que 24 h |
| B | Mayor que 11 % | Mayor que 24 h |

Solo se evalúan reglas con illustrative: true, métrica humidityPercent, unidad %
y operador > con umbral válido. La comparación es estricta: igualar el umbral
no crea una alerta. Cada regla superada crea una alerta vinculada a la nueva
medición y al mismo cliente del lote.

Las reglas measurementAgeHours se muestran como referencia. No se generan
alertas temporales: no hay reloj de simulación ni barrido periódico definidos.
Las métricas, operadores o condiciones no compatibles se informan como
limitaciones, sin asumir una lógica alternativa. Si faltan reglas compatibles,
se registra la medición y se informa que no pudo evaluarse la humedad.

Las alertas nuevas llevan estado «Simulada» como identificación de esta sesión.
No se asigna severidad porque la regla no la define. No se deduplican ni cierran
alertas previas automáticamente: el JSON no aporta políticas para hacerlo.
El estado «Abierta» de las alertas originales permanece intacto.

## Reflejo de los registros

La última humedad se obtiene por fecha, no por posición en el array. Dashboard
y Lotes usan las mediciones de la misma sesión. El detalle y su cronología
incluyen los registros nuevos y las alertas asociadas. No se agregan eventos
operacionales previos ni una segunda colección de historial.

La cancha muestra la humedad reciente y el número de alertas por lote. La
ocupación solo depende de la relación lote-ubicación: las nuevas mediciones
no cambian esa ocupación ni crean estados operacionales.

Los sectores se extraen del texto anterior a "/" en las etiquetas existentes.
Una ubicación está ocupada si algún lote la referencia y libre si ninguno lo
hace. El filtro por cliente mantiene las ubicaciones realmente libres y excluye
las ocupadas por otros clientes. Ambos formatos usan las mismas relaciones.
El conjunto inicial tiene ocho ubicaciones ocupadas y ninguna libre.

## Restablecer

Abrir «Restablecer datos ficticios originales» y pulsar «Confirmar restablecimiento».
Se restaura la copia inicial en memoria, sin hacer otra petición ni modificar
el JSON. Se eliminan las mediciones y alertas simuladas. Si el filtro de Alertas
ya no existe tras restablecer, vuelve a «Todos los estados».

## Alcance y aplicación original

El estado operacional de los lotes no existe en el JSON y se muestra como
«No informado». No hay registro de lotes, edición de reglas, gestión del ciclo
de alertas ni seguimiento automático de antigüedad.

La aplicación original utiliza React, TypeScript, ASP.NET Core, EF Core y
SQL Server. Esta demo no copia código propietario ni se conecta a sistemas
operacionales. La tarjeta de CanchaTrack del portafolio ofrece «Explorar demo» mediante la ruta
relativa `demos/canchatrack/`, configurada con `demoUrl` y `demoTexto` en
`data/projects.json`. La aplicación original permanece independiente. La portada
provisional requiere la revisión descrita en el [README del portafolio](../../README.md).
