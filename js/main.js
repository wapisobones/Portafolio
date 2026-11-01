const initFooterYear = () => {
  const yearElement = document.querySelector("#current-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
};

const loadProjects = async () => {
  const grid = document.querySelector("#projects-grid");
  const emptyElement = document.querySelector("#projects-empty");
  const filterButtons = document.querySelectorAll(".filter-button");

  if (!grid) {
    return;
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
  } catch (error) {
    grid.innerHTML = '<p class="empty-state">No fue posible cargar los proyectos. Recarga la página para intentarlo de nuevo.</p>';
    console.error(error);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  initFooterYear();
  loadProjects();
});
