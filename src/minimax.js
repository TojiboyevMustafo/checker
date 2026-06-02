import { getAllLegalMoves, applyMove } from "./moveGenerator";
import { evaluateBoard, isGameOver } from "./evaluateBoard";

const transpositionTable = new Map();

/**
 * Yurishlarni saralash (Move Ordering)
 * Alpha-beta samaradorligini keskin oshiradi.
 */
function orderMoves(moves) {
  return moves.sort((a, b) => {
    // Yeyish bilan bog'liq yurishlar har doim birinchi
    if (a.capturedId && !b.capturedId) return -1;
    if (!a.capturedId && b.capturedId) return 1;
    return 0;
  });
}

export function minimax(pieces, depth, alpha, beta, isMaximizing, difficulty) {
  const boardKey = JSON.stringify(pieces) + isMaximizing + depth;
  if (transpositionTable.has(boardKey)) return transpositionTable.get(boardKey);

  const legalMoves = getAllLegalMoves(pieces, !isMaximizing);
  const terminalValue = isGameOver(pieces, !isMaximizing, legalMoves);
  
  if (depth === 0 || terminalValue !== null) {
    return { score: evaluateBoard(pieces) };
  }

  const sortedMoves = orderMoves(legalMoves);
  let bestMove = null;

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of sortedMoves) {
      const nextPieces = applyMove(pieces, move);
      const evalRes = minimax(nextPieces, depth - 1, alpha, beta, false, difficulty);
      
      if (evalRes.score > maxEval) {
        maxEval = evalRes.score;
        bestMove = move;
      }
      alpha = Math.max(alpha, evalRes.score);
      if (beta <= alpha) break; // Beta pruning
    }
    const result = { score: maxEval, move: bestMove };
    transpositionTable.set(boardKey, result);
    return result;
  } else {
    let minEval = Infinity;
    for (const move of sortedMoves) {
      const nextPieces = applyMove(pieces, move);
      const evalRes = minimax(nextPieces, depth - 1, alpha, beta, true, difficulty);
      
      if (evalRes.score < minEval) {
        minEval = evalRes.score;
        bestMove = move;
      }
      beta = Math.min(beta, evalRes.score);
      if (beta <= alpha) break; // Alpha pruning
    }
    const result = { score: minEval, move: bestMove };
    transpositionTable.set(boardKey, result);
    return result;
  }
}

/**
 * Keshni tozalash (yangi yurishdan oldin)
 */
export function clearCache() {
  if (transpositionTable.size > 10000) {
    transpositionTable.clear();
  }
}