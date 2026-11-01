import { Game } from "./game.js";
import { InputController } from "./input.js";
import { setStorageWarningHandler } from "./storage.js";

// Elementos principales que vienen desde index.html.
const canvas = document.querySelector("#game-canvas");
const portfolioLink = document.querySelector("#portfolio-link");
const storageNotice = document.querySelector("#storage-notice");

setStorageWarningHandler(() => {
  storageNotice.hidden = false;
  storageNotice.textContent = "No se puede acceder al almacenamiento del navegador. Tu mejor puntaje se conserva solo en esta sesión y se pierde al recargar o cerrar esta página.";
});

// Referencias del HUD y pantallas flotantes que Game va actualizando.
const ui = {
  score: document.querySelector("#score"),
  bestScore: document.querySelector("#best-score"),
  powerFill: document.querySelector("#power-fill"),
  powerLabel: document.querySelector("#power-label"),
  readyPanel: document.querySelector("#ready-panel"),
  countdown: document.querySelector("#countdown"),
  gameOverPanel: document.querySelector("#game-over-panel"),
  finalScore: document.querySelector("#final-score"),
};

// Crea el juego y conecta los controles con el canvas.
const game = new Game(canvas, ui);
const input = new InputController(canvas);

// Botones principales del flujo del juego.
document.querySelector("#start-button").addEventListener("click", () => game.handleJump());
document.querySelector("#restart-button").addEventListener("click", () => game.restart());

// URL temporal configurable desde el atributo data-portfolio-url del HTML.
portfolioLink.href = portfolioLink.dataset.portfolioUrl || "#";
input.bind(() => game.handleJump());
game.start();
