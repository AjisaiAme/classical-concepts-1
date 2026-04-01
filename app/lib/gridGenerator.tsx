import grids from ".././grids.json";

export enum SymbolColor {
  Blue = 1,
  Red = 2,
  Yellow = 3,
}

export const ANSWER_CELL = -2;

const VALID_BOARDS: number[][][] = grids;

let previousMarker = -1;

// random grid from json
export function selectRandomBoard(): number {
  return Math.floor(Math.random() * VALID_BOARDS.length);
}

// marker (0–3) with a slight bias against repeating the last one
export function selectRandomMarker(): number {
  const candidates: number[] = [];
  for (let marker = 0; marker < 4; marker++) {
    candidates.push(marker);
    if (marker !== previousMarker) {
      candidates.push(marker, marker, marker);
    } else {
      if (previousMarker !== 0) candidates.push(0);
      if (previousMarker !== 1) candidates.push(1);
      if (previousMarker !== 2) candidates.push(2);
      if (previousMarker !== 3) candidates.push(3);
    }
  }
  const chosenMarker =
    candidates[Math.floor(Math.random() * candidates.length)];
  previousMarker = chosenMarker;
  return chosenMarker;
}

export function selectRandomDebuff(): number {
  return Math.floor(Math.random() * 2);
}

export function expandTo7x5Grid(
  baseBoard: number[][],
): (number | undefined)[][] {
  const grid: (number | undefined)[][] = [
    [0, undefined, 0, undefined, 0, undefined, 0],
    [undefined, -1, undefined, -1, undefined, -1, undefined],
    [0, undefined, 0, undefined, 0, undefined, 0],
    [undefined, -1, undefined, -1, undefined, -1, undefined],
    [0, undefined, 0, undefined, 0, undefined, 0],
  ];

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      grid[row * 2][col * 2] = baseBoard[row][col];
    }
  }
  return grid;
}

export function findAdjacentOfColor(
  board: number[][],
  x: number,
  y: number,
  color: SymbolColor,
): [number, number][] {
  const adjacent: [number, number][] = [];
  if (board[x - 1]?.[y] === color) adjacent.push([x - 1, y]);
  if (board[x + 1]?.[y] === color) adjacent.push([x + 1, y]);
  if (board[x]?.[y - 1] === color) adjacent.push([x, y - 1]);
  if (board[x]?.[y + 1] === color) adjacent.push([x, y + 1]);
  return adjacent;
}

export function locateBlueForMarker(
  board: number[][],
  markerCol: number,
): [number, number] {
  for (let row = 0; row < 3; row++) {
    if (board[row][markerCol] === SymbolColor.Blue) {
      return [row, markerCol];
    }
  }
  return [-1, markerCol];
}

export function locateCorrectShape(
  board: number[][],
  bluePos: [number, number],
  myColor: SymbolColor,
): [number, number] {
  const candidates = findAdjacentOfColor(
    board,
    bluePos[0],
    bluePos[1],
    myColor,
  );
  if (candidates.length === 1) {
    return candidates[0];
  }

  for (const [sx, sy] of candidates) {
    const adjacentBlues = findAdjacentOfColor(board, sx, sy, SymbolColor.Blue);
    const onlyThisBlue = adjacentBlues.every(
      ([bx, by]) => bx === bluePos[0] && by === bluePos[1],
    );
    if (onlyThisBlue) {
      return [sx, sy];
    }
  }

  // Fallback (shouldn't happen with valid boards)
  return candidates[0];
}

export interface GeneratedBoard {
  board: number[][];
  mySymbol: number;
  myDebuff: number;
  boardId: number;
}

export function generateBoard(): GeneratedBoard {
  const myMarker = selectRandomMarker(); // 0‑3
  const myDebuff = selectRandomDebuff(); // 0 or 1
  const myTargetColor = myDebuff === 0 ? SymbolColor.Red : SymbolColor.Yellow;

  const boardId = selectRandomBoard();
  const baseBoard = VALID_BOARDS[boardId];

  const expandedBoard = expandTo7x5Grid(baseBoard) as number[][];

  // Where is the blue for this marker?
  const bluePos = locateBlueForMarker(baseBoard, myMarker);

  // Which adjacent shape of my colour is the correct one?
  const shapePos = locateCorrectShape(baseBoard, bluePos, myTargetColor);

  // The gap lies exactly halfway between the blue and that shape.
  const gapRow = bluePos[0] * 2 - (bluePos[0] - shapePos[0]);
  const gapCol = bluePos[1] * 2 - (bluePos[1] - shapePos[1]);

  // Place the answer marker in the expanded grid.
  expandedBoard[gapRow][gapCol] = ANSWER_CELL;

  return {
    board: expandedBoard,
    mySymbol: myMarker,
    myDebuff,
    boardId,
  };
}
