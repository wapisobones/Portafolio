# Portafolio de Patricio Albornoz

MVP del portafolio personal de Patricio Albornoz, Ingeniero en Informatica y Desarrollador Fullstack.

El objetivo del sitio es presentar proyectos personales, experiencia profesional, perfil tecnico y datos de contacto en una vitrina estatica, moderna y facil de publicar.

## Tecnologias

- HTML
- CSS
- JavaScript puro
- JSON para los datos de proyectos

No usa backend, base de datos, login, panel administrador ni frameworks frontend.

## Como ejecutarlo localmente

Desde la raiz del proyecto, levantar un servidor estatico:

```bash
python -m http.server 5500
```

Luego abrir:

```text
http://localhost:5500
```

Tambien puedes usar extensiones como Live Server en VS Code. Se recomienda usar servidor estatico porque `fetch` carga `data/projects.json`.

## Estructura de carpetas

```text
portafolio/
├─ index.html
├─ README.md
├─ AGENTS.md
├─ assets/
│  ├─ images/
│  │  └─ placeholders/
│  ├─ icons/
│  └─ styles/
│     └─ main.css
├─ data/
│  └─ projects.json
├─ js/
│  ├─ main.js
│  ├─ projects.js
│  └─ filters.js
├─ pixel-dash/
│  └─ index.html
└─ pcm/
   └─ index.html
```

## Como agregar nuevos proyectos

Editar `data/projects.json` y agregar un objeto con esta estructura:

```json
{
  "id": "nuevo-proyecto",
  "nombre": "Nuevo Proyecto",
  "descripcion": "Descripcion corta del proyecto.",
  "estado": "En desarrollo",
  "tipo": "Hobby",
  "categorias": ["Web", "Hobby"],
  "tecnologias": ["HTML", "CSS", "JavaScript"],
  "imagen": "",
  "demoUrl": "",
  "codigoUrl": "",
  "confidencial": false,
  "rol": "Desarrollo completo"
}
```

Reglas importantes:

- `demoUrl`: si esta vacio, no se muestra el boton "Ver proyecto".
- `demoTexto`: personaliza el texto de la acción; si falta, se usa "Ver proyecto".
- `codigoUrl`: si esta vacio o contiene `privado`, no se muestra el boton "Ver codigo".
- `imagen`: si esta vacio o falla la carga, se muestra un placeholder visual.
- `categorias`, `tipo` y `estado` se usan para los filtros.

## Demo de CanchaTrack

La tarjeta conserva la descripción del proyecto fullstack, su estado, aporte y
tecnologías originales. La aclaración final distingue la demo estática independiente,
que utiliza exclusivamente datos ficticios.

La acción **Explorar demo** usa los campos existentes `demoUrl` y `demoTexto`.
Su destino es `demos/canchatrack/`, relativo al portafolio, compatible con una
publicación de GitHub Pages bajo el nombre del repositorio. Desde la demo se
puede volver a `../../index.html#proyectos`.

Para recorrerla localmente, iniciar el servidor indicado arriba y abrir
http://localhost:5500/demos/canchatrack/. El funcionamiento se documenta en
[demos/canchatrack/README.md](demos/canchatrack/README.md).

**Portada provisional, revisión pendiente antes de publicar:** se conserva
`assets/images/dashboard_canchaTrack.png`. No se ha generado una captura nueva
de la demo ni se ha verificado que la imagen actual carezca de información real.
No debe considerarse anonimizada ni aprobada para publicación. Revisar su
contenido o reemplazarla por una captura comprobada de la demo con datos ficticios.

## Demo de JobFinder AI

La ficha presenta el MVP original fullstack: React, TypeScript, ASP.NET Core 10,
EF Core y SQL Server, con aporte de diseño y desarrollo fullstack. La descripción
distingue la demostración estática interactiva independiente, que usa únicamente
datos ficticios y compatibilidades ilustrativas precargadas; no ejecuta IA.

La acción **Explorar demo** reutiliza `demoUrl` y `demoTexto` y enlaza a
`demos/jobfinder/`. La ficha aparece en Todos, Personales, Web y Sistemas.
El estado MVP se muestra con la etiqueta genérica existente, sin cambiar el
renderizador ni equipararlo automáticamente a «En desarrollo».

Con el servidor estático iniciado, abrir http://localhost:5500/demos/jobfinder/.
El recorrido se documenta en [README de JobFinder AI](demos/jobfinder/README.md).
Las rutas relativas permiten publicar bajo `/Portafolio/` en GitHub Pages.

**Imagen definitiva pendiente:** no existe una captura de JobFinder AI entre los
archivos disponibles. Se utiliza `assets/images/jobfinder-demo-placeholder.svg`,
identificada visualmente como «Portada provisional», con texto alternativo que
indica la captura pendiente. Es una ilustración, no una captura de la aplicación,
y no muestra datos personales ni ofertas. `verImagen: false` evita presentar
la ilustración mediante una acción «Ver captura».

Cuando exista una captura real de la demo, comprobar que solo contiene datos
ficticios y actualizar su referencia y texto alternativo en `data/projects.json`.

## Como modificar datos de contacto

Los datos placeholder estan en `index.html`, seccion `#contacto`:

- `correo@ejemplo.com`
- `linkedin.com/in/patricio-albornoz-rojas-19b582223`

Mantener placeholders hasta contar con datos reales autorizados.

## Publicacion futura

El sitio queda preparado para publicarse como sitio estatico en:

- GitHub Pages
- Netlify
- Vercel

Antes de publicar, verificar que todas las rutas sigan siendo relativas y que `data/projects.json` cargue correctamente desde el entorno elegido.

## Confidencialidad

Los proyectos profesionales SIPA y SISCAN se describen de forma general por confidencialidad del cliente.

No incluir en el repositorio:

- Credenciales o tokens.
- URLs reales de produccion.
- Endpoints internos sensibles.
- RUT o datos personales.
- Nombres de usuarios reales.
- Capturas con informacion interna.
- Logos o imagenes reales de clientes sin autorizacion.
- Informacion contractual o privada.
