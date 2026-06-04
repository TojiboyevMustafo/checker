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

  // Daraja 0: Boshlanuvchi - Tasodifiy
  if (difficulty === 0) {
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  // Daraja 1: Oson - Depth 2
  if (difficulty === 1) {
    const result = minimax(pieces, 2, -Infinity, Infinity, true, 1);
    return result.move || legalMoves[0];
  }

  // Daraja 2: O'rta - Depth 4
  if (difficulty === 2) {
    const result = minimax(pieces, 4, -Infinity, Infinity, true, 2);
    return result.move || legalMoves[0];
  }

  // Daraja 3: Qiyin - Depth 6
  if (difficulty === 3) {
    const result = minimax(pieces, 6, -Infinity, Infinity, true, 3);
    return result.move || legalMoves[0];
  }

  // Daraja 4: Professional - Depth 8 (Brauzer uchun optimal maksimal chuqurlik)
  // Izoh: Depth 10+ qilish uchun Web Worker ishlatish tavsiya etiladi.
  if (difficulty === 4) {
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