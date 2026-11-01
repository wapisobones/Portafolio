(function () {
  // Clave unica para guardar el ultimo proyecto PCM en el navegador.
  const STORAGE_KEY = "pcm-last-project";

  // Persiste plancha y piezas como JSON; no usa backend ni base de datos.
  function saveProject(project) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  }

  // Recupera el ultimo proyecto guardado y protege la app si el JSON esta corrupto.
  function loadProject() {
    const rawProject = localStorage.getItem(STORAGE_KEY);

    if (!rawProject) {
      return null;
    }

    try {
      return JSON.parse(rawProject);
    } catch (error) {
      console.warn("No se pudo leer el proyecto guardado.", error);
      return null;
    }
  }

  // Elimina solo el proyecto local de PCM.
  function clearProject() {
    localStorage.removeItem(STORAGE_KEY);
  }

  window.PCMStorage = {
    saveProject,
    loadProject,
    clearProject
  };
})();
