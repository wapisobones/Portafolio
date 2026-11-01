(function () {
  // Clave unica para guardar el ultimo proyecto PCM en el navegador.
  const STORAGE_KEY = "pcm-last-project";
  let memoryProject = null;
  let storageAvailable = true;

  // Persiste plancha y piezas como JSON; no usa backend ni base de datos.
  function saveProject(project) {
    memoryProject = JSON.stringify(project);
    if (storageAvailable) {
      try {
        localStorage.setItem(STORAGE_KEY, memoryProject);
      } catch {
        storageAvailable = false;
      }
    }
  }

  // Recupera el ultimo proyecto guardado y protege la app si el JSON esta corrupto.
  function loadProject() {
    if (storageAvailable) {
      try {
        memoryProject = localStorage.getItem(STORAGE_KEY);
      } catch {
        storageAvailable = false;
      }
    }

    if (!memoryProject) {
      return null;
    }

    try {
      return JSON.parse(memoryProject);
    } catch (error) {
      console.warn("No se pudo leer el proyecto guardado.", error);
      return null;
    }
  }

  // Elimina solo el proyecto local de PCM.
  function clearProject() {
    memoryProject = null;
    if (storageAvailable) {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        storageAvailable = false;
      }
    }
  }

  window.PCMStorage = {
    saveProject,
    loadProject,
    clearProject,
    isStorageAvailable: () => storageAvailable
  };
})();
