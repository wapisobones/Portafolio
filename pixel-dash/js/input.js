export class InputController {
  constructor(target) {
    // target es el canvas: clic o toque sobre el juego cuenta como salto.
    this.target = target;
    this.jumpHandler = null;
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
  }

  bind(onJump) {
    // Guarda la accion de salto y registra controles de PC/celular.
    this.jumpHandler = onJump;
    window.addEventListener("keydown", this.handleKeyDown);
    this.target.addEventListener("pointerdown", this.handlePointerDown);
  }

  handleKeyDown(event) {
    // Solo espacio y flecha arriba activan el salto en teclado.
    if (event.code !== "Space" && event.code !== "ArrowUp") {
      return;
    }

    // Deja que los controles enfocados conserven su interacción nativa.
    if (event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey
      || event.target?.isContentEditable
      || event.target?.closest?.("button, a[href], input, select, textarea, summary, [contenteditable]:not([contenteditable='false']), [role='button'], [role='link']")) {
      return;
    }

    event.preventDefault();
    this.emitJump();
  }

  handlePointerDown(event) {
    // Pointer cubre mouse, touch y stylus con un solo evento.
    event.preventDefault();
    this.emitJump();
  }

  emitJump() {
    // Ejecuta el callback entregado por main.js.
    if (this.jumpHandler) {
      this.jumpHandler();
    }
  }
}
