import {
  BOARD_CELL_COUNT,
  BOARD_SIZE,
  BingoBoard,
  BingoGame,
  BoardWin,
  type WinnerSelectionPolicy,
  type WinningLine,
} from './types';

interface LineCompletion {
  readonly line: WinningLine;
  readonly drawTime: number;
}

/** Maps each drawn number to the earliest draw index at which it is called. */
export function buildFirstDrawIndex(draws: readonly number[]): ReadonlyMap<number, number> {
  const firstDraw = new Map<number, number>();
  for (let i = 0; i < draws.length; i += 1) {
    const value = draws[i]!;
    if (!firstDraw.has(value)) {
      firstDraw.set(value, i);
    }
  }
  return firstDraw;
}

function computeCellDrawTimes(
  board: BingoBoard,
  firstDrawIndex: ReadonlyMap<number, number>,
): readonly number[] {
  const times: number[] = [];
  for (let i = 0; i < BOARD_CELL_COUNT; i += 1) {
    times.push(firstDrawIndex.get(board.cells[i]!) ?? Infinity);
  }
  return times;
}

function computeLineCompletions(cellTimes: readonly number[]): readonly LineCompletion[] {
  const completions: LineCompletion[] = [];
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    let rowMax = 0;
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      rowMax = Math.max(rowMax, cellTimes[r * BOARD_SIZE + c]!);
    }
    completions.push({ line: { kind: 'row', index: r }, drawTime: rowMax });
  }
  for (let c = 0; c < BOARD_SIZE; c += 1) {
    let colMax = 0;
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      colMax = Math.max(colMax, cellTimes[r * BOARD_SIZE + c]!);
    }
    completions.push({ line: { kind: 'col', index: c }, drawTime: colMax });
  }
  return completions;
}

function sumUnmarkedAfter(
  board: BingoBoard,
  cellTimes: readonly number[],
  winDrawIndex: number,
): bigint {
  let sum = 0n;
  for (let i = 0; i < BOARD_CELL_COUNT; i += 1) {
    if (cellTimes[i]! > winDrawIndex) {
      sum += BigInt(board.cells[i]!);
    }
  }
  return sum;
}

/** Evaluates a board's earliest row/column completion and score, or `null` if it never wins. */
export function evaluateBoard(
  board: BingoBoard,
  firstDrawIndex: ReadonlyMap<number, number>,
  draws: readonly number[],
): BoardWin | null {
  const cellTimes = computeCellDrawTimes(board, firstDrawIndex);
  const completions = computeLineCompletions(cellTimes);
  let bestTime = Infinity;
  for (const item of completions) {
    if (item.drawTime < bestTime) {
      bestTime = item.drawTime;
    }
  }
  if (!Number.isFinite(bestTime)) {
    return null;
  }
  const winningLines: WinningLine[] = [];
  for (const item of completions) {
    if (item.drawTime === bestTime) {
      winningLines.push(item.line);
    }
  }
  const unmarkedSum = sumUnmarkedAfter(board, cellTimes, bestTime);
  return new BoardWin(board.id, bestTime, draws[bestTime]!, unmarkedSum, winningLines);
}

/** Deterministic comparator ordering wins by earliest draw index, then ascending boardId. */
export function compareBoardWins(a: BoardWin, b: BoardWin): number {
  if (a.winDrawIndex !== b.winDrawIndex) {
    return a.winDrawIndex - b.winDrawIndex;
  }
  return a.boardId - b.boardId;
}

/** Evaluates all boards and returns winning outcomes sorted deterministically by win time. */
export function rankWinningBoards(game: BingoGame): readonly BoardWin[] {
  const firstDrawIndex = buildFirstDrawIndex(game.draws);
  const wins: BoardWin[] = [];
  for (const board of game.boards) {
    const outcome = evaluateBoard(board, firstDrawIndex, game.draws);
    if (outcome !== null) {
      wins.push(outcome);
    }
  }
  wins.sort(compareBoardWins);
  return Object.freeze(wins);
}

function assertHasWinners(winners: readonly BoardWin[]): void {
  if (winners.length === 0) {
    throw new RangeError('No board completes a row or column for the given draws');
  }
}

function selectFirstWinner(winners: readonly BoardWin[]): BoardWin {
  assertHasWinners(winners);
  return winners[0]!;
}

function selectLastWinner(winners: readonly BoardWin[]): BoardWin {
  assertHasWinners(winners);
  return winners[winners.length - 1]!;
}

export const FIRST_WINNER_POLICY: WinnerSelectionPolicy = Object.freeze({
  id: 'first',
  label: 'First Winner',
  selectWinner: selectFirstWinner,
});

export const LAST_WINNER_POLICY: WinnerSelectionPolicy = Object.freeze({
  id: 'last',
  label: 'Last Winner',
  selectWinner: selectLastWinner,
});

/** Solves a BingoGame according to the supplied winner-selection policy. */
export function solveBingoGame(game: BingoGame, policy: WinnerSelectionPolicy): BoardWin {
  return policy.selectWinner(rankWinningBoards(game));
}
