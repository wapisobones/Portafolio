import { escapeHtml as e, header, pending } from "./shared.js";
import { isCompatibilityStale } from "../state.js";

const statusLabels = { pending: "Pendiente", confirmed: "Confirmada", corrected: "Corregida", rejected: "Rechazada" };

function claimCard(claim, review, drafts) {
  const evidence = review.evidence.find((item) => item.id === claim.evidenceId);
  const draft = drafts?.get(claim.id) ?? claim.text;
  return `<li class="review-card review-card--${claim.status}" id="${e(claim.id)}">
    <div class="review-heading"><h3 tabindex="-1">${e(claim.label)}</h3><span class="review-status review-status--${claim.status}">${statusLabels[claim.status]}</span></div>
    <p><strong>Afirmación original:</strong> ${e(claim.originalText)}</p>
    ${claim.status === "corrected" ? `<p><strong>Texto corregido vigente:</strong> ${e(claim.text)}</p>` : ""}
    ${claim.status === "rejected" ? '<p class="meta">Esta afirmación se excluye de la información profesional de la sesión.</p>' : ""}
    <blockquote class="review-evidence"><p>${e(evidence?.text || "No hay evidencia disponible.")}</p><cite>${e(evidence?.section || "Sección no informada")} / evidencia ficticia</cite></blockquote>
    <div class="review-actions" role="group" aria-label="Revisar: ${e(claim.label)}">
      <button type="button" data-claim-action="confirm" data-claim-id="${e(claim.id)}" aria-pressed="${claim.status === "confirmed"}" aria-label="Confirmar original: ${e(claim.label)}">Confirmar original</button>
      <button type="button" data-claim-action="reject" data-claim-id="${e(claim.id)}" aria-pressed="${claim.status === "rejected"}" aria-label="Rechazar afirmación: ${e(claim.label)}">Rechazar afirmación</button>
    </div>
    <details class="review-editor" data-claim-editor="${e(claim.id)}">
      <summary>Corregir afirmación</summary>
      <form data-claim-form="${e(claim.id)}" novalidate>
        <label for="claim-text-${e(claim.id)}">Texto corregido: ${e(claim.label)}</label>
        <textarea id="claim-text-${e(claim.id)}" name="correction" data-claim-input="${e(claim.id)}" rows="4" minlength="3" maxlength="500" required aria-describedby="claim-help-${e(claim.id)} claim-error-${e(claim.id)}">${e(draft)}</textarea>
        <p class="meta" id="claim-help-${e(claim.id)}">Entre 3 y 500 caracteres. Usa únicamente texto ficticio. La evidencia original se conserva.</p>
        <p class="review-error" id="claim-error-${e(claim.id)}" role="alert"></p>
        <button type="submit" data-claim-submit="${e(claim.id)}">Guardar corrección</button>
      </form>
    </details>
  </li>`;
}

export function render(state, options = {}) {
  const profile = state.profile;
  const review = state.profileReview;
  const returnOffer = state.offers.find((item) => item.id === options.returnOfferId);
  return `${returnOffer ? `<a class="job-back" href="#empleos/${encodeURIComponent(returnOffer.id)}">Volver a la oferta</a>` : '<a class="job-back" href="#empleos">Ir al catálogo de empleos</a>'}` +
    header("Mi CV", "Revisa afirmaciones y evidencia textual totalmente ficticias. No se ha cargado ni extraído un documento real.") + `
    <p class="notice">Los cambios se conservan solo en memoria. Confirmar original conserva o restaura ese texto; corregir lo sustituye; rechazar lo excluye del perfil.</p>
    <div class="profile-layout">
      <section class="panel" aria-labelledby="profile-title">
        <span class="pill pill--example">Perfil ficticio de la sesión</span>
        <h2 id="profile-title" class="section-block">${e(profile.headline || "Titular no disponible tras la revisión")}</h2>
        <p>${e(profile.summary || "Resumen no disponible tras la revisión.")}</p>
        <h3>Experiencia de ejemplo</h3>
        <ul class="profile-list">${profile.experience.map((item) => `<li><h4>${e(item.role)}</h4><p>${e(item.organization)} / ${e(item.period)}</p><p>${e(item.description || "Descripción excluida del perfil en esta sesión.")}</p></li>`).join("")}</ul>
      </section>
      <div>
        <section class="panel" aria-labelledby="skills-title"><h2 id="skills-title">Tecnologías del perfil</h2><ul class="tag-list">${profile.skills.map((skill) => `<li>${e(skill)}</li>`).join("")}</ul></section>
        <section class="panel section-block" aria-labelledby="education-title"><h2 id="education-title">Formación ficticia</h2>${profile.education.map((item) => `<h3>${e(item.title)}</h3><p class="meta">${e(item.institution)} / ${e(item.period)}</p>`).join("")}</section>
      </div>
    </div>
    <section class="section-block" aria-labelledby="review-title"><h2 id="review-title">Afirmaciones y evidencia del CV ficticio</h2>
      <p class="meta">Los cuatro fragmentos se prepararon para esta demo. No son resultados de extracción ni inferencias de IA.</p>
      <dl class="count-strip review-counts">${Object.entries(statusLabels).map(([status, label]) => `<div><dt>${label}</dt><dd>${review.claims.filter((claim) => claim.status === status).length}</dd></div>`).join("")}</dl>
      <ul class="review-list">${review.claims.map((claim) => claimCard(claim, review, options.reviewDrafts)).join("")}</ul>
    </section>
    <p class="notice">${isCompatibilityStale(state) ? "<strong>No actualizado respecto al perfil actual.</strong> Los ejemplos de compatibilidad conservan el texto del perfil inicial; no se han recalculado." : "Los ejemplos de compatibilidad corresponden al perfil ficticio inicial. Confirmar su texto sin modificarlo no altera esa referencia."}</p>
    ${pending("La carga, extracción y análisis de archivos PDF/DOCX no están disponibles. Aquí solo se revisan afirmaciones ficticias precargadas.")}`;
}
