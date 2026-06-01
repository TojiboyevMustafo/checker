import React, { useState, useEffect } from "react";
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

export default function Checkers() {
  const [gameMode, setGameMode] = useState(null); 
  const [botDifficulty, setBotDifficulty] = useState(1); 
  const [pieces, setPieces] = useState(initialPieces);
  const [isWhiteTurn, setIsWhiteTurn] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [isBotThinking, setIsBotThinking] = useState(false);

  const [globalTime, setGlobalTime] = useState(180);
  const [turnTime, setTurnTime] = useState(15);
  const [winner, setWinner] = useState(null);

  const getBoardMatrix = () => {
    const matrix = Array(8).fill(null).map(() => Array(8).fill(null));
    pieces.forEach(p => { matrix[p.r][p.c] = p; });
    return matrix;
  };

  const boardMatrix = getBoardMatrix();

  const difficulties = [
    { label: "OSON", avatar: "🙂" },
    { label: "O‘RTA", avatar: "🤖" },
    { label: "QIYIN", avatar: "😈" }
  ];

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
      const botDelay = setTimeout(() => {
        makeBotMove();
        setIsBotThinking(false);
      }, 1000);
      return () => clearTimeout(botDelay);
    }
  }, [isWhiteTurn, winner, gameMode]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const getMovesForPiece = (p, turnIsWhite) => {
    if (!p) return { validMoves: [], captures: [] };
    const isKing = p.type === "wk" || p.type === "bk";
    const playerTypes = turnIsWhite ? ["w", "wk"] : ["b", "bk"];
    const enemyTypes = turnIsWhite ? ["b", "bk"] : ["w", "wk"];

    const validMoves = [];
    const captures = [];
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];

    if (!playerTypes.includes(p.type)) return { validMoves, captures };

    const currentMatrix = getBoardMatrix();

    for (let [dr, dc] of directions) {
      if (isKing) {
        let step = 1;
        let metEnemy = null;
        while (true) {
          const nr = p.r + dr * step;
          const nc = p.c + dc * step;
          if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) break;

          const target = currentMatrix[nr][nc];
          if (!metEnemy) {
            if (target === null) {
              validMoves.push({ r: nr, c: nc });
            } else if (enemyTypes.includes(target.type)) {
              metEnemy = target;
            } else {
              break;
            }
          } else {
            if (target === null) {
              captures.push({ to: { r: nr, c: nc }, target: metEnemy });
            } else {
              break;
            }
          }
          step++;
        }
      } else {
        const forwardRow = turnIsWhite ? -1 : 1;
        if (dr === forwardRow) {
          const nr = p.r + dr;
          const nc = p.c + dc;
          if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8 && currentMatrix[nr][nc] === null) {
            validMoves.push({ r: nr, c: nc });
          }
        }

        const enemyRow = p.r + dr;
        const enemyCol = p.c + dc;
        const nextRow = p.r + 2 * dr;
        const nextCol = p.c + 2 * dc;

        if (
          nextRow >= 0 && nextRow < 8 && nextCol >= 0 && nextCol < 8 &&
          currentMatrix[enemyRow]?.[enemyCol] &&
          enemyTypes.includes(currentMatrix[enemyRow][enemyCol].type) &&
          currentMatrix[nextRow][nextCol] === null
        ) {
          captures.push({ to: { r: nextRow, c: nextCol }, target: currentMatrix[enemyRow][enemyCol] });
        }
      }
    }
    return { validMoves, captures };
  };

  const getAllAvailableCaptures = (turnIsWhite) => {
    const allCaptures = [];
    pieces.forEach(p => {
      const { captures } = getMovesForPiece(p, turnIsWhite);
      captures.forEach(cap => {
        allCaptures.push({ fromPiece: p, ...cap });
      });
    });
    return allCaptures;
  };

  const checkGameOver = () => {
    const whitePieces = pieces.filter(p => p.type.startsWith("w"));
    const blackPieces = pieces.filter(p => p.type.startsWith("b"));

    if (whitePieces.length === 0) {
      setWinner(gameMode === "bot" ? "Bot g'alaba qozondi! Hamma toshingiz tugadi." : "Qora toshlar yutdi!");
      return;
    }
    if (blackPieces.length === 0) {
      setWinner(gameMode === "bot" ? "Siz yutdingiz! Botning hamma toshini urib bitirdingiz. 🎉" : "Oq toshlar yutdi!");
      return;
    }

    let hasWhiteMoves = false;
    let hasBlackMoves = false;

    pieces.forEach(p => {
      const { validMoves, captures } = getMovesForPiece(p, p.type.startsWith("w"));
      if (p.type.startsWith("w") && (validMoves.length > 0 || captures.length > 0)) hasWhiteMoves = true;
      if (p.type.startsWith("b") && (validMoves.length > 0 || captures.length > 0)) hasBlackMoves = true;
    });

    if (isWhiteTurn && !hasWhiteMoves) setWinner("Qoralar yutdi! Yo'llar yopildi.");
    if (!isWhiteTurn && !hasBlackMoves) setWinner("Oqlar yutdi! Yo'llar yopildi. 🎉");
  };

  const handleCellClick = (row, col) => {
    if (winner) return;
    if (gameMode === "bot" && !isWhiteTurn) return;

    const currentPiece = boardMatrix[row][col];

    if (currentPiece) {
      const isCorrectTurn = isWhiteTurn ? currentPiece.type.startsWith("w") : currentPiece.type.startsWith("b");
      if (isCorrectTurn) {
        setSelectedId(currentPiece.id);
        return;
      }
    }

    if (selectedId && !currentPiece) {
      const selectedPiece = pieces.find(p => p.id === selectedId);
      const { validMoves, captures } = getMovesForPiece(selectedPiece, isWhiteTurn);
      const allBoardCaptures = getAllAvailableCaptures(isWhiteTurn);
      const hitCapture = captures.find(c => c.to.r === row && c.to.c === col);

      if (hitCapture) {
        setPieces(prev => prev
          .filter(p => p.id !== hitCapture.target.id)
          .map(p => {
            if (p.id === selectedId) {
              let nextType = p.type;
              if (p.type === "w" && row === 0) nextType = "wk";
              if (p.type === "b" && row === 7) nextType = "bk";
              return { ...p, r: row, c: col, type: nextType };
            }
            return p;
          })
        );
        setSelectedId(null);
        setIsWhiteTurn(!isWhiteTurn);
      } else {
        const isTryingNormal = validMoves.some(m => m.r === row && m.c === col);
        if (allBoardCaptures.length > 0 && isTryingNormal) {
          alert("Majburiy yeyish toshi bor, toshingiz kuydi!");
          const burnedPiece = allBoardCaptures[0].fromPiece;
          setPieces(prev => prev.filter(p => p.id !== burnedPiece.id));
          setSelectedId(null);
          setIsWhiteTurn(!isWhiteTurn);
          return;
        }

        if (allBoardCaptures.length === 0 && isTryingNormal) {
          setPieces(prev => prev.map(p => {
            if (p.id === selectedId) {
              let nextType = p.type;
              if (p.type === "w" && row === 0) nextType = "wk";
              if (p.type === "b" && row === 7) nextType = "bk";
              return { ...p, r: row, c: col, type: nextType };
            }
            return p;
          }));
          setSelectedId(null);
          setIsWhiteTurn(!isWhiteTurn);
        }
      }
    }
  };

  const makeBotMove = () => {
    const allCaptures = getAllAvailableCaptures(false);

    if (allCaptures.length > 0) {
      const choice = allCaptures[Math.floor(Math.random() * allCaptures.length)];
      setPieces(prev => prev
        .filter(p => p.id !== choice.target.id)
        .map(p => {
          if (p.id === choice.fromPiece.id) {
            let nextType = p.type;
            if (p.type === "b" && choice.to.r === 7) nextType = "bk";
            return { ...p, r: choice.to.r, c: choice.to.c, type: nextType };
          }
          return p;
        })
      );
      setIsWhiteTurn(true);
      return;
    }

    const allBotPiecesMoves = [];
    pieces.filter(p => p.type.startsWith("b")).forEach(p => {
      const { validMoves } = getMovesForPiece(p, false);
      validMoves.forEach(m => allBotPiecesMoves.push({ fromPiece: p, to: m }));
    });

    if (allBotPiecesMoves.length === 0) return;

    let finalMove;

    if (botDifficulty === 0) {
      finalMove = allBotPiecesMoves[Math.floor(Math.random() * allBotPiecesMoves.length)];
    } else {
      let bestMoves = allBotPiecesMoves.filter(move => {
        const tempPieces = pieces.map(p => {
          if (p.id === move.fromPiece.id) return { ...p, r: move.to.r, c: move.to.c };
          return p;
        });
        let hasDanger = false;
        tempPieces.forEach(p => {
          if (p.type.startsWith("w")) {
            const directions = [[-1,-1], [-1,1], [1,-1], [1,1]];
            directions.forEach(([dr, dc]) => {
              if (p.r + 2*dr === move.to.r && p.c + 2*dc === move.to.c) hasDanger = true;
            });
          }
        });
        return !hasDanger;
      });

      if (bestMoves.length === 0) bestMoves = allBotPiecesMoves;

      if (botDifficulty === 2) {
        bestMoves.sort((a, b) => Math.abs(a.to.c - 3.5) - Math.abs(b.to.c - 3.5));
        finalMove = bestMoves[0];
      } else {
        finalMove = bestMoves[Math.floor(Math.random() * bestMoves.length)];
      }
    }

    setPieces(prev => prev.map(p => {
      if (p.id === finalMove.fromPiece.id) {
        let nextType = p.type;
        if (p.type === "b" && finalMove.to.r === 7) nextType = "bk";
        return { ...p, r: finalMove.to.r, c: finalMove.to.c, type: nextType };
      }
      return p;
    }));
    setIsWhiteTurn(true);
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
  };

  if (!gameMode) {
    return (
      <div className="casual-menu-bg">
        <div className="casual-top-bar">
          <h1 className="casual-main-title">SHASHKA</h1>
        </div>
        
        <p className="casual-instruction">Raqibning barcha shashkalarini yeng va g'olib bo'l!</p>

        <div className="casual-card">
          <div className="casual-avatar-circle">
            <span className="casual-avatar-emoji">{difficulties[botDifficulty].avatar}</span>
          </div>

          <div className="casual-controls-row" style={{ justifyContent: "center" }}>
            <h2 className={`difficulty-text diff-${botDifficulty}`}>
              {difficulties[botDifficulty].label}
            </h2>
          </div>

          <div className="slider-wrapper">
            <input 
              type="range" 
              min="0" 
              max="2" 
              value={botDifficulty} 
              onChange={(e) => setBotDifficulty(Number(e.target.value))} 
              className="casual-slider"
            />
            <div className="slider-ticks">
              <span onClick={() => setBotDifficulty(0)}>Oson</span>
              <span onClick={() => setBotDifficulty(1)}>O'rta</span>
              <span onClick={() => setBotDifficulty(2)}>Qiyin</span>
            </div>
          </div>

          <button className="casual-main-btn bot-play-btn" onClick={() => setGameMode("bot")}>
            <span className="btn-large-icon">🤖</span>
            <div className="btn-large-lbl">
              <span>YURISH REJIM</span>
              <h3>BOTA</h3>
            </div>
          </button>

          <button className="casual-main-btn friend-play-btn" onClick={() => setGameMode("friends")}>
            <span className="btn-large-icon">👥</span>
            <div className="btn-large-lbl">
              <span>YURISH REJIM</span>
              <h3>DRUGA</h3>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="header-box">
        <button className="back-btn" onClick={restartGame}>⬅ Menyuga</button>
        <h2>Rejim: {gameMode === "bot" ? `🤖 Bot (${difficulties[botDifficulty].label})` : "👥 Do‘stlar"}</h2>
      </div>

      {winner && (
        <div className="winner-overlay">
          <div className="winner-modal">
            <h2>🎉 O‘yin Tugadi!</h2>
            <p>{winner}</p>
            <button className="restart-btn" onClick={restartGame}>Qayta o'ynash</button>
          </div>
        </div>
      )}

      <div className="timers-box">
        <div className="global-timer">Umumiy: {formatTime(globalTime)}</div>
        <div className="turn-timer">Yurish: {turnTime}s</div>
      </div>

      <div className="turn-indicator">
        Navbat:{' '}
        {isWhiteTurn ? (
          <span className="user-label">Oq toshlar</span>
        ) : isBotThinking ? (
          <span className="bot-thinking-label">Bot o‘ylamoqda... 🤖</span>
        ) : (
          <span className="bot-label">Qora toshlar</span>
        )}
      </div>

      <div className="board-container">
        <div className="board-grid">
          {Array(8).fill(null).map((_, rIdx) => (
            <div key={rIdx} className="board-row">
              {Array(8).fill(null).map((_, cIdx) => {
                const isBlackCell = (rIdx + cIdx) % 2 === 1;
                return (
                  <div
                    key={cIdx}
                    className={`cell ${isBlackCell ? "dark-cell" : "light-cell"}`}
                    onClick={() => isBlackCell && handleCellClick(rIdx, cIdx)}
                  />
                );
              })}
            </div>
          ))}
        </div>

        {pieces.map((p) => {
          const isSelected = p.id === selectedId;
          const isKing = p.type === "wk" || p.type === "bk";
          
          const style = {
            transform: `translate(${p.c * 60 + 7}px, ${p.r * 60 + 7}px)`
          };

          return (
            <div
              key={p.id}
              className={`piece ${p.type.startsWith("w") ? "white-piece" : "black-piece"} ${isSelected ? "selected" : ""}`}
              style={style}
              onClick={() => handleCellClick(p.r, p.c)}
            >
              {isKing && <span className="crown-icon">👑</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}