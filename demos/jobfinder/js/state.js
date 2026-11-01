let current = null;
let initialState = null;

function validate(data) {
  const assert = (condition, message) => { if (!condition) throw new Error(message); };
  assert(data?.meta?.fictional === true && typeof data.profile?.id === "string", "El conjunto debe incluir un perfil y datos ficticios.");
  const collections = ["offers", "compatibilityExamples", "applications", "savedOffers", "interests"];
  collections.forEach((key) => assert(Array.isArray(data[key]), `Colección no válida: ${key}`));
  ["offers", "compatibilityExamples", "applications"].forEach((key) => {
    const ids = data[key].map((item) => item?.id);
    assert(ids.every((id) => typeof id === "string" && id.length > 0) && new Set(ids).size === ids.length, `Identificadores no válidos: ${key}`);
  });
  const hasOffer = (id) => data.offers.some((offer) => offer.id === id);
  ["savedOffers", "interests"].forEach((key) => {
    assert(data[key].every((item) => hasOffer(item.offerId)), `Referencias no válidas: ${key}`);
    assert(new Set(data[key].map((item) => item.offerId)).size === data[key].length, `Ofertas duplicadas: ${key}`);
  });
  data.applications.forEach((item) => {
    assert(hasOffer(item.offerId) && item.profileId === data.profile.id && typeof item.archived === "boolean", "Postulación con referencias no válidas.");
  });
  data.compatibilityExamples.forEach((item) => {
    assert(item.illustrative === true && item.profileId === data.profile.id && hasOffer(item.offerId), "Compatibilidad no ilustrativa o sin referencias.");
    ["recommendation", "summary", "advice"].forEach((key) => assert(typeof item[key] === "string", "Ejemplo de compatibilidad incompleto."));
    assert(Array.isArray(item.strengths) && Array.isArray(item.gaps), "Ejemplo de compatibilidad incompleto.");
  });
  const review = data.profileReview;
  assert(review && review.revision === 0 && review.examplesProfileRevision === 0, "Falta la revisión inicial del perfil.");
  assert(Array.isArray(review.claims) && Array.isArray(review.evidence), "Faltan afirmaciones o evidencia.");
  [review.claims, review.evidence].forEach((items) => {
    assert(items.every((item) => typeof item.id === "string") && new Set(items.map((item) => item.id)).size === items.length, "Identificadores de revisión no válidos.");
  });
  review.claims.forEach((claim) => {
    const evidence = review.evidence.find((item) => item.id === claim.evidenceId);
    assert(claim.profileId === data.profile.id && evidence?.profileId === data.profile.id &&
      evidence.text.includes(claim.originalText) && claim.text === claim.originalText && claim.status === "pending", "Afirmación sin evidencia ficticia relacionada.");
    const target = claim.target;
    const value = target.kind === "headline" ? data.profile.headline :
      target.kind === "summary" ? data.profile.summary :
      target.kind === "experienceDescription" ? data.profile.experience.find((item) => item.id === target.experienceId)?.description :
      target.kind === "skill" ? data.profile.skills[target.index] : null;
    assert(value === claim.originalText, "La afirmación no corresponde a su información profesional.");
  });
  return data;
}

function freeze(value) {
  if (value && typeof value === "object") {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
}

export async function initialize() {
  const { createDemoData } = await import("./data.js");
  const data = validate(createDemoData());
  const activeOffers = data.applications.filter((item) => !item.archived).map((item) => item.offerId);
  if (new Set(activeOffers).size !== activeOffers.length) throw new Error("Hay seguimientos activos duplicados.");
  current = freeze({
    ...data, sessionActivity: [],
    applicationTracking: {
      knownStages: [...new Set(data.applications.map((item) => item.stage))],
      completeStageContract: false, originals: data.applications, events: []
    }
  });
  initialState = current;
  return current;
}

export function resetDemo() {
  if (!initialState) throw new Error("Carga el conjunto ficticio antes de restablecer.");
  current = initialState;
  return current;
}

export function getState() {
  if (!current) throw new Error("El conjunto ficticio todavía no está cargado.");
  return current;
}
function setOfferFlag(collection, dateKey, offerId, enabled) {
  const state = getState();
  if (typeof enabled !== "boolean") throw new Error("El estado de la acción no es válido.");
  if (!state.offers.some((offer) => offer.id === offerId)) throw new Error("La oferta no está disponible en el conjunto ficticio.");
  const present = state[collection].some((item) => item.offerId === offerId);
  if (present === enabled) return current;
  const occurredAt = new Date().toISOString();
  const items = enabled
    ? [...state[collection], { offerId, [dateKey]: occurredAt.slice(0, 10) }]
    : state[collection].filter((item) => item.offerId !== offerId);
  const type = collection === "savedOffers" ? (enabled ? "saved" : "unsaved") : (enabled ? "interest-marked" : "interest-removed");
  const event = { id: nextTrackingId("SIM-ACT-", state.sessionActivity), type, offerId, occurredAt };
  current = freeze({ ...state, [collection]: items, sessionActivity: [...state.sessionActivity, event] });
  return current;
}

export function setOfferSaved(offerId, saved) {
  return setOfferFlag("savedOffers", "savedAt", offerId, saved);
}

export function setOfferInterest(offerId, interested) {
  return setOfferFlag("interests", "markedAt", offerId, interested);
}
// Las postulaciones no se crean ni se modifican desde estas acciones.

export function isCompatibilityStale(state = getState()) {
  return state.profileReview.revision !== state.profileReview.examplesProfileRevision;
}

export function reviewClaim(claimId, action, correction = "") {
  const state = getState();
  const review = state.profileReview;
  const claim = review.claims.find((item) => item.id === claimId);
  if (!claim) throw new Error("La afirmación no está disponible.");
  if (!["confirm", "correct", "reject"].includes(action)) throw new Error("La acción de revisión no es válida.");
  const text = action === "confirm" ? claim.originalText : action === "correct" ? String(correction).trim() : claim.text;
  if (action === "correct") {
    if (typeof correction !== "string" || text.length < 3 || text.length > 500) {
      throw new Error("Escribe una corrección ficticia de entre 3 y 500 caracteres.");
    }
    if (text === claim.originalText) throw new Error("Para conservar el texto original, usa «Confirmar original».");
  }
  const status = { confirm: "confirmed", correct: "corrected", reject: "rejected" }[action];
  const value = status === "rejected" ? "" : text;
  const target = claim.target;
  let profile;
  if (target.kind === "headline" || target.kind === "summary") {
    profile = { ...state.profile, [target.kind]: value };
  } else if (target.kind === "experienceDescription") {
    profile = { ...state.profile, experience: state.profile.experience.map((item) =>
      item.id === target.experienceId ? { ...item, description: value } : item) };
  } else {
    const previous = claim.status === "rejected" ? null : claim.text;
    const skills = state.profile.skills.filter((item) => item !== previous);
    if (value && skills.some((item) => item.toLocaleLowerCase("es") === value.toLocaleLowerCase("es"))) {
      throw new Error("Esa tecnología ya está en el perfil. Usa un texto diferente.");
    }
    if (value) skills.splice(Math.min(target.index, skills.length), 0, value);
    profile = { ...state.profile, skills };
  }
  const changed = JSON.stringify(profile) !== JSON.stringify(state.profile);
  if (!changed && claim.status === status && claim.text === text) return current;
  current = freeze({
    ...state, profile,
    profileReview: {
      ...review, revision: review.revision + (changed ? 1 : 0),
      claims: review.claims.map((item) => item.id === claimId ? { ...item, text, status } : item)
    }
  });
  return current;
}

export function registrationEligibility(offerId, state = getState()) {
  if (!state.offers.some((offer) => offer.id === offerId)) return { eligible: false, reason: "La oferta no está disponible." };
  if (state.applications.some((item) => item.offerId === offerId && !item.archived)) return { eligible: false, reason: "Ya existe una postulación activa para esta oferta." };
  if (!state.savedOffers.some((item) => item.offerId === offerId)) return { eligible: false, reason: "Guarda la oferta antes de registrar un seguimiento ficticio." };
  return { eligible: true, reason: "" };
}

function trackingError(message, field) {
  const error = new Error(message);
  error.field = field;
  return error;
}

function normalizeTracking(values, state) {
  if (!state.applicationTracking.knownStages.includes(values.stage)) throw trackingError("Selecciona una de las etapas conocidas.", "stage");
  if (typeof values.notes !== "string" || values.notes.trim().length > 1000) throw trackingError("Las notas deben tener como máximo 1000 caracteres.", "notes");
  const date = (value, key) => {
    if (value === "" || value === null || value === undefined) return null;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
        !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
      throw trackingError("Introduce una fecha válida o deja el campo vacío.", key);
    }
    return value;
  };
  const applicationDate = date(values.applicationDate, "applicationDate");
  const nextFollowUpDate = date(values.nextFollowUpDate, "nextFollowUpDate");
  if (applicationDate && nextFollowUpDate && nextFollowUpDate < applicationDate) throw trackingError("El próximo seguimiento no puede ser anterior a la fecha ficticia de postulación.", "nextFollowUpDate");
  return { stage: values.stage, notes: values.notes.trim(), applicationDate, nextFollowUpDate };
}

function nextTrackingId(prefix, items) {
  let number = 1;
  const ids = new Set(items.map((item) => item.id));
  while (ids.has(prefix + String(number).padStart(3, "0"))) number++;
  return prefix + String(number).padStart(3, "0");
}

function commitTracking(applications, applicationId, type, changes, occurredAt = new Date().toISOString()) {
  const state = getState(), tracking = state.applicationTracking;
  const event = { id: nextTrackingId("SIM-EVT-", tracking.events), applicationId, type, occurredAt, changes };
  current = freeze({ ...state, applications, applicationTracking: { ...tracking, events: [...tracking.events, event] } });
  return current;
}

export function registerApplication(offerId, values) {
  const state = getState(), eligibility = registrationEligibility(offerId, state);
  if (!eligibility.eligible) throw trackingError(eligibility.reason, "stage");
  const fields = normalizeTracking(values, state), now = new Date().toISOString();
  const application = { id: nextTrackingId("SIM-POST-", state.applications), profileId: state.profile.id, offerId, ...fields, archived: false, registeredAt: now.slice(0, 10), simulated: true };
  const changes = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== "" && value !== null).map(([key, value]) => [key, { before: null, after: value }]));
  commitTracking([...state.applications, application], application.id, "registered", changes, now);
  return application;
}

export function updateApplication(applicationId, values) {
  const state = getState(), application = state.applications.find((item) => item.id === applicationId);
  if (!application) throw new Error("El seguimiento no está disponible.");
  const fields = normalizeTracking(values, state);
  const previous = { stage: application.stage, notes: application.notes || "", applicationDate: application.applicationDate || null, nextFollowUpDate: application.nextFollowUpDate || null };
  const changes = Object.fromEntries(Object.entries(fields).filter(([key, value]) => value !== previous[key]).map(([key, value]) => [key, { before: previous[key], after: value }]));
  if (!Object.keys(changes).length) return current;
  return commitTracking(state.applications.map((item) => item.id === applicationId ? { ...item, ...fields } : item), applicationId, "updated", changes);
}

export function setApplicationArchived(applicationId, archived) {
  const state = getState();
  if (typeof archived !== "boolean") throw new Error("La acción de archivo no es válida.");
  const application = state.applications.find((item) => item.id === applicationId);
  if (!application) throw new Error("El seguimiento no está disponible.");
  if (application.archived === archived) return current;
  if (!archived && state.applications.some((item) => item.offerId === application.offerId && !item.archived && item.id !== applicationId)) throw new Error("No se puede restaurar: ya existe un seguimiento activo para esta oferta.");
  return commitTracking(state.applications.map((item) => item.id === applicationId ? { ...item, archived } : item), applicationId, archived ? "archived" : "restored", { archived: { before: application.archived, after: archived } });
}
