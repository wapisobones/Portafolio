export const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
})[character]);

const dateFormatter = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "UTC" });
export function formatDate(value) {
  const parsed = typeof value === "string" ? Date.parse(value) : NaN;
  return Number.isFinite(parsed)
    ? `<time datetime="${escapeHtml(value)}">${escapeHtml(dateFormatter.format(new Date(parsed)))}</time>`
    : "Fecha no informada";
}
export function header(title, description) {
  return `<header class="view-header"><h1 tabindex="-1">${escapeHtml(title)}</h1><p>${escapeHtml(description)}</p></header>`;
}
export function pending(text) {
  return `<aside class="notice"><strong>Pendiente en esta entrega</strong><p>${escapeHtml(text)}</p></aside>`;
}
export function analysisExample(example, { stale = false } = {}) {
  return `<section class="analysis-example" aria-label="Ejemplo de compatibilidad precargado">
    <h3>Compatibilidad ilustrativa</h3>
    <p class="analysis-label">Ejemplo precargado. No se ejecutó un análisis de IA.</p>
    ${stale ? '<p class="notice"><strong>No actualizado respecto al perfil actual.</strong> Este texto corresponde al perfil inicial y no se ha recalculado.</p>' : ""}
    <h4>Recomendación</h4><p>${escapeHtml(example.recommendation)}</p>
    <h4>Resumen</h4><p>${escapeHtml(example.summary)}</p>
    <h4>Fortalezas</h4><ul>${example.strengths.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <h4>Brechas</h4><ul>${example.gaps.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
    <h4>Consejo</h4><p>${escapeHtml(example.advice)}</p>
  </section>`;
}
