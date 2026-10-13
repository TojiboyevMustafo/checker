/**
 * Shashka doskasidagi barcha qonuniy yurishlarni generatsiya qilish.
 */

export function getMovesForPiece(piece, pieces, isWhiteTurn, matrix, boardSize = 8) {
  const size = boardSize || (matrix ? matrix.length : 8);
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
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;

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
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && matrix[nr][nc] === null) {
          validMoves.push({ r: nr, c: nc });
        }
      }

      // Yeyish (Jump - oldinga va orqaga)
      const enemyRow = piece.r + dr;
      const enemyCol = piece.c + dc;
      const nextRow = piece.r + 2 * dr;
      const nextCol = piece.c + 2 * dc;

      if (
        nextRow >= 0 && nextRow < size && nextCol >= 0 && nextCol < size &&
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
export function getCaptureSequences(piece, pieces, isWhiteTurn, boardSize = 8) {
  const results = [];
  const matrix = buildMatrix(pieces, boardSize);
  const { captures } = getMovesForPiece(piece, pieces, isWhiteTurn, matrix, boardSize);

  if (captures.length === 0) return [];

  for (const cap of captures) {
    const nextPieces = pieces
      .filter(p => p.id !== cap.target.id)
      .map(p => {
        if (p.id === piece.id) {
          let nextType = p.type;
          // Urish jarayonida damka liniyasiga yetsa, o'sha zahoti damka bo'ladi
          if (p.type === "w" && cap.to.r === 0) nextType = "wk";
          if (p.type === "b" && cap.to.r === boardSize - 1) nextType = "bk";
          return { ...p, r: cap.to.r, c: cap.to.c, type: nextType };
        }
        return p;
      });
    
    const nextPiece = nextPieces.find(p => p.id === piece.id);
    const subSequences = getCaptureSequences(nextPiece, nextPieces, isWhiteTurn, boardSize);

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

export function getAllLegalMoves(pieces, isWhiteTurn, boardSize = 8) {
  const matrix = buildMatrix(pieces, boardSize);
  const playerPieces = pieces.filter(p => isWhiteTurn ? p.type.startsWith('w') : p.type.startsWith('b'));
  let allCaptures = [];
  let allMoves = [];

  for (const p of playerPieces) {
    const sequences = getCaptureSequences(p, pieces, isWhiteTurn, boardSize);
    sequences.forEach(seq => {
      allCaptures.push({ from: p, to: seq.to, capturedIds: seq.capturedIds, path: seq.path });
    });

    const { validMoves } = getMovesForPiece(p, pieces, isWhiteTurn, matrix, boardSize);
    validMoves.forEach(m => allMoves.push({ from: p, to: m, capturedId: null }));
  }

  // Shashka qoidasiga ko'ra yeyish majburiy
  if (allCaptures.length > 0) {
    if (boardSize === 10) {
      // Xalqaro shashka (International draughts): ko'p tosh yeyish majburiy (majority capture)
      const maxCount = Math.max(...allCaptures.map(c => (c.capturedIds ? c.capturedIds.length : 1)));
      return allCaptures.filter(c => (c.capturedIds ? c.capturedIds.length : 1) === maxCount);
    }
    return allCaptures;
  }
  return allMoves;
}

export function applyMove(pieces, move, boardSize = 8) {
  const capturedIds = move.capturedIds || (move.capturedId ? [move.capturedId] : []);
  return pieces
    .filter(p => !capturedIds.includes(p.id))
    .map(p => {
      if (p.id === move.from.id) {
        let nextType = p.type;
        if (p.type === "w" && move.to.r === 0) nextType = "wk";
        if (p.type === "b" && move.to.r === boardSize - 1) nextType = "bk";
        return { ...p, r: move.to.r, c: move.to.c, type: nextType };
      }
      return p;
    });
}

export function buildMatrix(pieces, boardSize = 8) {
  const size = boardSize || 8;
  const matrix = Array(size).fill(null).map(() => Array(size).fill(null));
  pieces.forEach((p) => {
    if (p.r >= 0 && p.r < size && p.c >= 0 && p.c < size) {
      matrix[p.r][p.c] = p;
    }
  });
  return matrix;
}