import { AudioController } from "./audio.js";
import { createObstacle } from "./obstacle.js";
import { Player } from "./player.js";
import { getBestScore, saveBestScore } from "./storage.js";

const STATES = {
  // Estados principales del flujo de la partida.
  READY: "ready",
  COUNTDOWN: "countdown",
  PLAYING: "playing",
  GAME_OVER: "gameOver",
};

const POWER_MAX = 4;
const POWER_PER_OBSTACLE = 1;

export class Game {
  constructor(canvas, ui) {
    // Dependencias principales: canvas, UI, audio, jugador y estado inicial.
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.ui = ui;
    this.audio = new AudioController();
    this.player = new Player(this.canvas.height);
    this.groundY = this.canvas.height - 78;
    this.state = STATES.READY;
    this.bestScore = getBestScore();
    this.lastTime = 0;
    this.animationFrame = null;
    this.obstacles = [];
    this.score = 0;
    this.power = 0;
    this.speed = 320;
    this.spawnTimer = 0;
    this.nextSpawn = 1.4;
    this.backgroundOffset = 0;
    this.stars = this.createStars();
  }

  start() {
  this.updateScoreUi();
  this.showReady();

  this.tryPlayReadyMusic();

  this.animationFrame = window.requestAnimationFrame((time) => this.loop(time));
}

tryPlayReadyMusic() {
  this.audio.playMusic("assets/music/TownTheme.mp3");

  const unlockAndPlay = () => {
    //this.audio.unlock();
    this.audio.playMusic("assets/music/TownTheme.mp3");

    window.removeEventListener("pointerdown", unlockAndPlay);
    window.removeEventListener("keydown", unlockAndPlay);
    window.removeEventListener("touchstart", unlockAndPlay);
  };

  window.addEventListener("pointerdown", unlockAndPlay, { once: true });
  window.addEventListener("keydown", unlockAndPlay, { once: true });
  window.addEventListener("touchstart", unlockAndPlay, { once: true });
}

  handleJump() {
    // Una misma accion sirve para empezar o para saltar durante la partida.
    this.audio.unlock();

    if (this.state === STATES.READY) {
      this.startCountdown();
      return;
    }

    if (this.state !== STATES.PLAYING) {
      return;
    }

    if (this.player.jump()) {
      this.audio.playJump();
      return;
    }

    if (this.isPowerFull()) {
      this.player.dash();
      this.consumePower();
      this.audio.playJump();
    }
  }

  restart() {
    // Reinicia los datos de la carrera y vuelve a la cuenta regresiva.
    this.resetRun();
    this.startCountdown();
  }

  startCountdown() {
    this.state = STATES.COUNTDOWN;
    this.ui.readyPanel.hidden = true;
    this.ui.gameOverPanel.hidden = true;
    this.audio.playMusic("assets/music/TownTheme.mp3");
    this.runCountdown(3);
  }

  runCountdown(value) {
    this.ui.countdown.hidden = false;
    this.ui.countdown.textContent = String(value);

    if (value <= 0) {
      this.ui.countdown.hidden = true;
      this.resetRun();
      this.state = STATES.PLAYING;
      this.audio.playMusic("assets/music/WoodlandFantasy.mp3");
      return;
    }

    window.setTimeout(() => this.runCountdown(value - 1), 700);
  }

  resetRun() {
    // Valores que deben volver a cero al iniciar una nueva partida.
    this.player.reset();
    this.obstacles = [];
    this.score = 0;
    this.power = 0;
    this.speed = 320;
    this.spawnTimer = 0;
    this.nextSpawn = 1.1;
    this.backgroundOffset = 0;
    this.updateScoreUi();
    this.updatePowerUi();
  }

  loop(time) {
    // requestAnimationFrame entrega el tiempo para calcular movimiento fluido.
    const deltaTime = Math.min((time - this.lastTime) / 1000 || 0, 0.033);
    this.lastTime = time;

    this.update(deltaTime);
    this.draw();

    this.animationFrame = window.requestAnimationFrame((nextTime) => this.loop(nextTime));
  }

  update(deltaTime) {
    // Solo actualiza gameplay mientras se esta jugando.
    if (this.state !== STATES.PLAYING) {
      return;
    }

    this.score += deltaTime * 14;
    this.speed = 320 + this.score * 0.45;
    this.backgroundOffset += this.speed * deltaTime * 0.35;

    const wasDashing = this.player.isDashing;
    this.player.update(deltaTime);
    this.updateObstacles(deltaTime, wasDashing);
    this.updateScoreUi();

    if (this.hasCollision()) {
      this.finishRun();
    }
  }

  updateObstacles(deltaTime, wasDashing = false) {
    // Genera obstaculos cada cierto tiempo y aumenta presion con el puntaje.
    this.spawnTimer += deltaTime;

    if (this.spawnTimer >= this.nextSpawn) {
      this.obstacles.push(createObstacle(this.canvas.width + 20, this.groundY, this.score));
      this.spawnTimer = 0;
      this.nextSpawn = Math.max(0.75, 1.35 - this.score / 900 + Math.random() * 0.45);
    }

    this.obstacles.forEach((obstacle) => obstacle.update(deltaTime, this.speed));
    this.obstacles.forEach((obstacle) => this.checkObstacleDashed(obstacle, wasDashing));
    this.obstacles.forEach((obstacle) => this.checkObstaclePassed(obstacle));
    this.obstacles = this.obstacles.filter((obstacle) => !obstacle.isOffscreen());
  }

  checkObstacleDashed(obstacle, wasDashing) {
    // Si el dash ya dejo al jugador por delante, ese obstaculo queda superado.
    if ((!this.player.isDashing && !wasDashing) || obstacle.wasDashed) {
      return;
    }

    const playerBounds = this.player.getBounds();
    const obstacleBounds = obstacle.getBounds();

    if (playerBounds.x > obstacleBounds.x + obstacleBounds.width) {
      obstacle.wasDashed = true;
    }
  }

  checkObstaclePassed(obstacle) {
    // Cada obstaculo superado carga una parte del poder especial.
    if (obstacle.wasPassed || obstacle.x + obstacle.width >= this.player.x) {
      return;
    }

    obstacle.wasPassed = true;
    this.addPower(POWER_PER_OBSTACLE);
  }

  hasCollision() {
    // Compara cajas rectangulares del jugador contra cada obstaculo.
    if (this.player.isDashing || this.player.isDashRecovering) {
      return false;
    }

    const playerBounds = this.player.getBounds();

    return this.obstacles.some((obstacle) => {
      if (obstacle.wasDashed) {
        return false;
      }

      const obstacleBounds = obstacle.getBounds();
      return (
        playerBounds.x < obstacleBounds.x + obstacleBounds.width &&
        playerBounds.x + playerBounds.width > obstacleBounds.x &&
        playerBounds.y < obstacleBounds.y + obstacleBounds.height &&
        playerBounds.y + playerBounds.height > obstacleBounds.y
      );
    });
  }

  finishRun() {
    this.state = STATES.GAME_OVER;
    this.power = 0;
    this.audio.stopMusic();
    this.audio.playHit();
    this.audio.playGameOver();
    this.bestScore = saveBestScore(this.score);
    this.ui.finalScore.textContent = String(Math.floor(this.score));
    this.updateScoreUi();
    this.updatePowerUi();
    this.ui.gameOverPanel.hidden = false;
  }

  showReady() {
    // Estado visual antes de empezar a jugar.
    this.ui.readyPanel.hidden = false;
    this.ui.gameOverPanel.hidden = true;
    this.ui.countdown.hidden = true;
  }

  updateScoreUi() {
    // Mantiene sincronizado el HUD con los puntajes actuales.
    this.ui.score.textContent = String(Math.floor(this.score));
    this.ui.bestScore.textContent = String(Math.floor(this.bestScore));
  }

  addPower(amount) {
    this.power = Math.min(POWER_MAX, this.power + amount);
    this.updatePowerUi();
  }

  consumePower() {
    this.power = 0;
    this.updatePowerUi();
  }

  isPowerFull() {
    return this.power >= POWER_MAX;
  }

  updatePowerUi() {
    const percent = Math.floor((this.power / POWER_MAX) * 100);
    this.ui.powerFill.style.width = `${percent}%`;
    this.ui.powerFill.classList.toggle("is-full", this.isPowerFull());
    this.ui.powerLabel.textContent = this.isPowerFull() ? "LISTO" : `${percent}%`;
  }

  draw() {
    // Orden de dibujo: fondo, jugador y luego obstaculos.
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawBackground();
    this.player.draw(this.context);
    this.obstacles.forEach((obstacle) => obstacle.draw(this.context));
  }

  drawBackground() {
    // Fondo de campo nocturno: cielo, luna, estrellas, colinas y cesped.
    const ctx = this.context;
    const sky = ctx.createLinearGradient(0, 0, 0, this.groundY);
    sky.addColorStop(0, "#0d1426");
    sky.addColorStop(0.58, "#14203a");
    sky.addColorStop(1, "#16283d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, this.canvas.width, this.groundY);

    ctx.fillStyle = "#f7e7a6";
    ctx.fillRect(790, 54, 38, 38);
    ctx.fillStyle = "#0d1426";
    ctx.fillRect(778, 48, 26, 42);

    this.stars.forEach((star) => {
      const x = (star.x - this.backgroundOffset * star.speed) % this.canvas.width;
      const wrappedX = x < 0 ? x + this.canvas.width : x;
      ctx.fillStyle = star.color;
      ctx.fillRect(wrappedX, star.y, star.size, star.size);
    });

    this.drawHillLayer(ctx, 0.08, this.groundY - 78, "#17283f", 72);
    this.drawHillLayer(ctx, 0.14, this.groundY - 48, "#18384a", 54);

    ctx.fillStyle = "#19341f";
    ctx.fillRect(0, this.groundY, this.canvas.width, this.canvas.height - this.groundY);

    ctx.fillStyle = "#66c35c";
    ctx.fillRect(0, this.groundY, this.canvas.width, 12);

    ctx.fillStyle = "#8de06f";
    const grassOffset = -this.backgroundOffset % 18;
    for (let x = grassOffset; x < this.canvas.width; x += 18) {
      ctx.fillRect(x, this.groundY - 5, 4, 9);
      ctx.fillRect(x + 7, this.groundY - 9, 4, 13);
      ctx.fillRect(x + 13, this.groundY - 4, 4, 8);
    }

    ctx.fillStyle = "#102317";
    const tileSize = 36;
    const tileOffset = -this.backgroundOffset % tileSize;
    for (let x = tileOffset; x < this.canvas.width; x += tileSize) {
      ctx.fillRect(x, this.groundY + 28, 20, 5);
      ctx.fillRect(x + 10, this.groundY + 48, 14, 5);
    }
  }

  drawHillLayer(ctx, speed, baseY, color, height) {
    // Capa de colinas con parallax suave.
    const width = 180;
    const offset = -this.backgroundOffset * speed;

    ctx.fillStyle = color;
    for (let i = -1; i < Math.ceil(this.canvas.width / width) + 2; i += 1) {
      const x = i * width + (offset % width);
      ctx.beginPath();
      ctx.moveTo(x, this.groundY);
      ctx.lineTo(x, baseY + 22);
      ctx.lineTo(x + 45, baseY);
      ctx.lineTo(x + 96, baseY + 18);
      ctx.lineTo(x + width, baseY - height * 0.12);
      ctx.lineTo(x + width, this.groundY);
      ctx.closePath();
      ctx.fill();
    }
  }

  createStars() {
    // Estrellas fijas que se mueven lentamente para dar profundidad.
    return [
      { x: 70, y: 54, size: 3, speed: 0.03, color: "#f7f1de" },
      { x: 150, y: 108, size: 2, speed: 0.04, color: "#bde7ff" },
      { x: 245, y: 42, size: 2, speed: 0.03, color: "#f7f1de" },
      { x: 340, y: 88, size: 3, speed: 0.05, color: "#d9fff0" },
      { x: 465, y: 65, size: 2, speed: 0.04, color: "#f7f1de" },
      { x: 570, y: 116, size: 3, speed: 0.03, color: "#bde7ff" },
      { x: 680, y: 34, size: 2, speed: 0.05, color: "#f7f1de" },
      { x: 865, y: 104, size: 3, speed: 0.04, color: "#d9fff0" },
      { x: 925, y: 58, size: 2, speed: 0.03, color: "#f7f1de" },
    ];
  }
}
