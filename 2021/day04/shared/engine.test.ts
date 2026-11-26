import { describe, expect, it } from 'vitest';
import {
  FIRST_WINNER_POLICY,
  LAST_WINNER_POLICY,
  buildFirstDrawIndex,
  evaluateBoard,
  rankWinningBoards,
  solveBingoGame,
} from './engine';
import { parseBingoGame } from './parser';
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

function fillBoard(id: number, overrides: Readonly<Record<number, number>>, baseValue: number): BingoBoard {
  const cells = Array.from({ length: BOARD_CELL_COUNT }, (_, i) => overrides[i] ?? baseValue + i);
  return new BingoBoard(id, cells);
}

describe('2021 Day 4 engine', () => {
  it('solves the official example for both FIRST_WINNER_POLICY (4512n) and LAST_WINNER_POLICY (1924n)', () => {
    const game = parseBingoGame(OFFICIAL_EXAMPLE);
    const first = solveBingoGame(game, FIRST_WINNER_POLICY);
    const last = solveBingoGame(game, LAST_WINNER_POLICY);

    expect(first.boardId).toBe(2);
    expect(first.winDrawIndex).toBe(11);
    expect(first.winningDraw).toBe(24);
    expect(first.unmarkedSum).toBe(188n);
    expect(first.score).toBe(4512n);
    expect(first.winningLines).toEqual([{ kind: 'row', index: 0 }]);

    expect(last.boardId).toBe(1);
    expect(last.winDrawIndex).toBe(14);
    expect(last.winningDraw).toBe(13);
    expect(last.unmarkedSum).toBe(148n);
    expect(last.score).toBe(1924n);
    expect(last.winningLines).toEqual([{ kind: 'col', index: 2 }]);
  });

  it('uses first occurrence for duplicate draws and sums duplicate unmarked cells accurately', () => {
    const draws = [5, 1, 2, 3, 4, 5];
    const index = buildFirstDrawIndex(draws);
    expect(index.get(5)).toBe(0);

    const board = fillBoard(0, { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 5, 6: 99, 7: 99 }, 100);
    const win = evaluateBoard(board, index, draws)!;
    expect(win.winDrawIndex).toBe(4);
    expect(win.winningDraw).toBe(4);
    let expectedSum = 99n + 99n;
    for (let i = 8; i < BOARD_CELL_COUNT; i += 1) {
      expectedSum += BigInt(100 + i);
    }
    expect(win.unmarkedSum).toBe(expectedSum);
  });

  it('handles draw index 0 win, draw value 0, and simultaneous row+col win', () => {
    const draws = [7, 8, 9, 10, 0];
    const rowAndCol = fillBoard(
      0,
      {
        0: 7, 1: 8, 2: 0, 3: 9, 4: 10,
        7: 7, 12: 8, 17: 9, 22: 10,
      },
      200,
    );
    const win = solveBingoGame(new BingoGame(draws, [rowAndCol]), FIRST_WINNER_POLICY);
    expect(win.winDrawIndex).toBe(4);
    expect(win.winningDraw).toBe(0);
    expect(win.score).toBe(0n);
    expect(win.winningLines).toEqual([
      { kind: 'row', index: 0 },
      { kind: 'col', index: 2 },
    ]);

    const allZero = new BingoBoard(1, Array.from({ length: BOARD_CELL_COUNT }, () => 0));
    const idx0 = solveBingoGame(new BingoGame([0], [allZero]), FIRST_WINNER_POLICY);
    expect(idx0.winDrawIndex).toBe(0);
    expect(idx0.unmarkedSum).toBe(0n);
    expect(idx0.winningLines.length).toBe(10);
  });

  it('breaks simultaneous multi-board ties by ascending boardId and filters non-winners', () => {
    const draws = [1, 2, 3, 4, 5];
    const diagonalOnly = fillBoard(0, { 0: 1, 6: 2, 12: 3, 18: 4, 24: 5 }, 500);
    const winnerB = fillBoard(4, { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 }, 100);
    const winnerA = fillBoard(2, { 0: 1, 5: 2, 10: 3, 15: 4, 20: 5 }, 100);

    const ranked = rankWinningBoards(new BingoGame(draws, [diagonalOnly, winnerB, winnerA]));
    expect(ranked.map((w) => w.boardId)).toEqual([2, 4]);
    expect(FIRST_WINNER_POLICY.selectWinner(ranked).boardId).toBe(2);
    expect(LAST_WINNER_POLICY.selectWinner(ranked).boardId).toBe(4);
  });

  it('throws when no board wins and computes > MAX_SAFE_INTEGER BigInt scores', () => {
    const noWinGame = new BingoGame(
      [1, 2, 3, 4, 5],
      [fillBoard(0, { 0: 1, 6: 2, 12: 3, 18: 4, 24: 5 }, 900)],
    );
    expect(rankWinningBoards(noWinGame)).toEqual([]);
    expect(() => solveBingoGame(noWinGame, FIRST_WINNER_POLICY)).toThrow(RangeError);
    expect(() => solveBingoGame(noWinGame, LAST_WINNER_POLICY)).toThrow(RangeError);

    const bigCell = Number.MAX_SAFE_INTEGER;
    const bigBoard = fillBoard(0, { 0: 1, 1: 2, 2: 3, 3: 4, 4: 5 }, bigCell - 30);
    const bigWin = solveBingoGame(new BingoGame([1, 2, 3, 4, 5], [bigBoard]), FIRST_WINNER_POLICY);
    expect(bigWin.score > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
    expect(bigWin.score).toBe(bigWin.unmarkedSum * 5n);
  });
});
