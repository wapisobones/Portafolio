const initFooterYear = () => {
  const yearElement = document.querySelector("#current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
};

const loadProjects = async () => {
  const grid = document.querySelector("#projects-grid");
  const emptyElement = document.querySelector("#projects-empty");
  const loadingElement = document.querySelector("#projects-loading");
  const filterButtons = document.querySelectorAll(".filter-button");

  if (!grid) {
    return;
  }

  filterButtons.forEach((button) => {
    button.disabled = true;
  });
  grid.setAttribute("aria-busy", "true");
  if (loadingElement) {
    loadingElement.hidden = false;
  }

  try {
    const response = await fetch("data/projects.json");

    if (!response.ok) {
      throw new Error(`No se pudo cargar projects.json: ${response.status}`);
    }

    const projects = await response.json();
    window.Projects.render(projects, grid, emptyElement);
    window.Filters.init({
      buttons: filterButtons,
      projects,
      onChange: (filteredProjects) => window.Projects.render(filteredProjects, grid, emptyElement)
    });
    filterButtons.forEach((button) => {
      button.disabled = false;
    });
  } catch (error) {
    grid.innerHTML = '<p class="empty-state">No fue posible cargar los proyectos. Recarga la página para intentarlo de nuevo.</p>';
    console.error(error);
  } finally {
    grid.setAttribute("aria-busy", "false");
    if (loadingElement) {
      loadingElement.hidden = true;
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initFooterYear();
  loadProjects();
});
