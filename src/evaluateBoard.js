/**
 * Doska holatini baholash. 
 * Musbat qiymat Bot (Qora) uchun foydali, Manfiy Player (Oq) uchun.
 */

export function evaluateBoard(pieces, boardSize = 8) {
  let score = 0;
  const maxRow = boardSize - 1;

  for (const p of pieces) {
    const isWhite = p.type.startsWith('w');
    const isKing = p.type.endsWith('k');
    
    let val = 0;

    // 1. Toshlar qiymati (Professional balans)
    val += isKing ? 320 : 100;

    // 2. Pozitsion afzallik (Damkaga yaqinlashish)
    if (!isKing) {
      if (isWhite) {
        val += (maxRow - p.r) * 8; // Oqlar yuqoriga (r=0 ga) intiladi
      } else {
        val += p.r * 8; // Qoralar pastga (r=maxRow ga) intiladi
      }
    }

    // 3. Markazni nazorat qilish (Center control)
    const midMin = Math.floor(boardSize * 0.25);
    const midMax = Math.floor(boardSize * 0.75);
    if (p.c >= midMin && p.c <= midMax && p.r >= midMin && p.r <= midMax) {
      val += 10;
    }

    // 4. Orqa qator himoyasi (Back row defense)
    if (isWhite && p.r === maxRow) val += 25;
    if (!isWhite && p.r === 0) val += 25;

    // 5. Chet qatordagi toshlar (Xavfsizroq)
    if (p.c === 0 || p.c === maxRow) val += 10;

    score += isWhite ? -val : val;
  }

  return score;
}

/**
 * O'yin tugaganini tekshirish
 */
export function isGameOver(pieces, isWhiteTurn, moves) {
  if (pieces.filter(p => p.type.startsWith('w')).length === 0) return 10000;
  if (pieces.filter(p => p.type.startsWith('b')).length === 0) return -10000;
  if (moves.length === 0) return isWhiteTurn ? 10000 : -10000;
  return null;
}