import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_INPUT = [
  '7,4,9,5,11,17,23,2,0,14,21,24,10,16,13,6,15,25,12,22,18,20,8,19,3,26,1',
  '22 13 17 11  0\n 8  2 23  4 24\n21  9 14 16  7\n 6 10  3 18  5\n 1 12 20 15 19',
  ' 3 15  0  2 22\n 9 18 13 17  5\n19  8  7 25 23\n20 11 10 24  4\n14 21 16 12  6',
  '14 21 17 24  4\n10 16 15  9 19\n18  8 23 26 20\n22 11 13  6  5\n 2  0 12  3  7',
].join('\n\n');

function fixedNowMs(): number { return 100; }
const FIXED_CLOCK: Clock = Object.freeze({ nowMs: fixedNowMs });
function nextSeed(seed: number): number { return (Math.imul(seed, 1664525) + 1013904223) >>> 0; }
function parseSpaceNums(block: string): number[] { return parseNums(block, /\s+/); }
function makeEmptyMarks(): boolean[] { return new Array<boolean>(25).fill(false); }

function makeGrid(start: number): string {
  const rows: string[] = [];
  for (let r = 0; r < 5; r += 1) { const n = start + r * 5; rows.push(`${n} ${n + 1} ${n + 2} ${n + 3} ${n + 4}`); }
  return rows.join('\n');
}

function hasCompletedLine(marked: readonly boolean[]): boolean {
  for (let i = 0; i < 5; i += 1) {
    let rowOk = true, colOk = true;
    for (let j = 0; j < 5; j += 1) {
      if (!marked[i * 5 + j]) rowOk = false;
      if (!marked[j * 5 + i]) colOk = false;
    }
    if (rowOk || colOk) return true;
  }
  return false;
}

function parseNums(text: string, sep: RegExp): number[] {
  const nums: number[] = [];
  for (const token of text.trim().split(sep)) { if (token !== '') nums.push(Number(token)); }
  return nums;
}

function scoreBoard(cells: readonly number[], marked: readonly boolean[], draw: number): bigint {
  let sum = 0n;
  for (let i = 0; i < 25; i += 1) { if (!marked[i]) sum += BigInt(cells[i]!); }
  return sum * BigInt(draw);
}

function oracleLastWinnerScore(raw: string): bigint | null {
  const blocks = raw.trim().split(/\n\s*\n/);
  const draws = parseNums(blocks[0]!, /,/);
  const boards = blocks.slice(1).map(parseSpaceNums);
  const marks = boards.map(makeEmptyMarks);
  const won = new Array<boolean>(boards.length).fill(false);
  let lastScore: bigint | null = null;
  for (const draw of draws) {
    for (let b = 0; b < boards.length; b += 1) {
      if (won[b]) continue;
      for (let i = 0; i < 25; i += 1) { if (boards[b]![i] === draw) marks[b]![i] = true; }
      if (hasCompletedLine(marks[b]!)) { won[b] = true; lastScore = scoreBoard(boards[b]!, marks[b]!, draw); }
    }
  }
  return lastScore;
}

function buildRandomGame(seed: number): string {
  let s = nextSeed(seed);
  const draws: number[] = [];
  for (let i = 0, n = 15 + (s % 26); i < n; i += 1) { s = nextSeed(s); draws.push(s % 30); }
  s = nextSeed(s);
  const sections: string[] = [draws.join(',')];
  for (let b = 0, bc = 3 + (s % 3); b < bc; b += 1) {
    const rows: string[] = [];
    for (let r = 0; r < 5; r += 1) {
      const cols: number[] = [];
      for (let c = 0; c < 5; c += 1) { s = nextSeed(s); cols.push(s % 30); }
      rows.push(cols.join(' '));
    }
    sections.push(rows.join('\n'));
  }
  return sections.join('\n\n');
}

function extractDrawIndices(frames: readonly { readonly drawIndex: number }[]): number[] {
  const indices: number[] = [];
  for (let i = 0; i < frames.length; i += 1) indices.push(frames[i]!.drawIndex);
  return indices;
}

describe('2021 Day 4 Part 2 solver', () => {
  it('solves the official example to 1924n', () => {
    expect(solver.solve(solver.parse(EXAMPLE_INPUT))).toBe(1924n);
  });

  it('ignores diagonal-only and never-winning boards, keeping them pending', () => {
    const game = solver.parse(['1,7,13,19,25,101,102,103,104,105', makeGrid(1), makeGrid(101)].join('\n\n'));
    expect(solver.solve(game)).toBe(242550n);
    const last = solver.trace!(game).at(-1)!;
    expect(last.targetBoardId).toBe(1);
    expect(last.boardStatuses[0]).toEqual({ boardId: 0, winState: 'pending', winDrawIndex: null });
  });

  it('breaks simultaneous last-draw ties by selecting the highest boardId', () => {
    const game = solver.parse(['1,2,3,4,26,27,28,29,5', makeGrid(1), makeGrid(26).replace('30', '5')].join('\n\n'));
    expect(solver.solve(game)).toBe(4050n);
    expect(solver.trace!(game).at(-1)!.targetBoardId).toBe(1);
  });

  it('returns 0n for winning draw 0 and handles BigInt overflow > MAX_SAFE_INTEGER', () => {
    expect(solver.solve(solver.parse(['1,2,3,4,0', makeGrid(1).replace(' 5', ' 0')].join('\n\n')))).toBe(0n);
    const base = Number.MAX_SAFE_INTEGER - 25;
    const rest = makeGrid(base + 5).split('\n').slice(0, 4).join('\n');
    const bigGame = solver.parse([`${base},${base + 1},${base + 2},${base + 3},7`, `${base} ${base + 1} ${base + 2} ${base + 3} 7\n${rest}`].join('\n\n'));
    let expectedSum = 0n;
    for (let i = 5; i < 25; i += 1) expectedSum += BigInt(base + i);
    const score = solver.solve(bigGame);
    expect(score).toBe(expectedSum * 7n);
    expect(score > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it('matches oracleLastWinnerScore across 30 seeded PRNG games', () => {
    let winnersSeen = 0;
    for (let seed = 1; seed <= 30; seed += 1) {
      const raw = buildRandomGame(seed);
      const expected = oracleLastWinnerScore(raw);
      const game = solver.parse(raw);
      if (expected === null) expect(solver.solve.bind(solver, game)).toThrow(RangeError);
      else { winnersSeen += 1; expect(solver.solve(game)).toBe(expected); }
    }
    expect(winnersSeen).toBeGreaterThanOrEqual(20);
  });

  it('produces uncapped and maxSteps-bounded trace frames with frozen earlier winners', () => {
    const game = solver.parse(EXAMPLE_INPUT);
    const full = solver.trace!(game);
    expect(full.length).toBe(15);
    expect(full[11]!.wonCount).toBe(1);
    expect(full[11]!.isTargetWon).toBe(false);
    expect(full[14]!.drawnValue).toBe(13);
    expect(full[14]!.wonCount).toBe(3);
    expect(full[14]!.isTargetWon).toBe(true);
    expect(full[14]!.targetBoardId).toBe(1);
    expect(full[14]!.targetSnapshot.unmarkedSum).toBe(148n);
    expect(full[14]!.visibleBoards[2]!.winState).toBe('won');
    expect(full[14]!.visibleBoards[2]!.unmarkedSum).toBe(188n);
    const bounded4 = solver.trace!(game, { maxSteps: 4 });
    expect(extractDrawIndices(bounded4)).toEqual([0, 5, 9, 14]);
    expect(bounded4[3]!.targetSnapshot.unmarkedSum).toBe(148n);
    const bounded1 = solver.trace!(game, { maxSteps: 1 });
    expect(extractDrawIndices(bounded1)).toEqual([14]);
    expect(bounded1[0]!.isTargetWon).toBe(true);
    expect(solver.trace!.bind(solver, game, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('integrates with executeSolver and rejects invalid or no-winner inputs', () => {
    expect(executeSolver(solver, EXAMPLE_INPUT, FIXED_CLOCK)).toEqual({ answer: 1924n, elapsedMs: 0, runtime: 'main-thread' });
    expect(solver.parse.bind(solver, '')).toThrow(RangeError);
    expect(solver.parse.bind(solver, `1,bad\n\n${makeGrid(1)}`)).toThrow(SyntaxError);
    expect(solver.parse.bind(solver, '1\n\n1 2 3')).toThrow(RangeError);
    expect(solver.solve.bind(solver, solver.parse(`99\n\n${makeGrid(1)}`))).toThrow(RangeError);
  });
});
