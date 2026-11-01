export class Obstacle {
  constructor(type, x, groundY) {
    this.type = type;
    this.x = x;
    this.groundY = groundY;
    this.wasPassed = false;
    this.wasDashed = false;

    if (type === "trap") {
      this.width = 50;
      this.height = 36;
    } else if (type === "tall") {
      this.width = 48;
      this.height = 104;
    } else {
      this.width = 48;
      this.height = 52;
    }

    this.y = this.groundY - this.height;
  }

  update(deltaTime, speed) {
    // Los obstaculos se mueven hacia la izquierda para simular carrera.
    this.x -= speed * deltaTime;
  }

  isOffscreen() {
    // Permite borrar obstaculos que ya salieron del canvas.
    return this.x + this.width < 0;
  }

  getBounds() {
    // Caja de colision un poco mas chica que el dibujo para evitar choques injustos.
    return {
      x: this.x + 4,
      y: this.y + 4,
      width: this.width - 8,
      height: this.height - 6,
    };
  }

  draw(context) {
    if (this.type === "trap") {
      this.drawTrap(context);
      return;
    }

    if (this.type === "tall") {
      this.drawTallRock(context);
      return;
    }

    this.drawRock(context);
  }

  drawRock(context) {
    context.save();
    // muro de piedra
    context.fillStyle = "#5e6675";
    context.fillRect(this.x + 6, this.y + 8, 38, 44);
    context.fillStyle = "#747d8c";
    context.fillRect(this.x + 6, this.y + 8, 38, 10);
    context.fillStyle = "#4a5363";
    context.fillRect(this.x + 6, this.y + 35, 38, 17);

    context.fillStyle = "#8f98a8";
    context.fillRect(this.x + 13, this.y + 16, 8, 8);
    context.fillRect(this.x + 30, this.y + 25, 7, 7);
    context.fillStyle = "#394251";
    context.fillRect(this.x + 20, this.y + 36, 18, 4);
    context.restore();
  }

  drawTallRock(context) {
    context.save();
    // muro alto de 2 pisos
    // piso de arriba
    context.fillStyle = "#5e6675";
    context.fillRect(this.x + 6, this.y + 8, 38, 44);
    context.fillStyle = "#747d8c";
    context.fillRect(this.x + 6, this.y + 8, 38, 10);
    context.fillStyle = "#4a5363";
    context.fillRect(this.x + 6, this.y + 35, 38, 17);

    context.fillStyle = "#8f98a8";
    context.fillRect(this.x + 13, this.y + 16, 8, 8);
    context.fillRect(this.x + 30, this.y + 25, 7, 7);
    context.fillStyle = "#394251";
    context.fillRect(this.x + 20, this.y + 36, 18, 4);

    // piso de abajo
    context.fillStyle = "#5e6675";
    context.fillRect(this.x + 6, this.y + 56, 38, 44);
    context.fillStyle = "#747d8c";
    context.fillRect(this.x + 6, this.y + 56, 38, 10);
    context.fillStyle = "#4a5363";
    context.fillRect(this.x + 6, this.y + 83, 38, 17);

    context.fillStyle = "#8f98a8";
    context.fillRect(this.x + 13, this.y + 64, 8, 8);
    context.fillRect(this.x + 30, this.y + 73, 7, 7);
    context.fillStyle = "#394251";
    context.fillRect(this.x + 20, this.y + 84, 18, 4);

    context.restore();
  }

  drawTrap(context) {
    context.save();
    // trampa piramidal
    context.fillStyle = "#8c5b38";
    context.beginPath();
    context.moveTo(this.x + 4, this.y + 36);
    context.lineTo(this.x + 25, this.y + 2);
    context.lineTo(this.x + 48, this.y + 36);
    context.closePath();
    context.fill();

    context.fillStyle = "#b77649";
    context.beginPath();
    context.moveTo(this.x + 14, this.y + 34);
    context.lineTo(this.x + 25, this.y + 10);
    context.lineTo(this.x + 39, this.y + 34);
    context.closePath();
    context.fill();

    context.fillStyle = "#d69b63";
    context.fillRect(this.x + 24, this.y + 9, 4, 22);

    context.restore();
  }
}

export function createObstacle(x, groundY, score) {
  let type = "rock";

  if (score > 500 && Math.random() > 0.7) {
    type = "tall";
  } else if (score > 250 && Math.random() > 0.55) {
    type = "trap";
  }

  return new Obstacle(type, x, groundY);
}
