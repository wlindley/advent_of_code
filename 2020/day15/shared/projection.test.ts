import { describe, expect, it } from 'vitest';
import {
  formatRuleFormula,
  projectGrowthSparkline,
  projectTurnTimeline,
} from './projection';
import { MemoryGameSolver, MemoryGameTraceFrame } from './solver';

describe('formatRuleFormula and projectTurnTimeline', () => {
  it('handles empty recentTurns defensively', () => {
    const empty = new MemoryGameTraceFrame({
      turn: 1,
      targetTurn: 5,
      traceHorizon: 5,
      spoken: 0,
      origin: 'seed',
      considered: null,
      previousTurn: null,
      distinctCount: 1,
      zeroCount: 1,
      maxSpoken: 0,
      recentTurns: [],
    });

    const proj = projectTurnTimeline(empty);
    expect(proj.tiles).toEqual([]);
    expect(proj.arc.mode).toBe('novel');
    expect(proj.arc.targetIndex).toBe(-1);
    expect(proj.formula).toContain('Turn 1 (Seed)');
    expect(Object.isFrozen(proj)).toBe(true);
    expect(Object.isFrozen(proj.arc)).toBe(true);
  });

  it('projects seed, novel, and in-window repeat arcs accurately', () => {
    const solver = new MemoryGameSolver(10);
    const frames = solver.trace(solver.parse('0,3,6'));

    const seedProj = projectTurnTimeline(frames[0]!);
    expect(seedProj.arc.mode).toBe('novel');
    expect(seedProj.arc.consideredIndex).toBeNull();
    expect(seedProj.arc.label).toBe('Starting seed');
    expect(seedProj.tiles[0]!.isCurrent).toBe(true);
    expect(seedProj.formula).toBe('Turn 1 (Seed): spoke 0');

    const novelProj = projectTurnTimeline(frames[3]!);
    expect(novelProj.arc.mode).toBe('novel');
    expect(novelProj.arc.consideredIndex).toBe(2);
    expect(novelProj.arc.previousIndex).toBeNull();
    expect(novelProj.arc.label).toBe('First occurrence -> 0');
    expect(novelProj.tiles[2]!.isConsidered).toBe(true);
    expect(novelProj.tiles[3]!.isCurrent).toBe(true);
    expect(novelProj.formula).toBe('Turn 4 (Novel): 6 unseen -> 0');

    const repeatProj = projectTurnTimeline(frames[4]!);
    expect(repeatProj.arc.mode).toBe('in-window');
    expect(repeatProj.arc.previousIndex).toBe(0);
    expect(repeatProj.arc.consideredIndex).toBe(3);
    expect(repeatProj.arc.targetIndex).toBe(4);
    expect(repeatProj.tiles[0]!.isPreviousMatch).toBe(true);
    expect(repeatProj.tiles[3]!.isConsidered).toBe(true);
    expect(repeatProj.tiles[4]!.isCurrent).toBe(true);
    expect(formatRuleFormula(frames[4]!)).toBe('Turn 5 (Repeat): 0 at T1 -> (4 - 1) = 3');
  });

  it('projects off-window repeat arcs when previousTurn predates the 16-turn window', () => {
    const solver = new MemoryGameSolver(500);
    const frames = solver.trace(solver.parse('0,3,6'), { maxSteps: 500 });
    const offWindow = frames.find(
      (f) => f.origin === 'repeat' && f.previousTurn !== null && f.turn - f.previousTurn > 20,
    );
    expect(offWindow).toBeDefined();

    const proj = projectTurnTimeline(offWindow!);
    expect(proj.arc.mode).toBe('off-window');
    expect(proj.arc.previousIndex).toBeNull();
    expect(proj.arc.label).toContain('off-window');
    expect(proj.tiles.every((t) => !t.isPreviousMatch)).toBe(true);
  });
});

describe('projectGrowthSparkline', () => {
  it('handles empty and single-frame traces cleanly', () => {
    const empty = projectGrowthSparkline([], 0);
    expect(empty.points).toEqual([]);
    expect(empty.maxDistinct).toBe(0);
    expect(empty.peakSpoken).toBe(0);
    expect(empty.currentPoint).toBeNull();

    const solver = new MemoryGameSolver(1);
    const singleFrames = solver.trace(solver.parse('0'));
    const single = projectGrowthSparkline(singleFrames, 5);
    expect(single.points).toHaveLength(1);
    expect(single.points[0]!.xNorm).toBe(0.5);
    expect(single.points[0]!.isCurrent).toBe(true);
    expect(single.currentPoint).toEqual(single.points[0]);
  });

  it('normalizes multi-frame distinctCount and maxSpoken trajectories and clamps currentIndex', () => {
    const solver = new MemoryGameSolver(40);
    const frames = solver.trace(solver.parse('0,3,6'), { maxSteps: 10 });
    const spark = projectGrowthSparkline(frames, 3);

    expect(spark.points).toHaveLength(10);
    expect(spark.points[0]!.xNorm).toBe(0);
    expect(spark.points[9]!.xNorm).toBe(1);
    expect(spark.points[9]!.distinctYNorm).toBe(1);
    expect(spark.points[9]!.maxSpokenYNorm).toBe(1);
    expect(spark.points[3]!.isCurrent).toBe(true);
    expect(spark.currentPoint).toEqual(spark.points[3]);
    expect(Object.isFrozen(spark)).toBe(true);
    expect(Object.isFrozen(spark.points)).toBe(true);
  });
});
