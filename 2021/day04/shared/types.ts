export const BOARD_SIZE = 5;
export const BOARD_CELL_COUNT = BOARD_SIZE * BOARD_SIZE;

export type WinningLineKind = 'row' | 'col';

export interface WinningLine {
  readonly kind: WinningLineKind;
  readonly index: number;
}

function assertNonNegSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
}

function assertBoardAxis(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 0 || value >= BOARD_SIZE) {
    throw new RangeError(`${label} must be an integer in [0, ${BOARD_SIZE - 1}], got ${value}`);
  }
}

function freezeWinningLines(lines: readonly WinningLine[]): readonly WinningLine[] {
  if (lines.length === 0) {
    throw new RangeError('BoardWin requires at least one winning line');
  }
  const frozen: WinningLine[] = [];
  for (const line of lines) {
    assertBoardAxis(line.index, `winningLine(${line.kind}).index`);
    frozen.push(Object.freeze({ kind: line.kind, index: line.index }));
  }
  return Object.freeze(frozen);
}

/** Immutable 5x5 Bingo board storing its flat row-major cell grid. */
export class BingoBoard {
  readonly id: number;
  readonly cells: readonly number[];

  constructor(id: number, cells: readonly number[]) {
    assertNonNegSafeInt(id, 'board.id');
    if (cells.length !== BOARD_CELL_COUNT) {
      throw new RangeError(`BingoBoard(${id}) requires ${BOARD_CELL_COUNT} cells, got ${cells.length}`);
    }
    for (let i = 0; i < cells.length; i += 1) {
      assertNonNegSafeInt(cells[i]!, `board[${id}].cells[${i}]`);
    }
    this.id = id;
    this.cells = Object.freeze([...cells]);
    Object.freeze(this);
  }

  cellAt(row: number, col: number): number {
    assertBoardAxis(row, 'row');
    assertBoardAxis(col, 'col');
    return this.cells[row * BOARD_SIZE + col]!;
  }
}

/** Immutable Bingo game containing validated draw sequence and uniquely-identified boards. */
export class BingoGame {
  readonly draws: readonly number[];
  readonly boards: readonly BingoBoard[];

  constructor(draws: readonly number[], boards: readonly BingoBoard[]) {
    if (draws.length === 0) {
      throw new RangeError('BingoGame requires at least one draw');
    }
    for (let i = 0; i < draws.length; i += 1) {
      assertNonNegSafeInt(draws[i]!, `draws[${i}]`);
    }
    if (boards.length === 0) {
      throw new RangeError('BingoGame requires at least one board');
    }
    const seenIds = new Set<number>();
    for (const board of boards) {
      if (seenIds.has(board.id)) {
        throw new RangeError(`Duplicate board id: ${board.id}`);
      }
      seenIds.add(board.id);
    }
    this.draws = Object.freeze([...draws]);
    this.boards = Object.freeze([...boards]);
    Object.freeze(this);
  }

  get drawCount(): number {
    return this.draws.length;
  }

  get boardCount(): number {
    return this.boards.length;
  }
}

/** Immutable outcome for a winning Bingo board with dynamically computed BigInt score. */
export class BoardWin {
  readonly boardId: number;
  readonly winDrawIndex: number;
  readonly winningDraw: number;
  readonly unmarkedSum: bigint;
  readonly winningLines: readonly WinningLine[];

  constructor(
    boardId: number,
    winDrawIndex: number,
    winningDraw: number,
    unmarkedSum: bigint,
    winningLines: readonly WinningLine[],
  ) {
    assertNonNegSafeInt(boardId, 'boardId');
    assertNonNegSafeInt(winDrawIndex, 'winDrawIndex');
    assertNonNegSafeInt(winningDraw, 'winningDraw');
    if (unmarkedSum < 0n) {
      throw new RangeError(`unmarkedSum must be non-negative, got ${unmarkedSum}`);
    }
    this.boardId = boardId;
    this.winDrawIndex = winDrawIndex;
    this.winningDraw = winningDraw;
    this.unmarkedSum = unmarkedSum;
    this.winningLines = freezeWinningLines(winningLines);
    Object.freeze(this);
  }

  get score(): bigint {
    return this.unmarkedSum * BigInt(this.winningDraw);
  }
}

export interface WinnerSelectionPolicy {
  readonly id: 'first' | 'last';
  readonly label: string;
  selectWinner(winners: readonly BoardWin[]): BoardWin;
}
