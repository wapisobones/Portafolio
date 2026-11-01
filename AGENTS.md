# AGENTS.md

## Objetivo del proyecto

Este repositorio contiene el portafolio personal de Patricio Albornoz.

El objetivo es construir un sitio web estatico, profesional y moderno para mostrar proyectos personales, experiencia profesional, perfil tecnico y contacto.

## Alcance del MVP

El MVP debe ser una pagina estatica con:

- Inicio / Hero
- Sobre mi
- Perfil tecnico / tecnologias
- Proyectos con filtros
- Experiencia profesional
- Contacto
- Footer simple

El portafolio debe mostrar inicialmente estos proyectos:

- Pixel Dash
- PCM - Plano Corte Madera
- SIPA - Sistema Integrado de Pesaje y Atencion
- SISCAN

## Reglas tecnicas

- Usar HTML, CSS y JavaScript puro.
- No usar backend.
- No usar base de datos.
- No agregar frameworks innecesarios.
- No convertir el proyecto a React, Next.js, Astro u otro framework sin autorizacion explicita.
- Usar `data/projects.json` como fuente principal de informacion de proyectos.
- Separar responsabilidades:
  - `index.html`: estructura general.
  - `assets/styles/`: estilos.
  - `js/main.js`: inicializacion.
  - `js/projects.js`: renderizado de proyectos.
  - `js/filters.js`: logica de filtros.
- Usar rutas relativas para facilitar publicacion futura en GitHub Pages, Netlify o Vercel.
- Mantener diseno responsive para movil y escritorio.
- Evitar dependencias externas salvo que sean estrictamente necesarias.

## Reglas de confidencialidad

Los proyectos profesionales SIPA y SISCAN deben tratarse con cuidado.

No incluir:

- Credenciales.
- Tokens.
- URLs reales de produccion.
- Endpoints internos sensibles.
- RUT.
- Datos personales.
- Nombres de usuarios reales.
- Capturas con informacion interna.
- Logos o imagenes reales de clientes sin autorizacion.
- Informacion contractual o privada.

Usar descripciones generales y la nota:

“Proyecto profesional descrito de forma general por confidencialidad del cliente.”

## Estilo visual

- Fondo oscuro.
- Estetica moderna, tecnica y profesional.
- Detalles sutiles estilo pixel/gamer.
- No convertir todo el sitio en una estetica de videojuego.
- Mantener equilibrio entre creatividad y seriedad profesional.
- Usar animaciones minimas: hover en tarjetas y botones, transiciones suaves.

## Contenido personal

Datos base:

- Nombre: Patricio Albornoz.
- Rol: Ingeniero en Informatica | Desarrollador Fullstack.
- Frase principal: “Diseno y desarrollo soluciones de software que conectan operacion, datos y usuarios.”
- Contacto inicial:
  - correo@ejemplo.com
  - linkedin.com/in/patricio-albornoz-rojas-19b582223

## Proyectos personales

Pixel Dash:

- Proyecto funcional.
- Juego estilo dinosaurio de Chrome.
- Tecnologias: HTML, CSS, JavaScript.
- Puede abrirse localmente desde `pixel-dash/index.html`.

PCM - Plano Corte Madera:

- Proyecto en desarrollo.
- Aplicacion para dimensionar cortes en planchas de madera y calcular perdida por corte.
- Puede abrirse localmente desde `pcm/index.html`.

## Proyectos profesionales

SIPA:

- Proyecto profesional.
- Sistema relacionado con pesaje, operacion e integraciones corporativas.
- Describir de forma general.
- No mostrar informacion sensible.

SISCAN:

- Proyecto profesional.
- Sistema web/backend para procesos operativos, APIs, frontend modular y despliegue multiambiente.
- Describir de forma general.
- No mostrar informacion sensible.

## Buenas practicas

- Mantener codigo limpio y facil de entender.
- Usar nombres de clases descriptivos.
- No duplicar logica innecesariamente.
- Mantener los datos de proyectos centralizados en JSON.
- Agregar `alt` en imagenes.
- Cuidar contraste y accesibilidad basica.
- Documentar en README como ejecutar y modificar el proyecto.

## Antes de modificar

Antes de hacer cambios grandes:

1. Revisar este archivo.
2. Mantener el alcance estatico.
3. No introducir backend, base de datos o frameworks sin autorizacion.
4. Respetar reglas de confidencialidad.
