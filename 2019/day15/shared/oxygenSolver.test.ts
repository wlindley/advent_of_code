import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram, type IntcodeProgram } from '../../shared/intcode';
import {
  DEFAULT_MAX_TRACE_STEPS,
  OXYGEN_FILL_MINUTES_POLICY,
  OxygenSystemSolver,
  SHORTEST_PATH_POLICY,
  executeOxygenSystem,
  traceOxygenSystem,
} from './oxygenSolver';

function compileMazeToIntcode(rows: readonly string[]): IntcodeProgram {
  const height = rows.length;
  const width = rows[0]!.length;
  const b = 50;
  let sx = 0, sy = 0;
  const cells: number[] = [];
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const ch = rows[y]![x]!;
      if (ch === 'S') {
        sx = x;
        sy = y;
      }
      cells.push(ch === '#' ? 0 : ch === 'O' ? 2 : 1);
    }
  }
  const code = [
    3, b, 1001, b, b + 7, 7, 1, 0, b + 1, b + 3,
    1001, b, b + 12, 15, 1, 0, b + 2, b + 4,
    1002, b + 4, width, b + 5, 1, b + 5, b + 3, b + 5,
    1001, b + 5, b + 17, 31, 1001, 0, 0, b + 6,
    4, b + 6, 1006, b + 6, 0,
    1001, b + 3, 0, b + 1, 1001, b + 4, 0, b + 2, 1105, 1, 0,
    0, sx, sy, 0, 0, 0, 0, 0, 0, 0, -1, 1, 0, -1, 1, 0, 0,
    ...cells,
  ];
  return parseIntcodeProgram(code.join(','));
}

describe('oxygenSolver', () => {
  const maze = compileMazeToIntcode([
    '#######',
    '#S..O.#',
    '#.#.#.#',
    '#.....#',
    '#######',
  ]);

  it('solves shortest path (Part 1) and oxygen fill minutes (Part 2)', () => {
    const map = executeOxygenSystem(maze);
    expect(map.oxygen).toEqual({ x: 3, y: 0 });
    expect(SHORTEST_PATH_POLICY.extractAnswer(map)).toBe(3);
    expect(OXYGEN_FILL_MINUTES_POLICY.extractAnswer(map)).toBe(5);

    const part1 = new OxygenSystemSolver(SHORTEST_PATH_POLICY);
    const part2 = new OxygenSystemSolver(OXYGEN_FILL_MINUTES_POLICY);
    expect(part1.solve(part1.parse(maze.cells.join(',')))).toBe(3);
    expect(part2.solve(maze)).toBe(5);
  });

  it('traces explore and solve phases with default and custom maxSteps bounds', () => {
    const part1 = new OxygenSystemSolver(SHORTEST_PATH_POLICY);
    const fullFrames = part1.trace(maze);
    expect(fullFrames.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect(fullFrames[0]!.phase).toBe('explore');
    expect(fullFrames[0]!.stepIndex).toBe(0);
    expect(SHORTEST_PATH_POLICY.formatFrameAnswer(fullFrames[0]!)).toBe('Pending');

    const lastPart1 = fullFrames[fullFrames.length - 1]!;
    expect(lastPart1.phase).toBe('solve');
    expect(lastPart1.shortestPath).toHaveLength(4);
    expect(SHORTEST_PATH_POLICY.formatFrameAnswer(lastPart1)).toBe('3');

    const part2Frames = traceOxygenSystem(maze, OXYGEN_FILL_MINUTES_POLICY, 6, {
      maxVmSteps: 500_000,
      maxMoves: 500,
    });
    expect(part2Frames.length).toBeLessThanOrEqual(6);
    expect(OXYGEN_FILL_MINUTES_POLICY.formatFrameAnswer(part2Frames[0]!)).toBe('Pending');
    const lastPart2 = part2Frames[part2Frames.length - 1]!;
    expect(lastPart2.shortestPath).toEqual([]);
    expect(OXYGEN_FILL_MINUTES_POLICY.formatFrameAnswer(lastPart2)).toBe('5');
  });

  it('returns only the final solve frame when maxSteps is 1 and validates maxSteps', () => {
    const single = traceOxygenSystem(maze, SHORTEST_PATH_POLICY, 1);
    expect(single).toHaveLength(1);
    expect(single[0]!.phase).toBe('solve');
    expect(single[0]!.stepIndex).toBe(single[0]!.totalSteps);
    expect(SHORTEST_PATH_POLICY.formatFrameAnswer(single[0]!)).toBe('3');

    const singlePart2 = traceOxygenSystem(maze, OXYGEN_FILL_MINUTES_POLICY, 1);
    expect(singlePart2).toHaveLength(1);
    expect(OXYGEN_FILL_MINUTES_POLICY.formatFrameAnswer(singlePart2[0]!)).toBe('5');

    const part1Bounded = traceOxygenSystem(maze, SHORTEST_PATH_POLICY, 6);
    expect(part1Bounded).toHaveLength(6);
    const firstSolve = part1Bounded.find((frame) => frame.phase === 'solve')!;
    expect(SHORTEST_PATH_POLICY.formatFrameAnswer(firstSolve)).toBe('Pending');

    const twoSteps = traceOxygenSystem(maze, SHORTEST_PATH_POLICY, 2);
    expect(twoSteps).toHaveLength(2);
    expect(twoSteps[0]!.phase).toBe('explore');
    expect(twoSteps[1]!.phase).toBe('solve');

    const tiny = compileMazeToIntcode(['###', '#S#', '###']);
    expect(executeOxygenSystem(tiny).oxygen).toBeNull();
    expect(() => traceOxygenSystem(tiny, SHORTEST_PATH_POLICY)).toThrow('Oxygen system');
    expect(() => traceOxygenSystem(maze, SHORTEST_PATH_POLICY, 0)).toThrow(RangeError);
  });
});
