/** Shashka bot — Minimax, quiescence, transposition table */

function buildMatrix(pieceList) {
  const matrix = Array(8)
    .fill(null)
    .map(() => Array(8).fill(null));
  pieceList.forEach((p) => {
    matrix[p.r][p.c] = p;
  });
  return matrix;
}

function getMovesForPiece(p, turnIsWhite, matrix) {
  if (!p) return { validMoves: [], captures: [] };
  const isKing = p.type === "wk" || p.type === "bk";
  const playerTypes = turnIsWhite ? ["w", "wk"] : ["b", "bk"];
  const enemyTypes = turnIsWhite ? ["b", "bk"] : ["w", "wk"];

  const validMoves = [];
  const captures = [];
  const directions = [
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  if (!playerTypes.includes(p.type)) return { validMoves, captures };

  for (const [dr, dc] of directions) {
    if (isKing) {
      let step = 1;
      let metEnemy = null;
      while (true) {
        const nr = p.r + dr * step;
        const nc = p.c + dc * step;
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
      const forwardRow = turnIsWhite ? -1 : 1;
      if (dr === forwardRow) {
        const nr = p.r + dr;
        const nc = p.c + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && matrix[nr][nc] === null) {
          validMoves.push({ r: nr, c: nc });
        }
      }

      const enemyRow = p.r + dr;
      const enemyCol = p.c + dc;
      const nextRow = p.r + 2 * dr;
      const nextCol = p.c + 2 * dc;

      if (
        nextRow >= 0 &&
        nextRow < 8 &&
        nextCol >= 0 &&
        nextCol < 8 &&
        matrix[enemyRow]?.[enemyCol] &&
        enemyTypes.includes(matrix[enemyRow][enemyCol].type) &&
        matrix[nextRow][nextCol] === null
      ) {
        captures.push({
          to: { r: nextRow, c: nextCol },
          target: matrix[enemyRow][enemyCol],
        });
      }
    }
  }
  return { validMoves, captures };
}

function getAllCaptures(pieces, turnIsWhite) {
  const matrix = buildMatrix(pieces);
  const allCaptures = [];
  pieces.forEach((p) => {
    const isPlayer = turnIsWhite ? p.type.startsWith("w") : p.type.startsWith("b");
    if (!isPlayer) return;
    const { captures } = getMovesForPiece(p, turnIsWhite, matrix);
    captures.forEach((cap) => allCaptures.push({ fromPiece: p, ...cap }));
  });
  return allCaptures;
}

export function getAllLegalMoves(pieces, turnIsWhite) {
  const captures = getAllCaptures(pieces, turnIsWhite);
  if (captures.length > 0) {
    return captures.map((cap) => ({
      fromPiece: cap.fromPiece,
      to: cap.to,
      capturedId: cap.target.id,
    }));
  }

  const matrix = buildMatrix(pieces);
  const moves = [];
  pieces.forEach((p) => {
    const isPlayer = turnIsWhite ? p.type.startsWith("w") : p.type.startsWith("b");
    if (!isPlayer) return;
    const { validMoves } = getMovesForPiece(p, turnIsWhite, matrix);
    validMoves.forEach((to) => {
      moves.push({ fromPiece: p, to, capturedId: null });
    });
  });
  return moves;
}

export function applyMoveToPieces(pieces, move) {
  const { fromPiece, to, capturedId } = move;
  return pieces
    .filter((p) => p.id !== capturedId)
    .map((p) => {
      if (p.id !== fromPiece.id) return p;
      let nextType = p.type;
      if (p.type === "w" && to.r === 0) nextType = "wk";
      if (p.type === "b" && to.r === 7) nextType = "bk";
      return { ...p, r: to.r, c: to.c, type: nextType };
    });
}

function boardKey(pieces, depth, blackToMove) {
  const pos = pieces
    .map((p) => `${p.id}:${p.r}${p.c}${p.type}`)
    .sort()
    .join(";");
  return `${depth}|${blackToMove ? "B" : "W"}|${pos}`;
}

const tt = new Map();
const TT_MAX = 80000;

function ttStore(key, depth, score, flag, move) {
  if (tt.size > TT_MAX) tt.clear();
  tt.set(key, { depth, score, flag, move });
}

function ttGet(key, depth) {
  const e = tt.get(key);
  if (e && e.depth >= depth) return e;
  return null;
}

function isSquareAttackable(pieces, row, col, byWhite) {
  const matrix = buildMatrix(pieces);
  const attackers = pieces.filter((p) =>
    byWhite ? p.type.startsWith("w") : p.type.startsWith("b")
  );
  for (const p of attackers) {
    const { captures } = getMovesForPiece(p, byWhite, matrix);
    if (captures.some((c) => c.to.r === row && c.to.c === col)) return true;
  }
  return false;
}

function countAttackersOn(pieces, row, col, byWhite) {
  const matrix = buildMatrix(pieces);
  let n = 0;
  pieces.forEach((p) => {
    if (byWhite ? !p.type.startsWith("w") : !p.type.startsWith("b")) return;
    const { captures } = getMovesForPiece(p, byWhite, matrix);
    if (captures.some((c) => c.to.r === row && c.to.c === col)) n++;
  });
  return n;
}

function evaluatePosition(pieces) {
  const whiteAlive = pieces.some((p) => p.type.startsWith("w"));
  const blackAlive = pieces.some((p) => p.type.startsWith("b"));
  if (!whiteAlive) return 500000;
  if (!blackAlive) return -500000;

  let score = 0;

  for (const p of pieces) {
    const isWhite = p.type.startsWith("w");
    const isKing = p.type.includes("k");
    const sign = isWhite ? -1 : 1;

    let value = isKing ? 380 : 110;

    if (!isKing) {
      value += isWhite ? (7 - p.r) * 6 : p.r * 6;
      if ((isWhite && p.r <= 2) || (!isWhite && p.r >= 5)) value += 25;
    } else {
      value += 25;
      value += (3.5 - Math.abs(p.c - 3.5)) * 3;
    }

    const attackers = countAttackersOn(pieces, p.r, p.c, !isWhite);
    if (attackers > 0) value -= attackers * (isKing ? 55 : 90);

    if (!isKing && !isSquareAttackable(pieces, p.r, p.c, !isWhite)) {
      value += 12;
    }

    score += sign * value;
  }

  const blackCaps = getAllCaptures(pieces, false);
  const whiteCaps = getAllCaptures(pieces, true);
  score += blackCaps.length * 65;
  score -= whiteCaps.length * 80;

  for (const cap of blackCaps) {
    const t = cap.target;
    score += t.type.includes("k") ? 40 : 20;
  }
  for (const cap of whiteCaps) {
    const t = cap.target;
    score -= t.type.includes("k") ? 50 : 25;
  }

  const blackMoves = getAllLegalMoves(pieces, false).length;
  const whiteMoves = getAllLegalMoves(pieces, true).length;
  score += (blackMoves - whiteMoves) * 12;

  if (whiteMoves === 0 && blackAlive) score += 15000;
  if (blackMoves === 0 && whiteAlive) score -= 15000;

  const whiteCount = pieces.filter((p) => p.type.startsWith("w")).length;
  const blackCount = pieces.filter((p) => p.type.startsWith("b")).length;
  if (blackCount > whiteCount) score += (blackCount - whiteCount) * 15;

  return score;
}

function moveQuickScore(pieces, move) {
  let s = 0;
  if (move.capturedId) {
    const victim = pieces.find((p) => p.id === move.capturedId);
    if (victim) {
      s += victim.type.includes("k") ? 800 : 350;
      s += (victim.type.startsWith("w") ? victim.r : 7 - victim.r) * 5;
    }
  }
  if (move.to.r === 7 && move.fromPiece.type === "b") s += 300;
  const next = applyMoveToPieces(pieces, move);
  if (isSquareAttackable(next, move.to.r, move.to.c, true)) s -= 200;
  else s += 30;
  const followUp = getAllCaptures(next, false);
  s += followUp.length * 100;
  return s;
}

function orderMoves(pieces, moves) {
  return [...moves].sort((a, b) => moveQuickScore(pieces, b) - moveQuickScore(pieces, a));
}

function getCaptureMoves(pieces, turnIsWhite) {
  return getAllCaptures(pieces, turnIsWhite).map((cap) => ({
    fromPiece: cap.fromPiece,
    to: cap.to,
    capturedId: cap.target.id,
  }));
}

function quiescence(pieces, alpha, beta, blackToMove) {
  const evalScore = evaluatePosition(pieces);
  if (blackToMove) {
    if (evalScore >= beta) return beta;
    if (evalScore > alpha) alpha = evalScore;
  } else {
    if (evalScore <= alpha) return alpha;
    if (evalScore < beta) beta = evalScore;
  }

  const turnIsWhite = !blackToMove;
  const captures = orderMoves(pieces, getCaptureMoves(pieces, turnIsWhite));
  if (captures.length === 0) return evalScore;

  if (blackToMove) {
    for (const move of captures) {
      const next = applyMoveToPieces(pieces, move);
      const score = quiescence(next, alpha, beta, false);
      if (score > alpha) alpha = score;
      if (alpha >= beta) break;
    }
    return alpha;
  }

  for (const move of captures) {
    const next = applyMoveToPieces(pieces, move);
    const score = quiescence(next, alpha, beta, true);
    if (score < beta) beta = score;
    if (alpha >= beta) break;
  }
  return beta;
}

function search(pieces, depth, alpha, beta, blackToMove) {
  const key = boardKey(pieces, depth, blackToMove);
  const cached = ttGet(key, depth);
  if (cached) {
    if (cached.flag === "exact") return cached.score;
    if (cached.flag === "lower" && cached.score > alpha) alpha = cached.score;
    else if (cached.flag === "upper" && cached.score < beta) beta = cached.score;
    if (alpha >= beta) return cached.score;
  }

  const turnIsWhite = !blackToMove;
  const moves = getAllLegalMoves(pieces, turnIsWhite);

  if (moves.length === 0) {
    return blackToMove ? -400000 : 400000;
  }

  if (depth <= 0) {
    return quiescence(pieces, alpha, beta, blackToMove);
  }

  const ordered = orderMoves(pieces, moves);
  let bestMove = ordered[0];
  let origAlpha = alpha;

  if (blackToMove) {
    let maxEval = -Infinity;
    for (const move of ordered) {
      const next = applyMoveToPieces(pieces, move);
      const ev = search(next, depth - 1, alpha, beta, false);
      if (ev > maxEval) {
        maxEval = ev;
        bestMove = move;
      }
      if (ev > alpha) alpha = ev;
      if (beta <= alpha) break;
    }
    let flag = "exact";
    if (maxEval <= origAlpha) flag = "upper";
    else if (maxEval >= beta) flag = "lower";
    ttStore(key, depth, maxEval, flag, bestMove);
    return maxEval;
  }

  let minEval = Infinity;
  for (const move of ordered) {
    const next = applyMoveToPieces(pieces, move);
    const ev = search(next, depth - 1, alpha, beta, true);
    if (ev < minEval) {
      minEval = ev;
      bestMove = move;
    }
    if (ev < beta) beta = ev;
    if (beta <= alpha) break;
  }
  let flag = "exact";
  if (minEval >= beta) flag = "lower";
  else if (minEval <= alpha) flag = "upper";
  ttStore(key, depth, minEval, flag, bestMove);
  return minEval;
}

function pickBest(pieces, maxDepth) {
  const moves = getAllLegalMoves(pieces, false);
  if (moves.length === 0) return null;

  tt.clear();

  const pieceCount = pieces.length;
  let depth = maxDepth;
  if (pieceCount > 22) depth = maxDepth - 2;
  else if (pieceCount > 18) depth = maxDepth - 1;
  else if (pieceCount <= 10) depth = maxDepth + 1;
  depth = Math.max(4, depth);

  let bestMove = orderMoves(pieces, moves)[0];
  let bestScore = -Infinity;

  for (const move of orderMoves(pieces, moves)) {
    const next = applyMoveToPieces(pieces, move);
    const score = search(next, depth - 1, -Infinity, Infinity, false);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}

/** Professional — chuqur qidiruv (8–9 qadam) */
export function pickProfessionalMove(pieces) {
  return pickBest(pieces, 8);
}

/** Qiyin — 5–6 qadam */
export function pickHardMove(pieces) {
  return pickBest(pieces, 5);
}

/** O'rta — 4 qadam */
export function pickMediumMove(pieces) {
  return pickBest(pieces, 4);
}
