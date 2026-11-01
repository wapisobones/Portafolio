const Filters = (() => {
  const matchesFilter = (project, filter) => {
    if (filter === "Todos") {
      return true;
    }

    const searchableValues = [
      project.tipo,
      project.estado,
      ...(project.categorias || [])
    ].map((value) => String(value).toLowerCase());

    return searchableValues.includes(filter.toLowerCase());
  };

  const apply = (projects, filter) => projects.filter((project) => matchesFilter(project, filter));

  const init = ({ buttons, projects, onChange }) => {
    buttons.forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.filter;

        buttons.forEach((item) => {
          const isActive = item === button;
          item.classList.toggle("active", isActive);
          item.setAttribute("aria-pressed", String(isActive));
        });

        onChange(apply(projects, filter), filter);
      });
    });
  };

  return {
    apply,
    init
  };
})();

window.Filters = Filters;
