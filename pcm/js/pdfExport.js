(function () {
  function getJsPdf() {
    return window.jspdf && window.jspdf.jsPDF ? window.jspdf.jsPDF : null;
  }

  function formatArea(area) {
    return `${(area / 1000000).toFixed(3)} m2`;
  }

  function formatPercent(value) {
    return `${Number(value || 0).toFixed(1)}%`;
  }

  function formatDate(date) {
    const pad = (value) => String(value).padStart(2, "0");

    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}`;
  }

  function getGrainLabel(value) {
    const labels = {
      indiferente: "Indiferente",
      horizontal: "Horizontal",
      vertical: "Vertical"
    };

    return labels[value] || labels.indiferente;
  }

  function injectSvgStyles(svg) {
    const style = document.createElementNS("http://www.w3.org/2000/svg", "style");
    style.textContent = `
      .sheet-fill { fill: #d8b372; stroke: #8f6837; stroke-width: 3; }
      .waste-label { fill: rgba(49, 36, 19, 0.55); font-size: 22px; font-weight: 700; }
      .piece-rect { stroke: rgba(8, 17, 31, 0.75); stroke-width: 2; }
      .piece-text { fill: #07111f; font-size: 18px; font-weight: 700; text-anchor: middle; }
      .piece-size { fill: #172033; font-size: 14px; text-anchor: middle; }
      .rotation-mark, .grain-mark { fill: #07111f; font-size: 24px; font-weight: 900; }
      .grain-overlay { opacity: 0.72; }
      .sheet-grain-overlay { opacity: 0.16; }
    `;
    svg.insertBefore(style, svg.firstChild);
  }

  function svgToPngDataUrl(svgElement) {
    return new Promise((resolve, reject) => {
      const svgClone = svgElement.cloneNode(true);
      const viewBox = svgClone.getAttribute("viewBox").split(" ").map(Number);
      const width = viewBox[2] || 1200;
      const height = viewBox[3] || 800;
      const serializer = new XMLSerializer();
      const image = new Image();
      const canvas = document.createElement("canvas");
      const scale = Math.min(2, Math.max(1, 1400 / Math.max(width, height)));

      injectSvgStyles(svgClone);
      svgClone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      canvas.width = Math.ceil(width * scale);
      canvas.height = Math.ceil(height * scale);

      const blob = new Blob([serializer.serializeToString(svgClone)], {
        type: "image/svg+xml;charset=utf-8"
      });
      const url = URL.createObjectURL(blob);

      image.onload = () => {
        const context = canvas.getContext("2d");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/png"));
      };

      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("No se pudo convertir el SVG a imagen."));
      };

      image.src = url;
    });
  }

  function writeKeyValues(doc, x, y, rows, columnWidth = 56) {
    let cursorY = y;
    rows.forEach(([label, value], index) => {
      const column = index % 2;
      if (index > 0 && column === 0) {
        cursorY += 7;
      }
      const cursorX = x + column * 125;
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, cursorX, cursorY);
      doc.setFont("helvetica", "normal");
      doc.text(String(value), cursorX + columnWidth, cursorY);
    });

    return cursorY + 9;
  }

  function buildPieceStatusMap(layoutResult) {
    const statusBySource = new Map();

    (layoutResult.placedPieces || []).forEach((piece) => {
      const entry = statusBySource.get(piece.originalId) || { placed: 0, unplaced: 0 };
      entry.placed += 1;
      statusBySource.set(piece.originalId, entry);
    });

    (layoutResult.unplacedPieces || []).forEach((piece) => {
      const entry = statusBySource.get(piece.sourceId || piece.originalId || piece.id) || { placed: 0, unplaced: 0 };
      entry.unplaced += 1;
      statusBySource.set(piece.sourceId || piece.originalId || piece.id, entry);
    });

    return statusBySource;
  }

  function writePiecesTable(doc, pieces, layoutResult, startY) {
    const statusBySource = buildPieceStatusMap(layoutResult);
    const headers = ["Nombre", "Ancho", "Alto", "Cant.", "Rot.", "Veta", "Estado"];
    const widths = [48, 24, 24, 18, 18, 30, 48];
    let y = startY;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    headers.reduce((x, header, index) => {
      doc.text(header, x, y);
      return x + widths[index];
    }, 14);
    y += 5;
    doc.setFont("helvetica", "normal");

    pieces.forEach((piece) => {
      if (y > 190) {
        doc.addPage();
        y = 18;
      }

      const status = statusBySource.get(piece.id) || { placed: 0, unplaced: piece.quantity };
      const values = [
        piece.name || "Sin nombre",
        `${piece.width} mm`,
        `${piece.height} mm`,
        String(piece.quantity),
        piece.canRotate ? "Sí" : "No",
        getGrainLabel(piece.grain),
        status.unplaced > 0 ? `${status.placed}/${piece.quantity} ubicadas` : "Ubicada"
      ];

      values.reduce((x, value, index) => {
        doc.text(String(value).slice(0, 24), x, y);
        return x + widths[index];
      }, 14);
      y += 5;
    });
  }

  async function exportPlanToPdf({ boardConfig, pieces, layoutResult, svgElement }) {
    const JsPdf = getJsPdf();

    if (!JsPdf) {
      throw new Error("jsPDF no esta cargado.");
    }

    const doc = new JsPdf({ orientation: "landscape", unit: "mm", format: "a4" });
    const generatedAt = new Date();
    const imageData = await svgToPngDataUrl(svgElement);
    const placedCount = layoutResult.placedCount || (layoutResult.placedPieces || []).length;
    const unplacedCount = layoutResult.unplacedCount || (layoutResult.unplacedPieces || []).length;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("PCM - Plano Corte Madera", 14, 16);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de generación: ${generatedAt.toLocaleString()}`, 210, 16);

    const nextY = writeKeyValues(doc, 14, 28, [
      ["Material", boardConfig.material || "Sin material"],
      ["Plancha", `${boardConfig.width} x ${boardConfig.height} mm`],
      ["Espesor corte", `${boardConfig.kerf} mm`],
      ["Veta plancha", getGrainLabel(boardConfig.grainDirection || boardConfig.vetaPlancha || "horizontal")],
      ["Estado", layoutResult.fitsAll ? "Cabe" : "No cabe"],
      ["Total piezas", layoutResult.totalPieces],
      ["Ubicadas", placedCount],
      ["No ubicadas", unplacedCount],
      ["Aprovechamiento", formatPercent(layoutResult.usagePercent)],
      ["Pérdida", formatPercent(layoutResult.wastePercent)],
      ["Área usada", formatArea(layoutResult.usedArea)],
      ["Área total", formatArea(layoutResult.boardArea)]
    ]);

    const imageBox = fitImage(svgElement, 14, nextY + 2, 268, 72);
    doc.addImage(imageData, "PNG", imageBox.x, imageBox.y, imageBox.width, imageBox.height);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Lista de piezas", 14, 155);
    writePiecesTable(doc, pieces, layoutResult, 164);

    doc.save(`pcm-plano-corte-${formatDate(generatedAt)}.pdf`);
  }

  function fitImage(svgElement, x, y, maxWidth, maxHeight) {
    const viewBox = svgElement.getAttribute("viewBox").split(" ").map(Number);
    const sourceWidth = viewBox[2] || maxWidth;
    const sourceHeight = viewBox[3] || maxHeight;
    const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);

    return {
      x,
      y,
      width: sourceWidth * scale,
      height: sourceHeight * scale
    };
  }

  window.PCMPdfExport = {
    exportPlanToPdf
  };
})();
