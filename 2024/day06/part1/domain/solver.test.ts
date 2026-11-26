import { describe, expect, it } from 'vitest';
import { DIRS_4, executeSolver, Grid2D, type Clock } from '../../../../shared/core';
import { parseLabMap, simulatePatrol } from '../../shared';
import { countVisitedPositions, DEFAULT_MAX_TRACE_STEPS, solver, tracePatrol } from './solver';

const EXAMPLE_INPUT = [
  '....#.....',
  '.........#',
  '..........',
  '..#.......',
  '.......#..',
  '..........',
  '.#..^.....',
  '........#.',
  '#.........',
  '......#...',
].join('\n');

/** Independent Grid2D + Set-based reference oracle for differential testing. */
function referenceGrid2dSimulate(raw: string): { readonly outcome: 'exited' | 'loop'; readonly visited: number } {
  const grid = Grid2D.fromLines(raw, (ch) => ch);
  let row = 0;
  let col = 0;
  let dir = 0;
  const tokens = ['^', '>', 'v', '<'];
  for (let r = 0; r < grid.rows; r += 1) {
    for (let c = 0; c < grid.cols; c += 1) {
      const idx = tokens.indexOf(grid.at(r, c));
      if (idx !== -1) {
        row = r;
        col = c;
        dir = idx;
      }
    }
  }
  const visitedCells = new Set<string>([`${row},${col}`]);
  const visitedStates = new Set<string>([`${row},${col},${dir}`]);
  while (true) {
    const [dr, dc] = DIRS_4[dir]!;
    const nr = row + dr;
    const nc = col + dc;
    if (!grid.inBounds(nr, nc)) return { outcome: 'exited', visited: visitedCells.size };
    if (grid.at(nr, nc) === '#') {
      dir = (dir + 1) % 4;
    } else {
      row = nr;
      col = nc;
      visitedCells.add(`${row},${col}`);
    }
    const key = `${row},${col},${dir}`;
    if (visitedStates.has(key)) return { outcome: 'loop', visited: visitedCells.size };
    visitedStates.add(key);
  }
}

function makeSeededRandomGrid(seed: number, rows: number, cols: number): string {
  let state = seed >>> 0;
  const next = (): number => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const guardRow = Math.floor(next() * rows);
  const guardCol = Math.floor(next() * cols);
  const guardToken = ['^', '>', 'v', '<'][Math.floor(next() * 4)]!;
  const lines: string[] = [];
  for (let r = 0; r < rows; r += 1) {
    let line = '';
    for (let c = 0; c < cols; c += 1) {
      if (r === guardRow && c === guardCol) {
        line += guardToken;
      } else {
        line += next() < 0.2 ? '#' : '.';
      }
    }
    lines.push(line);
  }
  return lines.join('\n');
}

describe('2024 Day 6 Part 1 solver', () => {
  it('solves the official 10x10 example to 41', () => {
    const map = solver.parse(EXAMPLE_INPUT);
    expect(countVisitedPositions(map)).toBe(41);
    expect(solver.solve(map)).toBe(41);
  });

  it('runs executeSolver with a hand-written fake Clock', () => {
    const times = [10, 14.5];
    let idx = 0;
    const fakeClock: Clock = { nowMs: () => times[idx++] ?? 14.5 };
    const exec = executeSolver(solver, EXAMPLE_INPUT, fakeClock);
    expect(exec).toEqual({ answer: 41, elapsedMs: 4.5, runtime: 'main-thread' });
  });

  it('throws Error in countVisitedPositions when the guard enters a loop', () => {
    const loopMap = parseLabMap(['.#.', '#^#', '.#.'].join('\n'));
    expect(() => countVisitedPositions(loopMap)).toThrow(Error);
  });

  it('produces bounded, endpoint-preserving trace frames across options and map types', () => {
    const map = parseLabMap(EXAMPLE_INPUT);
    const full = tracePatrol(map);
    expect(Object.isFrozen(full)).toBe(true);
    expect(Object.isFrozen(full[0])).toBe(true);
    expect(full.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect(full[0]!.stepIndex).toBe(0);
    expect(full[full.length - 1]!.visitedCount).toBe(41);
    expect(full[full.length - 1]!.outcome).toBe('exited');

    const capped = tracePatrol(map, { maxSteps: 10 });
    expect(capped.length).toBe(10);
    expect(capped[0]!.stepIndex).toBe(0);
    expect(capped[9]!.stepIndex).toBe(capped[9]!.totalSteps - 1);
    expect(capped[9]!.visitedCount).toBe(41);
    expect(capped[9]!.turnCount).toBeGreaterThan(0);

    const singleFrame = tracePatrol(map, { maxSteps: 1 });
    expect(singleFrame.length).toBe(1);
    expect(singleFrame[0]!.stepIndex).toBe(singleFrame[0]!.totalSteps - 1);
    expect(singleFrame[0]!.visitedCount).toBe(41);

    const tiny = tracePatrol(parseLabMap('^'));
    expect(tiny).toHaveLength(1);
    expect(tiny[0]!.visitedCount).toBe(1);
    expect(tiny[0]!.turnCount).toBe(0);

    const loopTrace = tracePatrol(parseLabMap(['.#...', '....#', '.^...', '#....', '...#.'].join('\n')));
    expect(loopTrace[loopTrace.length - 1]!.outcome).toBe('loop');
    expect(loopTrace[loopTrace.length - 1]!.turnCount).toBe(4);

    for (const bad of [0, -3, 1.5]) {
      expect(() => tracePatrol(map, { maxSteps: bad })).toThrow(RangeError);
    }
  });

  it('matches the independent Grid2D reference oracle across official + 20 seeded random grids', () => {
    const grids = [EXAMPLE_INPUT];
    for (let i = 0; i < 20; i += 1) {
      const size = 5 + i;
      grids.push(makeSeededRandomGrid(9001 + i * 37, size, 25 - (i % 7)));
    }
    for (const raw of grids) {
      const expected = referenceGrid2dSimulate(raw);
      const map = parseLabMap(raw);
      const actual = simulatePatrol(map);
      expect(actual.outcome).toBe(expected.outcome);
      expect(actual.visitedCount).toBe(expected.visited);
      if (expected.outcome === 'exited') {
        expect(countVisitedPositions(map)).toBe(expected.visited);
      }
    }
  });
});
