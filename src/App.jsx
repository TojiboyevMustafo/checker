import React, { useState, useEffect, useMemo } from "react";
import { pickBotMove, formatBotMove } from "./ai";
import { buildMatrix, getCaptureSequences } from "./moveGenerator";
import { 
  Button, 
  Typography, 
  Card, 
  Space, 
  Tag, 
  Modal, 
  ConfigProvider, 
  theme,
  Badge
} from "antd";
import { 
  ArrowLeftOutlined, 
  BulbOutlined, 
  TrophyOutlined,
  DashboardOutlined,
  FireOutlined,
  UserOutlined,
  CrownOutlined
} from "@ant-design/icons";
import "./App.css";

const { Title, Text, Paragraph } = Typography;

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
    { label: "EASY", avatar: "🙂", hoverAvatar: "😉" },
    { label: "MEDIUM", avatar: "🤖", hoverAvatar: "⚡" },
    { label: "HARD", avatar: "😈", hoverAvatar: "🔥" },
    { label: "PROFESSIONAL", avatar: "🏆", hoverAvatar: "👑" },
  ];

  export default function Checkers() {
    const [gameMode, setGameMode] = useState(null);
    const [isSupkaRule, setIsSupkaRule] = useState(true);
    const [botDifficulty, setBotDifficulty] = useState(0);
    const [pieces, setPieces] = useState(initialPieces);
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [isBotThinking, setIsBotThinking] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [isFriendHovered, setIsFriendHovered] = useState(false);

    const [globalTime, setGlobalTime] = useState(600);
    const [turnTime, setTurnTime] = useState(30);
    const [winner, setWinner] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Matrix faqat urilmagan toshlardan qurilishi kerak, shunda multi-jump hisob-kitobi buzilmaydi
    const boardMatrix = useMemo(() => buildMatrix(pieces.filter(p => !p.isCaptured)), [pieces]);
    
    const whiteCount = pieces.filter(p => p.type.startsWith('w')).length;
    const blackCount = pieces.filter(p => p.type.startsWith('b')).length;

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
      if (!piece) return { validMoves: [], captures: [] };
      
      return getMovesForPiece(piece, isWhiteTurn, boardMatrix);
    }, [selectedId, isWhiteTurn, pieces, winner, mandatoryCaptures]);

    const showMoveHints = false;

    useEffect(() => {
      if (!gameMode || winner) return;
      const timer = setInterval(() => {
        setTurnTime((prev) => {
          if (prev <= 1) {
            setIsWhiteTurn((t) => !t);
            setSelectedId(null);
            return gameMode === "bot" ? 30 : 45;
          }
          return prev - 1;
        });
        if (gameMode !== "bot") {
          setGlobalTime((prev) => {
            if (prev <= 1) {
              setWinner("Draw (Time is up!)");
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
      return () => clearInterval(timer);
    }, [isWhiteTurn, winner, gameMode]);

    useEffect(() => {
      if (!gameMode) return;
      setTurnTime(gameMode === "bot" ? 30 : 45);
      checkGameOver();
    }, [isWhiteTurn, gameMode, pieces]);

    useEffect(() => {
      if (gameMode === "bot" && !isWhiteTurn && !winner) {
        setIsBotThinking(true);
        const delay = 1000;
        const botDelay = setTimeout(async () => {
          await makeBotMove();
        }, delay);
        return () => clearTimeout(botDelay);
      }
    }, [isWhiteTurn, winner, gameMode, botDifficulty]);

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
            ? "Bot wins! All your pieces are captured."
            : "Black wins!"
        );
        return;
      }
      if (blackPieces.length === 0) {
        setWinner(
          gameMode === "bot"
            ? "You win! All bot pieces captured."
            : "White wins!"
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

      if (isWhiteTurn && !hasWhiteMoves) setWinner("Black wins! No more moves.");
      if (!isWhiteTurn && !hasBlackMoves) setWinner("White wins! No more moves.");
    };

    const applyMove = async (pieceId, row, col, capturedId) => {
      setIsProcessing(true);
      let piecesToBurnIds = [];

      if (isSupkaRule && !capturedId && mandatoryCaptures.length > 0) {
        const burnId = mustCapturePieceIds.has(pieceId) ? pieceId : Array.from(mustCapturePieceIds)[0];
        piecesToBurnIds = [burnId];
      }

      const idsToRemove = [capturedId, ...piecesToBurnIds].filter(Boolean);
      
      // 1. Vizual harakat va urilganlik holatini belgilash
      const intermediatePieces = pieces.map(p => {
        if (p.id === pieceId) {
          let nextType = p.type;
          if (p.type === "w" && row === 0) nextType = "wk";
          if (p.type === "b" && row === 7) nextType = "bk";
          return { ...p, r: row, c: col, type: nextType };
        }
        if (idsToRemove.includes(p.id)) return { ...p, isCaptured: true };
        return p;
      });
      setPieces(intermediatePieces);

      if (idsToRemove.length > 0) {
        await new Promise(r => setTimeout(r, 600));
      }

      // 2. Navbat almashish mantiqini aniqlash
      const finalPieces = intermediatePieces.filter(p => !p.isCaptured);
      const movedPiece = finalPieces.find(p => p.id === pieceId);
      let nextIsWhiteTurn = !isWhiteTurn;

      if (capturedId && movedPiece) {
        const { captures } = getMovesForPiece(movedPiece, isWhiteTurn, buildMatrix(finalPieces));
        if (captures.length > 0) nextIsWhiteTurn = isWhiteTurn;
      }

      setPieces(finalPieces);
      setSelectedId(nextIsWhiteTurn === isWhiteTurn ? pieceId : null);
      setIsWhiteTurn(nextIsWhiteTurn);
      setIsProcessing(false);
    };

  const handleCellClick = async (row, col) => {
    if (winner || isProcessing) return;
    if (gameMode === "bot" && !isWhiteTurn) return;

    const isPlayableCell = (row + col) % 2 === 1;
    if (!isPlayableCell) return;

    const currentPiece = boardMatrix[row][col];

    if (currentPiece) {
      const isCorrectTurn = isWhiteTurn
        ? currentPiece.type.startsWith("w")
        : currentPiece.type.startsWith("b");
      
      if (isCorrectTurn) {
        // Supka bo'lsa ham, bo'lmasa ham xohlagan toshni tanlashga ruxsat beramiz
        setSelectedId(currentPiece.id);
        return;
      }
    }

    if (selectedId && !currentPiece) {
      const selectedPiece = pieces.find((p) => p.id === selectedId);
      const moves = getMovesForPiece(selectedPiece, isWhiteTurn);
      
      const hitCapture = moves.captures.find((c) => c.to.r === row && c.to.c === col);
      const isTryingNormal = moves.validMoves.find((m) => m.r === row && m.c === col);

      // Agar Supka bo'lsa yeyish majburiy. 
      // Supkasiz bo'lsa: agar ham yeyish, ham yurish mumkin bo'lsa - bosilgan katakka qarab ishlaydi.
      if (hitCapture) {
        const selectedPiece = pieces.find(p => p.id === selectedId);
        await applyMove(selectedId, row, col, hitCapture.target.id);
        
        // Foydalanuvchi instruksiyasi: damkaga chiqib 2-toshni olmasa, tosh olib tashlanadi (supka)
        // Ammo o'yin mantiqan davom ettirishga imkon berishi kerak.
        return;
      }

      if (isTryingNormal) {
        await applyMove(selectedId, row, col, null);
      }
    }
  };

    const applyBotMove = async (fromPiece, to, capturedIds, path) => {
      // Botning yurish yo'li (intermediate squares) va uriladigan toshlar
      const steps = path && path.length > 0 ? path : [{ r: to.r, c: to.c }];
      const kills = Array.isArray(capturedIds) ? capturedIds : (capturedIds ? [capturedIds] : []);

      // Bot yurayotgan toshini "tanlangan" qilib belgilaymiz (z-index ko'tarilishi uchun)
      setSelectedId(fromPiece.id);

      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const killId = kills[i];

        // 1. Bot toshini keyingi nuqtaga suramiz (animatsiya bilan)
        setPieces(prev => prev.map(p => 
          p.id === fromPiece.id ? { ...p, r: step.r, c: step.c } : p
        ));

        if (killId) {
          // Bot urayotganda toshni avval belgilaymiz va biroz uzoqroq ko'rsatamiz
          setPieces(prev => prev.map(p => p.id === killId ? { ...p, isCaptured: true } : p));
          await new Promise(r => setTimeout(r, 800));
          // Keyin o'chiramiz
          setPieces(prev => prev.filter(p => !p.isCaptured));
          await new Promise(r => setTimeout(r, 400));
        } else {
          await new Promise(r => setTimeout(r, 350));
        }
      }

      // Oxirgi nuqtada Damla (King) bo'lishini tekshirish
      setPieces(prev => prev.map(p => {
        if (p.id === fromPiece.id && p.type === "b" && p.r === 7) {
          return { ...p, type: "bk" };
        }
        return p;
      }));

      setIsWhiteTurn(true);
      // Yurish tugagach tanlovni bekor qilamiz
      setSelectedId(null);
  };

  const makeBotMove = async () => {
    const rawMove = pickBotMove(pieces, botDifficulty);
    const formatted = formatBotMove(rawMove);
    
    if (formatted) {
      await applyBotMove(formatted.fromPiece, formatted.to, formatted.capturedIds, formatted.path);
    }
    setIsBotThinking(false);
  };

  const restartGame = () => {
    setPieces(initialPieces);
    setIsWhiteTurn(true);
    setSelectedId(null);
    setGlobalTime(600);
    setTurnTime(30);
    setWinner(null);
    setGameMode(null);
    setIsBotThinking(false);
  };

  const startGame = (mode, supka) => {
    setPieces(initialPieces);
    setIsWhiteTurn(true);
    setSelectedId(null);
    setGlobalTime(600);
    setTurnTime(mode === "bot" ? 30 : 45);
    setWinner(null);
    setGameMode(mode);
    setIsSupkaRule(supka);
  };

  const isHintCell = (r, c) => {
    if (!showMoveHints || !selectedId || winner) return null;
    if (gameMode === "bot" && !isWhiteTurn) return null;
    if (selectedHints.captures.some((cap) => cap.to.r === r && cap.to.c === c)) return "capture";
    if (selectedHints.validMoves.some((m) => m.r === r && m.c === c)) return "move";
    return null;
  };

  const pieceHasSupka = (piece) => {
    return false; // Talabga ko'ra markerlar olib tashlandi
  };

  if (!gameMode) {
    // Cursor qaysi tugma ustida tursa, o'shaning emojisini ko'rsatish
    let displayEmoji = ""; 
    if (isFriendHovered) displayEmoji = "🤝";
    else if (hoveredIdx !== null) displayEmoji = DIFFICULTIES[hoveredIdx].hoverAvatar;

    const isHovering = hoveredIdx !== null || isFriendHovered;
    if (!isHovering) displayEmoji = DIFFICULTIES[botDifficulty].avatar;

    return (
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#d4a574',
          },
        }}
      >
      <div className="casual-menu-bg">
        <div className="casual-top-bar">
          <Title className="casual-main-title">CHECKERS</Title>
        </div>

        <Card className="casual-card" variant="borderless">
          <div className="casual-avatar-circle">
            <span className={`casual-avatar-emoji ${isHovering ? 'emoji-pop' : ''}`}>
              {displayEmoji}
            </span>
          </div>

          <Space direction="vertical" size="middle" style={{ width: '100%', marginTop: '20px' }}>
            {DIFFICULTIES.map((d, idx) => (
              <Button 
                key={idx}
                type={botDifficulty === idx ? "primary" : "default"}
                block 
                className={`casual-main-btn diff-btn-${idx}`}
                onClick={() => {
                  setBotDifficulty(idx);
                  setHoveredIdx(null); // Bosilganda holatni tozalash
                  startGame("bot", true);
                }}
                onPointerEnter={() => setHoveredIdx(idx)}
                onPointerLeave={() => setHoveredIdx(null)}
                style={{ height: 'auto', padding: '12px' }}
              >
                <div className="btn-arcade-content">
                  <span className="btn-emoji-static">{d.avatar}</span>
                  <div className="btn-large-lbl">
                    <Title level={4} className="btn-title">{d.label}</Title>
                  </div>
                </div>
              </Button>
            ))}

            <Button 
              block 
              className="casual-main-btn friend-play-btn"
              onClick={() => startGame("friends", true)}
              onPointerEnter={() => setIsFriendHovered(true)}
              onPointerLeave={() => setIsFriendHovered(false)}
              style={{ height: 'auto', padding: '12px' }}
            >
              <div className="btn-arcade-content">
                <span className="btn-emoji-static">👥</span>
                <div className="btn-large-lbl">
                  <Title level={4} className="btn-title">VS FRIEND</Title>
                </div>
              </div>
            </Button>
          </Space>
        </Card>
      </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#d4a574', // O'yin tugmalari va elementlarini jigarrang qilish
        },
      }}
    >
      <div className={`game-container ${isWhiteTurn ? 'turn-user' : 'turn-opponent'}`}>
        <div className="header-box">
          <Button icon={<ArrowLeftOutlined />} onClick={restartGame} type="text" style={{ color: 'white' }}>
            Menu
          </Button>
          <Title level={4} style={{ margin: 0, color: 'white' }}>
            {gameMode === "bot"
              ? `🤖 ${DIFFICULTIES[botDifficulty].label}`
              : "👥 Friends"}
          </Title>
        </div>

        {winner && (
          <Modal
            title={
              <Title level={3} style={{ margin: 0 }}>
                {winner.includes("You win") || winner.includes("White wins") 
                  ? "🎉 Victory!" 
                  : "😔 Game Over"}
              </Title>
            }
            open={!!winner}
            onOk={restartGame}
            cancelButtonProps={{ style: { display: 'none' } }}
            okText="Play Again"
            closable={false}
            centered
          >
            <Text style={{ fontSize: '1.2rem' }}>{winner}</Text>
          </Modal>
        )}

        <div className="timers-box">
          {gameMode !== "bot" && <div className="global-timer">Total: {formatTime(globalTime)}</div>}
          <div className="turn-timer" style={{ border: turnTime < 10 ? '2px solid red' : '' }}>
            <DashboardOutlined /> {turnTime}s
          </div>
        </div>

        <div className="scoreboard-wrapper">
          <div className="score-item user-side">
            <span className="score-label">YOU</span>
            <span className="score-number">{whiteCount}</span>
          </div>
          
          <div className="vs-divider">VS</div>

          <div className="score-item opp-side">
            <span className="score-label">
              {gameMode === 'bot' ? 'BOT' : 'FRIEND'}
            </span>
            <span className="score-number">{blackCount}</span>
          </div>
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
                        >
                          {hintType && !piece && (
                            <span className={`hint-dot ${hintType === "capture" ? "hint-capture" : "hint-move"}`} />
                          )}
                        </div>
                      );
                    })
                )}

              {/* Toshlar qatlami - absolute joylashuv uchun */}
              {pieces.map((p) => {
                const isSelected = p.id === selectedId;
                const isKing = p.type === "wk" || p.type === "bk";
                const isBeingCaptured = p.isCaptured;
                const hasSupka = pieceHasSupka(p);

                return (
                  <div
                    key={p.id}
                    className={`piece ${isSelected ? "selected" : ""} ${hasSupka ? "has-supka" : ""} ${isBeingCaptured ? "is-captured" : ""}`}
                    style={{
                      transform: `translate(${p.c * 100}%, ${p.r * 100}%)`,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCellClick(p.r, p.c);
                    }}
                  >
                    <div className={`piece-content ${p.type.startsWith("w") ? "white-piece" : "black-piece"}`}>
                      {isKing ? (
                        <CrownOutlined style={{ fontSize: '26px', color: '#faad14', filter: 'drop-shadow(0 0 5px rgba(250,173,20,0.4))' }} />
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}
