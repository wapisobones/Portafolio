(() => {
  "use strict";

  const routes = {
    dashboard: { title: "Dashboard", description: "Una primera mirada al conjunto ficticio de lotes de mineral.", collection: "lots" },
    lotes: { title: "Lotes", description: "Cada lote reúne un cliente, una ubicación y mediciones de humedad.", collection: "lots" },
    alertas: { title: "Alertas", description: "Ejemplos de alertas vinculadas a un lote, una medición y una regla.", collection: "alerts" },
    cancha: { title: "Cancha visual", description: "Una distribución esquemática para situar los lotes de ejemplo.", collection: "locations" },
    reglas: { title: "Reglas", description: "Condiciones ficticias diferenciadas por cliente para preparar el monitoreo.", collection: "rules" }
  };
  const escape = (value) => String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
  const header = (title, description, stage = "Estructura inicial · módulos pendientes") => `
    <header class="view-header">
      <h1 tabindex="-1">${escape(title)}</h1>
      <p>${escape(description)}</p>
      <span class="stage-label">${escape(stage)}</span>
    </header>`;

  const numberFormat = new Intl.NumberFormat("es-CL", { minimumFractionDigits: 1, maximumFractionDigits: 20 });
  const dateFormat = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  const valueOr = (value, fallback = "No informado") =>
    typeof value === "string" && value.trim() ? value : fallback;
  const humidity = (value) => Number.isFinite(value)
    ? `${numberFormat.format(value)}&nbsp;%` : "Humedad no disponible";
  const timestamp = (value) => {
    const parsed = typeof value === "string" ? Date.parse(value) : NaN;
    return Number.isFinite(parsed) ? parsed : -Infinity;
  };
  const time = (value) => Number.isFinite(timestamp(value))
    ? `<time datetime="${escape(value)}">${escape(dateFormat.format(new Date(value)))} UTC</time>`
    : "Fecha no informada";
  const measurementsFor = (data, lotId) => data.measurements
    .filter((item) => item.lotId === lotId)
    .sort((a, b) => timestamp(b.recordedAt) - timestamp(a.recordedAt));
  const latestMeasurement = (data, lotId) => measurementsFor(data, lotId)
    .find((item) => Number.isFinite(timestamp(item.recordedAt)));
  const recentHumidity = (measurement) => measurement
    ? `${humidity(measurement.humidityPercent)}<span class="lot-secondary">${time(measurement.recordedAt)}</span>`
    : "Sin mediciones fechadas";

  const lotResults = (data, filters = {}) => {
    const query = String(filters.query || "").trim().toLocaleLowerCase("es");
    const lots = data.lots.filter((lot) =>
      lot.id.toLocaleLowerCase("es").includes(query) &&
      (!filters.clientId || lot.clientId === filters.clientId));
    const rows = lots.length ? lots.map((lot) => {
      const client = data.clients.find((item) => item.id === lot.clientId);
      const location = data.locations.find((item) => item.id === lot.locationId);
      return `<tr>
        <th scope="row"><a class="lot-code" href="#lotes/${encodeURIComponent(lot.id)}">${escape(lot.id)}</a><span class="lot-secondary">${escape(valueOr(lot.label))}</span></th>
        <td>${escape(valueOr(client?.name))}</td>
        <td>${escape(valueOr(lot.material))}</td>
        <td>${escape(valueOr(location?.label))}</td>
        <td class="lot-number">${recentHumidity(latestMeasurement(data, lot.id))}</td>
        <td><span class="lot-status">No informado</span></td>
      </tr>`;
    }).join("") : `<tr><td colspan="6" class="lot-empty">${data.lots.length
      ? "No hay lotes para esta búsqueda. Limpia los filtros para volver a ver el listado."
      : "No hay lotes en el conjunto local."}</td></tr>`;
    return {
      rows,
      countText: `${lots.length} ${lots.length === 1 ? "lote encontrado" : "lotes encontrados"} de ${data.lots.length}.`
    };
  };

  const renderLots = (data, filters) => {
    const results = lotResults(data, filters);
    return header("Lotes", "Consulta los lotes ficticios y abre su detalle desde el código.", "Consulta de datos ficticios") + `
      <div class="lot-filters" role="group" aria-label="Filtros de lotes">
        <div class="lot-field">
          <label for="lot-search">Buscar por código</label>
          <input id="lot-search" name="lot-search" type="search" autocomplete="off" placeholder="Ej.: DEMO-LOT-002" value="${escape(filters.query || "")}" aria-controls="lot-table-body">
        </div>
        <div class="lot-field">
          <label for="lot-client">Cliente ficticio</label>
          <select id="lot-client" name="lot-client" aria-controls="lot-table-body">
            <option value="">Todos los clientes</option>
            ${data.clients.map((client) => `<option value="${escape(client.id)}"${filters.clientId === client.id ? " selected" : ""}>${escape(client.name)}</option>`).join("")}
          </select>
        </div>
        <button id="clear-lot-filters" type="button">Limpiar filtros</button>
      </div>
      <p id="lot-result-count" class="lot-result-count" role="status" aria-live="polite" aria-atomic="true">${results.countText}</p>
      <p id="lot-state-note" class="lot-note">El JSON no incluye un estado operacional explícito: se muestra «No informado». Las alertas se consultan en el detalle.</p>
      <p id="lot-scroll-help" class="lot-note">En pantallas pequeñas, desplaza la tabla horizontalmente para consultar todas las columnas.</p>
      <div class="lot-table-scroll" role="region" aria-label="Listado de lotes" aria-describedby="lot-scroll-help" tabindex="0">
        <table class="lot-table" aria-describedby="lot-state-note">
          <caption>Lotes del conjunto ficticio</caption>
          <thead><tr><th scope="col">Código</th><th scope="col">Cliente</th><th scope="col">Material</th><th scope="col">Ubicación</th><th scope="col">Humedad reciente</th><th scope="col">Estado operacional</th></tr></thead>
          <tbody id="lot-table-body">${results.rows}</tbody>
        </table>
      </div>`;
  };

  const renderMeasurements = (measurements) => measurements.length ? `
    <div class="lot-table-scroll" role="region" aria-label="Mediciones de humedad" tabindex="0">
      <table class="lot-table lot-table--compact">
        <caption>Mediciones disponibles, de más reciente a más antigua</caption>
        <thead><tr><th scope="col">Registro</th><th scope="col">Fecha (UTC)</th><th scope="col">Humedad</th></tr></thead>
        <tbody>${measurements.map((item) => `<tr><th scope="row">${escape(item.id)}${item.simulated ? '<span class="lot-secondary">Simulada en esta sesión</span>' : ""}</th><td>${time(item.recordedAt)}</td><td class="lot-number">${humidity(item.humidityPercent)}</td></tr>`).join("")}</tbody>
      </table>
    </div>` : '<p class="lot-note">No hay mediciones de humedad para este lote.</p>';

  const renderLotAlerts = (alerts, data) => alerts.length ? `<ul class="lot-alerts">
    ${alerts.map((alert) => {
      const rule = data.rules.find((item) => item.id === alert.ruleId);
      const measurement = data.measurements.find((item) => item.id === alert.measurementId);
      return `<li>
        <h3>${escape(alert.id)}${alert.simulated ? ' <span class="ct4-session-badge">Esta sesión</span>' : ""}</h3>
        <p>${escape(valueOr(alert.message, "Sin descripción de alerta."))}</p>
        <dl class="lot-alert-facts">
          <div><dt>Severidad</dt><dd>${escape(valueOr(alert.severity))}</dd></div>
          <div><dt>Estado de la alerta</dt><dd>${escape(valueOr(alert.status))}</dd></div>
          <div><dt>Fecha</dt><dd>${time(alert.createdAt)}</dd></div>
          <div><dt>Regla asociada</dt><dd>${escape(valueOr(rule?.name, "Regla no disponible"))}</dd></div>
          <div><dt>Medición asociada</dt><dd>${measurement ? escape(measurement.id) + " / " + humidity(measurement.humidityPercent) : "Medición no disponible"}</dd></div>
        </dl>
      </li>`;
    }).join("")}
    </ul>` : '<p class="lot-note">No hay alertas relacionadas con este lote en el conjunto local.</p>';

  const renderLotHistory = (measurements, alerts) => {
    // La cronología reutiliza registros existentes; no agrega eventos al JSON.
    const events = [
      ...measurements.map((item) => ({ date: item.recordedAt, title: "Medición de humedad", text: `${escape(item.id)} / ${humidity(item.humidityPercent)}` })),
      ...alerts.map((item) => ({ date: item.createdAt, title: "Alerta de ejemplo", text: `${escape(item.id)} / ${escape(valueOr(item.message, "Sin descripción de alerta."))}` }))
    ].sort((a, b) => timestamp(b.date) - timestamp(a.date));
    return events.length ? `<ol class="lot-timeline">${events.map((event) => `
      <li><div class="lot-event-date">${time(event.date)}</div><div><h3>${event.title}</h3><p>${event.text}</p></div></li>`).join("")}</ol>`
      : '<p class="lot-note">No hay eventos disponibles para este lote.</p>';
  };


  const renderHumidityForm = (lot) => `
    <form id="humidity-form" class="ct4-humidity-form" data-lot-id="${escape(lot.id)}" novalidate>
      <h3>Registrar una medición ficticia</h3>
      <p id="humidity-help" class="lot-note">Solo modifica esta sesión. Se usará la hora actual del navegador, mostrada en UTC. No se envían ni guardan datos.</p>
      <div class="lot-field"><label for="humidity-value">Humedad (%)</label>
        <input id="humidity-value" name="humidity" type="number" min="0" max="100" step="any" inputmode="decimal" required aria-describedby="humidity-help humidity-error">
      </div>
      <p id="humidity-error" class="ct4-field-error" role="alert"></p>
      <button type="submit">Registrar medición ficticia</button>
      <p class="lot-note">Solo se evalúan umbrales de humedad compatibles. No se generan alertas por antigüedad ni se cierran alertas anteriores.</p>
    </form>`;

  const renderLotDetail = (encodedId, data) => {
    let id;
    try { id = decodeURIComponent(encodedId); } catch { id = ""; }
    const lot = data.lots.find((item) => item.id === id);
    const back = '<a class="lot-back" href="#lotes">Volver a Lotes</a>';
    if (!lot) return back + header("Lote no encontrado", "El código no corresponde a un lote del conjunto ficticio. Vuelve al listado para elegir uno.", "Consulta de datos ficticios");
    const client = data.clients.find((item) => item.id === lot.clientId);
    const location = data.locations.find((item) => item.id === lot.locationId);
    const measurements = measurementsFor(data, id);
    const alerts = data.alerts.filter((item) => item.lotId === id)
      .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt));
    const facts = [
      ["Código", escape(lot.id)], ["Cliente", escape(valueOr(client?.name))],
      ["Material", escape(valueOr(lot.material))], ["Ubicación", escape(valueOr(location?.label))],
      ["Estado operacional", "No informado"], ["Humedad reciente", recentHumidity(latestMeasurement(data, id))]
    ];
    return back + header(valueOr(lot.label, lot.id), lot.id, "Detalle de datos ficticios") + `
      <section class="lot-detail-section" aria-labelledby="lot-general-title">
        <h2 id="lot-general-title">Información general</h2>
        <dl class="lot-facts">${facts.map(([label, value]) => `<div><dt>${label}</dt><dd>${value}</dd></div>`).join("")}</dl>
        <p class="lot-note">El estado operacional no está informado en el JSON. Una alerta no asigna por sí sola ese estado.</p>
      </section>
      <section class="lot-detail-section" aria-labelledby="lot-measurements-title">
        <h2 id="lot-measurements-title">Mediciones de humedad</h2>
        ${renderMeasurements(measurements)}
        ${renderHumidityForm(lot)}
      </section>
      <section class="lot-detail-section" aria-labelledby="lot-alerts-title">
        <h2 id="lot-alerts-title">Alertas relacionadas</h2>
        ${renderLotAlerts(alerts, data)}
      </section>
      <section class="lot-detail-section" aria-labelledby="lot-history-title">
        <h2 id="lot-history-title">Historial disponible</h2>
        <p class="lot-note">Cronología de las mediciones y alertas del JSON, de más reciente a más antigua. Incluye los registros simulados de esta sesión; no agrega eventos operacionales previos.</p>
        ${renderLotHistory(measurements, alerts)}
      </section>`;
  };


  const compareIds = (a, b) => a.id.localeCompare(b.id, "es", { numeric: true });
  const lotLink = (lot) => `<a href="#lotes/${encodeURIComponent(lot.id)}">${escape(lot.id)}</a>`;

  const renderDashboard = (data) => {
    const latestLots = [...data.lots].sort((a, b) =>
      timestamp(latestMeasurement(data, b.id)?.recordedAt) -
      timestamp(latestMeasurement(data, a.id)?.recordedAt) || compareIds(a, b)).slice(0, 4);
    const latestAlerts = [...data.alerts].sort((a, b) =>
      timestamp(b.createdAt) - timestamp(a.createdAt) || compareIds(a, b)).slice(0, 4);
    return header("Dashboard", "Lotes, mediciones y alertas del escenario ficticio.", "Consulta del conjunto local") + `
      <p class="lot-note">Conjunto ficticio del JSON y registros simulados de esta sesión. Sin actualización automática ni envío de datos.</p>
      <dl class="ct3-metrics" aria-label="Indicadores del conjunto ficticio">
        ${[["Lotes", "lots"], ["Ubicaciones", "locations"], ["Mediciones", "measurements"], ["Alertas existentes", "alerts"]].map(([label, key]) => `
          <div><dt>${label}</dt><dd>${new Intl.NumberFormat("es-CL").format(data[key].length)}</dd></div>`).join("")}
      </dl>
      <div class="ct3-dashboard-actions"><a href="#cancha">Explorar la Cancha visual</a><a href="#lotes">Consultar todos los lotes</a></div>
      <div class="ct3-dashboard-grid">
        <section class="ct3-summary" aria-labelledby="ct3-lots-title">
          <h2 id="ct3-lots-title">Lotes por última medición</h2>
          <p class="lot-note">Se muestran hasta cuatro lotes, ordenados por la fecha de su última medición disponible.</p>
          ${latestLots.length ? `<ul class="ct3-recent-lots">${latestLots.map((lot) => {
            const client = data.clients.find((item) => item.id === lot.clientId);
            return `<li><div>${lotLink(lot)}<p>${escape(valueOr(client?.name))}</p></div><div><span class="ct3-caption">Última humedad</span><p>${recentHumidity(latestMeasurement(data, lot.id))}</p></div></li>`;
          }).join("")}</ul>` : '<p class="lot-note">No hay lotes en el conjunto local.</p>'}
        </section>
        <section class="ct3-summary" aria-labelledby="ct3-alerts-title">
          <h2 id="ct3-alerts-title">Alertas recientes</h2>
          <p class="lot-note">Hasta cuatro registros por fecha de alerta. El enlace abre el lote y sus alertas relacionadas.</p>
          ${latestAlerts.length ? `<ul class="ct3-recent-alerts">${latestAlerts.map((alert) => {
            const lot = data.lots.find((item) => item.id === alert.lotId);
            return `<li><h3>${escape(alert.id)}</h3><p class="ct3-alert-meta">${escape(valueOr(alert.severity))} / ${escape(valueOr(alert.status))}</p><p>${escape(valueOr(alert.message, "Sin descripción de alerta."))}</p><p class="ct3-caption">${time(alert.createdAt)}</p>${lot ? `<p>Consultar lote ${lotLink(lot)}</p>` : '<p class="lot-note">Lote asociado no disponible.</p>'}</li>`;
          }).join("")}</ul>` : '<p class="lot-note">No hay alertas en el conjunto local.</p>'}
        </section>
      </div>`;
  };

  // El sector se obtiene de la etiqueta existente: «Sector A / posición 1».
  const sectorOf = (location) => {
    const label = valueOr(location.label, "");
    const separator = label.indexOf("/");
    return separator > 0 ? label.slice(0, separator).trim() : "Sector no informado";
  };
  const sectorsOf = (data) => [...new Set(data.locations.map(sectorOf))]
    .sort((a, b) => a.localeCompare(b, "es", { numeric: true }));
  const yardLotLinks = (lots, data) => lots.length ? `<ul class="ct3-yard-lots">${lots.map((lot) => {
    const client = data.clients.find((item) => item.id === lot.clientId);
    const alertCount = data.alerts.filter((item) => item.lotId === lot.id).length;
    return `<li>${lotLink(lot)}<span class="ct3-caption">${escape(valueOr(client?.name))}</span><div class="ct4-yard-reading">Humedad reciente: ${recentHumidity(latestMeasurement(data, lot.id))}</div><span class="ct3-caption">${alertCount} alertas en el conjunto local</span></li>`;
  }).join("")}</ul>` : '<p class="ct3-caption">Sin lotes asociados.</p>';

  const yardResults = (data, filters = {}) => {
    // La ocupación se resuelve ANTES de aplicar los filtros de cliente.
    const entries = data.locations.map((location) => {
      const lots = data.lots.filter((lot) => lot.locationId === location.id);
      return {
        location, sector: sectorOf(location), occupied: lots.length > 0,
        totalLots: lots.length,
        visibleLots: lots.filter((lot) => !filters.clientId || lot.clientId === filters.clientId)
      };
    }).filter((entry) =>
      (!filters.sector || entry.sector === filters.sector) &&
      (!filters.clientId || !entry.occupied || entry.visibleLots.length > 0)
    ).sort((a, b) =>
      a.sector.localeCompare(b.sector, "es", { numeric: true }) ||
      a.location.label.localeCompare(b.location.label, "es", { numeric: true }));
    const occupied = entries.filter((entry) => entry.occupied).length;
    const lotsVisible = entries.reduce((sum, entry) => sum + entry.visibleLots.length, 0);
    const empty = '<p class="lot-note">No hay ubicaciones para estos filtros. Limpia los filtros para consultar toda la cancha.</p>';
    const occupancy = (entry) => entry.occupied ? "Ocupada" : "Libre";
    const hiddenLotsNote = (entry) => entry.visibleLots.length < entry.totalLots
      ? `<p class="ct3-caption">${entry.visibleLots.length} de ${entry.totalLots} lotes asociados visibles con este filtro.</p>` : "";
    const groups = [...new Set(entries.map((entry) => entry.sector))];
    return {
      countText: `${entries.length} ubicaciones visibles: ${occupied} ocupadas y ${entries.length - occupied} libres. ${lotsVisible} lotes visibles.`,
      mapHtml: entries.length ? groups.map((sector) => `
        <section class="ct3-sector" aria-label="${escape(sector)}">
          <h2>${escape(sector)}</h2>
          <ul class="ct3-yard-grid">${entries.filter((entry) => entry.sector === sector).map((entry) => `
            <li class="ct3-location ct3-location--${entry.occupied ? "occupied" : "free"}">
              <h3>${escape(entry.location.label)}</h3>
              <p class="ct3-occupancy">${occupancy(entry)}</p>
              ${yardLotLinks(entry.visibleLots, data)}${hiddenLotsNote(entry)}
            </li>`).join("")}
          </ul>
        </section>`).join("") : empty,
      listHtml: entries.length ? `<ul class="ct3-yard-list">${entries.map((entry) => `
        <li><div><h3>${escape(entry.location.label)}</h3><p class="ct3-occupancy">${occupancy(entry)}</p></div><div>${yardLotLinks(entry.visibleLots, data)}${hiddenLotsNote(entry)}</div></li>`).join("")}</ul>` : empty
    };
  };

  const renderYard = (data, filters) => {
    const results = yardResults(data, filters);
    return header("Cancha visual", "Ubicaciones agrupadas por sector y lotes asociados al conjunto ficticio.", "Consulta de ocupación por ubicación") + `
      <div class="ct3-yard-filters" role="group" aria-label="Filtros de la cancha">
        <div class="lot-field"><label for="yard-client">Cliente ficticio</label>
          <select id="yard-client" name="yard-client" aria-controls="yard-map yard-list-results">
            <option value="">Todos los clientes</option>
            ${data.clients.map((client) => `<option value="${escape(client.id)}"${filters.clientId === client.id ? " selected" : ""}>${escape(client.name)}</option>`).join("")}
          </select>
        </div>
        <div class="lot-field"><label for="yard-sector">Sector</label>
          <select id="yard-sector" name="yard-sector" aria-controls="yard-map yard-list-results">
            <option value="">Todos los sectores</option>
            ${sectorsOf(data).map((sector) => `<option value="${escape(sector)}"${filters.sector === sector ? " selected" : ""}>${escape(sector)}</option>`).join("")}
          </select>
        </div>
        <button id="clear-yard-filters" type="button">Limpiar filtros de cancha</button>
      </div>
      <p id="yard-result-count" class="lot-result-count" role="status" aria-live="polite" aria-atomic="true">${results.countText}</p>
      <p class="lot-note">Ocupada: tiene al menos un lote asociado en el JSON. Libre: no tiene ninguno. Esto describe ocupación, no un estado operacional.</p>
      <p class="lot-note">Al filtrar por cliente se muestran sus lotes y las ubicaciones realmente libres. Los sectores proceden de las etiquetas existentes; el esquema no tiene escala geográfica.</p>
      <details id="yard-list" class="ct3-list-alternative">
        <summary>Consultar ubicaciones en formato listado</summary>
        <div id="yard-list-results">${results.listHtml}</div>
      </details>
      <div id="yard-map">${results.mapHtml}</div>`;
  };


  const alertStatuses = (data) => [...new Set(data.alerts.map((alert) => valueOr(alert.status)))]
    .sort((a, b) => a.localeCompare(b, "es"));
  const alertResults = (data, filters = {}) => {
    const alerts = [...data.alerts].filter((alert) => !filters.status || valueOr(alert.status) === filters.status)
      .sort((a, b) => timestamp(b.createdAt) - timestamp(a.createdAt) || compareIds(a, b));
    return {
      countText: `${alerts.length} alertas visibles de ${data.alerts.length}.`,
      html: alerts.length ? `<ul class="ct4-alert-list">${alerts.map((alert) => {
        const lot = data.lots.find((item) => item.id === alert.lotId);
        const rule = data.rules.find((item) => item.id === alert.ruleId);
        return `<li><h2>${escape(alert.id)}${alert.simulated ? ' <span class="ct4-session-badge">Esta sesión</span>' : ""}</h2>
          <p>${escape(valueOr(alert.message, "Sin descripción de alerta."))}</p>
          <dl class="lot-alert-facts">
            <div><dt>Estado</dt><dd>${escape(valueOr(alert.status))}</dd></div>
            <div><dt>Severidad</dt><dd>${escape(valueOr(alert.severity, "No definida por la regla"))}</dd></div>
            <div><dt>Fecha</dt><dd>${time(alert.createdAt)}</dd></div>
            <div><dt>Regla</dt><dd>${escape(valueOr(rule?.name, "Regla no disponible"))}</dd></div>
          </dl>
          <p class="ct4-alert-link">${lot ? `Consultar lote ${lotLink(lot)}` : "Lote asociado no disponible."}</p></li>`;
      }).join("")}</ul>` : '<p class="lot-note">No hay alertas para este estado. Selecciona «Todos los estados» para revisar el conjunto completo.</p>'
    };
  };
  const renderAlerts = (data, filters) => {
    const result = alertResults(data, filters);
    return header("Alertas", "Registros ficticios originales y alertas generadas por la simulación local.", "Consulta de alertas ficticias") + `
      <p class="lot-note">«Simulada» identifica una alerta creada en esta sesión. No representa un ciclo de atención ni una severidad de producción.</p>
      <div class="ct4-alert-filter lot-field"><label for="alert-status">Estado de la alerta</label>
        <select id="alert-status" name="alert-status" aria-controls="alert-results">
          <option value="">Todos los estados</option>
          ${alertStatuses(data).map((status) => `<option value="${escape(status)}"${filters.status === status ? " selected" : ""}>${escape(status)}</option>`).join("")}
        </select>
      </div>
      <p id="alert-result-count" class="lot-result-count" role="status" aria-live="polite" aria-atomic="true">${result.countText}</p>
      <div id="alert-results">${result.html}</div>`;
  };

  const renderRules = (data) => header("Reglas", "Umbrales ilustrativos por cliente. No representan criterios operacionales reales.", "Consulta de reglas ficticias") + `
    <p class="lot-note">La humedad se evalúa únicamente al registrar una medición. Los plazos de antigüedad se muestran como referencia: no hay reloj de simulación ni barrido temporal definidos.</p>
    <div class="ct4-rule-clients">${data.clients.length ? data.clients.map((client) => {
      const rules = data.rules.filter((rule) => rule.clientId === client.id);
      return `<section class="ct4-rule-client"><h2>${escape(client.name)}</h2>
        ${rules.length ? `<ul class="ct4-rule-list">${rules.map((rule) => {
          const support = window.CanchaData.ruleSupport(rule);
          const metric = rule.metric === "humidityPercent" ? "Humedad" : rule.metric === "measurementAgeHours" ? "Antigüedad de la medición" : valueOr(rule.metric, "Métrica no informada");
          const condition = typeof rule.operator === "string" && Number.isFinite(rule.threshold) && typeof rule.unit === "string"
            ? `${escape(rule.operator)} ${numberFormat.format(rule.threshold)} ${escape(rule.unit)}` : "Condición incompleta";
          return `<li><h3>${escape(valueOr(rule.name))}</h3><p class="ct4-rule-condition">${escape(metric)} ${condition}</p><p class="ct3-caption">${escape(rule.id)}</p><p class="lot-note">${escape(support.reason)}</p></li>`;
        }).join("")}</ul>` : '<p class="lot-note">Este cliente no tiene reglas en el conjunto local.</p>'}</section>`;
    }).join("") : '<p class="lot-note">No hay clientes disponibles para consultar reglas.</p>'}</div>`;

  const render = (route, data, filters = {}) => {
    if (route === "alertas") return renderAlerts(data, filters);
    if (route === "reglas") return renderRules(data);
    if (route === "dashboard") return renderDashboard(data);
    if (route === "cancha") return renderYard(data, filters);
    if (route === "lotes") return renderLots(data, filters);
    if (route.startsWith("lotes/")) return renderLotDetail(route.slice(6), data);
    return '<header class="view-header"><h1 tabindex="-1">Vista no encontrada</h1><p>Elige una vista del menú o <a href="#dashboard">vuelve al Dashboard</a>.</p></header>';
  };

  const renderState = (state) => state === "loading"
    ? '<h1 tabindex="-1">Preparando la demostración</h1><p>El conjunto local se está cargando.</p>'
    : '<h1 tabindex="-1">Datos no disponibles</h1><p>No se pudo preparar la vista. Usa «Reintentar carga» o recarga la página desde un servidor HTTP.</p>';

  window.CanchaViews = { routes, render, renderState, lotResults, yardResults, alertResults, alertStatuses };
})();
