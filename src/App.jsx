import React, { useState, useEffect, useMemo, useRef } from "react";
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
  CrownOutlined,
  PauseCircleFilled,
  CaretRightOutlined,
  ReloadOutlined,
  HomeOutlined
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

  const initial10x10Pieces = [
    { id: "ib1", type: "b", r: 0, c: 1 }, { id: "ib2", type: "b", r: 0, c: 3 },
    { id: "ib3", type: "b", r: 0, c: 5 }, { id: "ib4", type: "b", r: 0, c: 7 }, { id: "ib5", type: "b", r: 0, c: 9 },
    { id: "ib6", type: "b", r: 1, c: 0 }, { id: "ib7", type: "b", r: 1, c: 2 },
    { id: "ib8", type: "b", r: 1, c: 4 }, { id: "ib9", type: "b", r: 1, c: 6 }, { id: "ib10", type: "b", r: 1, c: 8 },
    { id: "ib11", type: "b", r: 2, c: 1 }, { id: "ib12", type: "b", r: 2, c: 3 },
    { id: "ib13", type: "b", r: 2, c: 5 }, { id: "ib14", type: "b", r: 2, c: 7 }, { id: "ib15", type: "b", r: 2, c: 9 },
    { id: "ib16", type: "b", r: 3, c: 0 }, { id: "ib17", type: "b", r: 3, c: 2 },
    { id: "ib18", type: "b", r: 3, c: 4 }, { id: "ib19", type: "b", r: 3, c: 6 }, { id: "ib20", type: "b", r: 3, c: 8 },

    { id: "iw1", type: "w", r: 6, c: 1 }, { id: "iw2", type: "w", r: 6, c: 3 },
    { id: "iw3", type: "w", r: 6, c: 5 }, { id: "iw4", type: "w", r: 6, c: 7 }, { id: "iw5", type: "w", r: 6, c: 9 },
    { id: "iw6", type: "w", r: 7, c: 0 }, { id: "iw7", type: "w", r: 7, c: 2 },
    { id: "iw8", type: "w", r: 7, c: 4 }, { id: "iw9", type: "w", r: 7, c: 6 }, { id: "iw10", type: "w", r: 7, c: 8 },
    { id: "iw11", type: "w", r: 8, c: 1 }, { id: "iw12", type: "w", r: 8, c: 3 },
    { id: "iw13", type: "w", r: 8, c: 5 }, { id: "iw14", type: "w", r: 8, c: 7 }, { id: "iw15", type: "w", r: 8, c: 9 },
    { id: "iw16", type: "w", r: 9, c: 0 }, { id: "iw17", type: "w", r: 9, c: 2 },
    { id: "iw18", type: "w", r: 9, c: 4 }, { id: "iw19", type: "w", r: 9, c: 6 }, { id: "iw20", type: "w", r: 9, c: 8 },
  ];

  const DIFFICULTIES = [
    { label: "EASY", avatar: "🙂", hoverAvatar: "😉" },
    { label: "MEDIUM", avatar: "🤖", hoverAvatar: "⚡" },
    { label: "HARD", avatar: "😈", hoverAvatar: "🔥" },
    { label: "PROFESSIONAL", avatar: "🏆", hoverAvatar: "👑" },
  ];

  export default function Checkers() {
    const [gameMode, setGameMode] = useState(null);
    const [isInternational, setIsInternational] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [pendingInternational, setPendingInternational] = useState(false);
    const [isSupkaRule, setIsSupkaRule] = useState(true);
    const [botDifficulty, setBotDifficulty] = useState(0);
    const [pieces, setPieces] = useState(initialPieces);
    const [isWhiteTurn, setIsWhiteTurn] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [isBotThinking, setIsBotThinking] = useState(false);
    const [hoveredIdx, setHoveredIdx] = useState(null);
    const [isFriendHovered, setIsFriendHovered] = useState(false);
    const [pendingDifficulty, setPendingDifficulty] = useState(null);
    const [playerIsWhite, setPlayerIsWhite] = useState(true);

    const [globalTime, setGlobalTime] = useState(600);
    const [turnTime, setTurnTime] = useState(30);
    const [winner, setWinner] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const boardSize = isInternational ? 10 : 8;

    const piecesRef = useRef(pieces);
    const isWhiteTurnRef = useRef(isWhiteTurn);
    const playerIsWhiteRef = useRef(playerIsWhite);
    const botDifficultyRef = useRef(botDifficulty);
    const gameModeRef = useRef(gameMode);
    const isProcessingRef = useRef(isProcessing);
    const isInternationalRef = useRef(isInternational);

    useEffect(() => { piecesRef.current = pieces; }, [pieces]);
    useEffect(() => { isWhiteTurnRef.current = isWhiteTurn; }, [isWhiteTurn]);
    useEffect(() => { playerIsWhiteRef.current = playerIsWhite; }, [playerIsWhite]);
    useEffect(() => { botDifficultyRef.current = botDifficulty; }, [botDifficulty]);
    useEffect(() => { gameModeRef.current = gameMode; }, [gameMode]);
    useEffect(() => { isProcessingRef.current = isProcessing; }, [isProcessing]);
    useEffect(() => { isInternationalRef.current = isInternational; }, [isInternational]);

    // Matrix faqat urilmagan toshlardan qurilishi kerak, shunda multi-jump hisob-kitobi buzilmaydi
    const boardMatrix = useMemo(() => buildMatrix(pieces.filter(p => !p.isCaptured), boardSize), [pieces, boardSize]);
    
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
            if (nr < 0 || nr >= boardSize || nc < 0 || nc >= boardSize) break;

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
            if (nr >= 0 && nr < boardSize && nc >= 0 && nc < boardSize && matrix[nr][nc] === null) {
              validMoves.push({ r: nr, c: nc });
            }
          }

          const enemyRow = p.r + dr;
          const enemyCol = p.c + dc;
          const nextRow = p.r + 2 * dr;
          const nextCol = p.c + 2 * dc;

          if (
            nextRow >= 0 && nextRow < boardSize && nextCol >= 0 && nextCol < boardSize &&
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

    const isPlayerTurn = gameMode !== "bot" || (playerIsWhite ? isWhiteTurn : !isWhiteTurn);
    const isBotTurn = gameMode === "bot" && !isPlayerTurn;

    useEffect(() => {
      if (!gameMode || winner || isPaused) return;
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
    }, [isWhiteTurn, winner, gameMode, isPaused]);

    useEffect(() => {
      if (!gameMode) return;
      setTurnTime(gameMode === "bot" ? 30 : 45);
      checkGameOver();
    }, [isWhiteTurn, gameMode, pieces]);

    useEffect(() => {
      if (gameMode === "bot" && isBotTurn && !winner && !isProcessing && !isPaused) {
        setIsBotThinking(true);
        const delay = 1000;
        const botDelay = setTimeout(async () => {
          await makeBotMove();
        }, delay);
        return () => clearTimeout(botDelay);
      }
    }, [isWhiteTurn, winner, gameMode, botDifficulty, playerIsWhite, isProcessing, isPaused]);

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
            ? (playerIsWhite ? "Bot wins! All your pieces are captured." : "You win! All bot pieces captured.")
            : "Black wins!"
        );
        return;
      }
      if (blackPieces.length === 0) {
        setWinner(
          gameMode === "bot"
            ? (playerIsWhite ? "You win! All bot pieces captured." : "Bot wins! All your pieces are captured.")
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

      if (isWhiteTurn && !hasWhiteMoves) {
        setWinner(gameMode === "bot" ? (playerIsWhite ? "Bot wins! No more moves." : "You win! No more moves.") : "Black wins! No more moves.");
      }
      if (!isWhiteTurn && !hasBlackMoves) {
        setWinner(gameMode === "bot" ? (playerIsWhite ? "You win! No more moves." : "Bot wins! No more moves.") : "White wins! No more moves.");
      }
    };

    const applyMove = async (pieceId, row, col, capturedId) => {
      setIsProcessing(true);
      let piecesToBurnIds = [];

      if (isSupkaRule && !capturedId && mandatoryCaptures.length > 0) {
        const burnId = mustCapturePieceIds.has(pieceId) ? pieceId : Array.from(mustCapturePieceIds)[0];
        piecesToBurnIds = [burnId];
      }

      const idsToAnimateAndRemove = [capturedId, ...piecesToBurnIds].filter(Boolean);
      
      // 1. Avval faqat yurayotgan toshni siljitamiz (harakat boshlanadi)
      setPieces(prev => prev.map(p => {
        if (p.id === pieceId) {
          let nextType = p.type;
          if (p.type === "w" && row === 0) nextType = "wk";
          if (p.type === "b" && row === boardSize - 1) nextType = "bk";
          return { ...p, r: row, c: col, type: nextType };
        }
        return p;
      }));

      if (idsToAnimateAndRemove.length > 0) {
        // 2. Tosh ustiga kelishini kutamiz (0.3s)
        await new Promise(r => setTimeout(r, 300));
        // 3. Endi raqib toshini qizil qilamiz
        setPieces(prev => prev.map(p => 
          idsToAnimateAndRemove.includes(p.id) ? { ...p, isCaptured: true } : p
        ));
        // 4. Qizarib yo'qolishi uchun biroz kutamiz
        await new Promise(r => setTimeout(r, 400));
      } else {
        // Oddiy yurish bo'lsa tezroq tugatish
        await new Promise(r => setTimeout(r, 250));
      }

      const finalPieces = pieces.map(p => {
        if (p.id === pieceId) {
          let nextType = p.type;
          if (p.type === "w" && row === 0) nextType = "wk";
          if (p.type === "b" && row === boardSize - 1) nextType = "bk";
          return { ...p, r: row, c: col, type: nextType };
        }
        return p;
      }).filter(p => !idsToAnimateAndRemove.includes(p.id));

      const movedPiece = finalPieces.find(p => p.id === pieceId);
      let nextIsWhiteTurn = !isWhiteTurn;

      if (capturedId && movedPiece) {
        const { captures } = getMovesForPiece(movedPiece, isWhiteTurn, buildMatrix(finalPieces, boardSize));
        if (captures.length > 0) nextIsWhiteTurn = isWhiteTurn;
      }

      setPieces(finalPieces);
      setSelectedId(nextIsWhiteTurn === isWhiteTurn ? pieceId : null);
      setIsWhiteTurn(nextIsWhiteTurn);
      setIsProcessing(false);
    };

  const handleCellClick = async (row, col) => {
    if (winner || isProcessing || isPaused) return;
    if (gameMode === "bot" && !isPlayerTurn) return;

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
        await applyMove(selectedId, row, col, hitCapture.target.id);
        return;
      }

      if (isTryingNormal) {
        await applyMove(selectedId, row, col, null);
      }
    }
  };

    const applyBotMove = async (fromPiece, to, capturedIds, path) => {
      // Botning yurish yo'li va uriladigan toshlar
      const steps = path && path.length > 0 ? path : [{ r: to.r, c: to.c }];
      const kills = Array.isArray(capturedIds) ? capturedIds : (capturedIds ? [capturedIds] : []);

      // Harakat tezligi: oddiy yurishda juda tez (200ms), urishda sekinroq
      const isMultiJump = kills.length > 1;
      const isCapture = kills.length > 0;
      const moveTime = isMultiJump ? 600 : (isCapture ? 400 : 200); 
      const captureTime = isMultiJump ? 500 : 300;

      // Bot yurayotgan toshini "tanlangan" qilib belgilaymiz (z-index ko'tarilishi uchun)
      setSelectedId(fromPiece.id);

      let currentPieces = [...piecesRef.current]; // Start with current pieces state for bot's turn

      for (let i = 0; i < steps.length; i++) { // Iterate through each step of the bot's move
        const step = steps[i]; // The square the bot's piece moves to
        const killId = kills[i]; // The piece captured *after* moving to 'step'

        // 1. Move the bot's piece to the current step's coordinates
        currentPieces = currentPieces.map(p => {
          if (p.id === fromPiece.id) {
            let nextType = p.type;
            if (p.type === "b" && step.r === boardSize - 1) nextType = "bk";
            if (p.type === "w" && step.r === 0) nextType = "wk";
            return { ...p, r: step.r, c: step.c, type: nextType };
          }
          return p;
        });
        setPieces(currentPieces); // Update state to show the move
        await new Promise(r => setTimeout(r, moveTime)); 

        if (killId) { // If there's a piece to capture at this step
          // 2. Mark the captured piece as 'isCaptured' for animation
          currentPieces = currentPieces.map(p =>
            p.id === killId ? { ...p, isCaptured: true } : p
          );
          setPieces(currentPieces); // Update state to show the captured piece turning red/fading
          await new Promise(r => setTimeout(r, captureTime)); 

          // 3. Remove the captured piece from the board
          currentPieces = currentPieces.filter(p => p.id !== killId);
          setPieces(currentPieces); // Update state to reflect removal
          await new Promise(r => setTimeout(r, isMultiJump ? 350 : 50));
        }
      }

      // Navbat o'yinchiga o'tadi
      setIsWhiteTurn(playerIsWhiteRef.current);
      setSelectedId(null);
      setIsBotThinking(false);
  };

  const makeBotMove = async () => {
    if (isPaused) {
      setIsBotThinking(false);
      return;
    }
    const botPlaysWhite = !playerIsWhiteRef.current;
    if (isWhiteTurnRef.current !== botPlaysWhite) {
      setIsBotThinking(false);
      return;
    }

    const rawMove = pickBotMove(
      piecesRef.current,
      botDifficultyRef.current,
      playerIsWhiteRef.current,
      isInternationalRef.current ? 10 : 8
    );
    const formatted = formatBotMove(rawMove);
    
    if (formatted) {
      await applyBotMove(formatted.fromPiece, formatted.to, formatted.capturedIds, formatted.path);
    } else {
      setIsBotThinking(false);
    }
  };

  const restartMatch = () => {
    const startingPieces = isInternational ? initial10x10Pieces : initialPieces;
    setPieces(startingPieces);
    setIsWhiteTurn(true);
    setSelectedId(null);
    setGlobalTime(600);
    setTurnTime(gameMode === "bot" ? 30 : 45);
    setWinner(null);
    setIsBotThinking(false);
    setIsProcessing(false);
    setIsPaused(false);
  };

  const exitToHome = () => {
    setPieces(initialPieces);
    setIsWhiteTurn(true);
    setSelectedId(null);
    setGlobalTime(600);
    setTurnTime(30);
    setWinner(null);
    setGameMode(null);
    setIsBotThinking(false);
    setPendingDifficulty(null);
    setPendingInternational(false);
    setPlayerIsWhite(true);
    setIsInternational(false);
    setIsPaused(false);
  };

  const startGame = (mode, supka, playAsWhite = true, international = false) => {
    const startingPieces = international ? initial10x10Pieces : initialPieces;
    setPieces(startingPieces);
    setIsInternational(international);
    setPlayerIsWhite(playAsWhite);
    setIsWhiteTurn(true);
    setSelectedId(null);
    setGlobalTime(600);
    setTurnTime(mode === "bot" ? 30 : 45);
    setWinner(null);
    setGameMode(mode);
    setIsSupkaRule(supka);
    setPendingDifficulty(null);
    setPendingInternational(false);
    setIsPaused(false);
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
    const pendingDiff = pendingDifficulty !== null ? DIFFICULTIES[pendingDifficulty] : null;
    let displayEmoji = ""; 
    if (pendingInternational) displayEmoji = "👑";
    else if (pendingDiff) displayEmoji = pendingDiff.avatar;
    else if (isFriendHovered) displayEmoji = "🤝";
    else if (hoveredIdx !== null) displayEmoji = DIFFICULTIES[hoveredIdx].hoverAvatar;

    const isHovering = pendingInternational || pendingDiff || hoveredIdx !== null || isFriendHovered;
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

          <Space direction="vertical" size={8} style={{ width: '100%', marginTop: '14px' }}>
            {pendingDifficulty !== null ? (
              <>
                <Title level={4} className="color-select-title">
                  {DIFFICULTIES[pendingDifficulty].label} — Choose Side
                </Title>
                <Text className="color-select-subtitle">Select which color you want to play</Text>

                <Button
                  block
                  type="primary"
                  className="casual-main-btn color-btn-white"
                  onClick={() => {
                    setBotDifficulty(pendingDifficulty);
                    startGame("bot", true, true, false);
                  }}
                  style={{ height: 'auto' }}
                >
                  <div className="btn-arcade-content">
                    <span className="btn-emoji-static">⚪</span>
                    <div className="btn-large-lbl">
                      <Title level={4} className="btn-title">PLAY AS WHITE</Title>
                    </div>
                  </div>
                </Button>

                <Button
                  block
                  className="casual-main-btn color-btn-black"
                  onClick={() => {
                    setBotDifficulty(pendingDifficulty);
                    startGame("bot", true, false, false);
                  }}
                  style={{ height: 'auto' }}
                >
                  <div className="btn-arcade-content">
                    <span className="btn-emoji-static">⚫</span>
                    <div className="btn-large-lbl">
                      <Title level={4} className="btn-title">PLAY AS BLACK</Title>
                    </div>
                  </div>
                </Button>

                <Button
                  block
                  type="text"
                  onClick={() => setPendingDifficulty(null)}
                  style={{ color: '#94a3b8', marginTop: '2px' }}
                >
                  ← Back
                </Button>
              </>
            ) : pendingInternational ? (
              <>
                <Title level={4} className="color-select-title" style={{ color: '#fbbf24' }}>
                  👑 INTERNATIONAL DRAUGHTS
                </Title>
                <Text className="color-select-subtitle">10×10 Board • World Championship Mode</Text>

                <Button
                  block
                  type="primary"
                  className="casual-main-btn color-btn-white"
                  onClick={() => {
                    setBotDifficulty(1);
                    startGame("bot", true, true, true);
                  }}
                  style={{ height: 'auto' }}
                >
                  <div className="btn-arcade-content">
                    <span className="btn-emoji-static">⚪</span>
                    <div className="btn-large-lbl">
                      <Title level={4} className="btn-title">PLAY AS WHITE (BOT)</Title>
                    </div>
                  </div>
                </Button>

                <Button
                  block
                  className="casual-main-btn color-btn-black"
                  onClick={() => {
                    setBotDifficulty(1);
                    startGame("bot", true, false, true);
                  }}
                  style={{ height: 'auto' }}
                >
                  <div className="btn-arcade-content">
                    <span className="btn-emoji-static">⚫</span>
                    <div className="btn-large-lbl">
                      <Title level={4} className="btn-title">PLAY AS BLACK (BOT)</Title>
                    </div>
                  </div>
                </Button>

                <Button
                  block
                  className="casual-main-btn friend-play-btn"
                  onClick={() => startGame("friends", true, true, true)}
                  style={{ height: 'auto' }}
                >
                  <div className="btn-arcade-content">
                    <span className="btn-emoji-static">👥</span>
                    <div className="btn-large-lbl">
                      <Title level={4} className="btn-title">VS FRIEND (10×10)</Title>
                    </div>
                  </div>
                </Button>

                <Button
                  block
                  type="text"
                  onClick={() => setPendingInternational(false)}
                  style={{ color: '#94a3b8', marginTop: '2px' }}
                >
                  ← Back
                </Button>
              </>
            ) : (
              <>
                {DIFFICULTIES.map((d, idx) => (
                  <Button 
                    key={idx}
                    type={botDifficulty === idx ? "primary" : "default"}
                    block 
                    className={`casual-main-btn diff-btn-${idx}`}
                    onClick={() => {
                      setBotDifficulty(idx);
                      setHoveredIdx(null);
                      setPendingDifficulty(idx);
                    }}
                    onPointerEnter={() => setHoveredIdx(idx)}
                    onPointerLeave={() => setHoveredIdx(null)}
                    style={{ height: 'auto' }}
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
                  className="casual-main-btn international-draughts-btn"
                  onClick={() => {
                    setHoveredIdx(null);
                    setPendingDifficulty(null);
                    setPendingInternational(true);
                  }}
                  style={{ height: 'auto' }}
                >
                  <div className="btn-arcade-content">
                    <span className="btn-emoji-static">👑</span>
                    <div className="btn-large-lbl">
                      <Title level={4} className="btn-title premium-btn-title">INTERNATIONAL DRAUGHTS</Title>
                      <span className="premium-gold-badge">10×10 BOARD</span>
                    </div>
                  </div>
                </Button>

                <Button 
                  block 
                  className="casual-main-btn friend-play-btn"
                  onClick={() => startGame("friends", true, true, false)}
                  onPointerEnter={() => setIsFriendHovered(true)}
                  onPointerLeave={() => setIsFriendHovered(false)}
                  style={{ height: 'auto' }}
                >
                  <div className="btn-arcade-content">
                    <span className="btn-emoji-static">👥</span>
                    <div className="btn-large-lbl">
                      <Title level={4} className="btn-title">VS FRIEND</Title>
                    </div>
                  </div>
                </Button>
              </>
            )}
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
          <Button
            className="menu-btn"
            icon={<ArrowLeftOutlined />}
            onClick={exitToHome}
            type="text"
          >
            <span className="menu-label">Menu</span>
          </Button>
          <Title level={4} className="header-title-text">
            {gameMode === "bot"
              ? `🤖 ${DIFFICULTIES[botDifficulty].label}`
              : "👥 Friends"}
          </Title>
          <Button
            className="pause-btn"
            onClick={() => setIsPaused(true)}
            aria-label="Pause"
            title="Pause"
            icon={<PauseCircleFilled className="pause-icon" />}
          >
            <span className="pause-label">Pause</span>
          </Button>
        </div>

        {/* CENTRED PAUSE MENU MODAL */}
        <Modal
          open={isPaused}
          footer={null}
          closable={false}
          centered
          className="pause-modal"
          width={360}
        >
          <div className="pause-modal-body">
            <Title level={3} className="pause-modal-title">
              <span>⏸️</span> Game Paused
            </Title>
            <Text style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
              {isInternational ? "International Draughts (10×10)" : "Classic Checkers (8×8)"}
            </Text>

            <div className="pause-menu-actions">
              <Button
                block
                className="pause-action-btn pause-resume-btn"
                onClick={() => setIsPaused(false)}
                icon={<CaretRightOutlined style={{ fontSize: '20px' }} />}
              >
                Continue
              </Button>

              <Button
                block
                className="pause-action-btn pause-restart-btn"
                onClick={restartMatch}
                icon={<ReloadOutlined style={{ fontSize: '18px' }} />}
              >
                Restart
              </Button>

              <Button
                block
                className="pause-action-btn pause-home-btn"
                onClick={exitToHome}
                icon={<HomeOutlined style={{ fontSize: '18px' }} />}
              >
                Home
              </Button>
            </div>
          </div>
        </Modal>

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
            onOk={restartMatch}
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
            <span className="score-number">{playerIsWhite ? whiteCount : blackCount}</span>
          </div>
          
          <div className="vs-divider">VS</div>

          <div className="score-item opp-side">
            <span className="score-label">
              {gameMode === 'bot' ? 'BOT' : 'FRIEND'}
            </span>
            <span className="score-number">{playerIsWhite ? blackCount : whiteCount}</span>
          </div>
        </div>

        <div className="board-anchor">
          <div className="board-container">
            <div className={`board-grid ${boardSize === 10 ? 'grid-10' : ''}`} style={{ '--cells': boardSize }}>
              {Array(boardSize)
                .fill(null)
                .map((_, rIdx) =>
                  Array(boardSize)
                    .fill(null)
                    .map((_, cIdx) => {
                      const r = playerIsWhite ? rIdx : (boardSize - 1) - rIdx;
                      const c = playerIsWhite ? cIdx : (boardSize - 1) - cIdx;
                      const isDarkCell = (r + c) % 2 === 1;
                      const hintType = isDarkCell ? isHintCell(r, c) : null;
                      const piece = boardMatrix[r][c];

                      return (
                        <div
                          key={`${rIdx}-${cIdx}`}
                          className={`cell ${isDarkCell ? "dark-cell" : "light-cell"}`}
                          onClick={() => handleCellClick(r, c)}
                        >
                          {hintType && !piece && (
                            <span className={`hint-dot ${hintType === "capture" ? "hint-capture" : "hint-move"}`} />
                          )}
                        </div>
                      );
                    })
                )}
                
                {/* Toshlar qatlami grid ichida */}
                {pieces.map((p) => {
                  const isSelected = p.id === selectedId;
                  const isKing = p.type === "wk" || p.type === "bk";
                  const isBeingCaptured = p.isCaptured;
                  const hasSupka = pieceHasSupka(p);

                  const displayR = playerIsWhite ? p.r : (boardSize - 1) - p.r;
                  const displayC = playerIsWhite ? p.c : (boardSize - 1) - p.c;

                  return (
                    <div
                      key={p.id}
                      className={`piece ${isSelected ? "selected" : ""} ${hasSupka ? "has-supka" : ""} ${isBeingCaptured ? "is-captured" : ""}`}
                      style={{
                        transform: `translate(${displayC * 100}%, ${displayR * 100}%)`,
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: `${100 / boardSize}%`,
                        height: `${100 / boardSize}%`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s",
                        zIndex: isBeingCaptured ? 100 : (isSelected ? 110 : 10),
                        opacity: isBeingCaptured ? 0 : 1,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCellClick(p.r, p.c);
                      }}
                    >
                      <div 
                        className={`piece-content ${p.type.startsWith("w") ? "white-piece" : "black-piece"}`}
                        style={{ background: isBeingCaptured ? "#ff4d4f" : "" }}
                      >
                        {isKing ? (
                          <CrownOutlined className="crown-icon" style={{ color: '#faad14', filter: 'drop-shadow(0 0 5px rgba(250,173,20,0.4))' }} />
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
