import { describe, expect, it } from 'vitest';
import {
  BOARD_CELL_COUNT,
  BOARD_SIZE,
  BingoBoard,
  BingoGame,
  BoardWin,
  type WinningLine,
} from './types';

function makeSequentialCells(offset: number): number[] {
  const cells: number[] = [];
  for (let i = 0; i < BOARD_CELL_COUNT; i += 1) {
    cells.push(offset + i);
  }
  return cells;
}

describe('2021 Day 4 shared types', () => {
  it('constructs an immutable BingoBoard and reads cells by (row, col)', () => {
    const raw = makeSequentialCells(0);
    const board = new BingoBoard(0, raw);
    raw[0] = 999;

    expect(BOARD_SIZE).toBe(5);
    expect(BOARD_CELL_COUNT).toBe(25);
    expect(board.id).toBe(0);
    expect(board.cells.length).toBe(25);
    expect(board.cellAt(0, 0)).toBe(0);
    expect(board.cellAt(4, 4)).toBe(24);
    expect(Object.isFrozen(board)).toBe(true);
    expect(Object.isFrozen(board.cells)).toBe(true);
  });

  it('rejects invalid BingoBoard ids, cell lengths, cell values, and coordinates', () => {
    const valid = makeSequentialCells(1);
    expect(() => new BingoBoard(-1, valid)).toThrow(RangeError);
    expect(() => new BingoBoard(1.5, valid)).toThrow(RangeError);
    expect(() => new BingoBoard(0, valid.slice(0, 24))).toThrow(RangeError);
    const negCells = [...valid];
    negCells[3] = -2;
    expect(() => new BingoBoard(0, negCells)).toThrow(RangeError);
    const unsafeCells = [...valid];
    unsafeCells[0] = Number.MAX_SAFE_INTEGER + 1;
    expect(() => new BingoBoard(0, unsafeCells)).toThrow(RangeError);

    const board = new BingoBoard(2, valid);
    expect(() => board.cellAt(-1, 0)).toThrow(RangeError);
    expect(() => board.cellAt(5, 0)).toThrow(RangeError);
    expect(() => board.cellAt(0, -1)).toThrow(RangeError);
    expect(() => board.cellAt(0, 5)).toThrow(RangeError);
    expect(() => board.cellAt(1.5, 0)).toThrow(RangeError);
  });

  it('constructs an immutable BingoGame with dynamic counts and validates uniqueness', () => {
    const b0 = new BingoBoard(0, makeSequentialCells(0));
    const b1 = new BingoBoard(1, makeSequentialCells(25));
    const draws = [0, 7, 4, 9];
    const boards = [b0, b1];
    const game = new BingoGame(draws, boards);
    draws.push(99);
    boards.pop();

    expect(game.drawCount).toBe(4);
    expect(game.boardCount).toBe(2);
    expect(Object.isFrozen(game)).toBe(true);
    expect(Object.isFrozen(game.draws)).toBe(true);
    expect(Object.isFrozen(game.boards)).toBe(true);

    expect(() => new BingoGame([], [b0])).toThrow(RangeError);
    expect(() => new BingoGame([-1], [b0])).toThrow(RangeError);
    expect(() => new BingoGame([1], [])).toThrow(RangeError);
    expect(() => new BingoGame([1], [b0, new BingoBoard(0, makeSequentialCells(10))])).toThrow(
      RangeError,
    );
  });

  it('constructs an immutable BoardWin with dynamic BigInt score and validates invariants', () => {
    const lines: WinningLine[] = [{ kind: 'row', index: 0 }];
    const win = new BoardWin(2, 11, 24, 188n, lines);
    expect(win.boardId).toBe(2);
    expect(win.winDrawIndex).toBe(11);
    expect(win.winningDraw).toBe(24);
    expect(win.unmarkedSum).toBe(188n);
    expect(win.score).toBe(4512n);
    expect(win.winningLines).toEqual([{ kind: 'row', index: 0 }]);
    expect(Object.isFrozen(win)).toBe(true);
    expect(Object.isFrozen(win.winningLines)).toBe(true);
    expect(Object.isFrozen(win.winningLines[0])).toBe(true);

    expect(() => new BoardWin(-1, 0, 1, 0n, lines)).toThrow(RangeError);
    expect(() => new BoardWin(0, -1, 1, 0n, lines)).toThrow(RangeError);
    expect(() => new BoardWin(0, 0, -1, 0n, lines)).toThrow(RangeError);
    expect(() => new BoardWin(0, 0, 1, -1n, lines)).toThrow(RangeError);
    expect(() => new BoardWin(0, 0, 1, 0n, [])).toThrow(RangeError);
    expect(() => new BoardWin(0, 0, 1, 0n, [{ kind: 'col', index: 5 }])).toThrow(RangeError);
    expect(() => new BoardWin(0, 0, 1, 0n, [{ kind: 'row', index: -1 }])).toThrow(RangeError);
  });
});
