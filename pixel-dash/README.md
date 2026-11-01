# Pixel Dash

Pixel Dash es un runner web 2D estilo dinosaurio de Chrome, con estetica pixel art y tematica de fantasia. El proyecto esta pensado como pieza simple, bonita y funcional para portafolio.

## Objetivo

Controlar un personaje que corre automaticamente, saltar obstaculos, usar doble salto, cargar un dash especial y acumular puntaje hasta chocar.

## Tecnologias

- HTML
- CSS
- JavaScript puro
- HTML Canvas
- localStorage

## Como ejecutar localmente

Abre `index.html` directamente en el navegador o sirve la carpeta con un servidor local estatico.

```bash
python -m http.server 8000
```

Luego visita `http://localhost:8000`.

## Controles

- PC: barra espaciadora, flecha arriba o clic. Cuando el foco está en un botón, enlace o campo, se conserva su interacción nativa.
- Celular: toque en pantalla.
- El personaje puede hacer doble salto.
- Al superar obstaculos se carga la barra de poder.
- Con la barra llena, despues del doble salto puedes activar un dash hacia adelante que consume toda la carga.

## Funcionalidades del MVP

- Pantalla unica de juego.
- Canvas con loop principal.
- Jugador visible.
- Salto y doble salto.
- Barra de poder cargada por obstaculos superados.
- Dash especial hacia adelante con carga completa.
- Obstaculo simple con variantes de roca y trampa.
- Colisiones y Game Over.
- Puntaje actual.
- Mejor puntaje guardado en localStorage. Si el navegador bloquea su lectura o escritura, se muestra un aviso y el puntaje se conserva solo en memoria hasta recargar o cerrar la página.
- Reinicio de partida.
- Cuenta regresiva inicial.
- Boton temporal para volver al portafolio.
- Sonidos 8-bit generados con Web Audio.
- Fondo animado simple.
- Compatibilidad basica con PC y celular.

## Estructura

```text
pixel-dash/
|-- index.html
|-- README.md
|-- AGENTS.md
|-- assets/
|   |-- images/
|   |-- audio/
|   `-- fonts/
|-- css/
|   `-- styles.css
`-- js/
    |-- main.js
    |-- game.js
    |-- player.js
    |-- obstacle.js
    |-- input.js
    |-- storage.js
    `-- audio.js
```

## Creditos de assets

La version inicial usa figuras placeholder dibujadas en Canvas y sonidos generados con Web Audio. Las carpetas `assets/images`, `assets/audio` y `assets/fonts` quedan preparadas para incorporar assets locales.

## Mejoras futuras

- Integracion con portafolio real.
- Publicacion en GitHub Pages.
- Pausa.
- Mas obstaculos.
- Mas escenarios.
- Seleccion de personaje.
- PWA/offline.
- Ranking global.
