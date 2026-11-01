(function () {
  const { expandPieces } = window.PCMPieces;

  // Paleta estable para que una misma corrida entregue colores diferenciables en el plano.
  const COLORS = [
    "#5eead4",
    "#60a5fa",
    "#a78bfa",
    "#fbbf24",
    "#fb7185",
    "#34d399",
    "#f472b6",
    "#38bdf8"
  ];

  // Crea la orientacion normal o rotada manteniendo las medidas originales como referencia.
  function createOrientation(piece, rotated) {
    return {
      ...piece,
      width: rotated ? piece.height : piece.width,
      height: rotated ? piece.width : piece.height,
      originalWidth: piece.width,
      originalHeight: piece.height,
      rotated
    };
  }

  function getGrain(piece) {
    return piece.grain || piece.veta || "indiferente";
  }

  // Devuelve las orientaciones que la pieza puede probar segun rotacion y restriccion de veta.
  function getOrientations(piece) {
    const orientations = [createOrientation(piece, false)];
    const grain = getGrain(piece);

    if (grain === "indiferente" && (piece.canRotate || piece.allowRotation) && piece.width !== piece.height) {
      orientations.push(createOrientation(piece, true));
    }

    return orientations;
  }

  function canFitIgnoringGrain(piece, freeRects, board) {
    return freeRects.some((freeRect) => {
      return [createOrientation(piece, false), createOrientation(piece, true)].some((candidate) => {
        const reserved = getReservedSize(candidate, freeRect, board, board.kerf);
        return reserved.width <= freeRect.width && reserved.height <= freeRect.height;
      });
    });
  }

  // El corte se reserva hacia la derecha y abajo, excepto cuando la pieza llega al borde.
  function getReservedSize(candidate, freeRect, board, kerf) {
    const touchesRightEdge = freeRect.x + candidate.width >= board.width;
    const touchesBottomEdge = freeRect.y + candidate.height >= board.height;

    return {
      width: candidate.width + (touchesRightEdge ? 0 : kerf),
      height: candidate.height + (touchesBottomEdge ? 0 : kerf)
    };
  }

  // Best Area Fit: busca el espacio libre donde la pieza deje menos area sobrante.
  function findBestPlacement(piece, freeRects, board) {
    let bestPlacement = null;

    freeRects.forEach((freeRect, freeRectIndex) => {
      getOrientations(piece).forEach((candidate) => {
        const reserved = getReservedSize(candidate, freeRect, board, board.kerf);

        if (reserved.width > freeRect.width || reserved.height > freeRect.height) {
          return;
        }

        const areaWaste = freeRect.width * freeRect.height - reserved.width * reserved.height;
        const shortSideWaste = Math.min(freeRect.width - reserved.width, freeRect.height - reserved.height);
        const longSideWaste = Math.max(freeRect.width - reserved.width, freeRect.height - reserved.height);

        const score = {
          areaWaste,
          shortSideWaste,
          longSideWaste
        };

        if (!bestPlacement || isBetterScore(score, bestPlacement.score)) {
          bestPlacement = {
            freeRect,
            freeRectIndex,
            piece: candidate,
            reserved,
            score
          };
        }
      });
    });

    return bestPlacement;
  }

  // Compara candidatos priorizando menor desperdicio de area y luego mejor ajuste de lados.
  function isBetterScore(score, bestScore) {
    if (score.areaWaste !== bestScore.areaWaste) {
      return score.areaWaste < bestScore.areaWaste;
    }

    if (score.shortSideWaste !== bestScore.shortSideWaste) {
      return score.shortSideWaste < bestScore.shortSideWaste;
    }

    return score.longSideWaste < bestScore.longSideWaste;
  }

  function intersects(a, b) {
    return (
      a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y
    );
  }

  // Divide cada rectangulo libre afectado por la nueva pieza reservando tambien el kerf.
  function splitFreeRect(freeRect, usedRect) {
    const nextRects = [];

    if (!intersects(freeRect, usedRect)) {
      return [freeRect];
    }

    if (usedRect.x > freeRect.x) {
      nextRects.push({
        x: freeRect.x,
        y: freeRect.y,
        width: usedRect.x - freeRect.x,
        height: freeRect.height
      });
    }

    if (usedRect.x + usedRect.width < freeRect.x + freeRect.width) {
      nextRects.push({
        x: usedRect.x + usedRect.width,
        y: freeRect.y,
        width: freeRect.x + freeRect.width - (usedRect.x + usedRect.width),
        height: freeRect.height
      });
    }

    if (usedRect.y > freeRect.y) {
      nextRects.push({
        x: freeRect.x,
        y: freeRect.y,
        width: freeRect.width,
        height: usedRect.y - freeRect.y
      });
    }

    if (usedRect.y + usedRect.height < freeRect.y + freeRect.height) {
      nextRects.push({
        x: freeRect.x,
        y: usedRect.y + usedRect.height,
        width: freeRect.width,
        height: freeRect.y + freeRect.height - (usedRect.y + usedRect.height)
      });
    }

    return nextRects.filter((rect) => rect.width > 0 && rect.height > 0);
  }

  function isContainedIn(inner, outer) {
    return (
      inner.x >= outer.x &&
      inner.y >= outer.y &&
      inner.x + inner.width <= outer.x + outer.width &&
      inner.y + inner.height <= outer.y + outer.height
    );
  }

  // Limpia rectangulos libres redundantes para que el buscador no elija espacios invalidos.
  function pruneFreeRects(freeRects) {
    return freeRects.filter((rect, index) => {
      return !freeRects.some((other, otherIndex) => {
        return index !== otherIndex && isContainedIn(rect, other);
      });
    });
  }

  function sortPieces(pieces) {
    return expandPieces(pieces).sort((a, b) => {
      const areaDiff = b.width * b.height - a.width * a.height;

      if (areaDiff !== 0) {
        return areaDiff;
      }

      return Math.max(b.width, b.height) - Math.max(a.width, a.height);
    });
  }

  // Algoritmo principal: MaxRects simple con lista de espacios libres y Best Area Fit.
  function calculateLayout(boardConfig, pieces) {
    const board = {
      ...boardConfig,
      kerf: Math.max(0, Number(boardConfig.kerf) || 0)
    };
    const sortedPieces = sortPieces(pieces);
    let freeRects = [{ x: 0, y: 0, width: board.width, height: board.height }];
    const placedPieces = [];
    const unplacedPieces = [];

    sortedPieces.forEach((piece) => {
      const placement = findBestPlacement(piece, freeRects, board);

      if (!placement) {
        const grain = getGrain(piece);
        const blockedByGrain = grain !== "indiferente" && canFitIgnoringGrain(piece, freeRects, board);
        unplacedPieces.push({
          ...piece,
          grain,
          reason: blockedByGrain
            ? "La pieza no cabe respetando la dirección de veta."
            : "La pieza no cabe en los espacios libres disponibles."
        });
        return;
      }

      const placedPiece = {
        id: piece.id,
        originalId: piece.sourceId || piece.id,
        sourceId: piece.sourceId || piece.id,
        name: piece.name,
        x: placement.freeRect.x,
        y: placement.freeRect.y,
        width: placement.piece.width,
        height: placement.piece.height,
        originalWidth: placement.piece.originalWidth,
        originalHeight: placement.piece.originalHeight,
        rotated: placement.piece.rotated,
        grain: getGrain(piece),
        veta: getGrain(piece),
        grainLocked: getGrain(piece) !== "indiferente",
        boardGrain: board.grainDirection || board.vetaPlancha || "horizontal",
        color: COLORS[placedPieces.length % COLORS.length],
        colorIndex: placedPieces.length,
        copyNumber: piece.copyNumber
      };
      const usedRect = {
        x: placedPiece.x,
        y: placedPiece.y,
        width: placement.reserved.width,
        height: placement.reserved.height
      };

      placedPieces.push(placedPiece);
      freeRects = pruneFreeRects(freeRects.flatMap((freeRect) => splitFreeRect(freeRect, usedRect)));
    });

    const boardArea = board.width * board.height;
    const usedArea = placedPieces.reduce((total, piece) => total + piece.width * piece.height, 0);
    const wasteArea = Math.max(boardArea - usedArea, 0);
    const usagePercent = boardArea > 0 ? (usedArea / boardArea) * 100 : 0;
    const wastePercent = Math.max(0, 100 - usagePercent);
    const kerfLoss = estimateKerfLoss(placedPieces, board);

    return {
      placedPieces,
      unplacedPieces,
      placed: placedPieces,
      unplaced: unplacedPieces,
      boardArea,
      totalArea: boardArea,
      usedArea,
      areaUsed: usedArea,
      wasteArea,
      lossEstimate: wasteArea,
      kerfLoss,
      usagePercent,
      wastePercent,
      fitsAll: unplacedPieces.length === 0,
      totalPieces: sortedPieces.length,
      placedCount: placedPieces.length,
      unplacedCount: unplacedPieces.length,
      freeRects
    };
  }

  // Estimacion informativa: calcula el area reservada por separaciones de corte.
  function estimateKerfLoss(placedPieces, board) {
    return placedPieces.reduce((total, piece) => {
      const reserved = getReservedSize(piece, { x: piece.x, y: piece.y }, board, board.kerf);
      const reservedArea = reserved.width * reserved.height;
      const pieceArea = piece.width * piece.height;

      return total + Math.max(0, reservedArea - pieceArea);
    }, 0);
  }

  window.PCMCuttingAlgorithm = {
    calculateLayout,
    createLayout: calculateLayout
  };
})();
