const BEST_SCORE_KEY = "pixelDashBestScore";
let memoryBestScore = 0;
let storageAvailable = true;
let storageWarningHandler = null;

export function setStorageWarningHandler(handler) {
  storageWarningHandler = handler;
  if (!storageAvailable) storageWarningHandler?.();
}

function useMemoryStorage() {
  storageAvailable = false;
  storageWarningHandler?.();
}

// Lee el mejor puntaje guardado en el navegador.
export function getBestScore() {
  if (storageAvailable) {
    try {
      const savedScore = Number(localStorage.getItem(BEST_SCORE_KEY));
      if (Number.isFinite(savedScore)) memoryBestScore = Math.max(memoryBestScore, savedScore);
    } catch {
      useMemoryStorage();
    }
  }
  return memoryBestScore;
}

// Guarda solo si el nuevo puntaje supera al mejor anterior.
export function saveBestScore(score) {
  memoryBestScore = Math.max(getBestScore(), Math.floor(score));
  if (storageAvailable) {
    try {
      localStorage.setItem(BEST_SCORE_KEY, String(memoryBestScore));
    } catch {
      useMemoryStorage();
    }
  }
  return memoryBestScore;
}
