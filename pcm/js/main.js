(function () {
  // main.js coordina la interfaz: lee formularios, actualiza estado, calcula y renderiza.
  const { saveProject, loadProject, clearProject } = window.PCMStorage;
  const { normalizePiece, duplicatePiece } = window.PCMPieces;
  const { validatePiece, validateProject } = window.PCMValidations;
  const { createLayout } = window.PCMCuttingAlgorithm;
  const { renderBoard } = window.PCMRenderBoard;
  const { exportPlanToPdf } = window.PCMPdfExport || {};

  // Estado inicial de la app. Todas las medidas se trabajan en milimetros.
  const DEFAULT_STATE = {
    sheet: {
      width: 2440,
      height: 1220,
      kerf: 3,
      material: "MDF 18mm",
      grainDirection: "horizontal",
      vetaPlancha: "horizontal"
    },
    pieces: [],
    lastLayout: null
  };

  // Referencias DOM centralizadas para evitar consultas repetidas y facilitar mantenimiento.
  const elements = {
    material: document.querySelector("#material"),
    sheetWidth: document.querySelector("#sheetWidth"),
    sheetHeight: document.querySelector("#sheetHeight"),
    kerf: document.querySelector("#kerf"),
    sheetGrain: document.querySelector("#sheetGrain"),
    validationMessages: document.querySelector("#validationMessages"),
    saveStatus: document.querySelector("#saveStatus"),
    pieceForm: document.querySelector("#pieceForm"),
    pieceId: document.querySelector("#pieceId"),
    pieceName: document.querySelector("#pieceName"),
    pieceWidth: document.querySelector("#pieceWidth"),
    pieceHeight: document.querySelector("#pieceHeight"),
    pieceQuantity: document.querySelector("#pieceQuantity"),
    pieceCanRotate: document.querySelector("#pieceCanRotate"),
    pieceGrain: document.querySelector("#pieceGrain"),
    submitPieceButton: document.querySelector("#submitPieceButton"),
    cancelEditButton: document.querySelector("#cancelEditButton"),
    calculateButton: document.querySelector("#calculateButton"),
    exportPdfButton: document.querySelector("#exportPdfButton"),
    saveProjectButton: document.querySelector("#saveProjectButton"),
    loadProjectButton: document.querySelector("#loadProjectButton"),
    clearProjectButton: document.querySelector("#clearProjectButton"),
    clearPiecesButton: document.querySelector("#clearPiecesButton"),
    piecesTableBody: document.querySelector("#piecesTableBody"),
    summaryCards: document.querySelector("#summaryCards"),
    boardCanvas: document.querySelector("#boardCanvas"),
    boardSubtitle: document.querySelector("#boardSubtitle"),
    unplacedPanel: document.querySelector("#unplacedPanel"),
    unplacedList: document.querySelector("#unplacedList")
  };

  let state = clone(DEFAULT_STATE);

  // Copia objetos simples de estado sin compartir referencias.
  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // Convierte inputs numericos a Number con fallback seguro.
  function numberFromInput(input, fallback = 0) {
    const value = Number(input.value);
    return Number.isFinite(value) ? value : fallback;
  }

  // Lee la configuracion actual de la plancha desde el formulario.
  function getSheetFromForm() {
    return {
      material: elements.material.value.trim() || "Sin material",
      width: numberFromInput(elements.sheetWidth),
      height: numberFromInput(elements.sheetHeight),
      kerf: numberFromInput(elements.kerf),
      grainDirection: elements.sheetGrain.value,
      vetaPlancha: elements.sheetGrain.value
    };
  }

  // Mantiene el estado sincronizado cuando cambian los campos de plancha.
  function syncSheet() {
    state.sheet = getSheetFromForm();
    state.lastLayout = null;
    renderSummary();
    markUnsaved();
  }

  function formatArea(area) {
    return `${(area / 1000000).toFixed(3)} m2`;
  }

  function formatPercent(value) {
    return `${value.toFixed(1)}%`;
  }

  function getTotalPieces() {
    return state.pieces.reduce((total, piece) => total + piece.quantity, 0);
  }

  // Crea una tarjeta de resumen reutilizable para las metricas del calculo.
  function createSummaryItem(label, value, tone = "") {
    const card = document.createElement("article");
    card.className = `summary-card ${tone}`.trim();
    card.innerHTML = `<span>${label}</span><strong>${value}</strong>`;
    return card;
  }

  // Renderiza las metricas principales; si aun no hay calculo muestra valores pendientes.
  function renderSummary() {
    const layout = state.lastLayout;
    const totalArea = state.sheet.width * state.sheet.height;
    const placedCount = layout ? layout.placedCount || (layout.placedPieces || layout.placed || []).length : 0;
    const unplacedCount = layout ? layout.unplacedCount || (layout.unplacedPieces || layout.unplaced || []).length : 0;
    const cards = [
      createSummaryItem("Estado", layout ? (layout.fitsAll ? "Cabe" : "No cabe") : "Pendiente", layout ? (layout.fitsAll ? "ok" : "fail") : "warn"),
      createSummaryItem("Piezas totales", String(layout ? layout.totalPieces : getTotalPieces())),
      createSummaryItem("Piezas ubicadas", String(placedCount)),
      createSummaryItem("Piezas no ubicadas", String(unplacedCount), unplacedCount > 0 ? "fail" : ""),
      createSummaryItem("Aprovechamiento", layout ? formatPercent(layout.usagePercent) : "0.0%"),
      createSummaryItem("Perdida", layout ? formatPercent(layout.wastePercent) : "0.0%"),
      createSummaryItem("Area usada", layout ? formatArea(layout.usedArea || layout.areaUsed) : formatArea(0)),
      createSummaryItem("Area plancha", formatArea(layout ? layout.boardArea || layout.totalArea : totalArea))
    ];

    elements.summaryCards.replaceChildren(...cards);
  }

  // Muestra errores o advertencias de validacion de forma acumulada.
  function showMessages(messages, type = "error") {
    elements.validationMessages.replaceChildren();
    messages.forEach((message) => {
      const item = document.createElement("div");
      item.className = `message ${type}`;
      item.textContent = message;
      elements.validationMessages.appendChild(item);
    });
  }

  function clearMessages() {
    elements.validationMessages.replaceChildren();
  }

  // Pinta el listado editable de piezas y sus acciones.
  function renderPiecesTable() {
    elements.piecesTableBody.replaceChildren();

    if (state.pieces.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = '<td colspan="7">Sin piezas agregadas.</td>';
      elements.piecesTableBody.appendChild(row);
      return;
    }

    state.pieces.forEach((piece) => {
      const row = document.createElement("tr");
      const nameCell = document.createElement("td");
      const widthCell = document.createElement("td");
      const heightCell = document.createElement("td");
      const quantityCell = document.createElement("td");
      const rotationCell = document.createElement("td");
      const grainCell = document.createElement("td");
      const actionsCell = document.createElement("td");
      const actions = document.createElement("div");

      nameCell.textContent = piece.name || "Sin nombre";
      widthCell.textContent = `${piece.width} mm`;
      heightCell.textContent = `${piece.height} mm`;
      quantityCell.textContent = String(piece.quantity);
      rotationCell.textContent = piece.canRotate ? "Si" : "No";
      grainCell.textContent = getGrainLabel(piece.grain);
      actions.className = "table-actions";
      actions.append(
        createActionButton("Editar", "edit", piece.id),
        createActionButton("Duplicar", "duplicate", piece.id),
        createActionButton("Eliminar", "delete", piece.id, "danger")
      );
      actionsCell.appendChild(actions);
      row.append(nameCell, widthCell, heightCell, quantityCell, rotationCell, grainCell, actionsCell);
      elements.piecesTableBody.appendChild(row);
    });
  }

  function getGrainLabel(value) {
    const labels = {
      indiferente: "Indiferente",
      horizontal: "Horizontal",
      vertical: "Vertical"
    };

    return labels[value] || labels.indiferente;
  }

  // Crea botones de accion para cada fila de pieza.
  function createActionButton(label, action, id, tone = "") {
    const button = document.createElement("button");
    button.className = `small-button ${tone}`.trim();
    button.type = "button";
    button.dataset.action = action;
    button.dataset.id = id;
    button.textContent = label;
    return button;
  }

  // Construye una pieza normalizada a partir del formulario.
  function getPieceFromForm() {
    return normalizePiece({
      id: elements.pieceId.value || undefined,
      name: elements.pieceName.value,
      width: numberFromInput(elements.pieceWidth),
      height: numberFromInput(elements.pieceHeight),
      quantity: numberFromInput(elements.pieceQuantity, 1),
      canRotate: elements.pieceCanRotate.checked,
      grain: elements.pieceGrain.value,
      veta: elements.pieceGrain.value
    });
  }

  // Deja el formulario listo para agregar una nueva pieza.
  function resetPieceForm() {
    elements.pieceForm.reset();
    elements.pieceId.value = "";
    elements.pieceQuantity.value = "1";
    elements.pieceCanRotate.checked = true;
    elements.pieceGrain.value = "indiferente";
    elements.submitPieceButton.textContent = "Agregar pieza";
    elements.cancelEditButton.classList.add("is-hidden");
  }

  // Agrega una pieza nueva o guarda cambios de una pieza existente.
  function savePiece(event) {
    event.preventDefault();
    syncSheet();

    const piece = getPieceFromForm();
    const errors = validatePiece(piece, state.sheet);

    if (errors.length > 0) {
      showMessages(errors);
      return;
    }

    const existingIndex = state.pieces.findIndex((item) => item.id === piece.id);

    if (existingIndex >= 0) {
      state.pieces[existingIndex] = piece;
    } else {
      state.pieces.push(piece);
    }

    state.lastLayout = null;
    clearMessages();
    resetPieceForm();
    renderPiecesTable();
    renderSummary();
    markUnsaved();
  }

  // Carga una pieza existente en el formulario para editarla.
  function editPiece(id) {
    const piece = state.pieces.find((item) => item.id === id);

    if (!piece) {
      return;
    }

    elements.pieceId.value = piece.id;
    elements.pieceName.value = piece.name;
    elements.pieceWidth.value = piece.width;
    elements.pieceHeight.value = piece.height;
    elements.pieceQuantity.value = piece.quantity;
    elements.pieceCanRotate.checked = piece.canRotate;
    elements.pieceGrain.value = piece.grain || "indiferente";
    elements.submitPieceButton.textContent = "Guardar cambios";
    elements.cancelEditButton.classList.remove("is-hidden");
  }

  // Resuelve las acciones de la tabla: editar, duplicar o eliminar.
  function handlePieceAction(event) {
    const button = event.target.closest("[data-action]");

    if (!button) {
      return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "edit") {
      editPiece(id);
    }

    if (action === "duplicate") {
      const piece = state.pieces.find((item) => item.id === id);
      if (piece) {
        state.pieces.push(duplicatePiece(piece));
        state.lastLayout = null;
        renderPiecesTable();
        renderSummary();
        markUnsaved();
      }
    }

    if (action === "delete") {
      state.pieces = state.pieces.filter((item) => item.id !== id);
      state.lastLayout = null;
      renderPiecesTable();
      renderSummary();
      markUnsaved();
    }
  }

  // Valida el proyecto, ejecuta el algoritmo y actualiza plano, resumen y no ubicadas.
  function calculateLayout() {
    syncSheet();

    const errors = validateProject(state.sheet, state.pieces);

    if (errors.length > 0) {
      showMessages(errors);
      return;
    }

    clearMessages();
    state.lastLayout = createLayout(state.sheet, state.pieces);
    renderSummary();
    renderBoard(elements.boardCanvas, state.sheet, state.lastLayout);
    renderUnplaced();
    if (state.lastLayout.fitsAll) {
      elements.boardSubtitle.textContent = `${state.sheet.material} - ${state.sheet.width} x ${state.sheet.height} mm - distribucion calculada con espacios libres.`;
    } else {
      elements.boardSubtitle.textContent = "Algunas piezas no caben en la plancha con la configuracion actual.";
    }
  }

  // Lista las piezas que no entraron en la plancha con el algoritmo actual.
  function renderUnplaced() {
    const unplaced = state.lastLayout ? state.lastLayout.unplacedPieces || state.lastLayout.unplaced || [] : [];
    elements.unplacedPanel.classList.toggle("is-hidden", unplaced.length === 0);
    elements.unplacedList.replaceChildren();

    unplaced.forEach((piece) => {
      const item = document.createElement("li");
      item.textContent = `${piece.name || piece.id}: ${piece.width} x ${piece.height} mm. ${piece.reason || ""}`;
      elements.unplacedList.appendChild(item);
    });
  }

  async function exportPdf() {
    if (!state.lastLayout) {
      calculateLayout();
    }

    if (!state.lastLayout || !exportPlanToPdf) {
      showMessages(["No se pudo iniciar la exportacion PDF. Revisa que jsPDF este cargado."], "warning");
      return;
    }

    const svgElement = elements.boardCanvas.querySelector("svg");

    if (!svgElement) {
      showMessages(["Calcula el plano antes de exportar a PDF."], "warning");
      return;
    }

    try {
      await exportPlanToPdf({
        boardConfig: state.sheet,
        pieces: state.pieces,
        layoutResult: state.lastLayout,
        svgElement
      });
    } catch (error) {
      console.error(error);
      showMessages(["No se pudo generar el PDF en el navegador."], "error");
    }
  }

  // Guarda solo plancha y piezas; el layout se recalcula cuando sea necesario.
  function saveCurrentProject() {
    syncSheet();
    saveProject({
      sheet: state.sheet,
      pieces: state.pieces
    });
    elements.saveStatus.textContent = "Proyecto guardado localmente";
  }

  // Carga el ultimo proyecto guardado en localStorage.
  function loadSavedProject() {
    const saved = loadProject();

    if (!saved) {
      showMessages(["No hay un proyecto local guardado."], "warning");
      return;
    }

    state = {
      ...clone(DEFAULT_STATE),
      sheet: normalizeSheet(saved.sheet),
      pieces: Array.isArray(saved.pieces) ? saved.pieces.map(normalizePiece) : [],
      lastLayout: null
    };
    renderAll();
    elements.saveStatus.textContent = "Ultimo proyecto cargado";
  }

  // Limpia estado de pantalla y tambien borra el proyecto persistido.
  function clearCurrentProject() {
    state = clone(DEFAULT_STATE);
    clearProject();
    renderAll();
    elements.boardCanvas.innerHTML = '<p class="empty-state">El plano aparecera aqui despues de calcular.</p>';
    elements.saveStatus.textContent = "Proyecto local limpiado";
  }

  // Limpia unicamente la lista de piezas del proyecto actual.
  function clearPieces() {
    state.pieces = [];
    state.lastLayout = null;
    resetPieceForm();
    renderPiecesTable();
    renderSummary();
    renderUnplaced();
    elements.boardCanvas.innerHTML = '<p class="empty-state">El plano aparecera aqui despues de calcular.</p>';
    markUnsaved();
  }

  // Marca visualmente que hay cambios que aun no se han guardado en localStorage.
  function markUnsaved() {
    elements.saveStatus.textContent = "Cambios sin guardar";
  }

  // Rehidrata todos los controles visibles desde el estado actual.
  function renderAll() {
    elements.material.value = state.sheet.material;
    elements.sheetWidth.value = state.sheet.width;
    elements.sheetHeight.value = state.sheet.height;
    elements.kerf.value = state.sheet.kerf;
    elements.sheetGrain.value = state.sheet.grainDirection || state.sheet.vetaPlancha || "horizontal";
    resetPieceForm();
    clearMessages();
    renderPiecesTable();
    renderSummary();
    renderUnplaced();
    elements.boardSubtitle.textContent = "Agrega piezas para calcular la distribucion.";
  }

  // Agrupa todos los eventos de usuario de la aplicacion.
  function bindEvents() {
    [elements.material, elements.sheetWidth, elements.sheetHeight, elements.kerf, elements.sheetGrain].forEach((element) => {
      element.addEventListener("input", syncSheet);
      element.addEventListener("change", syncSheet);
    });

    elements.pieceForm.addEventListener("submit", savePiece);
    elements.cancelEditButton.addEventListener("click", resetPieceForm);
    elements.calculateButton.addEventListener("click", calculateLayout);
    elements.exportPdfButton.addEventListener("click", exportPdf);
    elements.piecesTableBody.addEventListener("click", handlePieceAction);
    elements.saveProjectButton.addEventListener("click", saveCurrentProject);
    elements.loadProjectButton.addEventListener("click", loadSavedProject);
    elements.clearProjectButton.addEventListener("click", clearCurrentProject);
    elements.clearPiecesButton.addEventListener("click", clearPieces);
  }

  // Al iniciar, intenta recuperar el ultimo proyecto local.
  const saved = loadProject();
  if (saved) {
    state = {
      ...clone(DEFAULT_STATE),
      sheet: normalizeSheet(saved.sheet),
      pieces: Array.isArray(saved.pieces) ? saved.pieces.map(normalizePiece) : [],
      lastLayout: null
    };
  }

  function normalizeSheet(sheet = {}) {
    const grainDirection = sheet.grainDirection || sheet.vetaPlancha || "horizontal";

    return {
      ...DEFAULT_STATE.sheet,
      ...sheet,
      grainDirection,
      vetaPlancha: grainDirection
    };
  }

  renderAll();
  bindEvents();
})();
