/**
 * Shashka doskasidagi barcha qonuniy yurishlarni generatsiya qilish.
 */

export function getMovesForPiece(piece, pieces, isWhiteTurn, matrix) {
  const isKing = piece.type === "wk" || piece.type === "bk";
  const enemyTypes = isWhiteTurn ? ["b", "bk"] : ["w", "wk"];
  const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  
  const validMoves = [];
  const captures = [];

  for (const [dr, dc] of directions) {
    if (isKing) {
      let step = 1;
      let metEnemy = null;
      while (true) {
        const nr = piece.r + dr * step;
        const nc = piece.c + dc * step;
        if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;

        const target = matrix[nr][nc];
        if (!metEnemy) {
          if (target === null) validMoves.push({ r: nr, c: nc });
          else if (enemyTypes.includes(target.type)) metEnemy = target;
          else break;
        } else {
          if (target === null) captures.push({ to: { r: nr, c: nc }, target: metEnemy });
          else break;
        }
        step++;
      }
    } else {
      // Oddiy toshlar uchun oldinga yurish
      const forwardRow = isWhiteTurn ? -1 : 1;
      if (dr === forwardRow) {
        const nr = piece.r + dr;
        const nc = piece.c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && matrix[nr][nc] === null) {
          validMoves.push({ r: nr, c: nc });
        }
      }

      // Yeyish (Jump)
      const enemyRow = piece.r + dr;
      const enemyCol = piece.c + dc;
      const nextRow = piece.r + 2 * dr;
      const nextCol = piece.c + 2 * dc;

      if (
        nextRow >= 0 && nextRow < 8 && nextCol >= 0 && nextCol < 8 &&
        matrix[enemyRow]?.[enemyCol] &&
        enemyTypes.includes(matrix[enemyRow][enemyCol].type) &&
        matrix[nextRow][nextCol] === null
      ) {
        captures.push({ to: { r: nextRow, c: nextCol }, target: matrix[enemyRow][enemyCol] });
      }
    }
  }
  return { validMoves, captures };
}

/**
 * Barcha mumkin bo'lgan yeyish zanjirlarini topadi (Bumerang/Multi-jump)
 */
export function getCaptureSequences(piece, pieces, isWhiteTurn) {
  const results = [];
  const matrix = buildMatrix(pieces);
  const { captures } = getMovesForPiece(piece, pieces, isWhiteTurn, matrix);

  if (captures.length === 0) return [];

  for (const cap of captures) {
    const nextPieces = pieces
      .filter(p => p.id !== cap.target.id)
      .map(p => p.id === piece.id ? { ...p, r: cap.to.r, c: cap.to.c } : p);
    
    const nextPiece = nextPieces.find(p => p.id === piece.id);
    const subSequences = getCaptureSequences(nextPiece, nextPieces, isWhiteTurn);

    if (subSequences.length > 0) {
      for (const sub of subSequences) {
        results.push({
          to: sub.to,
          capturedIds: [cap.target.id, ...sub.capturedIds],
          path: [cap.to, ...sub.path]
        });
      }
    } else {
      results.push({
        to: cap.to,
        capturedIds: [cap.target.id],
        path: [cap.to]
      });
    }
  }
  return results;
}

export function getAllLegalMoves(pieces, isWhiteTurn) {
  const matrix = buildMatrix(pieces);
  const playerPieces = pieces.filter(p => isWhiteTurn ? p.type.startsWith('w') : p.type.startsWith('b'));
  let allCaptures = [];
  let allMoves = [];

  for (const p of playerPieces) {
    const sequences = getCaptureSequences(p, pieces, isWhiteTurn);
    sequences.forEach(seq => {
      allCaptures.push({ from: p, to: seq.to, capturedIds: seq.capturedIds, path: seq.path });
    });

    const { validMoves } = getMovesForPiece(p, pieces, isWhiteTurn, matrix);
    validMoves.forEach(m => allMoves.push({ from: p, to: m, capturedId: null }));
  }

  // Shashka qoidasiga ko'ra yeyish majburiy
  return allCaptures.length > 0 ? allCaptures : allMoves;
}

export function applyMove(pieces, move) {
  const capturedIds = move.capturedIds || (move.capturedId ? [move.capturedId] : []);
  return pieces
    .filter(p => !capturedIds.includes(p.id))
    .map(p => {
      if (p.id === move.from.id) {
        let nextType = p.type;
        if (p.type === "w" && move.to.r === 0) nextType = "wk";
        if (p.type === "b" && move.to.r === 7) nextType = "bk";
        return { ...p, r: move.to.r, c: move.to.c, type: nextType };
      }
      return p;
    });
}

export function buildMatrix(pieces) {
  const matrix = Array(8).fill(null).map(() => Array(8).fill(null));
  pieces.forEach((p) => { matrix[p.r][p.c] = p; });
  return matrix;
}