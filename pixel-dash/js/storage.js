const BEST_SCORE_KEY = "pixelDashBestScore";

// Lee el mejor puntaje guardado en el navegador.
export function getBestScore() {
  const savedScore = Number(localStorage.getItem(BEST_SCORE_KEY));
  return Number.isFinite(savedScore) ? savedScore : 0;
}

// Guarda solo si el nuevo puntaje supera al mejor anterior.
export function saveBestScore(score) {
  const bestScore = Math.max(getBestScore(), Math.floor(score));
  localStorage.setItem(BEST_SCORE_KEY, String(bestScore));
  return bestScore;
}
