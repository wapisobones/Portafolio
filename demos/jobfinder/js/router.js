const routes = {
  dashboard: { title: "Dashboard", load: () => import("./views/dashboard.js") },
  "mi-cv": { title: "Mi CV", load: () => import("./views/cv.js") },
  empleos: { title: "Empleos", load: () => import("./views/jobs.js") },
  postulaciones: { title: "Mis postulaciones", load: () => import("./views/applications.js") }
};

function focusView(content, encodedApplicationId) {
  let id = null;
  try { if (encodedApplicationId !== undefined) id = decodeURIComponent(encodedApplicationId); } catch { /* Se enfoca el encabezado si la ruta no es válida. */ }
  const card = id ? [...content.querySelectorAll("[data-application-card]")].find((item) => item.dataset.applicationCard === id) : null;
  (card || content.querySelector("h1"))?.focus();
}

export async function startRouter({ content, links, getState, report, getViewOptions = () => ({}) }) {
  let revision = 0;
  const navigate = async (moveFocus = false) => {
    const token = ++revision;
    const name = window.location.hash.slice(1) || "dashboard";
    const detail = name.startsWith("empleos/");
    const applicationDetail = name.startsWith("postulaciones/");
    const encodedApplicationId = applicationDetail ? name.slice("postulaciones/".length) : undefined;
    const routeName = detail ? "empleos" : applicationDetail ? "postulaciones" : name;
    const route = Object.hasOwn(routes, routeName) ? routes[routeName] : null;
    const title = detail ? "Detalle de oferta" : applicationDetail ? "Seguimiento de postulación" : route?.title;
    links.forEach((link) => {
      if (link.getAttribute("href") === `#${routeName}`) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
    content.setAttribute("aria-busy", "true");
    if (!route) {
      document.title = "Vista no encontrada | JobFinder AI Demo";
      content.innerHTML = '<h1 tabindex="-1">Vista no encontrada</h1><p>Elige una opción del menú o <a href="#dashboard">vuelve al Dashboard</a>.</p>';
      report("La ruta no existe. Elige una vista de la navegación.");
      content.setAttribute("aria-busy", "false");
      if (moveFocus) content.querySelector("h1")?.focus();
      return;
    }
    report(`Cargando vista: ${route.title}…`);
    content.innerHTML = '<h1 tabindex="-1">Cargando vista…</h1><p>Preparando el contenido local.</p>';
    try {
      const view = await route.load();
      if (token !== revision) return;
      content.innerHTML = view.render(getState(), { ...getViewOptions(), encodedOfferId: detail ? name.slice(8) : undefined, encodedApplicationId });
      document.title = `${title} | JobFinder AI Demo`;
      report(`Vista: ${title}. Datos ficticios; cambios de esta sesión solo en memoria.`);
    } catch (error) {
      if (token !== revision) return;
      content.innerHTML = '<h1 tabindex="-1">No fue posible abrir esta vista</h1><p>Prueba otra opción del menú o usa «Recargar demo» para volver a intentarlo.</p>';
      document.title = "Error de vista | JobFinder AI Demo";
      report("No se pudo cargar la vista local. Recarga la demo para reintentar.", true);
      console.error("Error de navegación de la demo:", error);
    } finally {
      if (token === revision) {
        content.setAttribute("aria-busy", "false");
        if (moveFocus || applicationDetail) focusView(content, encodedApplicationId);
      }
    }
  };
  const onHashChange = () => { navigate(true); };
  window.addEventListener("hashchange", onHashChange);
  await navigate();
  return { navigate, stop() { revision++; window.removeEventListener("hashchange", onHashChange); } };
}
