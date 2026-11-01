const Projects = (() => {
  const publicCodeUrl = (url) => Boolean(url && url.trim() && url.trim().toLowerCase() !== "privado");

  const escapeHtml = (value = "") =>
    String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const renderTags = (items, className) =>
    items.map((item) => `<li class="${className}">${escapeHtml(item)}</li>`).join("");

  const buildProjectCard = (project) => {
    const initials = project.nombre
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("")
      .toUpperCase();

    const imageMarkup = project.imagen
      ? `<img src="${escapeHtml(project.imagen)}" alt="${escapeHtml(project.imagenAlt || `Imagen referencial de ${project.nombre}`)}" loading="lazy" decoding="async" data-placeholder="${escapeHtml(initials)}" onerror="this.replaceWith(window.Projects.createPlaceholder(this.dataset.placeholder))">`
      : `<div class="project-placeholder" aria-hidden="true">${escapeHtml(initials)}</div>`;

    const demoButton = project.demoUrl
      ? `<a class="project-link primary" href="${escapeHtml(project.demoUrl)}">${escapeHtml(project.demoTexto || "Ver proyecto")}<span class="visually-hidden">: ${escapeHtml(project.nombre)}</span></a>`
      : "";

    const codeButton = publicCodeUrl(project.codigoUrl)
      ? `<a class="project-link" href="${escapeHtml(project.codigoUrl)}" target="_blank" rel="noopener noreferrer">Ver código<span class="visually-hidden">: ${escapeHtml(project.nombre)} (se abre en otra pestaña)</span></a>`
      : "";

    const imageButton = project.verImagen && project.imagen && !project.confidencial
      ? `<a class="project-link" href="${escapeHtml(project.imagen)}" target="_blank" rel="noopener noreferrer">Ver captura<span class="visually-hidden">: ${escapeHtml(project.nombre)} (se abre en otra pestaña)</span></a>`
      : "";

    // El tipo y el estado conservan sus valores originales para los filtros.
    const categories = [
      project.tipo === "Hobby" ? "Personal" : project.tipo,
      ...project.categorias.filter((category) => category !== project.tipo && category !== project.estado).slice(0, 3)
    ];
    const technologies = project.tecnologiasPrincipales || project.tecnologias.slice(0, 4);
    const statusClass = {
      "Funcional": "project-status--ready",
      "En desarrollo": "project-status--development"
    }[project.estado] || "";
    // «Profesional» describe el tipo de proyecto, no su estado de desarrollo.
    const status = project.estado !== project.tipo
      ? `<span class="project-status ${statusClass}">${escapeHtml(project.estado)}</span>`
      : "";

    const confidentiality = project.confidencial
      ? `<p class="confidential-note">${escapeHtml(project.notaConfidencialidad)}</p>`
      : "";

    return `
      <article class="project-card" data-project-id="${escapeHtml(project.id)}" aria-labelledby="project-title-${escapeHtml(project.id)}">
        <div class="project-media">${imageMarkup}</div>
        <div class="project-body">
          <div class="project-topline">
            <h3 class="project-title" id="project-title-${escapeHtml(project.id)}">${escapeHtml(project.nombre)}</h3>
            ${status}
          </div>
          <ul class="project-tags" aria-label="Categorías">${renderTags(categories, "project-tag")}</ul>
          <p class="project-description">${escapeHtml(project.descripcion)}</p>
          <p class="project-role"><strong>Mi aporte:</strong> ${escapeHtml(project.rol)}</p>
          <ul class="project-techs" aria-label="Tecnologías principales">${renderTags(technologies, "project-tech")}</ul>
          ${confidentiality}
          ${demoButton || codeButton || imageButton ? `<div class="project-actions">${demoButton}${codeButton}${imageButton}</div>` : ""}
        </div>
      </article>
    `;
  };

  const render = (projects, container, emptyElement) => {
    container.innerHTML = projects.map(buildProjectCard).join("");
    if (emptyElement) {
      emptyElement.hidden = projects.length > 0;
    }
  };

  const createPlaceholder = (label) => {
    const placeholder = document.createElement("div");
    placeholder.className = "project-placeholder";
    placeholder.setAttribute("aria-hidden", "true");
    placeholder.textContent = label;
    return placeholder;
  };

  return {
    render,
    createPlaceholder
  };
})();

window.Projects = Projects;
