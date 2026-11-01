# JobFinder AI: demo estática interactiva

JF-DEMO-002 prepara una demo independiente en HTML, CSS y JavaScript puro.
JF-DEMO-003 incorpora catálogo interactivo, detalle y organización de ofertas.
JF-DEMO-004 incorpora revisión de afirmaciones y consulta de compatibilidad ilustrativa.
JF-DEMO-005 incorpora seguimiento de postulaciones en memoria.
JF-DEMO-006 completa el Dashboard dinámico, los enlaces de seguimiento y el restablecimiento.
Todos los datos y textos de compatibilidad son ficticios. No se ejecuta el
proyecto original ni se accede a su base de datos.

## Ejecutar

Desde la raíz del portafolio:

```sh
python -m http.server 5500
```

Abrir http://localhost:5500/demos/jobfinder/.

Usar HTTP, no file://, porque las vistas utilizan módulos ES locales.
Las rutas de archivos son relativas y funcionan bajo un subdirectorio de
GitHub Pages, como /Portafolio/demos/jobfinder/. No hay dependencias externas.

## Estructura

```text
demos/jobfinder/
├── index.html
├── css/styles.css
├── js/
│   ├── app.js
│   ├── router.js
│   ├── state.js
│   ├── data.js
│   └── views/
│       ├── shared.js
│       ├── dashboard.js
│       ├── cv.js
│       ├── jobs.js
│       └── applications.js
└── README.md
```

- app.js: inicio, estado de carga/error y salto al contenido.
- router.js: navegación por fragmentos, carga local de vistas, títulos y foco.
- state.js: validación y única referencia compartida al conjunto en memoria.
- data.js: escenario ficticio y función que crea una copia inicial.
- views/: presentación independiente de cada pantalla y funciones comunes.

## Vistas

- #dashboard: guardadas, interés, activas y archivadas, distribución de activas
  en las cuatro etapas, actividad reciente y enlaces a ofertas/seguimientos.
- #mi-cv: perfil ficticio y revisión de cuatro afirmaciones con evidencia textual inventada.
- #empleos: catálogo de seis ofertas con búsqueda por cargo/empresa, modalidad
  y guardado. Las etiquetas de organización se distinguen de las postulaciones.
- #empleos/JF-OF-001: detalle, descripción, requisitos y contexto de postulación.
  Permite guardar/quitar y marcar/quitar interés de forma independiente.
  La compatibilidad consulta los cinco campos precargados e indica si quedaron desactualizados.
- #postulaciones: consulta de activas/archivadas, edición de etapa, notas y fechas,
  archivo, restauración e historial de acciones de la sesión.
- #postulaciones/JF-POST-001: el mismo módulo con foco y resaltado del seguimiento
  solicitado; los enlaces del Dashboard y las ofertas usan esta ruta.

El aviso «Demo interactiva · Datos ficticios · Resultados de IA ilustrativos»
permanece visible al desplazarse. Las rutas desconocidas permiten volver al
Dashboard. Los errores de datos o vistas ofrecen indicaciones y recarga.

## Datos y relaciones

El escenario fijo de mayo de 2026 incluye un perfil profesional ficticio, seis
ofertas de empresas identificadas expresamente como ficticias, cuatro ejemplos
de compatibilidad, cuatro postulaciones activas y una archivada.

Los ejemplos de compatibilidad y las postulaciones referencian el mismo perfil
y las ofertas por identificador. La compatibilidad presenta recomendación,
resumen, fortalezas, brechas y consejo. No incluye puntuaciones, porcentajes
ni inferencias reales.

Las colecciones permanecen separadas:

- savedOffers: ofertas guardadas para revisarlas después.
- interests: ofertas para las que se marcó interés.
- applications: registros explícitos de postulación, con etapa y archivo.

No se deduce una acción de otra. La oferta JF-OF-006 está guardada y marcada con
interés, pero no tiene postulación. JF-OF-001 tiene postulación y no está guardada
ni marcada con interés. Estas diferencias son parte del conjunto de ejemplo.

## Alcance de esta entrega

Son funcionales la navegación, los filtros del catálogo, el detalle, guardar y
quitar de guardadas, y marcar y quitar interés. Cada pantalla indica sus flujos
pendientes. Desde una oferta guardada sin seguimiento activo se puede registrar
una postulación ficticia. Mis postulaciones permite editar, archivar y restaurar.
No hay carga/extracción de documentos ni evaluación de IA.

El estado compartido expone instantáneas inmutables. setOfferSaved actualiza
únicamente savedOffers y setOfferInterest únicamente interests, sin duplicar
ofertas ni tocar applications o compatibilityExamples. Las fechas de las nuevas
marcas corresponden a la acción de la sesión, no a eventos históricos precargados.

Los filtros se conservan en memoria al ir al detalle, volver o usar Atrás.
Se borran al recargar. Buscar no reemplaza los controles ni mueve el foco.
Si se quita una oferta del filtro Guardadas y desaparece de la lista, el foco
pasa al mismo control de una oferta restante o al conteo de resultados.

«Descubierta» indica ausencia de guardado e interés; una oferta descubierta
puede tener una postulación previa. Ese contexto se muestra por separado.
Consultar un texto precargado no genera un análisis ni ejecuta IA.

## Revisión de afirmaciones y compatibilidad

La fábrica del conjunto añade cuatro afirmaciones pendientes vinculadas al titular,
resumen, descripción de una experiencia y una tecnología del perfil existente.
Cada afirmación referencia un fragmento textual explícitamente ficticio. No se
procesa un CV ni se extrae información de PDF/DOCX.

- Confirmar original: conserva o restaura el texto original.
- Corregir: sustituye la información correspondiente; requiere entre 3 y 500
  caracteres, distintos del original. No permite duplicar una tecnología existente.
- Rechazar: excluye la afirmación del perfil de la sesión, conservando el texto
  original y su evidencia para revisión.

Los estados pendiente, confirmada, corregida y rechazada son visibles mediante
texto y estilo. Los errores se muestran junto al campo y devuelven el foco a él.
Los borradores y filtros se conservan en memoria al navegar; desde Mi CV puede
volverse a la última oferta consultada. Revisar afirmaciones no modifica postulaciones.

El perfil tiene una revisión de contenido. Confirmar sin cambiarlo no la aumenta.
Corregir o rechazar información incrementa esa revisión y marca los cuatro
ejemplos como «No actualizado respecto al perfil actual», incluso antes de abrir
su contenido. El aviso también acompaña los cinco campos: recomendación, resumen,
fortalezas, brechas y consejo. Sus textos precargados nunca se modifican ni se
recalculan. Restaurar manualmente el texto no elimina el aviso: no se ha generado
una nueva evaluación. Recargar o confirmar «Restablecer demo» recupera el conjunto inicial.

Para las dos ofertas sin ejemplo se indica que no existe una evaluación
ilustrativa disponible. No se inventa una recomendación alternativa.

## Seguimiento de postulaciones

Registrar requiere una oferta guardada y ausencia de otra postulación activa
para la misma oferta. Guardar, marcar interés y registrar son acciones explícitas
e independientes. Registrar nunca cambia savedOffers o interests, ni envía datos.

Las activas y archivadas tienen enlaces al detalle de su oferta. El formulario
permite elegir una etapa conocida, editar notas de hasta 1000 caracteres y
establecer fechas ficticias opcionales de postulación y próximo seguimiento.
Las fechas deben ser válidas; si se informan ambas, el seguimiento no puede ser
anterior a la postulación. Estos campos no se deducen de registeredAt ni cambian
la fecha del registro original.

Los borradores se conservan en memoria al navegar o actualizar otros registros.
Los errores se muestran junto a los controles y el foco vuelve al campo afectado.
Editar un seguimiento archivado no lo restaura automáticamente. Cambiar a
«Cerrada» tampoco archiva: no se asumen políticas de transición desconocidas.

### Etapas de esta demo

Se mantienen exclusivamente Enviada, En revisión, Entrevista y Cerrada.
No se incorporan otras etapas ni se asumen transiciones automáticas.
La distribución del Dashboard cuenta solo postulaciones activas; las archivadas
se presentan aparte y no forman parte del total por etapas.

### Duplicados y archivo

Solo puede existir un seguimiento activo por oferta. El registro y la restauración
validan esa condición en el estado, además de los controles de interfaz. Archivar
no borra el registro ni cambia su etapa. Puede registrarse otro seguimiento de una
oferta guardada que solo tenga archivados; restaurar el anterior queda bloqueado
mientras el nuevo siga activo. No se elimina ni se fusiona ningún registro.

### Historial y procedencia

applicationTracking.originals conserva una referencia inmutable a los cinco
registros iniciales, sin crear eventos del pasado. Se muestran aparte como datos
originales precargados. No existe un historial original de transiciones en el
conjunto y la interfaz lo indica expresamente.

applicationTracking.events empieza vacío. Solo registra las acciones reales de
esta simulación: registro, edición, archivo y restauración, con hora actual del
navegador y valores antes/después. Se presenta cronológicamente en UTC, separado
de la referencia original. No se generan eventos por operaciones sin cambios ni
por validaciones fallidas.

Los registros nuevos usan identificadores SIM-POST-* y los eventos SIM-EVT-*.
Dashboard y Empleos consultan el mismo conjunto de sesión. Si una oferta tiene
archivados y una postulación activa, Empleos da prioridad al contexto activo.
No se alteran el perfil ni los textos de compatibilidad.

## Dashboard y actividad reciente

Los cuatro indicadores derivan del estado compartido: guardadas, interés,
postulaciones activas y archivadas. La distribución muestra los conteos de activas
por las cuatro etapas, incluyendo etapas con cero registros. No hay porcentajes
ni indicadores de contratación.

Los resúmenes enlazan a los detalles de las ofertas y a seguimientos concretos.
Volver al catálogo conserva sus filtros. Los enlaces a seguimientos ponen el foco
en su tarjeta, tanto si está activa como archivada; una ruta inexistente lo informa.

La actividad mezcla hasta ocho entradas ordenadas por las fechas disponibles:
registros originales de applicationTracking.originals, eventos de seguimiento de
la sesión y acciones reales de guardar/quitar o marcar/quitar interés. Los
originales se rotulan como datos precargados y solo muestran la fecha de registro
existente. No se deducen transiciones pasadas ni un horario que no esté disponible.
Las acciones de sesión llevan su hora real del navegador en UTC. Una operación
sin cambios o fallida no añade actividad.

## Restablecer demo

El botón global abre un diálogo con confirmación. Cancelar o pulsar Escape conserva
el estado y devuelve el foco al botón. Confirmar recupera la instantánea inicial
inmutable en memoria, sin recargar la página ni volver a cargar el conjunto ficticio. También limpia filtros, borradores,
actividad de ofertas, eventos de seguimiento y cambios de revisión del perfil.

Se conserva la sección actual si sigue siendo válida. Si el seguimiento simulado
de la ruta desaparece al restablecer, se vuelve a Mis postulaciones. Las rutas de
ofertas originales se mantienen. El foco vuelve al contenido renderizado y se
anuncia el resultado.

## Recorrido sugerido

1. Consultar el Dashboard inicial y abrir una oferta guardada.
2. Buscar/filtrar en Empleos, guardar o marcar interés y regresar al Dashboard
   para comprobar que ambas acciones se cuentan por separado.
3. Abrir JF-OF-006, guardada inicialmente y sin seguimiento activo, y registrar
   una postulación ficticia eligiendo una de las cuatro etapas.
4. Abrir ese seguimiento desde el Dashboard, editar etapa, notas o fechas,
   archivarlo y restaurarlo. Los conteos y la actividad reflejan cada cambio.
5. Revisar afirmaciones de Mi CV y consultar desde una oferta los cinco campos
   de compatibilidad precargados, con su aviso de desactualización si corresponde.
6. Confirmar «Restablecer demo» para volver a los datos iniciales.

Los límites se mantienen: datos ficticios, resultados precargados sin IA, sin
envíos reales, sin carga/extracción de documentos y únicamente cuatro etapas.

Recargar también recrea el conjunto inicial. No hay localStorage, sessionStorage,
cookies, IndexedDB, OAuth, scraping, APIs ni proveedores de IA. Solo se solicitan
archivos estáticos del propio sitio.

La aplicación original utiliza React, TypeScript, ASP.NET Core 10, EF Core y
SQL Server. La demo no copia código propietario ni información personal.
El portafolio principal, data/projects.json y las otras demos quedan intactos.
