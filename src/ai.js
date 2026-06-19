import { minimax, clearCache } from "./minimax";
import { getAllLegalMoves } from "./moveGenerator";

/**
 * Qiyinchilik darajasiga ko'ra eng yaxshi yurishni tanlash.
 * botIsBlack: true = bot qora, false = bot oq (player qora bo'lsa)
 */
export function pickBotMove(pieces, difficulty, botIsBlack = true) {
  clearCache();
  
  const isWhiteTurn = !botIsBlack;
  const isMaximizing = botIsBlack;
  const legalMoves = getAllLegalMoves(pieces, isWhiteTurn);

  if (legalMoves.length === 0) return null;

  if (difficulty === 0) {
    const result = minimax(pieces, 1, -Infinity, Infinity, isMaximizing, 0);
    return result.move || legalMoves[0];
  }

  if (difficulty === 1) {
    const result = minimax(pieces, 4, -Infinity, Infinity, isMaximizing, 1);
    return result.move || legalMoves[0];
  }

  if (difficulty === 2) {
    const result = minimax(pieces, 6, -Infinity, Infinity, isMaximizing, 2);
    return result.move || legalMoves[0];
  }

  if (difficulty === 3) {
    const result = minimax(pieces, 8, -Infinity, Infinity, isMaximizing, 4);
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