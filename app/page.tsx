"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { LuTriangle } from "react-icons/lu";
import { ImRadioUnchecked, ImCross, ImCheckboxUnchecked } from "react-icons/im";
import { generateBoard, ANSWER_CELL } from "./lib/gridGenerator";

type Debuff = "α" | "β";

const MARKERS = [
  { id: 0, icon: <ImRadioUnchecked />, label: "Circle", color: "#f87171" },
  { id: 1, icon: <ImCross />, label: "Cross", color: "#60a5fa" },
  { id: 2, icon: <LuTriangle />, label: "Triangle", color: "#4ade80" },
  { id: 3, icon: <ImCheckboxUnchecked />, label: "Square", color: "#c084fc" },
] as const;

const COLUMN_MARKERS: Record<number, { icon: React.ReactNode; color: string }> =
  {
    1: { icon: <ImRadioUnchecked />, color: "#f87171" },
    3: { icon: <ImCross />, color: "#60a5fa" },
    5: { icon: <LuTriangle />, color: "#4ade80" },
    7: { icon: <ImCheckboxUnchecked />, color: "#c084fc" },
  };

const TOTAL_ROWS = 5;
const TOTAL_COLS = 7;

const C = {
  crust: "#11111b",
  surface0: "#313244",
  surface1: "#45475a",
  surface2: "#585b70",
  subtext1: "#bac2de",
  subtext0: "#a6adc8",
  overlay0: "#6c7086",
  white: "fff",
  mauve: "#cba6f7",
  green: "#a6e3a1",
  blue: "#89b4fa",
  red: "#f38ba8",
} as const;

const Chip = ({
  label,
  value,
  valueColor = C.subtext1,
}: {
  label: string;
  value: React.ReactNode;
  valueColor?: string;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "3px 9px",
      background: C.surface0,
      border: `1px solid ${C.surface1}`,
      borderRadius: 5,
      fontSize: 12,
      lineHeight: 1,
      height: 28,
    }}
  >
    <span style={{ color: C.overlay0 }}>{label}</span>
    <span style={{ color: valueColor, fontWeight: 600 }}>{value}</span>
  </div>
);

export default function ClassicalConceptsSim() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState({ score: 0, attempts: 0 });
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameState, setGameState] = useState<{
    board: number[][];
    markerIdx: number;
    debuff: Debuff;
    answerCell: { row: number; col: number };
    boardId: number;
  } | null>(null);

  const [clickFeedback, setClickFeedback] = useState<{
    clicked?: { row: number; col: number; correct: boolean };
    correctHighlights?: { row: number; col: number }[];
  }>({});

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startNewRound = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const { board, mySymbol, myDebuff, boardId } = generateBoard();
    let answerCell: { row: number; col: number } | null = null;
    for (let r = 0; r < 5; r++)
      for (let c = 0; c < 7; c++)
        if (board[r][c] === ANSWER_CELL) {
          answerCell = { row: r, col: c };
          break;
        }
    setGameState({
      board,
      markerIdx: mySymbol,
      debuff: myDebuff === 0 ? "α" : "β",
      answerCell: answerCell!,
      boardId,
    });
    setClickFeedback({});
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    startNewRound();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [startNewRound]);

  const successRate = useMemo(
    () =>
      stats.attempts === 0
        ? 0
        : Math.round((stats.score / stats.attempts) * 100),
    [stats],
  );

  const handleCellClick = (row: number, col: number) => {
    if (!gameState || isProcessing) return;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    const { answerCell } = gameState;
    const isCorrect = row === answerCell.row && col === answerCell.col;
    if (isCorrect) {
      setClickFeedback({
        clicked: { row, col, correct: true },
        correctHighlights: [],
      });
      setStats((prev) => ({
        score: prev.score + 1,
        attempts: prev.attempts + 1,
      }));
    } else {
      setClickFeedback({
        clicked: { row, col, correct: false },
        correctHighlights: [answerCell],
      });
      setStats((prev) => ({ ...prev, attempts: prev.attempts + 1 }));
    }
    setIsProcessing(true);
    timeoutRef.current = setTimeout(startNewRound, 2800);
  };

  if (!mounted || !gameState) {
    return (
      <div
        style={{
          display: "flex",
          minHeight: "100dvh",
          alignItems: "center",
          justifyContent: "center",
          background: C.crust,
        }}
      >
        <span
          style={{ color: C.overlay0, fontSize: 12, letterSpacing: "0.12em" }}
        >
          loading…
        </span>
      </div>
    );
  }

  const { board, markerIdx, debuff, boardId } = gameState;
  const marker = MARKERS[markerIdx];

  const renderCell = (rowIdx: number, colIdx: number) => {
    const value = board[rowIdx][colIdx];
    if (value === -1) return <div style={{ width: 38, height: 38 }} />;

    const isClicked =
      clickFeedback.clicked?.row === rowIdx &&
      clickFeedback.clicked?.col === colIdx;
    const isHighlight = clickFeedback.correctHighlights?.some(
      (g) => g.row === rowIdx && g.col === colIdx,
    );
    const isShapeCell = rowIdx % 2 === 0 && colIdx % 2 === 0;

    let bg = C.surface0;
    let border = C.surface1;
    let color = C.overlay0;
    let label: React.ReactNode = "·";
    let fw = 400;
    let glow = "none";

    if (isShapeCell && value > 0) {
      if (value === 2) {
        bg = "rgba(248,113,113,0.08)";
        border = "rgba(248,113,113,0.25)";
        color = "#f87171";
        label = "R";
        fw = 700;
      } else if (value === 1) {
        bg = "rgba(96,165,250,0.08)";
        border = "rgba(96,165,250,0.25)";
        color = "#60a5fa";
        label = "B";
        fw = 700;
      } else if (value === 3) {
        bg = "rgba(250,204,21,0.08)";
        border = "rgba(250,204,21,0.25)";
        color = "#facc15";
        label = "Y";
        fw = 700;
      }
    }

    if (isClicked) {
      if (clickFeedback.clicked?.correct) {
        bg = "rgba(166,227,161,0.14)";
        border = "rgba(166,227,161,0.6)";
        color = C.green;
        glow = `0 0 10px rgba(166,227,161,0.3)`;
      } else {
        bg = "rgba(243,139,168,0.14)";
        border = "rgba(243,139,168,0.6)";
        color = C.red;
        glow = `0 0 10px rgba(243,139,168,0.3)`;
      }
    } else if (isHighlight) {
      bg = "rgba(166,227,161,0.14)";
      border = "rgba(166,227,161,0.6)";
      glow = `0 0 10px rgba(166,227,161,0.3)`;
    }

    return (
      <button
        onClick={() => handleCellClick(rowIdx, colIdx)}
        disabled={isProcessing}
        style={{
          width: 38,
          height: 38,
          border: `1px solid ${border}`,
          borderRadius: 4,
          background: bg,
          color,
          fontSize: 11,
          fontWeight: fw,
          fontFamily: "var(--font-geist-mono, monospace)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isProcessing ? "default" : "pointer",
          transition: "all 100ms",
          boxShadow: glow,
          outline: "none",
        }}
        onMouseEnter={(e) => {
          if (!isProcessing && !isClicked && !isHighlight) {
            (e.currentTarget as HTMLElement).style.borderColor = C.surface2;
            (e.currentTarget as HTMLElement).style.background = C.surface1;
          }
        }}
        onMouseLeave={(e) => {
          if (!isProcessing && !isClicked && !isHighlight) {
            (e.currentTarget as HTMLElement).style.borderColor = border;
            (e.currentTarget as HTMLElement).style.background = bg;
          }
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100dvh",
        padding: "24px 16px",
        background: C.crust,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: C.subtext1,
              letterSpacing: "0.01em",
            }}
          >
            Classical Concepts 1 Sim (Elemental)
          </span>
          <span
            style={{
              fontSize: 11,
              color: C.overlay0,
              fontFamily: "var(--font-geist-mono, monospace)",
              letterSpacing: "0.08em",
            }}
          >
            #{String(boardId).padStart(4, "0")}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <Chip
            label="marker"
            value={
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  width: "64px",
                }}
              >
                <span
                  style={{ color: marker.color, display: "flex", fontSize: 12 }}
                >
                  {marker.icon}
                </span>
                <span style={{ color: C.subtext0, fontWeight: 400 }}>
                  {marker.label}
                </span>
              </span>
            }
          />
          <Chip
            label="debuff"
            value={
              <span
                style={{
                  fontFamily: "var(--font-geist-mono, monospace)",
                  color: C.white,
                }}
              >
                {debuff}
              </span>
            }
          />
          <div style={{ flex: 1 }} />
          <Chip label="score" value={stats.score} valueColor={C.green} />
          <Chip label="acc" value={`${successRate}%`} valueColor={C.mauve} />
        </div>

        <div style={{ height: 1, background: C.surface0 }} />

        <div>
          <div
            style={{
              display: "flex",
              gap: 4,
              justifyContent: "center",
              marginBottom: 6,
            }}
          >
            {Array.from({ length: TOTAL_COLS }, (_, i) => i + 1).map((col) => {
              const cm = COLUMN_MARKERS[col];
              return (
                <div
                  key={col}
                  style={{
                    width: 38,
                    height: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                  }}
                >
                  {cm ? (
                    <span style={{ color: cm.color, display: "flex" }}>
                      {cm.icon}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {Array.from({ length: TOTAL_ROWS }, (_, rowIdx) => (
              <div
                key={rowIdx}
                style={{ display: "flex", gap: 4, justifyContent: "center" }}
              >
                {Array.from({ length: TOTAL_COLS }, (_, colIdx) => (
                  <div key={colIdx}>{renderCell(rowIdx, colIdx)}</div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: C.surface0 }} />

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current);
              startNewRound();
            }}
            style={{
              flex: 1,
              height: 32,
              background: `${C.mauve}18`,
              border: `1px solid ${C.mauve}40`,
              borderRadius: 5,
              color: C.mauve,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              letterSpacing: "0.04em",
              transition: "background 120ms, border-color 120ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                `${C.mauve}28`;
              (e.currentTarget as HTMLElement).style.borderColor =
                `${C.mauve}70`;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background =
                `${C.mauve}18`;
              (e.currentTarget as HTMLElement).style.borderColor =
                `${C.mauve}40`;
            }}
          >
            Next Pull
          </button>
          <button
            onClick={() => setStats({ score: 0, attempts: 0 })}
            style={{
              width: 90,
              height: 32,
              background: C.surface0,
              border: `1px solid ${C.surface1}`,
              borderRadius: 5,
              color: C.subtext0,
              fontSize: 12,
              cursor: "pointer",
              transition: "background 120ms, border-color 120ms, color 120ms",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = C.surface1;
              (e.currentTarget as HTMLElement).style.color = C.subtext1;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = C.surface0;
              (e.currentTarget as HTMLElement).style.color = C.subtext0;
            }}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
