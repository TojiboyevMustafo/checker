  import React, { useState, useEffect, useMemo } from "react";
  import { pickBotMove, formatBotMove } from "./ai";
  import { buildMatrix, getCaptureSequences } from "./moveGenerator";
  import "./App.css";

  const initialPieces = [
    { id: "b1", type: "b", r: 0, c: 1 }, { id: "b2", type: "b", r: 0, c: 3 },
    { id: "b3", type: "b", r: 0, c: 5 }, { id: "b4", type: "b", r: 0, c: 7 },
    { id: "b5", type: "b", r: 1, c: 0 }, { id: "b6", type: "b", r: 1, c: 2 },
    { id: "b7", type: "b", r: 1, c: 4 }, { id: "b8", type: "b", r: 1, c: 6 },
    { id: "b9", type: "b", r: 2, c: 1 }, { id: "b10", type: "b", r: 2, c: 3 },
    { id: "b11", type: "b", r: 2, c: 5 }, { id: "b12", type: "b", r: 2, c: 7 },

    { id: "w1", type: "w", r: 5, c: 0 }, { id: "w2", type: "w", r: 5, c: 2 },
    { id: "w3", type: "w", r: 5, c: 4 }, { id: "w4", type: "w", r: 5, c: 6 },
    { id: "w5", type: "w", r: 6, c: 1 }, { id: "w6", type: "w", r: 6, c: 3 },
    { id: "w7", type: "w", r: 6, c: 5 }, { id: "w8", type: "w", r: 6, c: 7 },
    { id: "w9", type: "w", r: 7, c: 0 }, { id: "w10", type: "w", r: 7, c: 2 },
    { id: "w11", type: "w", r: 7, c: 4 }, { id: "w12", type: "w", r: 7, c: 6 },
  ];

  const DIFFICULTIES = [
    { label: "BOSHLANUVCHI", avatar: "📚", desc: "Qayerga yurishni o‘rgatadi" },
    { label: "OSON", avatar: "🙂", desc: "Oddiy bot" },
    { label: "O‘RTA", avatar: "🤖", desc: "4 qadam oldindan ko‘radi" },
    { label: "QIYIN", avatar: "😈", desc: "5–6 qadam, kuchli himoya" },
    { label: "PROFESSIONAL", avatar: "🏆", desc: "8+ qadam — eng qiyin" },
  ];

  const TUTORIAL_TIPS = [
    "1-qadam: Oq toshingizni bosing (pastdagi oq doiralar).",
    "2-qadam: Yashil nuqtali qora katakka bosing — shu yerga yurasiz.",
    "Eslatma: Faqat qora (to‘q) kataklarda yuriladi.",
    "Qizil supka = majburiy yeyish! Faqat shu toshni yuring.",
    "Agar qizil nuqta bo‘lsa — raqib toshini yeyishingiz mumkin!",
    "Maqsad: raqibning barcha toshlarini yeb, g‘alaba qozonish.",
  ];

  export default function Checkers() {
    const [gameMode, setGameMode] = useState(null);
    const [botDifficulty, setBotDifficulty] = useState(0);
    const [pieces, setPieces] = useState(initialPieces);
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [isBotThinking, setIsBotThinking] = useState(false);
    const [moveCount, setMoveCount] = useState(0);
    const [tutorialTipIndex, setTutorialTipIndex] = useState(0);

    const [globalTime, setGlobalTime] = useState(180);
    const [turnTime, setTurnTime] = useState(15);
    const [winner, setWinner] = useState(null);

    const isTutorialMode = botDifficulty === 0 && gameMode === "bot";
    const boardMatrix = useMemo(() => buildMatrix(pieces), [pieces]);

    const getMovesForPiece = (p, turnIsWhite, matrix = boardMatrix) => {
      if (!p) return { validMoves: [], captures: [] };
      const isKing = p.type === "wk" || p.type === "bk";
      const playerTypes = turnIsWhite ? ["w", "wk"] : ["b", "bk"];
      const enemyTypes = turnIsWhite ? ["b", "bk"] : ["w", "wk"];

      const validMoves = [];
      const captures = [];
      const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

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
            nextRow >= 0 && nextRow < 8 && nextCol >= 0 && nextCol < 8 &&
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
    };

    const getAllAvailableCaptures = (turnIsWhite, matrix = boardMatrix) => {
      const allCaptures = [];
      pieces.forEach((p) => {
        const { captures } = getMovesForPiece(p, turnIsWhite, matrix);
        captures.forEach((cap) => allCaptures.push({ fromPiece: p, ...cap }));
      });
      return allCaptures;
    };

    const mandatoryCaptures = useMemo(
      () => getAllAvailableCaptures(isWhiteTurn),
      [pieces, isWhiteTurn, boardMatrix]
    );

    const mustCapturePieceIds = useMemo(
      () => new Set(mandatoryCaptures.map((c) => c.fromPiece.id)),
      [mandatoryCaptures]
    );

    const selectedHints = useMemo(() => {
      if (!selectedId || winner) return { validMoves: [], captures: [] };
      const piece = pieces.find((p) => p.id === selectedId);
      const moves = getMovesForPiece(piece, isWhiteTurn);
      if (mandatoryCaptures.length > 0) {
        return { validMoves: [], captures: moves.captures };
      }
      return moves;
    }, [selectedId, isWhiteTurn, pieces, winner, mandatoryCaptures]);

    const showMoveHints =
      isTutorialMode || gameMode === "friends" || (gameMode === "bot" && botDifficulty <= 1);

    useEffect(() => {
      if (!gameMode || winner) return;
      const timer = setInterval(() => {
        setTurnTime((prev) => {
          if (prev <= 1) {
            setIsWhiteTurn((t) => !t);
            setSelectedId(null);
            return 15;
          }
          return prev - 1;
        });
        setGlobalTime((prev) => {
          if (prev <= 1) {
            setWinner("Durrang (Umumiy vaqt tugadi!)");
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }, [isWhiteTurn, winner, gameMode]);

    useEffect(() => {
      if (!gameMode) return;
      setTurnTime(15);
      checkGameOver();
    }, [isWhiteTurn, gameMode, pieces]);

    useEffect(() => {
      if (gameMode === "bot" && !isWhiteTurn && !winner) {
        setIsBotThinking(true);
        const delay = botDifficulty === 0 ? 1400 : botDifficulty === 4 ? 1100 : botDifficulty >= 2 ? 800 : 1000;
        const botDelay = setTimeout(() => {
          makeBotMove();
          setIsBotThinking(false);
        }, delay);
        return () => clearTimeout(botDelay);
      }
    }, [isWhiteTurn, winner, gameMode]);

    useEffect(() => {
      if (isTutorialMode && isWhiteTurn && moveCount < TUTORIAL_TIPS.length) {
        setTutorialTipIndex(Math.min(moveCount, TUTORIAL_TIPS.length - 1));
      }
    }, [moveCount, isWhiteTurn, isTutorialMode]);

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    const checkGameOver = () => {
      const whitePieces = pieces.filter((p) => p.type.startsWith("w"));
      const blackPieces = pieces.filter((p) => p.type.startsWith("b"));

      if (whitePieces.length === 0) {
        setWinner(
          gameMode === "bot"
            ? "Bot g'alaba qozondi! Hamma toshingiz tugadi."
            : "Qora toshlar yutdi!"
        );
        return;
      }
      if (blackPieces.length === 0) {
        setWinner(
          gameMode === "bot"
            ? "Siz yutdingiz! Botning hamma toshini urib bitirdingiz. 🎉"
            : "Oq toshlar yutdi!"
        );
        return;
      }

      let hasWhiteMoves = false;
      let hasBlackMoves = false;

      pieces.forEach((p) => {
        const { validMoves, captures } = getMovesForPiece(p, p.type.startsWith("w"));
        if (p.type.startsWith("w") && (validMoves.length > 0 || captures.length > 0)) hasWhiteMoves = true;
        if (p.type.startsWith("b") && (validMoves.length > 0 || captures.length > 0)) hasBlackMoves = true;
      });

      if (isWhiteTurn && !hasWhiteMoves) setWinner("Qoralar yutdi! Yo'llar yopildi.");
      if (!isWhiteTurn && !hasBlackMoves) setWinner("Oqlar yutdi! Yo'llar yopildi. 🎉");
    };

    const applyMove = (pieceId, row, col, capturedId) => {
      let nextIsWhiteTurn = !isWhiteTurn;
      let newPieces = pieces
        .filter((p) => p.id !== capturedId)
        .map((p) => {
          if (p.id === pieceId) {
            let nextType = p.type;
            if (p.type === "w" && row === 0) nextType = "wk";
            if (p.type === "b" && row === 7) nextType = "bk";
            return { ...p, r: row, c: col, type: nextType };
          }
          return p;
        });

      // Zanjirli yeyishni tekshirish (Multi-jump / Boomerang logic)
      if (capturedId) {
        const movedPiece = newPieces.find(p => p.id === pieceId);
        // getMovesForPiece bu yerda callback orqali yangi matrix bilan chaqiriladi
        const { captures } = getMovesForPiece(movedPiece, isWhiteTurn, buildMatrix(newPieces));
        if (captures.length > 0) {
          nextIsWhiteTurn = isWhiteTurn; // Navbat almashmaydi
          setSelectedId(pieceId); // Toshni ghosted effect uchun aktiv qoldiramiz
        } else {
          setSelectedId(null);
        }
      } else {
        setSelectedId(null);
      }

      setPieces(newPieces);
      setIsWhiteTurn(nextIsWhiteTurn);
      if (isWhiteTurn) setMoveCount((m) => m + 1);
    };

  const handleCellClick = (row, col) => {
    if (winner) return;
    if (gameMode === "bot" && !isWhiteTurn) return;

    const isPlayableCell = (row + col) % 2 === 1;
    if (!isPlayableCell) return;

    const currentPiece = boardMatrix[row][col];

    if (currentPiece) {
      const isCorrectTurn = isWhiteTurn
        ? currentPiece.type.startsWith("w")
        : currentPiece.type.startsWith("b");
      if (isCorrectTurn) {
        if (mandatoryCaptures.length > 0) {
          const { captures } = getMovesForPiece(currentPiece, isWhiteTurn);
          if (captures.length === 0) return;
        }
        setSelectedId(currentPiece.id);
        return;
      }
    }

    if (selectedId && !currentPiece) {
      const selectedPiece = pieces.find((p) => p.id === selectedId);
      const { validMoves, captures } = getMovesForPiece(selectedPiece, isWhiteTurn);
      const hitCapture = captures.find((c) => c.to.r === row && c.to.c === col);

      if (hitCapture) {
        applyMove(selectedId, row, col, hitCapture.target.id);
        return;
      }

      if (mandatoryCaptures.length > 0) return;

      const isTryingNormal = validMoves.some((m) => m.r === row && m.c === col);
      if (isTryingNormal) {
        applyMove(selectedId, row, col, null);
      }
    }
  };

  const applyBotMove = (fromPiece, to, capturedIds) => {
    const idsToRemove = Array.isArray(capturedIds) ? capturedIds : [capturedIds].filter(Boolean);
    setPieces((prev) =>
      prev
        .filter((p) => !idsToRemove.includes(p.id))
        .map((p) => {
          if (p.id === fromPiece.id) {
            let nextType = p.type;
            if (p.type === "b" && to.r === 7) nextType = "bk";
            return { ...p, r: to.r, c: to.c, type: nextType };
          }
          return p;
        })
    );
    setIsWhiteTurn(true);
  };

  const makeBotMove = () => {
    const rawMove = pickBotMove(pieces, botDifficulty);
    const formatted = formatBotMove(rawMove);
    
    if (formatted) {
      applyBotMove(formatted.fromPiece, formatted.to, formatted.capturedId);
    }
  };

  const restartGame = () => {
    setPieces(initialPieces);
    setIsWhiteTurn(true);
    setSelectedId(null);
    setGlobalTime(180);
    setTurnTime(15);
    setWinner(null);
    setGameMode(null);
    setIsBotThinking(false);
    setMoveCount(0);
    setTutorialTipIndex(0);
  };

  const startGame = (mode) => {
    setPieces(initialPieces);
    setIsWhiteTurn(true);
    setSelectedId(null);
    setGlobalTime(180);
    setTurnTime(15);
    setWinner(null);
    setMoveCount(0);
    setTutorialTipIndex(0);
    setGameMode(mode);
  };

  const isHintCell = (r, c) => {
    if (!showMoveHints || !selectedId || winner) return null;
    if (gameMode === "bot" && !isWhiteTurn) return null;
    if (selectedHints.captures.some((cap) => cap.to.r === r && cap.to.c === c)) return "capture";
    if (selectedHints.validMoves.some((m) => m.r === r && m.c === c)) return "move";
    return null;
  };

  const pieceHasSupka = (piece) => {
    if (!piece || winner) return false;
    const isWhitePiece = piece.type.startsWith("w");
    if (isWhiteTurn && isWhitePiece) return mustCapturePieceIds.has(piece.id);
    if (!isWhiteTurn && !isWhitePiece) return mustCapturePieceIds.has(piece.id);
    return false;
  };

  if (!gameMode) {
    const diff = DIFFICULTIES[botDifficulty];
    return (
      <div className="casual-menu-bg">
        <div className="casual-top-bar">
          <h1 className="casual-main-title">SHASHKA</h1>
        </div>

        <p className="casual-instruction">
          Raqibning barcha shashkalarini yeng va g&apos;olib bo&apos;ling!
        </p>

        <div className="casual-card">
          <div className="casual-avatar-circle">
            <span className="casual-avatar-emoji">{diff.avatar}</span>
          </div>

          <div className="casual-controls-row" style={{ justifyContent: "center" }}>
            <h2 className={`difficulty-text diff-${botDifficulty}`}>{diff.label}</h2>
          </div>
          <p className="difficulty-desc">{diff.desc}</p>

          <div className="slider-wrapper">
            <input
              type="range"
              min="0"
              max="4"
              value={botDifficulty}
              onChange={(e) => setBotDifficulty(Number(e.target.value))}
              className="casual-slider"
            />
            <div className="slider-ticks slider-ticks-5">
              {DIFFICULTIES.map((d, i) => (
                <span key={d.label} onClick={() => setBotDifficulty(i)} title={d.desc}>
                  {i === 0 ? "Boshl." : d.label.split(" ")[0].slice(0, 4)}
                </span>
              ))}
            </div>
          </div>

          <button className="casual-main-btn bot-play-btn" onClick={() => startGame("bot")}>
            <span className="btn-large-icon">🤖</span>
            <div className="btn-large-lbl">
              <span>YURISH REJIM</span>
              <h3>BOTGA</h3>
            </div>
          </button>

          <button className="casual-main-btn friend-play-btn" onClick={() => startGame("friends")}>
            <span className="btn-large-icon">👥</span>
            <div className="btn-large-lbl">
              <span>YURISH REJIM</span>
              <h3>DO&apos;STGA</h3>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="header-box">
        <button type="button" className="back-btn" onClick={restartGame}>
          ⬅ Menyuga
        </button>
        <h2 className="header-title">
          {gameMode === "bot"
            ? `🤖 ${DIFFICULTIES[botDifficulty].label}`
            : "👥 Do‘stlar"}
        </h2>
      </div>

      <div className={`tutorial-slot ${isTutorialMode ? "has-tutorial" : ""}`} aria-hidden={!isTutorialMode || winner}>
        <div
          className={`tutorial-banner ${isTutorialMode && isWhiteTurn && !winner ? "is-visible" : "is-hidden"}`}
        >
          <span className="tutorial-icon">💡</span>
          <p>{TUTORIAL_TIPS[tutorialTipIndex]}</p>
        </div>
      </div>

      {winner && (
        <div className="winner-overlay">
          <div className="winner-modal">
            <h2>🎉 O‘yin Tugadi!</h2>
            <p>{winner}</p>
            <button type="button" className="restart-btn" onClick={restartGame}>
              Qayta o&apos;ynash
            </button>
          </div>
        </div>
      )}

      <div className="timers-box">
        <div className="global-timer">Umumiy: {formatTime(globalTime)}</div>
        <div className="turn-timer">Yurish: {turnTime}s</div>
      </div>

      <div className="turn-indicator">
        <span className="turn-label">Navbat:</span>
        <span className="turn-value user-label" style={{ display: isWhiteTurn ? "inline" : "none" }}>
          Oq toshlar (siz)
        </span>
        <span
          className="turn-value bot-thinking-label"
          style={{ display: !isWhiteTurn && isBotThinking ? "inline" : "none" }}
        >
          Bot o‘ylamoqda...
        </span>
        <span
          className="turn-value bot-label"
          style={{ display: !isWhiteTurn && !isBotThinking ? "inline" : "none" }}
        >
          Qora toshlar
        </span>
      </div>

      <div className="board-anchor">
      <div className="board-container">
        <div className="board-grid">
          {Array(8)
            .fill(null)
            .map((_, rIdx) =>
              Array(8)
                .fill(null)
                .map((_, cIdx) => {
                  const isDarkCell = (rIdx + cIdx) % 2 === 1;
                  const hintType = isDarkCell ? isHintCell(rIdx, cIdx) : null;
                  const piece = boardMatrix[rIdx][cIdx];
                  const isSelected = piece?.id === selectedId;
                  const isKing = piece && (piece.type === "wk" || piece.type === "bk");

                  return (
                    <div
                      key={`${rIdx}-${cIdx}`}
                      className={`cell ${isDarkCell ? "dark-cell" : "light-cell"}`}
                      onClick={() => handleCellClick(rIdx, cIdx)}
                      role="button"
                      tabIndex={isDarkCell ? 0 : -1}
                      aria-label={isDarkCell ? `Katak ${rIdx + 1}, ${cIdx + 1}` : undefined}
                    >
                      {hintType && !piece && (
                        <span className={`hint-dot ${hintType === "capture" ? "hint-capture" : "hint-move"}`} />
                      )}
                      {piece && (
                        <div
                          className={`piece ${piece.type.startsWith("w") ? "white-piece" : "black-piece"} ${isSelected ? "selected" : ""} ${pieceHasSupka(piece) ? "has-supka" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCellClick(rIdx, cIdx);
                          }}
                          role="button"
                          tabIndex={0}
                        >
                          {isKing && <span className="crown-icon">👑</span>}
                          {pieceHasSupka(piece) && <span className="supka-marker" title="Majburiy yeyish" />}
                        </div>
                      )}
                    </div>
                  );
                })
            )}
        </div>
      </div>
      </div>

      <div className={`tutorial-footer-slot ${isTutorialMode ? "has-tutorial" : ""}`}>
        <p
          className={`tutorial-footer ${isTutorialMode && !selectedId && isWhiteTurn && !winner ? "is-visible" : "is-hidden"}`}
        >
          Oq toshlardan birini bosing — yurishni boshlang
        </p>
      </div>
    </div>
  );
}
