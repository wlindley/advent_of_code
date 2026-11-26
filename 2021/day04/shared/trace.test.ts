import { describe, expect, it } from 'vitest';
import { FIRST_WINNER_POLICY, LAST_WINNER_POLICY } from './engine';
import { parseBingoGame } from './parser';
import {
  BoardSnapshot,
  DEFAULT_MAX_TRACE_STEPS,
  MAX_VISIBLE_BOARDS,
  buildDrawWindow,
  createBingoSolver,
  traceBingoGame,
} from './trace';
import { BOARD_CELL_COUNT, BingoBoard, BingoGame } from './types';

const OFFICIAL_EXAMPLE = [
  '7,4,9,5,11,17,23,2,0,14,21,24,10,16,13,6,15,25,12,22,18,20,8,19,3,26,1',
  '',
  '22 13 17 11  0',
  ' 8  2 23  4 24',
  '21  9 14 16  7',
  ' 6 10  3 18  5',
  ' 1 12 20 15 19',
  '',
  ' 3 15  0  2 22',
  ' 9 18 13 17  5',
  '19  8  7 25 23',
  '20 11 10 24  4',
  '14 21 16 12  6',
  '',
  '14 21 17 24  4',
  '10 16 15  9 19',
  '18  8 23 26 20',
  '22 11 13  6  5',
  ' 2  0 12  3  7',
].join('\n');

function makeBoard(id: number, start: number, row0: readonly number[]): BingoBoard {
  const cells = Array.from({ length: BOARD_CELL_COUNT }, (_, i) => (i < 5 ? row0[i]! : start + i));
  return new BingoBoard(id, cells);
}

describe('2021 Day 4 trace and solver factory', () => {
  it('builds bounded branch-free draw windows at start, middle, and end', () => {
    const draws = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
    expect(buildDrawWindow(draws, 0)).toEqual({
      startIndex: 0,
      activeIndex: 0,
      endIndex: 6,
      values: [10, 11, 12, 13, 14, 15, 16],
    });
    expect(buildDrawWindow(draws, 7)).toEqual({
      startIndex: 1,
      activeIndex: 7,
      endIndex: 13,
      values: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23],
    });
    expect(buildDrawWindow(draws, 14)).toEqual({
      startIndex: 8,
      activeIndex: 14,
      endIndex: 14,
      values: [18, 19, 20, 21, 22, 23, 24],
    });
  });

  it('computes dynamic BoardSnapshot metrics and checks coordinates', () => {
    const cells = Array.from({ length: BOARD_CELL_COUNT }, (_, i) => i + 1);
    const snap = new BoardSnapshot(0, cells, 0b11111, 'target-won', [{ kind: 'row', index: 0 }]);

    expect(snap.markedCount).toBe(5);
    expect(snap.isMarked(0, 0)).toBe(true);
    expect(snap.isMarked(0, 4)).toBe(true);
    expect(snap.isMarked(1, 0)).toBe(false);
    expect(snap.unmarkedSum).toBe(310n);
    expect(Object.isFrozen(snap)).toBe(true);
    expect(() => snap.isMarked(-1, 0)).toThrow(RangeError);
    expect(() => snap.isMarked(0, 5)).toThrow(RangeError);
  });

  it('traces official example for both first-winner and last-winner policies', () => {
    const game = parseBingoGame(OFFICIAL_EXAMPLE);
    const firstFrames = traceBingoGame(game, FIRST_WINNER_POLICY);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(firstFrames.length).toBe(12);
    expect(firstFrames[0]?.wonCount).toBe(0);
    expect(firstFrames[0]?.isTargetWon).toBe(false);
    expect(firstFrames[11]?.drawnValue).toBe(24);
    expect(firstFrames[11]?.wonCount).toBe(1);
    expect(firstFrames[11]?.isTargetWon).toBe(true);
    expect(firstFrames[11]?.targetSnapshot.boardId).toBe(2);
    expect(firstFrames[11]?.targetSnapshot.unmarkedSum).toBe(188n);

    const lastFrames = traceBingoGame(game, LAST_WINNER_POLICY);
    expect(lastFrames.length).toBe(15);
    expect(lastFrames[11]?.wonCount).toBe(1);
    expect(lastFrames[11]?.isTargetWon).toBe(false);
    expect(lastFrames[14]?.wonCount).toBe(3);
    expect(lastFrames[14]?.isTargetWon).toBe(true);
    expect(lastFrames[14]?.targetSnapshot.boardId).toBe(1);
    expect(lastFrames[14]?.targetSnapshot.unmarkedSum).toBe(148n);
    const frozenWinner = lastFrames[14]!.visibleBoards.find((b) => b.boardId === 2)!;
    expect(frozenWinner.winState).toBe('won');
    expect(frozenWinner.unmarkedSum).toBe(188n);
  });

  it('bounds trace frames via maxSteps and caps visibleBoards while keeping targetBoard', () => {
    const draws = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const boards = Array.from({ length: 8 }, (_, idx) =>
      idx === 7
        ? makeBoard(idx, 500, [6, 7, 8, 9, 10])
        : makeBoard(idx, 100 + idx * 30, [1, 2, 3, 4, 5]),
    );
    const game = new BingoGame(draws, boards);

    const sampled = traceBingoGame(game, LAST_WINNER_POLICY, { maxSteps: 4 });
    expect(sampled.map((f) => f.drawIndex)).toEqual([0, 3, 6, 9]);
    expect(sampled[3]?.visibleBoards.length).toBe(MAX_VISIBLE_BOARDS);
    expect(sampled[3]?.visibleBoards.some((b) => b.boardId === 7)).toBe(true);
    expect(sampled[3]?.targetSnapshot.boardId).toBe(7);

    const single = traceBingoGame(game, FIRST_WINNER_POLICY, { maxSteps: 1 });
    expect(single.map((f) => f.drawIndex)).toEqual([4]);
    expect(() => traceBingoGame(game, FIRST_WINNER_POLICY, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('creates frozen PolicyBingoSolver instances delegating parse, solve, and trace', () => {
    const solver = createBingoSolver(FIRST_WINNER_POLICY);
    expect(Object.isFrozen(solver)).toBe(true);
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(parsed)).toBe(4512n);
    expect(solver.trace!(parsed).length).toBe(12);
    expect(solver.trace!(parsed, { maxSteps: 3 }).map((f) => f.drawIndex)).toEqual([0, 6, 11]);
  });
});
