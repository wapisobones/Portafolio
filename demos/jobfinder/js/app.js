import { initialize, getState, setOfferSaved, setOfferInterest, reviewClaim, isCompatibilityStale, registerApplication, updateApplication, setApplicationArchived, resetDemo } from "./state.js";
import { render as renderCV } from "./views/cv.js";
import { render as renderApplications } from "./views/applications.js";
import { catalogueResults, render as renderJobs } from "./views/jobs.js";
import { startRouter } from "./router.js";

const content = document.querySelector("#view-content");
const status = document.querySelector("#app-status");
const reloadButton = document.querySelector("#reload-demo");
const resetButton = document.querySelector("#reset-demo");
const resetDialog = document.querySelector("#reset-demo-dialog");
const cancelReset = document.querySelector("#cancel-reset-demo");
const confirmReset = document.querySelector("#confirm-reset-demo");
let activeRouter = null;
const links = document.querySelectorAll(".main-nav a");
const filters = { query: "", workMode: "", saved: "all" };
const reviewDrafts = new Map();
const applicationDrafts = new Map();
const registrationDrafts = new Map();
let returnOfferId = null;

function report(message, error = false) {
  status.textContent = message;
  reloadButton.hidden = !error;
}

reloadButton.addEventListener("click", () => window.location.reload());
document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  document.querySelector("#contenido").focus();
});

function applicationRoute() {
  const name = window.location.hash.slice(1);
  return name === "postulaciones" || name.startsWith("postulaciones/");
}

function jobRoute() {
  const name = window.location.hash.slice(1);
  return name === "empleos" || name.startsWith("empleos/");
}

function updateCatalogue() {
  if (window.location.hash !== "#empleos") return;
  const result = catalogueResults(getState(), filters);
  content.querySelector("#job-results").innerHTML = result.html;
  content.querySelector("#jobs-result-count").textContent = result.countText;
}

function refreshJobs(action, offerId, moveFocus = true) {
  const name = window.location.hash.slice(1);
  if (name === "empleos") {
    updateCatalogue();
  } else {
    const open = content.querySelector("#job-compatibility-example")?.open;
    content.innerHTML = renderJobs(getState(), { ...viewOptions(), encodedOfferId: name.slice(8) });
    const example = content.querySelector("#job-compatibility-example");
    if (example) example.open = Boolean(open);
  }
  const buttons = [...content.querySelectorAll("[data-job-action]")];
  const button = buttons.find((item) => item.dataset.jobAction === action && item.dataset.offerId === offerId)
    || buttons.find((item) => item.dataset.jobAction === action);
  if (moveFocus) (button || content.querySelector("#jobs-result-count") || content.querySelector("h1"))?.focus();
}

function viewOptions() {
  const name = window.location.hash.slice(1);
  if (name.startsWith("empleos/")) {
    try {
      const id = decodeURIComponent(name.slice(8));
      if (getState().offers.some((offer) => offer.id === id)) returnOfferId = id;
    } catch { /* Una ruta no válida no sustituye el regreso anterior. */ }
  }
  return {
    filters, reviewDrafts, returnOfferId, applicationDrafts, registrationDrafts,
    encodedApplicationId: name.startsWith("postulaciones/") ? name.slice("postulaciones/".length) : undefined
  };
}

function refreshProfile(claimId, action) {
  const editors = [...content.querySelectorAll("[data-claim-editor]")];
  const open = new Set(editors.filter((item) => item.open).map((item) => item.dataset.claimEditor));
  content.innerHTML = renderCV(getState(), viewOptions());
  content.querySelectorAll("[data-claim-editor]").forEach((item) => { item.open = open.has(item.dataset.claimEditor); });
  const selector = action === "correct" ? "[data-claim-submit]" : "[data-claim-action]";
  const control = [...content.querySelectorAll(selector)].find((item) =>
    action === "correct" ? item.dataset.claimSubmit === claimId :
      item.dataset.claimId === claimId && item.dataset.claimAction === action);
  control?.focus();
}

function announceReview(action) {
  const label = { confirm: "Afirmación original confirmada", correct: "Afirmación corregida", reject: "Afirmación rechazada" }[action];
  report(`${label} en esta sesión. ${isCompatibilityStale() ? "Los ejemplos de compatibilidad no están actualizados respecto al perfil actual; no se han recalculado." : "El contenido profesional original se conserva."}`);
}

function trackingErrorElement(kind, id) {
  return [...content.querySelectorAll("[data-tracking-error]")].find((item) => item.dataset.trackingError === `${kind}:${id}`);
}

function refreshApplications(id, action) {
  const open = new Set([...content.querySelectorAll("[data-application-editor]")].filter((item) => item.open).map((item) => item.dataset.applicationEditor));
  content.innerHTML = renderApplications(getState(), viewOptions());
  content.querySelectorAll("[data-application-editor]").forEach((item) => { item.open = open.has(item.dataset.applicationEditor); });
  const selector = action === "updated" ? "[data-application-submit]" : "[data-application-action]";
  const button = [...content.querySelectorAll(selector)].find((item) =>
    action === "updated" ? item.dataset.applicationSubmit === id : item.dataset.applicationId === id);
  (button || content.querySelector("h1"))?.focus();
}

function rememberTrackingDraft(target) {
  const { trackingKind: kind, trackingId: id, trackingField: field } = target.dataset || {};
  if (!field || !id || !["application", "registration"].includes(kind)) return false;
  const drafts = kind === "application" ? applicationDrafts : registrationDrafts;
  drafts.set(id, { ...drafts.get(id), [field]: target.value });
  return true;
}

content.addEventListener("submit", (event) => {
  const registrationId = event.target.dataset.registerOffer;
  const applicationId = event.target.dataset.applicationForm;
  if (registrationId || applicationId) {
    event.preventDefault();
    if (registrationId && !window.location.hash.startsWith("#empleos/")) return;
    if (applicationId && !applicationRoute()) return;
    const kind = registrationId ? "registration" : "application", id = registrationId || applicationId;
    const inputs = Object.fromEntries(["stage", "notes", "applicationDate", "nextFollowUpDate"].map((key) => [key, event.target.querySelector(`[name="${key}"]`)]));
    const error = trackingErrorElement(kind, id);
    Object.values(inputs).forEach((input) => input.removeAttribute("aria-invalid"));
    error.textContent = "";
    try {
      const values = Object.fromEntries(Object.entries(inputs).map(([key, input]) => [key, input.value]));
      if (registrationId) {
        const application = registerApplication(registrationId, values);
        registrationDrafts.delete(registrationId);
        refreshJobs(null, registrationId, false);
        const link = [...content.querySelectorAll("[data-tracking-link]")].find((item) => item.dataset.trackingLink === application.id);
        (link || content.querySelector("h1"))?.focus();
        report("Seguimiento ficticio registrado en memoria. No se ha enviado una postulación real.");
      } else {
        const previous = getState();
        updateApplication(applicationId, values);
        applicationDrafts.delete(applicationId);
        refreshApplications(applicationId, "updated");
        report(getState() === previous ? "No hay cambios de seguimiento para guardar." : "Seguimiento actualizado en memoria. El cambio se añadió al historial de esta sesión.");
      }
    } catch (failure) {
      error.textContent = failure.message;
      const input = inputs[failure.field] || inputs.stage;
      input.setAttribute("aria-invalid", "true");
      input.focus();
    }
    return;
  }
  const claimId = event.target.dataset.claimForm;
  if (!claimId || window.location.hash !== "#mi-cv") return;
  event.preventDefault();
  const input = event.target.querySelector("textarea");
  const error = event.target.querySelector('[role="alert"]');
  input.removeAttribute("aria-invalid");
  error.textContent = "";
  try {
    reviewClaim(claimId, "correct", input.value);
    reviewDrafts.delete(claimId);
    refreshProfile(claimId, "correct");
    announceReview("correct");
  } catch (failure) {
    error.textContent = failure.message;
    input.setAttribute("aria-invalid", "true");
    input.focus();
  }
});

content.addEventListener("input", (event) => {
  if (rememberTrackingDraft(event.target)) return;
  if (event.target.dataset?.claimInput) {
    reviewDrafts.set(event.target.dataset.claimInput, event.target.value);
    return;
  }
  if (event.target.id !== "job-search") return;
  filters.query = event.target.value;
  updateCatalogue();
});
content.addEventListener("change", (event) => {
  if (rememberTrackingDraft(event.target)) return;
  if (event.target.id === "job-mode") filters.workMode = event.target.value;
  else if (event.target.id === "job-saved") filters.saved = event.target.value;
  else return;
  updateCatalogue();
});
content.addEventListener("click", (event) => {
  if (applicationRoute()) {
    const button = event.target.closest("button[data-application-action]");
    if (!button || !content.contains(button)) return;
    const { applicationId, applicationAction } = button.dataset;
    if (!["archive", "restore"].includes(applicationAction)) return;
    try {
      setApplicationArchived(applicationId, applicationAction === "archive");
      refreshApplications(applicationId, applicationAction);
      report(applicationAction === "archive" ? "Seguimiento archivado en esta sesión." : "Seguimiento restaurado en esta sesión.");
    } catch (failure) {
      trackingErrorElement("application", applicationId).textContent = failure.message;
      button.focus();
    }
    return;
  }
  if (window.location.hash === "#mi-cv") {
    const button = event.target.closest("button[data-claim-action]");
    if (!button || !content.contains(button)) return;
    const { claimId, claimAction } = button.dataset;
    try {
      reviewClaim(claimId, claimAction);
      reviewDrafts.delete(claimId);
      refreshProfile(claimId, claimAction);
      announceReview(claimAction);
    } catch (failure) {
      report(failure.message);
    }
    return;
  }
  if (!jobRoute()) return;
  if (event.target.id === "clear-job-filters") {
    filters.query = "";
    filters.workMode = "";
    filters.saved = "all";
    const search = content.querySelector("#job-search");
    search.value = "";
    content.querySelector("#job-mode").value = "";
    content.querySelector("#job-saved").value = "all";
    updateCatalogue();
    search.focus();
    return;
  }
  const button = event.target.closest("button[data-job-action]");
  if (!button || !content.contains(button)) return;
  const { jobAction: action, offerId } = button.dataset;
  try {
    if (action === "save") {
      const saved = getState().savedOffers.some((item) => item.offerId === offerId);
      setOfferSaved(offerId, !saved);
      refreshJobs(action, offerId);
      report(saved ? "Oferta quitada de guardadas en esta sesión." : "Oferta guardada en esta sesión.");
    } else if (action === "interest") {
      const interested = getState().interests.some((item) => item.offerId === offerId);
      setOfferInterest(offerId, !interested);
      refreshJobs(action, offerId);
      report(interested ? "Interés quitado en esta sesión." : "Interés marcado en esta sesión.");
    }
  } catch (error) {
    report(error.message, true);
  }
});

function resetDestination() {
  const name = window.location.hash.slice(1);
  if (["dashboard", "mi-cv", "empleos", "postulaciones"].includes(name)) return name;
  try {
    if (name.startsWith("empleos/")) {
      const id = decodeURIComponent(name.slice("empleos/".length));
      return getState().offers.some((item) => item.id === id) ? name : "empleos";
    }
    if (name.startsWith("postulaciones/")) {
      const id = decodeURIComponent(name.slice("postulaciones/".length));
      return getState().applications.some((item) => item.id === id) ? name : "postulaciones";
    }
  } catch { /* Una ruta inválida vuelve al Dashboard. */ }
  return "dashboard";
}

function closeReset() {
  resetDialog.close();
  resetButton.focus();
}
resetButton.addEventListener("click", () => {
  if (!activeRouter) return;
  resetDialog.showModal();
  cancelReset.focus();
});
cancelReset.addEventListener("click", closeReset);
resetDialog.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeReset();
});
confirmReset.addEventListener("click", async () => {
  if (!activeRouter || confirmReset.disabled) return;
  confirmReset.disabled = true;
  try {
    resetDemo();
    filters.query = "";
    filters.workMode = "";
    filters.saved = "all";
    reviewDrafts.clear();
    applicationDrafts.clear();
    registrationDrafts.clear();
    returnOfferId = null;
    const destination = resetDestination();
    if (window.location.hash !== "#" + destination) window.history.replaceState(null, "", "#" + destination);
    resetDialog.close();
    await activeRouter.navigate(true);
    report("Demo restablecida: datos ficticios originales recuperados; cambios, actividad de sesión, filtros y borradores eliminados.");
  } catch (error) {
    resetDialog.close();
    report("No fue posible restablecer la demo. Usa «Recargar demo» para volver al conjunto inicial.", true);
    resetButton.focus();
    console.error("Error al restablecer la demo:", error);
  } finally {
    confirmReset.disabled = false;
  }
});

async function start() {
  content.setAttribute("aria-busy", "true");
  report("Cargando el conjunto ficticio…");
  try {
    await initialize();
    activeRouter = await startRouter({ content, links, getState, report, getViewOptions: viewOptions });
    resetButton.disabled = false;
  } catch (error) {
    content.innerHTML = '<h1 tabindex="-1">Datos no disponibles</h1><p>No fue posible preparar el conjunto ficticio. Abre la demo desde un servidor HTTP y usa «Recargar demo» para reintentar.</p>';
    content.setAttribute("aria-busy", "false");
    report("No se pudieron cargar los datos locales. Revisa el servidor y recarga la página.", true);
    console.error("Error al iniciar JobFinder AI Demo:", error);
  }
}

start();
