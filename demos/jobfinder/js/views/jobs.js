import { escapeHtml as e, header, analysisExample, formatDate } from "./shared.js";
import { isCompatibilityStale } from "../state.js";
import { registrationForm } from "./applications.js";

const normalize = (value) => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLocaleLowerCase("es");
const contextFor = (state, offerId) => ({
  saved: state.savedOffers.some((item) => item.offerId === offerId),
  interested: state.interests.some((item) => item.offerId === offerId),
  application: state.applications.find((item) => item.offerId === offerId && !item.archived)
    || state.applications.find((item) => item.offerId === offerId)
});

function signals(context) {
  return `<div class="offer-signals">
    ${!context.saved && !context.interested ? '<span class="pill">Descubierta</span>' : ""}
    ${context.saved ? '<span class="pill pill--green">Guardada</span>' : ""}
    ${context.interested ? '<span class="pill job-interest">Con interés</span>' : ""}
  </div>`;
}

function actions(offer, context) {
  const saveLabel = context.saved ? "Quitar de guardadas" : "Guardar oferta";
  const interestLabel = context.interested ? "Quitar interés" : "Marcar interés";
  return `<div class="job-actions" role="group" aria-label="Organizar oferta: ${e(offer.title)}">
    <button type="button" data-job-action="save" data-offer-id="${e(offer.id)}" aria-pressed="${context.saved}" aria-label="${saveLabel}: ${e(offer.title)} de ${e(offer.company)}">${saveLabel}</button>
    <button type="button" data-job-action="interest" data-offer-id="${e(offer.id)}" aria-pressed="${context.interested}" aria-label="${interestLabel}: ${e(offer.title)} de ${e(offer.company)}">${interestLabel}</button>
  </div>`;
}

function applicationContext(application, detailed = false) {
  return `<div class="job-application-context">${application
    ? `<p>Postulación registrada: <strong>${e(application.stage)}</strong> (${application.archived ? "archivada" : "activa"}).</p>${detailed ? `<p class="meta">Registro ficticio: ${formatDate(application.registeredAt)} / ${e(application.id)}</p><a href="#postulaciones/${encodeURIComponent(application.id)}" data-tracking-link="${e(application.id)}">Consultar mis postulaciones</a>` : ""}`
    : "<p>Sin postulación registrada.</p>"}</div>`;
}

export function catalogueResults(state, filters = {}) {
  const query = normalize(filters.query);
  const offers = state.offers.filter((offer) => {
    const saved = state.savedOffers.some((item) => item.offerId === offer.id);
    return (!query || normalize(offer.title).includes(query) || normalize(offer.company).includes(query)) &&
      (!filters.workMode || offer.workMode === filters.workMode) &&
      (!filters.saved || filters.saved === "all" || (filters.saved === "saved" ? saved : !saved));
  });
  return {
    countText: `${offers.length} de ${state.offers.length} ofertas ficticias.`,
    html: offers.length ? `<ul class="offer-list">${offers.map((offer) => {
      const context = contextFor(state, offer.id);
      return `<li class="offer-card">
        <h2>${e(offer.title)}</h2><p class="meta">${e(offer.company)}</p>
        <p class="meta">${e(offer.location)} / ${e(offer.workMode)}</p>
        ${signals(context)}
        ${applicationContext(context.application)}
        <a class="job-detail-link" href="#empleos/${encodeURIComponent(offer.id)}" aria-label="Ver detalle: ${e(offer.title)} de ${e(offer.company)}">Ver detalle</a>
        ${actions(offer, context)}
      </li>`;
    }).join("")}</ul>` : '<p class="empty-message">No hay ofertas para esta búsqueda. Usa «Limpiar filtros» para consultar el catálogo completo.</p>'
  };
}

function renderCatalogue(state, filters) {
  const result = catalogueResults(state, filters);
  const modes = [...new Set(state.offers.map((offer) => offer.workMode))].sort((a, b) => a.localeCompare(b, "es"));
  return header("Empleos", "Explora las seis ofertas ficticias y organiza tu búsqueda durante esta sesión.") + `
    <p class="notice">Guardar una oferta y marcar interés son acciones independientes. Ninguna registra ni modifica postulaciones. «Descubierta» indica que no está guardada ni marcada con interés.</p>
    <div class="job-filters" role="group" aria-label="Filtros del catálogo">
      <div class="job-field"><label for="job-search">Cargo o empresa</label><input id="job-search" name="job-search" type="search" autocomplete="off" placeholder="Ej.: frontend o Empresa ficticia B" value="${e(filters.query || "")}" aria-controls="job-results"></div>
      <div class="job-field"><label for="job-mode">Modalidad</label><select id="job-mode" name="job-mode" aria-controls="job-results"><option value="">Todas las modalidades</option>${modes.map((mode) => `<option value="${e(mode)}"${filters.workMode === mode ? " selected" : ""}>${e(mode)}</option>`).join("")}</select></div>
      <div class="job-field"><label for="job-saved">Guardado</label><select id="job-saved" name="job-saved" aria-controls="job-results">
        ${[["all", "Todas las ofertas"], ["saved", "Guardadas"], ["unsaved", "Sin guardar"]].map(([value, label]) => `<option value="${value}"${(filters.saved || "all") === value ? " selected" : ""}>${label}</option>`).join("")}
      </select></div>
      <button id="clear-job-filters" type="button">Limpiar filtros</button>
    </div>
    <p id="jobs-result-count" class="job-count" role="status" aria-live="polite" aria-atomic="true" tabindex="-1">${result.countText}</p>
    <div id="job-results">${result.html}</div>`;
}

function renderDetail(state, encodedId, options) {
  let id;
  try { id = decodeURIComponent(encodedId); } catch { id = ""; }
  const offer = state.offers.find((item) => item.id === id);
  const back = '<a class="job-back" href="#empleos">Volver al catálogo</a>';
  if (!offer) return back + header("Oferta no encontrada", "El identificador no corresponde a una oferta ficticia. Vuelve al catálogo para elegir una.");
  const context = contextFor(state, id);
  const example = state.compatibilityExamples.find((item) => item.offerId === id && item.profileId === state.profile.id);
  return back + header(offer.title, offer.company) + `
    <dl class="job-facts"><div><dt>Código</dt><dd>${e(offer.id)}</dd></div><div><dt>Ubicación ficticia</dt><dd>${e(offer.location)}</dd></div><div><dt>Modalidad</dt><dd>${e(offer.workMode)}</dd></div></dl>
    ${signals(context)}
    ${actions(offer, context)}
    <p class="meta">Los cambios de guardado e interés se conservan solo en memoria y se pierden al recargar.</p>
    <section class="section-block" aria-labelledby="job-description-title"><h2 id="job-description-title">Descripción</h2><p>${e(offer.description || "No hay descripción disponible.")}</p></section>
    <section class="section-block" aria-labelledby="job-requirements-title"><h2 id="job-requirements-title">Requisitos disponibles</h2>
      ${offer.requirements?.length ? `<ul>${offer.requirements.map((item) => `<li>${e(item)}</li>`).join("")}</ul>` : '<p class="empty-message">No hay requisitos precargados para esta oferta.</p>'}
    </section>
    <section class="section-block" aria-labelledby="job-application-title"><h2 id="job-application-title">Postulaciones: contexto</h2>
      ${applicationContext(context.application, true)}
      ${registrationForm(state, offer, options.registrationDrafts?.get(offer.id))}
      <p class="meta">Etapas de esta demo: ${state.applicationTracking.knownStages.map(e).join(", ")}. No se envían postulaciones reales.</p>
    </section>
    <section class="panel section-block" aria-labelledby="job-compatibility-title"><h2 id="job-compatibility-title">Acceso a compatibilidad ilustrativa</h2>
      <p class="meta">Solo se consultan los cinco campos del ejemplo precargado. No se ejecuta IA ni se recalcula compatibilidad.</p>
      <a class="job-back" href="#mi-cv">Revisar perfil ficticio</a>
      ${example && isCompatibilityStale(state) ? '<p class="notice"><strong>No actualizado respecto al perfil actual.</strong> Se conserva el ejemplo del perfil inicial sin recalcularlo.</p>' : ""}
      ${example ? `<details id="job-compatibility-example" class="offer-details"><summary>Consultar compatibilidad ilustrativa precargada</summary>${analysisExample(example, { stale: isCompatibilityStale(state) })}</details>` : '<p class="empty-message">No existe una evaluación ilustrativa disponible para esta oferta. No se ha generado un análisis.</p>'}
    </section>`;
}

export function render(state, options = {}) {
  return options.encodedOfferId !== undefined
    ? renderDetail(state, options.encodedOfferId, options)
    : renderCatalogue(state, options.filters || {});
}
