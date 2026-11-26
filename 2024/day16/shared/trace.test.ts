import { describe, expect, it } from 'vitest';
import { analyzeReindeerMaze } from './dijkstra';
import { parseReindeerMaze } from './parse';
import { buildMazeTrace, DEFAULT_MAX_TRACE_STEPS } from './trace';

const SAMPLE_MAZE = [
  '###############',
  '#.......#....E#',
  '#.#.###.#.###.#',
  '#.....#.#...#.#',
  '#.###.#####.#.#',
  '#.#.#.......#.#',
  '#.#.#####.###.#',
  '#...........#.#',
  '###.#.#####.#.#',
  '#...#.....#.#.#',
  '#.#.#.###.#.#.#',
  '#.....#...#.#.#',
  '#.###.#.#.#.#.#',
  '#S..#.....#...#',
  '###############',
].join('\n');

describe('buildMazeTrace', () => {
  it('builds explore, reconstruct, and complete phases bounded by maxSteps', () => {
    const analysis = analyzeReindeerMaze(parseReindeerMaze(SAMPLE_MAZE));
    const frames = buildMazeTrace(analysis);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect(frames.length).toBeGreaterThan(3);

    const phases = new Set(frames.map((f) => f.phase));
    expect(phases).toEqual(new Set(['explore', 'reconstruct', 'complete']));

    const last = frames[frames.length - 1]!;
    expect(Object.isFrozen(last)).toBe(true);
    expect(Object.isFrozen(last.context)).toBe(true);
    expect(last.phase).toBe('complete');
    expect(last.settledCount).toBe(analysis.settledCount);
    expect(last.frontierCost).toBe(7036);
    expect(last.pathStepsShown).toBe(last.context.canonicalPath.length);
    expect(last.showOptimalMask).toBe(true);
    expect(last.context.maxSettledDist).toBeGreaterThanOrEqual(7036);
  });

  it('respects maxSteps = 1, maxSteps = 2, and custom small caps', () => {
    const analysis = analyzeReindeerMaze(parseReindeerMaze(SAMPLE_MAZE));

    const one = buildMazeTrace(analysis, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.phase).toBe('complete');
    expect(one[0]!.frontierCost).toBe(7036);

    const two = buildMazeTrace(analysis, { maxSteps: 2 });
    expect(two).toHaveLength(2);
    expect(two[0]!.phase).toBe('explore');
    expect(two[1]!.phase).toBe('complete');

    const ten = buildMazeTrace(analysis, { maxSteps: 10 });
    expect(ten).toHaveLength(10);
    expect(ten[0]!.settledCount).toBe(1);
    expect(ten[ten.length - 1]!.phase).toBe('complete');
  });

  it('handles unreachable mazes without reconstruct phase and rejects invalid maxSteps', () => {
    const unreachable = analyzeReindeerMaze(parseReindeerMaze('#####\n#S#E#\n#####'));
    const frames = buildMazeTrace(unreachable);
    expect(frames.map((f) => f.phase)).toEqual(['explore', 'complete']);
    expect(frames[1]!.frontierCost).toBe(0);
    expect(frames[1]!.pathStepsShown).toBe(0);
    expect(frames[0]!.context.maxSettledDist).toBe(1);

    const oneUnreachable = buildMazeTrace(unreachable, { maxSteps: 1 });
    expect(oneUnreachable).toHaveLength(1);
    expect(oneUnreachable[0]!.phase).toBe('complete');
    expect(oneUnreachable[0]!.frontierCost).toBe(0);

    expect(() => buildMazeTrace(unreachable, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => buildMazeTrace(unreachable, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
