(function () {
  // Genera identificadores internos simples para piezas nuevas o duplicadas.
  function createId(prefix = "piece") {
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  // Normaliza datos provenientes del formulario o localStorage a un formato confiable.
  function normalizePiece(piece) {
    const canRotate = piece.canRotate !== undefined
      ? Boolean(piece.canRotate)
      : piece.allowRotation !== undefined
        ? Boolean(piece.allowRotation)
        : true;
    const grain = normalizeGrain(piece.grain || piece.veta);

    return {
      id: piece.id || createId(),
      name: (piece.name || "").trim(),
      width: Number(piece.width),
      height: Number(piece.height),
      quantity: Math.floor(Number(piece.quantity)),
      canRotate,
      allowRotation: canRotate,
      grain,
      veta: grain
    };
  }

  function normalizeGrain(value) {
    return ["horizontal", "vertical"].includes(value) ? value : "indiferente";
  }

  // Convierte piezas con cantidad > 1 en unidades individuales para el algoritmo.
  function expandPieces(pieces) {
    return pieces.flatMap((piece) => {
      return Array.from({ length: piece.quantity }, (_, index) => ({
        id: `${piece.id}-${index + 1}`,
        sourceId: piece.id,
        name: piece.name || `Pieza ${index + 1}`,
        width: piece.width,
        height: piece.height,
        canRotate: piece.canRotate,
        allowRotation: piece.canRotate,
        grain: piece.grain || "indiferente",
        veta: piece.grain || "indiferente",
        copyNumber: index + 1
      }));
    });
  }

  // Crea una copia editable de una pieza sin reutilizar su id.
  function duplicatePiece(piece) {
    return {
      ...piece,
      id: createId(),
      name: piece.name ? `${piece.name} copia` : ""
    };
  }

  window.PCMPieces = {
    createId,
    normalizePiece,
    expandPieces,
    duplicatePiece
  };
})();
