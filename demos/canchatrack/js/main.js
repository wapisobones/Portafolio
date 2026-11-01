(() => {
  "use strict";

  const content = document.querySelector("#view-content");
  const status = document.querySelector("#data-status");
  const retryButton = document.querySelector("#retry-load");
  const links = document.querySelectorAll(".app-nav a");
  const resetPanel = document.querySelector("#reset-panel");
  const resetButton = document.querySelector("#reset-data");
  let data = null;
  let state = "loading";
  const lotFilters = { query: "", clientId: "" };
  const yardFilters = { clientId: "", sector: "" };
  const alertFilters = { status: "" };

  const currentRoute = () => window.location.hash.slice(1) || "dashboard";
  const render = (moveFocus = false) => {
    const route = currentRoute();
    const isLotDetail = route.startsWith("lotes/");
    const activeRoute = isLotDetail ? "lotes" : route;
    links.forEach((link) => {
      if (link.getAttribute("href") === `#${activeRoute}`) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
    content.innerHTML = state === "ready"
      ? window.CanchaViews.render(route, data, route === "cancha" ? yardFilters : route === "alertas" ? alertFilters : lotFilters)
      : window.CanchaViews.renderState(state);
    const title = isLotDetail ? "Detalle de lote" : Object.hasOwn(window.CanchaViews.routes, route)
      ? window.CanchaViews.routes[route].title
      : "Vista no encontrada";
    document.title = `${title} | CanchaTrack Demo`;
    if (moveFocus) content.querySelector("h1")?.focus();
  };

  // Actualizar solo las filas conserva el foco y la posición del cursor.
  const updateLotResults = () => {
    if (state !== "ready" || currentRoute() !== "lotes") return;
    const result = window.CanchaViews.lotResults(data, lotFilters);
    content.querySelector("#lot-table-body").innerHTML = result.rows;
    content.querySelector("#lot-result-count").textContent = result.countText;
  };
  const updateYardResults = () => {
    if (state !== "ready" || currentRoute() !== "cancha") return;
    const result = window.CanchaViews.yardResults(data, yardFilters);
    content.querySelector("#yard-map").innerHTML = result.mapHtml;
    content.querySelector("#yard-list-results").innerHTML = result.listHtml;
    content.querySelector("#yard-result-count").textContent = result.countText;
  };
  const updateAlertResults = () => {
    if (state !== "ready" || currentRoute() !== "alertas") return;
    const result = window.CanchaViews.alertResults(data, alertFilters);
    content.querySelector("#alert-results").innerHTML = result.html;
    content.querySelector("#alert-result-count").textContent = result.countText;
  };
  content.addEventListener("submit", (event) => {
    if (event.target.id !== "humidity-form") return;
    event.preventDefault();
    if (state !== "ready") return;
    const input = content.querySelector("#humidity-value");
    const errorElement = content.querySelector("#humidity-error");
    input.removeAttribute("aria-invalid");
    errorElement.textContent = "";
    try {
      const value = input.value.trim() ? input.valueAsNumber : NaN;
      const result = window.CanchaData.recordHumidity(event.target.dataset.lotId, value);
      render();
      status.textContent = `Medición ficticia registrada solo en memoria. ${result.evaluatedRules} reglas de humedad evaluadas; ${result.alerts.length} alertas simuladas creadas. ${result.limitations.join(" ")}`;
      content.querySelector("#humidity-value").focus();
    } catch (error) {
      errorElement.textContent = error.message;
      input.setAttribute("aria-invalid", "true");
      input.focus();
    }
  });
  content.addEventListener("input", (event) => {
    if (event.target.id !== "lot-search") return;
    lotFilters.query = event.target.value;
    updateLotResults();
  });
  content.addEventListener("change", (event) => {
    if (event.target.id === "alert-status") {
      alertFilters.status = event.target.value;
      updateAlertResults();
    } else if (event.target.id === "lot-client") {
      lotFilters.clientId = event.target.value;
      updateLotResults();
    } else if (event.target.id === "yard-client") {
      yardFilters.clientId = event.target.value;
      updateYardResults();
    } else if (event.target.id === "yard-sector") {
      yardFilters.sector = event.target.value;
      updateYardResults();
    }
  });
  content.addEventListener("click", (event) => {
    if (event.target.id === "clear-yard-filters") {
      yardFilters.clientId = "";
      yardFilters.sector = "";
      const client = content.querySelector("#yard-client");
      client.value = "";
      content.querySelector("#yard-sector").value = "";
      updateYardResults();
      client.focus();
      return;
    }
    if (event.target.id !== "clear-lot-filters") return;
    lotFilters.query = "";
    lotFilters.clientId = "";
    const search = content.querySelector("#lot-search");
    search.value = "";
    content.querySelector("#lot-client").value = "";
    updateLotResults();
    search.focus();
  });

  const load = async () => {
    state = "loading";
    resetPanel.hidden = true;
    resetButton.disabled = true;
    retryButton.hidden = true;
    status.textContent = "Cargando datos ficticios…";
    content.setAttribute("aria-busy", "true");
    render();
    try {
      data = await window.CanchaData.load();
      state = "ready";
      status.textContent = "Datos ficticios cargados. Los cambios de la simulación se conservan solo en memoria.";
      resetPanel.hidden = false;
      resetButton.disabled = false;
    } catch (error) {
      data = null;
      state = "error";
      status.textContent = "No fue posible cargar los datos ficticios. Reintenta la carga o recarga la página.";
      retryButton.hidden = false;
      console.error("Error al cargar la demo de CanchaTrack:", error);
    } finally {
      render();
      content.setAttribute("aria-busy", "false");
    }
  };

  // El salto al contenido conserva su destino y no cambia la vista seleccionada.
  document.querySelector(".skip-link").addEventListener("click", (event) => {
    event.preventDefault();
    document.querySelector("#contenido").focus();
  });
  window.addEventListener("hashchange", () => render(true));
  retryButton.addEventListener("click", async () => {
    await load();
    // El botón desaparece al cargar: devolver el foco al contenido evita perderlo.
    if (state === "ready") content.querySelector("h1")?.focus();
    else retryButton.focus();
  });
  resetButton.addEventListener("click", () => {
    if (state !== "ready") return;
    data = window.CanchaData.reset();
    if (!window.CanchaViews.alertStatuses(data).includes(alertFilters.status)) alertFilters.status = "";
    resetPanel.open = false;
    render(true);
    status.textContent = "Datos ficticios originales restablecidos. Se eliminaron los registros simulados de esta sesión.";
  });
  load();
})();
