(function () {
  // Crea nodos SVG con el namespace correcto.
  function createSvgElement(name) {
    return document.createElementNS("http://www.w3.org/2000/svg", name);
  }

  // Dibuja la plancha y las piezas ubicadas usando coordenadas reales en milimetros.
  function renderBoard(container, sheet, layout) {
    container.replaceChildren();

    const placedPieces = layout ? layout.placedPieces || layout.placed || [] : [];

    if (placedPieces.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent = "No hay piezas ubicadas para mostrar.";
      container.appendChild(empty);
      return;
    }

    const svg = createSvgElement("svg");
    svg.classList.add("board-svg");
    // viewBox permite escalar automaticamente el plano sin perder proporciones.
    svg.setAttribute("viewBox", `0 0 ${sheet.width} ${sheet.height}`);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `Plano de ${sheet.material || "plancha"} de ${sheet.width} por ${sheet.height} milimetros.`);
    svg.appendChild(createGrainPatterns());

    const sheetRect = createSvgElement("rect");
    sheetRect.classList.add("sheet-fill");
    sheetRect.setAttribute("x", "0");
    sheetRect.setAttribute("y", "0");
    sheetRect.setAttribute("width", String(sheet.width));
    sheetRect.setAttribute("height", String(sheet.height));
    svg.appendChild(sheetRect);

    const sheetGrain = sheet.grainDirection || sheet.vetaPlancha || "horizontal";
    const sheetGrainOverlay = createSvgElement("rect");
    sheetGrainOverlay.classList.add("sheet-grain-overlay");
    sheetGrainOverlay.setAttribute("x", "0");
    sheetGrainOverlay.setAttribute("y", "0");
    sheetGrainOverlay.setAttribute("width", String(sheet.width));
    sheetGrainOverlay.setAttribute("height", String(sheet.height));
    sheetGrainOverlay.setAttribute("fill", `url(#piece-grain-${sheetGrain})`);
    svg.appendChild(sheetGrainOverlay);

    const wasteLabel = createSvgElement("text");
    wasteLabel.classList.add("waste-label");
    wasteLabel.setAttribute("x", "24");
    wasteLabel.setAttribute("y", "42");
    wasteLabel.textContent = "Espacio sobrante";
    svg.appendChild(wasteLabel);

    placedPieces.forEach((piece) => {
      const group = createSvgElement("g");
      const rect = createSvgElement("rect");
      const label = createSvgElement("text");
      const size = createSvgElement("text");
      const rotationMark = createSvgElement("text");
      const grainMark = createSvgElement("text");
      const pieceName = piece.name || piece.id;
      const grain = piece.grain || piece.veta || "indiferente";
      const centerX = piece.x + piece.width / 2;
      const centerY = piece.y + piece.height / 2;
      const canShowSize = piece.width >= 150 && piece.height >= 85;
      const canShowRotation = piece.rotated && piece.width >= 60 && piece.height >= 40;
      const canShowGrain = grain !== "indiferente" && piece.width >= 60 && piece.height >= 40;

      // Cada pieza se pinta como rectangulo y se etiqueta si tiene espacio visual suficiente.
      rect.classList.add("piece-rect");
      rect.setAttribute("x", String(piece.x));
      rect.setAttribute("y", String(piece.y));
      rect.setAttribute("width", String(piece.width));
      rect.setAttribute("height", String(piece.height));
      rect.setAttribute("fill", piece.color || "#5eead4");

      const title = createSvgElement("title");
      title.textContent = `${pieceName}: ${piece.width} x ${piece.height} mm. Rotada: ${piece.rotated ? "si" : "no"}. Veta: ${grain}. Original: ${piece.originalWidth || piece.width} x ${piece.originalHeight || piece.height} mm`;
      rect.appendChild(title);

      label.classList.add("piece-text");
      label.setAttribute("x", String(centerX));
      label.setAttribute("y", String(canShowSize ? centerY - 5 : centerY + 6));
      label.textContent = pieceName;

      group.appendChild(rect);

      if (grain !== "indiferente") {
        const grainOverlay = createSvgElement("rect");
        grainOverlay.classList.add("grain-overlay");
        grainOverlay.setAttribute("x", String(piece.x));
        grainOverlay.setAttribute("y", String(piece.y));
        grainOverlay.setAttribute("width", String(piece.width));
        grainOverlay.setAttribute("height", String(piece.height));
        grainOverlay.setAttribute("fill", `url(#piece-grain-${grain})`);
        group.appendChild(grainOverlay);
      }

      group.appendChild(label);

      if (canShowSize) {
        size.classList.add("piece-size");
        size.setAttribute("x", String(centerX));
        size.setAttribute("y", String(centerY + 18));
        size.textContent = `${piece.width} x ${piece.height} mm`;
        group.appendChild(size);
      }

      if (canShowRotation) {
        rotationMark.classList.add("rotation-mark");
        rotationMark.setAttribute("x", String(piece.x + Math.min(38, piece.width - 8)));
        rotationMark.setAttribute("y", String(piece.y + 28));
        rotationMark.textContent = "R";
        group.appendChild(rotationMark);
      }

      if (canShowGrain) {
        grainMark.classList.add("grain-mark");
        grainMark.setAttribute("x", String(piece.x + piece.width - 34));
        grainMark.setAttribute("y", String(piece.y + 28));
        grainMark.textContent = grain === "horizontal" ? "↔" : "↕";
        group.appendChild(grainMark);
      }

      svg.appendChild(group);
    });

    container.appendChild(svg);
  }

  function createGrainPatterns() {
    const defs = createSvgElement("defs");
    const horizontalPattern = createPattern("piece-grain-horizontal", 18, 0, 18, 18);
    const verticalPattern = createPattern("piece-grain-vertical", 0, 18, 18, 18);

    defs.append(horizontalPattern, verticalPattern);
    return defs;
  }

  function createPattern(id, x2, y2, width, height) {
    const pattern = createSvgElement("pattern");
    const line = createSvgElement("line");

    pattern.setAttribute("id", id);
    pattern.setAttribute("patternUnits", "userSpaceOnUse");
    pattern.setAttribute("width", String(width));
    pattern.setAttribute("height", String(height));
    line.setAttribute("x1", "0");
    line.setAttribute("y1", "0");
    line.setAttribute("x2", String(x2));
    line.setAttribute("y2", String(y2));
    line.setAttribute("stroke", "#07111f");
    line.setAttribute("stroke-opacity", "0.26");
    line.setAttribute("stroke-width", "3");
    pattern.appendChild(line);

    return pattern;
  }

  window.PCMRenderBoard = {
    renderBoard
  };
})();
