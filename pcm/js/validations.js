(function () {
  // Helper comun para validar medidas en milimetros.
  function isPositiveNumber(value) {
    return Number.isFinite(value) && value > 0;
  }

  // Valida los datos base de la plancha antes de calcular.
  function validateSheet(sheet) {
    const errors = [];

    if (!isPositiveNumber(sheet.width)) {
      errors.push("El ancho de la plancha debe ser mayor a cero.");
    }

    if (!isPositiveNumber(sheet.height)) {
      errors.push("El alto de la plancha debe ser mayor a cero.");
    }

    if (!Number.isFinite(sheet.kerf) || sheet.kerf < 0) {
      errors.push("El espesor de corte debe ser igual o mayor a cero.");
    }

    if (!["horizontal", "vertical"].includes(sheet.grainDirection || sheet.vetaPlancha || "horizontal")) {
      errors.push("La dirección de veta de la plancha no es válida.");
    }

    return errors;
  }

  // Valida una pieza individual y, si existe plancha, confirma que pueda entrar.
  function validatePiece(piece, sheet) {
    const errors = [];

    if (!isPositiveNumber(piece.width)) {
      errors.push("El ancho de la pieza debe ser mayor a cero.");
    }

    if (!isPositiveNumber(piece.height)) {
      errors.push("El alto de la pieza debe ser mayor a cero.");
    }

    if (!Number.isInteger(piece.quantity) || piece.quantity <= 0) {
      errors.push("La cantidad debe ser un número entero mayor a cero.");
    }

    if (!["indiferente", "horizontal", "vertical"].includes(piece.grain || piece.veta || "indiferente")) {
      errors.push("La dirección de veta de la pieza no es válida.");
    }

    return errors;
  }

  // Valida el proyecto completo: plancha, lista no vacia y cada pieza.
  function validateProject(sheet, pieces) {
    const errors = validateSheet(sheet);

    if (pieces.length === 0) {
      errors.push("Agrega al menos una pieza para calcular.");
    }

    pieces.forEach((piece) => {
      validatePiece(piece, sheet).forEach((error) => {
        errors.push(`${piece.name || "Pieza"}: ${error}`);
      });
    });

    return errors;
  }

  window.PCMValidations = {
    validateSheet,
    validatePiece,
    validateProject
  };
})();
