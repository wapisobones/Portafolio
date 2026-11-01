export class Player {
  constructor(gameHeight) {
    // Medidas y fisica basica del personaje.
    this.width = 42;
    this.height = 58;
    this.x = 120;
    this.groundY = gameHeight - 78;
    this.gravity = 1700;
    this.jumpForce = 680;
    this.maxJumps = 2;
    this.baseX = 120;
    this.dashForce = 760;
    this.dashSpeed = 620;
    this.dashDuration = 0.28;
    this.reset();
  }

  reset() {
    // Devuelve al jugador al suelo y limpia sus saltos usados.
    this.x = this.baseX;
    this.y = this.groundY - this.height;
    this.velocityY = 0;
    this.velocityX = 0;
    this.jumpsUsed = 0;
    this.isGrounded = true;
    this.isDashing = false;
    this.isDashRecovering = false;
    this.dashTimer = 0;
  }

  jump() {
    // Permite salto normal y doble salto.
    if (this.jumpsUsed >= this.maxJumps) {
      return false;
    }

    this.velocityY = -this.jumpForce;
    this.jumpsUsed += 1;
    this.isGrounded = false;
    return true;
  }

  dash() {
    // Poder especial: un tercer impulso con avance horizontal temporal.
    this.velocityY = -this.dashForce;
    this.velocityX = this.dashSpeed;
    this.jumpsUsed = this.maxJumps + 1;
    this.isGrounded = false;
    this.isDashing = true;
    this.isDashRecovering = false;
    this.dashTimer = this.dashDuration;
  }

  update(deltaTime) {
    // Aplica gravedad y detecta cuando vuelve a tocar el suelo.
    if (this.isDashing) {
      this.dashTimer -= deltaTime;

      if (this.dashTimer <= 0) {
        this.isDashing = false;
        this.isDashRecovering = !this.isGrounded;
      }
    }

    this.velocityY += this.gravity * deltaTime;
    this.y += this.velocityY * deltaTime;
    this.x += this.velocityX * deltaTime;

    if (!this.isDashing && this.x > this.baseX) {
      this.velocityX = Math.min(this.velocityX, 0);
      this.x = Math.max(this.baseX, this.x - 260 * deltaTime);
    }

    const floor = this.groundY - this.height;
    if (this.y >= floor) {
      this.y = floor;
      this.velocityY = 0;
      this.velocityX = 0;
      this.x = this.baseX;
      this.jumpsUsed = 0;
      this.isGrounded = true;
      this.isDashing = false;
      this.isDashRecovering = false;
    }
  }

  getBounds() {
    // Caja de colision ajustada al cuerpo del mago.
    return {
      x: this.x + 7,
      y: this.y + 4,
      width: this.width - 14,
      height: this.height - 6,
    };
  }

  draw(context) {
    // Dibuja el mago con figuras pixel art directamente en canvas.
    context.save();
    context.imageSmoothingEnabled = false;

    const bob = this.isGrounded ? 0 : -2;
    const x = this.x;
    const y = this.y + bob;

    if (this.isDashing) {
      context.fillStyle = "rgba(98, 217, 150, 0.32)";
      context.fillRect(x - 34, y + 18, 28, 8);
      context.fillStyle = "rgba(255, 209, 102, 0.38)";
      context.fillRect(x - 52, y + 31, 42, 7);
      context.fillStyle = "rgba(79, 141, 255, 0.42)";
      context.fillRect(x - 24, y + 44, 20, 6);
    }

    // cuerpo del pj
    context.fillStyle = "#1d51c9";
    context.fillRect(x + 15, y + 25, 24, 27);
    context.fillStyle = "#153b99";
    context.fillRect(x + 10, y + 31, 8, 18);
    context.fillRect(x + 36, y + 29, 8, 22);
    context.fillStyle = "#4f8dff";
    context.fillRect(x + 18, y + 29, 5, 5);
    context.fillRect(x + 29, y + 42, 4, 4);
    // cara del pj
    context.fillStyle = "#f0bd82";
    context.fillRect(x + 18, y + 16, 19, 16);
    context.fillStyle = "#ffe0ad";
    context.fillRect(x + 20, y + 18, 12, 8);
    // barba del pj
    context.fillStyle = "#f4e3e3";
    context.fillRect(x + 18, y + 27, 17, 16);
    context.fillRect(x + 22, y + 41, 10, 6);
    context.fillStyle = "#d8d0c4";
    context.fillRect(x + 29, y + 29, 6, 14);
    // sombrero del pj
    context.fillStyle = "#113fb5";
    context.beginPath();
    context.moveTo(x + 12, y + 16);
    context.lineTo(x + 28, y - 10);
    context.lineTo(x + 45, y + 16);
    context.closePath();
    context.fill();
    context.fillStyle = "#2d6bff";
    context.fillRect(x + 25, y - 7, 9, 6);
    context.fillRect(x + 19, y + 4, 19, 6);
    context.fillStyle = "#0f2f86";
    context.fillRect(x + 12, y + 15, 36, 5);
    // ojo del pj
    context.fillStyle = "#1f2330";
    context.fillRect(x + 33, y + 21, 4, 4);
    // baston
    context.fillStyle = "#292119";
    context.fillRect(x + 6, y + 12, 4, 45);
    context.fillStyle = "#f2be42";
    context.fillRect(x + 3, y + 8, 10, 7);
    context.fillStyle = "#ff7a2f";
    context.fillRect(x + 6, y + 4, 5, 5);
    // pies
    context.fillStyle = "#102c72";
    context.fillRect(x + 17, y + 51, 8, 7);
    context.fillRect(x + 31, y + 51, 8, 7);

    context.restore();
  }
}
