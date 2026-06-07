import { minimax, clearCache } from "./minimax";
import { getAllLegalMoves } from "./moveGenerator";

/**
 * Qiyinchilik darajasiga ko'ra eng yaxshi yurishni tanlash.
 */
export function pickBotMove(pieces, difficulty) {
  clearCache();
  
  // Bot doim qora (isMaximizing = true)
  const isWhiteTurn = false;
  const legalMoves = getAllLegalMoves(pieces, isWhiteTurn);

  if (legalMoves.length === 0) return null;

  // Daraja 0: Oson - Depth 1 (Odamlar oson yutishi uchun)
  if (difficulty === 0) {
    const result = minimax(pieces, 1, -Infinity, Infinity, true, 0);
    return result.move || legalMoves[0];
  }

  // Daraja 1: O'rta - Depth 4
  if (difficulty === 1) {
    const result = minimax(pieces, 4, -Infinity, Infinity, true, 1);
    return result.move || legalMoves[0];
  }

  // Daraja 2: Qiyin - Depth 6
  if (difficulty === 2) {
    const result = minimax(pieces, 6, -Infinity, Infinity, true, 2);
    return result.move || legalMoves[0];
  }

  // Daraja 3: Professional - Depth 8
  if (difficulty === 3) {
    const result = minimax(pieces, 8, -Infinity, Infinity, true, 4);
    return result.move || legalMoves[0];
  }

  return legalMoves[0];
}

export function formatBotMove(aiMove) {
  if (!aiMove) return null;
  return { 
    fromPiece: aiMove.from, 
    to: aiMove.to, 
    capturedIds: aiMove.capturedIds || (aiMove.capturedId ? [aiMove.capturedId] : []),
    path: aiMove.path 
  };
}