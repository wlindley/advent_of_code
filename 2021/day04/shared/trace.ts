import { sampleTraceIndices, validateMaxSteps, type PuzzleSolver, type TraceOptions } from '../../../shared/core';
import { rankWinningBoards, solveBingoGame } from './engine';
import { parseBingoGame } from './parser';
import { BOARD_CELL_COUNT, BOARD_SIZE, BingoBoard, BingoGame, BoardWin, type WinnerSelectionPolicy, type WinningLine } from './types';

export const DEFAULT_MAX_TRACE_STEPS = 120;
export const MAX_VISIBLE_BOARDS = 6;
export const DRAW_WINDOW_RADIUS = 6;

export type BoardWinState = 'pending' | 'won' | 'target-won';
export interface DrawWindow { readonly startIndex: number; readonly activeIndex: number; readonly endIndex: number; readonly values: readonly number[]; }
export interface BoardStatus { readonly boardId: number; readonly winState: BoardWinState; readonly winDrawIndex: number | null; }

/** Immutable snapshot of one board at a draw step with dynamically derived mark stats. */
export class BoardSnapshot {
  readonly boardId: number;
  readonly cells: readonly number[];
  readonly markedMask: number;
  readonly winState: BoardWinState;
  readonly winningLines: readonly WinningLine[];

  constructor(boardId: number, cells: readonly number[], markedMask: number, winState: BoardWinState, winningLines: readonly WinningLine[]) {
    this.boardId = boardId;
    this.cells = cells;
    this.markedMask = markedMask;
    this.winState = winState;
    this.winningLines = Object.freeze([...winningLines]);
    Object.freeze(this);
  }

  isMarked(row: number, col: number): boolean {
    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) throw new RangeError(`Cell (${row}, ${col}) out of bounds`);
    return (this.markedMask & (1 << (row * BOARD_SIZE + col))) !== 0;
  }

  get markedCount(): number {
    let count = 0;
    for (let mask = this.markedMask; mask !== 0; mask &= mask - 1) count += 1;
    return count;
  }

  get unmarkedSum(): bigint {
    let sum = 0n;
    for (let i = 0; i < BOARD_CELL_COUNT; i += 1) {
      if ((this.markedMask & (1 << i)) === 0) sum += BigInt(this.cells[i]!);
    }
    return sum;
  }
}

/** Immutable draw-step trace frame deriving `wonCount` and `isTargetWon` dynamically. */
export class BingoTraceFrame {
  readonly drawIndex: number;
  readonly drawnValue: number;
  readonly drawWindow: DrawWindow;
  readonly targetBoardId: number;
  readonly boardStatuses: readonly BoardStatus[];
  readonly visibleBoards: readonly BoardSnapshot[];

  constructor(drawIndex: number, drawnValue: number, drawWindow: DrawWindow, targetBoardId: number, boardStatuses: readonly BoardStatus[], visibleBoards: readonly BoardSnapshot[]) {
    this.drawIndex = drawIndex;
    this.drawnValue = drawnValue;
    this.drawWindow = drawWindow;
    this.targetBoardId = targetBoardId;
    this.boardStatuses = Object.freeze(boardStatuses);
    this.visibleBoards = Object.freeze(visibleBoards);
    Object.freeze(this);
  }

  get wonCount(): number {
    let total = 0;
    for (const status of this.boardStatuses) { if (status.winState !== 'pending') total += 1; }
    return total;
  }

  get isTargetWon(): boolean { return this.boardStatuses.some((status) => status.winState === 'target-won'); }
  get targetSnapshot(): BoardSnapshot { return this.visibleBoards.find((snap) => snap.boardId === this.targetBoardId)!; }
}

/** Builds a branch-free sliding window of draws centered around `drawIndex`. */
export function buildDrawWindow(draws: readonly number[], drawIndex: number): DrawWindow {
  const startIndex = Math.max(0, drawIndex - DRAW_WINDOW_RADIUS);
  const endIndex = Math.min(draws.length - 1, drawIndex + DRAW_WINDOW_RADIUS);
  return Object.freeze({ startIndex, activeIndex: drawIndex, endIndex, values: Object.freeze(draws.slice(startIndex, endIndex + 1)) });
}

function selectVisibleIndices(boardCount: number, targetIndex: number): readonly number[] {
  if (boardCount <= MAX_VISIBLE_BOARDS) return Array.from({ length: boardCount }, (_, i) => i);
  const indices = Array.from({ length: MAX_VISIBLE_BOARDS - 1 }, (_, i) => i);
  indices.push(targetIndex < MAX_VISIBLE_BOARDS - 1 ? MAX_VISIBLE_BOARDS - 1 : targetIndex);
  return indices;
}

function resolveBoardState(win: BoardWin | undefined, drawIndex: number, targetId: number): BoardWinState {
  if (win === undefined || win.winDrawIndex > drawIndex) return 'pending';
  return win.boardId === targetId ? 'target-won' : 'won';
}

function applyDrawToMasks(boards: readonly BingoBoard[], masks: number[], winsById: ReadonlyMap<number, BoardWin>, drawIndex: number, drawnValue: number): void {
  for (let b = 0; b < boards.length; b += 1) {
    const board = boards[b]!;
    const win = winsById.get(board.id);
    if (win !== undefined && win.winDrawIndex < drawIndex) continue;
    let mask = masks[b]!;
    for (let i = 0; i < BOARD_CELL_COUNT; i += 1) { if (board.cells[i] === drawnValue) mask |= 1 << i; }
    masks[b] = mask;
  }
}

function buildFrameAtDraw(game: BingoGame, drawIndex: number, masks: readonly number[], winsById: ReadonlyMap<number, BoardWin>, targetBoardId: number, visibleIndices: readonly number[]): BingoTraceFrame {
  const statuses = game.boards.map((board) => {
    const win = winsById.get(board.id);
    const winState = resolveBoardState(win, drawIndex, targetBoardId);
    return Object.freeze({ boardId: board.id, winState, winDrawIndex: winState === 'pending' ? null : win!.winDrawIndex });
  });
  const visible = visibleIndices.map((idx) => {
    const board = game.boards[idx]!;
    const win = winsById.get(board.id);
    const winState = resolveBoardState(win, drawIndex, targetBoardId);
    return new BoardSnapshot(board.id, board.cells, masks[idx]!, winState, winState === 'pending' ? [] : win!.winningLines);
  });
  return new BingoTraceFrame(drawIndex, game.draws[drawIndex]!, buildDrawWindow(game.draws, drawIndex), targetBoardId, statuses, visible);
}

/** Generates bounded draw-by-draw trace frames up to the selected winner's winning draw. */
export function traceBingoGame(game: BingoGame, policy: WinnerSelectionPolicy, options?: TraceOptions): readonly BingoTraceFrame[] {
  const limit = validateMaxSteps(options?.maxSteps, DEFAULT_MAX_TRACE_STEPS);
  const ranked = rankWinningBoards(game);
  const targetWin = policy.selectWinner(ranked);
  const winsById = new Map<number, BoardWin>(ranked.map((w) => [w.boardId, w]));
  const visibleIndices = selectVisibleIndices(game.boardCount, game.boards.findIndex((b) => b.id === targetWin.boardId));
  const sampled = sampleTraceIndices(targetWin.winDrawIndex + 1, limit);
  const masks = new Array<number>(game.boardCount).fill(0);
  const frames: BingoTraceFrame[] = [];
  for (let d = 0, cursor = 0; d <= targetWin.winDrawIndex; d += 1) {
    applyDrawToMasks(game.boards, masks, winsById, d, game.draws[d]!);
    if (d === sampled[cursor]) { frames.push(buildFrameAtDraw(game, d, masks, winsById, targetWin.boardId, visibleIndices)); cursor += 1; }
  }
  return Object.freeze(frames);
}

/** Policy-parameterized PuzzleSolver implementation for Giant Squid. */
export class PolicyBingoSolver implements PuzzleSolver<BingoGame, bigint, BingoTraceFrame> {
  readonly policy: WinnerSelectionPolicy;
  constructor(policy: WinnerSelectionPolicy) { this.policy = policy; }
  parse(raw: string): BingoGame { return parseBingoGame(raw); }
  solve(game: BingoGame): bigint { return solveBingoGame(game, this.policy).score; }
  trace(game: BingoGame, options?: TraceOptions): readonly BingoTraceFrame[] { return traceBingoGame(game, this.policy, options); }
}

export function createBingoSolver(policy: WinnerSelectionPolicy): PuzzleSolver<BingoGame, bigint, BingoTraceFrame> {
  return Object.freeze(new PolicyBingoSolver(policy));
}
