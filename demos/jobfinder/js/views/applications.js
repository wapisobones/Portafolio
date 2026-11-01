import { escapeHtml as e, header, formatDate } from "./shared.js";
import { registrationEligibility } from "../state.js";

const eventTitles = { registered: "Registro de seguimiento ficticio", updated: "Actualización del seguimiento", archived: "Archivo del seguimiento", restored: "Restauración del seguimiento" };
const fieldLabels = { stage: "Etapa", notes: "Notas", applicationDate: "Fecha ficticia de postulación", nextFollowUpDate: "Próximo seguimiento ficticio", archived: "Archivo" };
const eventDate = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const fieldsOf = (item = {}, draft = {}) => ({ stage: item.stage || "", notes: item.notes || "", applicationDate: item.applicationDate || "", nextFollowUpDate: item.nextFollowUpDate || "", ...draft });

function trackingFields(state, kind, id, values) {
  const key = kind + "-" + id;
  const attrs = (field) => `name="${field}" data-tracking-kind="${kind}" data-tracking-id="${e(id)}" data-tracking-field="${field}" aria-describedby="tracking-error-${key}"`;
  return `<div class="tracking-field-grid">
    <div class="job-field"><label for="stage-${key}">Etapa conocida</label><select id="stage-${key}" ${attrs("stage")} required>
      <option value="">Selecciona una etapa</option>${state.applicationTracking.knownStages.map((stage) => `<option value="${e(stage)}"${values.stage === stage ? " selected" : ""}>${e(stage)}</option>`).join("")}
    </select></div>
    <div class="job-field"><label for="applicationDate-${key}">Fecha ficticia de postulación (opcional)</label><input id="applicationDate-${key}" type="date" ${attrs("applicationDate")} value="${e(values.applicationDate)}"></div>
    <div class="job-field"><label for="nextFollowUpDate-${key}">Próximo seguimiento ficticio (opcional)</label><input id="nextFollowUpDate-${key}" type="date" ${attrs("nextFollowUpDate")} value="${e(values.nextFollowUpDate)}"></div>
    <div class="job-field tracking-notes"><label for="notes-${key}">Notas ficticias (opcional, máximo 1000 caracteres)</label><textarea id="notes-${key}" ${attrs("notes")} rows="3" maxlength="1000">${e(values.notes)}</textarea></div>
  </div>`;
}

export function registrationForm(state, offer, draft = {}) {
  const eligibility = registrationEligibility(offer.id, state);
  if (!eligibility.eligible) return `<p class="meta">${e(eligibility.reason)}</p>`;
  return `<form class="tracking-form" data-register-offer="${e(offer.id)}" novalidate>
    <h3>Registrar seguimiento ficticio</h3><p class="meta">Solo se crea un registro en esta sesión. No se envía una postulación ni se modifica el interés marcado.</p>
    ${trackingFields(state, "registration", offer.id, fieldsOf({}, draft))}
    <p id="tracking-error-registration-${e(offer.id)}" data-tracking-error="registration:${e(offer.id)}" class="review-error" role="alert"></p>
    <button type="submit" data-register-submit="${e(offer.id)}">Registrar postulación ficticia</button>
  </form>`;
}

function history(item, state) {
  const original = state.applicationTracking.originals.find((entry) => entry.id === item.id);
  const events = state.applicationTracking.events.filter((event) => event.applicationId === item.id)
    .sort((a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt) || a.id.localeCompare(b.id, "es", { numeric: true }));
  const value = (key, data) => {
    if (data === null || data === "") return "No informado";
    if (key === "archived") return data ? "Archivada" : "Activa";
    return key === "applicationDate" || key === "nextFollowUpDate" ? formatDate(data) : e(data);
  };
  return `<details class="tracking-history"><summary>Historial disponible</summary>
    ${original ? `<div class="tracking-original"><h4>Datos originales precargados</h4><p>Etapa: ${e(original.stage)}. Archivo: ${original.archived ? "archivada" : "activa"}. Registro original: ${formatDate(original.registeredAt)}.</p><p class="meta">El conjunto no aporta un historial previo de transiciones. Estos datos no se presentan como eventos históricos nuevos.</p></div>` : '<p class="meta">Registro creado durante esta sesión; no tiene un historial original precargado.</p>'}
    <h4>Eventos simulados de esta sesión</h4>
    ${events.length ? `<ol class="tracking-events">${events.map((event) => `<li>
      <p class="meta"><time datetime="${e(event.occurredAt)}">${e(eventDate.format(new Date(event.occurredAt)))} UTC</time> / ${e(event.id)}</p>
      <h5>${eventTitles[event.type]}</h5><ul>${Object.entries(event.changes).map(([key, change]) => `<li><strong>${fieldLabels[key]}:</strong> ${value(key, change.before)} → ${value(key, change.after)}</li>`).join("")}</ul>
    </li>`).join("")}</ol>` : '<p class="empty-message">Todavía no hay cambios simulados para este seguimiento.</p>'}
  </details>`;
}

function list(items, state, drafts, archived = false, selectedId = null) {
  return items.length ? `<ul class="application-list${archived ? " application-list--archived" : ""}">${items.map((item) => {
    const offer = state.offers.find((entry) => entry.id === item.offerId);
    const changed = state.applicationTracking.events.some((event) => event.applicationId === item.id);
    return `<li data-application-card="${e(item.id)}" tabindex="-1" aria-labelledby="application-title-${e(item.id)}"${selectedId === item.id ? ' class="tracking-target"' : ""}>
      <h3 id="application-title-${e(item.id)}">${e(offer?.title || "Oferta no disponible")}</h3><p class="meta">${e(offer?.company || "Empresa no informada")}</p>
      <span class="pill">${item.simulated ? "Registro simulado de esta sesión" : "Registro original precargado"}</span>
      ${changed && !item.simulated ? '<span class="pill pill--example">Con cambios simulados</span>' : ""}
      <dl class="application-facts">
        <div><dt>Etapa</dt><dd>${e(item.stage)}</dd></div><div><dt>Registro</dt><dd>${formatDate(item.registeredAt)}</dd></div><div><dt>Identificador</dt><dd>${e(item.id)}</dd></div>
        <div><dt>Fecha ficticia de postulación</dt><dd>${item.applicationDate ? formatDate(item.applicationDate) : "No informada"}</dd></div><div><dt>Próximo seguimiento ficticio</dt><dd>${item.nextFollowUpDate ? formatDate(item.nextFollowUpDate) : "No informado"}</dd></div>
      </dl>
      <p class="tracking-notes-display">Notas: ${e(item.notes || "Sin notas registradas.")}</p>
      ${offer ? `<a class="job-detail-link" href="#empleos/${encodeURIComponent(offer.id)}">Ver detalle de la oferta</a>` : ""}
      <div class="tracking-actions"><button type="button" data-application-action="${archived ? "restore" : "archive"}" data-application-id="${e(item.id)}" aria-label="${archived ? "Restaurar seguimiento" : "Archivar seguimiento"}: ${e(offer?.title || item.id)}" aria-describedby="tracking-error-application-${e(item.id)}">${archived ? "Restaurar seguimiento" : "Archivar seguimiento"}</button></div>
      <p id="tracking-error-application-${e(item.id)}" data-tracking-error="application:${e(item.id)}" class="review-error" role="alert"></p>
      <details class="tracking-editor" data-application-editor="${e(item.id)}"><summary>Editar etapa, notas y fechas</summary>
        <form class="tracking-form" data-application-form="${e(item.id)}" novalidate>
          ${trackingFields(state, "application", item.id, fieldsOf(item, drafts?.get(item.id)))}
          <button type="submit" data-application-submit="${e(item.id)}">Guardar cambios de seguimiento</button>
        </form>
      </details>
      ${history(item, state)}
    </li>`;
  }).join("")}</ul>` : '<p class="empty-message">No hay registros en esta sección del conjunto ficticio.</p>';
}

export function render(state, options = {}) {
  let selectedId = null;
  try { if (options.encodedApplicationId !== undefined) selectedId = decodeURIComponent(options.encodedApplicationId); } catch { /* Se informa una ruta no válida. */ }
  const missing = options.encodedApplicationId !== undefined && !state.applications.some((item) => item.id === selectedId);
  const active = state.applications.filter((item) => !item.archived), archived = state.applications.filter((item) => item.archived);
  return header("Mis postulaciones", "Seguimientos ficticios de esta sesión. La demo no envía postulaciones a empresas.") + `
    <p class="notice">Esta demo utiliza únicamente ${state.applicationTracking.knownStages.map(e).join(", ")}. Cambiar de etapa no archiva automáticamente un seguimiento.</p>
    ${missing ? '<p class="notice" role="status">No se encontró el seguimiento solicitado. Puedes consultar los registros disponibles o <a href="#postulaciones">volver al listado</a>.</p>' : ""}
    <p class="meta">Para registrar un seguimiento, abre una oferta guardada sin postulación activa. Las fechas opcionales no se deducen del registro original.</p>
    <section class="section-block" aria-labelledby="active-title"><h2 id="active-title">Activas (${active.length})</h2>${list(active, state, options.applicationDrafts, false, selectedId)}</section>
    <section class="section-block" aria-labelledby="archived-title"><h2 id="archived-title">Archivadas (${archived.length})</h2>${list(archived, state, options.applicationDrafts, true, selectedId)}</section>`;
}
