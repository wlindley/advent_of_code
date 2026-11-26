import { describe, expect, it } from 'vitest';
import {
  FIRST_WINNER_POLICY,
  LAST_WINNER_POLICY,
  rankWinningBoards,
  solveBingoGame,
} from './engine';
import { parseBingoGame } from './parser';
import { BOARD_CELL_COUNT, BOARD_SIZE, BingoBoard, BingoGame, type WinningLine } from './types';

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

class SeededRng {
  private state: bigint;

  constructor(seed: bigint) {
    this.state = seed & 0xffffffffffffffffn;
  }

  nextInt(bound: number): number {
    this.state = (this.state * 6364136223846793005n + 1442695040888963407n) & 0xffffffffffffffffn;
    return Number((this.state >> 32n) & 0xffffffffn) % bound;
  }
}

interface OracleWin {
  readonly boardId: number;
  readonly winDrawIndex: number;
  readonly winningDraw: number;
  readonly unmarkedSum: bigint;
  readonly score: bigint;
  readonly winningLines: readonly WinningLine[];
}

function findCompletedLines(marked: readonly boolean[]): WinningLine[] {
  const lines: WinningLine[] = [];
  for (let r = 0; r < BOARD_SIZE; r += 1) {
    let allRow = true;
    for (let c = 0; c < BOARD_SIZE; c += 1) {
      if (!marked[r * BOARD_SIZE + c]) allRow = false;
    }
    if (allRow) lines.push({ kind: 'row', index: r });
  }
  for (let c = 0; c < BOARD_SIZE; c += 1) {
    let allCol = true;
    for (let r = 0; r < BOARD_SIZE; r += 1) {
      if (!marked[r * BOARD_SIZE + c]) allCol = false;
    }
    if (allCol) lines.push({ kind: 'col', index: c });
  }
  return lines;
}

function oracleSimulateGame(game: BingoGame): OracleWin[] {
  const marked = game.boards.map(() => new Array<boolean>(BOARD_CELL_COUNT).fill(false));
  const won = new Array<boolean>(game.boardCount).fill(false);
  const wins: OracleWin[] = [];

  for (let d = 0; d < game.drawCount; d += 1) {
    const draw = game.draws[d]!;
    for (let b = 0; b < game.boardCount; b += 1) {
      if (won[b]) continue;
      const board = game.boards[b]!;
      const marks = marked[b]!;
      for (let i = 0; i < BOARD_CELL_COUNT; i += 1) {
        if (board.cells[i] === draw) marks[i] = true;
      }
      const lines = findCompletedLines(marks);
      if (lines.length > 0) {
        won[b] = true;
        let unmarkedSum = 0n;
        for (let i = 0; i < BOARD_CELL_COUNT; i += 1) {
          if (!marks[i]) unmarkedSum += BigInt(board.cells[i]!);
        }
        wins.push({
          boardId: board.id,
          winDrawIndex: d,
          winningDraw: draw,
          unmarkedSum,
          score: unmarkedSum * BigInt(draw),
          winningLines: lines,
        });
      }
    }
  }
  return wins;
}

function generateRandomGame(rng: SeededRng): BingoGame {
  const maxVal = 12 + rng.nextInt(18);
  const drawLen = 5 + rng.nextInt(35);
  const draws = Array.from({ length: drawLen }, () => rng.nextInt(maxVal));
  const boardCount = 1 + rng.nextInt(8);
  const boards = Array.from({ length: boardCount }, (_, idx) => {
    const cells = Array.from({ length: BOARD_CELL_COUNT }, () => rng.nextInt(maxVal));
    return new BingoBoard(idx * 2 + rng.nextInt(2), cells);
  });
  return new BingoGame(draws, boards);
}

describe('2021 Day 4 step-by-step simulator oracle cross-check', () => {
  it('matches oracle across the official example and 50 seeded PRNG games', () => {
    const official = parseBingoGame(OFFICIAL_EXAMPLE);
    const officialActual = rankWinningBoards(official);
    const officialOracle = oracleSimulateGame(official);
    expect(officialActual.map((w) => [w.boardId, w.winDrawIndex, w.score, w.winningLines])).toEqual(
      officialOracle.map((w) => [w.boardId, w.winDrawIndex, w.score, w.winningLines]),
    );

    const rng = new SeededRng(20210401n);
    for (let trial = 0; trial < 50; trial += 1) {
      const game = generateRandomGame(rng);
      const actual = rankWinningBoards(game);
      const expected = oracleSimulateGame(game);

      expect(actual.length).toBe(expected.length);
      for (let i = 0; i < actual.length; i += 1) {
        expect(actual[i]!.boardId).toBe(expected[i]!.boardId);
        expect(actual[i]!.winDrawIndex).toBe(expected[i]!.winDrawIndex);
        expect(actual[i]!.unmarkedSum).toBe(expected[i]!.unmarkedSum);
        expect(actual[i]!.score).toBe(expected[i]!.score);
        expect(actual[i]!.winningLines).toEqual(expected[i]!.winningLines);
      }
      if (expected.length > 0) {
        expect(solveBingoGame(game, FIRST_WINNER_POLICY).score).toBe(expected[0]!.score);
        expect(solveBingoGame(game, LAST_WINNER_POLICY).score).toBe(
          expected[expected.length - 1]!.score,
        );
      } else {
        expect(() => solveBingoGame(game, FIRST_WINNER_POLICY)).toThrow(RangeError);
        expect(() => solveBingoGame(game, LAST_WINNER_POLICY)).toThrow(RangeError);
      }
    }
  });
});
