import { escapeHtml as e, header, formatDate } from "./shared.js";

const activityLabels = {
  saved: "Oferta guardada", unsaved: "Oferta quitada de guardadas",
  "interest-marked": "Interés marcado", "interest-removed": "Interés quitado",
  registered: "Seguimiento registrado", updated: "Seguimiento actualizado",
  archived: "Seguimiento archivado", restored: "Seguimiento restaurado"
};
const clock = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const offerLink = (offer) => `<a href="#empleos/${encodeURIComponent(offer.id)}">${e(offer.title)}</a>`;
const applicationLink = (item) => `<a href="#postulaciones/${encodeURIComponent(item.id)}">Ver seguimiento ${e(item.id)}</a>`;

export function summarize(state) {
  const active = state.applications.filter((item) => !item.archived);
  const archived = state.applications.filter((item) => item.archived);
  const stages = state.applicationTracking.knownStages.map((stage) => ({ stage, count: active.filter((item) => item.stage === stage).length }));
  const original = state.applicationTracking.originals.map((item) => ({
    id: "original:" + item.id, type: "original", source: "original",
    date: item.registeredAt, offerId: item.offerId, applicationId: item.id
  }));
  const tracking = state.applicationTracking.events.map((event) => ({
    ...event, source: "session", date: event.occurredAt,
    offerId: state.applications.find((item) => item.id === event.applicationId)?.offerId
  }));
  const organization = state.sessionActivity.map((event) => ({ ...event, source: "session", date: event.occurredAt }));
  const activity = [...original, ...tracking, ...organization]
    .filter((item) => Number.isFinite(Date.parse(item.date)) && state.offers.some((offer) => offer.id === item.offerId))
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date) || b.id.localeCompare(a.id, "es", { numeric: true })).slice(0, 8);
  return { saved: state.savedOffers.length, interested: state.interests.length, active, archived, stages, activity };
}

function offersToReview(state, records) {
  return records.length ? `<ul class="dashboard-offer-links">${records.map((record) => {
    const offer = state.offers.find((item) => item.id === record.offerId);
    return offer ? `<li>${offerLink(offer)}<span class="meta">${e(offer.company)}</span></li>` : "";
  }).join("")}</ul>` : '<p class="empty-message">No hay ofertas en este grupo.</p>';
}

export function render(state) {
  const summary = summarize(state);
  const recentApplications = [...summary.active].sort((a, b) => b.registeredAt.localeCompare(a.registeredAt) || a.id.localeCompare(b.id)).slice(0, 3);
  return header("Dashboard", "Tu búsqueda ficticia, en contexto. Los indicadores reflejan los cambios de esta sesión.") + `
    <dl class="count-strip" aria-label="Indicadores de la sesión">
      ${[["Ofertas guardadas", summary.saved], ["Ofertas con interés", summary.interested], ["Postulaciones activas", summary.active.length], ["Archivadas", summary.archived.length]].map(([label, count]) => `<div><dt>${label}</dt><dd>${count}</dd></div>`).join("")}
    </dl>
    <div class="dashboard-layout">
      <section class="panel" aria-labelledby="stages-title">
        <h2 id="stages-title">Etapas de postulaciones activas</h2>
        <dl class="dashboard-stages">${summary.stages.map((item) => `<div><dt>${e(item.stage)}</dt><dd>${item.count}</dd></div>`).join("")}</dl>
        <p class="meta">Las archivadas quedan fuera de esta distribución. Se mantienen únicamente las cuatro etapas de esta demo.</p>
        <h3>Seguimientos activos recientes</h3>
        ${recentApplications.length ? `<ul class="follow-up-list">${recentApplications.map((item) => {
          const offer = state.offers.find((entry) => entry.id === item.offerId);
          return `<li><span class="pill pill--green">${e(item.stage)}</span><p>${offer ? offerLink(offer) : "Oferta no disponible"}</p><p>${applicationLink(item)}</p><p class="meta">Fecha de registro: ${formatDate(item.registeredAt)}</p></li>`;
        }).join("")}</ul>` : '<p class="empty-message">No hay seguimientos activos.</p>'}
        <a class="job-detail-link" href="#postulaciones">Consultar activas y archivadas</a>
      </section>
      <section class="panel" aria-labelledby="offers-review-title">
        <h2 id="offers-review-title">Ofertas para revisar</h2>
        <h3>Guardadas (${summary.saved})</h3>${offersToReview(state, state.savedOffers)}
        <h3 class="section-block">Con interés (${summary.interested})</h3>${offersToReview(state, state.interests)}
        <p class="meta">Guardar, marcar interés y registrar una postulación son acciones independientes.</p>
        <a class="job-detail-link" href="#empleos">Volver al catálogo con sus filtros</a>
      </section>
    </div>
    <section class="panel section-block" aria-labelledby="activity-title">
      <h2 id="activity-title">Actividad reciente de ofertas y seguimientos</h2>
      <p class="meta">Hasta ocho registros. Se distinguen las fechas disponibles del conjunto inicial y las acciones de esta sesión; no se reconstruyen transiciones anteriores.</p>
      ${summary.activity.length ? `<ol class="dashboard-activity">${summary.activity.map((activity) => {
        const offer = state.offers.find((item) => item.id === activity.offerId);
        const application = state.applications.find((item) => item.id === activity.applicationId);
        const original = activity.source === "original";
        return `<li><div><span class="pill${original ? "" : " pill--green"}">${original ? "Dato original precargado" : "Evento simulado de esta sesión"}</span>
          <h3>${original ? "Registro precargado de seguimiento" : activityLabels[activity.type]}</h3>
          <p class="meta">${original ? `Fecha disponible: ${formatDate(activity.date)}` : `<time datetime="${e(activity.date)}">${e(clock.format(new Date(activity.date)))} UTC</time>`}</p>
          ${activity.changes?.stage ? `<p class="meta">Etapa: ${e(activity.changes.stage.before || "Sin etapa anterior")} → ${e(activity.changes.stage.after)}</p>` : ""}
        </div><div><p>${offerLink(offer)}</p>${application ? `<p>${applicationLink(application)}</p>` : ""}</div></li>`;
      }).join("")}</ol>` : '<p class="empty-message">No hay actividad disponible.</p>'}
    </section>`;
}
