import { describe, expect, it } from 'vitest';
import { CLUMSY_CRUCIBLE_RULE, ULTRA_CRUCIBLE_RULE } from './crucibleRule';
import { CrucibleRouter, DEFAULT_MAX_TRACE_STEPS } from './crucibleRouter';
import { HeatMap, parseHeatMap } from './heatMap';

const OFFICIAL_EXAMPLE = [
  '2413432311323',
  '3215453535623',
  '3255245654254',
  '3446585845452',
  '4546657867536',
  '1438598798454',
  '4457876987766',
  '3637877979653',
  '4654967986887',
  '4564679986453',
  '1224686865563',
  '2546548887735',
  '4322674655533',
].join('\n');

const ULTRA_EXAMPLE = [
  '111111111111',
  '999999999991',
  '999999999991',
  '999999999991',
  '999999999991',
].join('\n');

describe('CrucibleRouter', () => {
  it('solves the official 13x13 example for both Clumsy (102) and Ultra (94) rules', () => {
    const map = parseHeatMap(OFFICIAL_EXAMPLE);
    const clumsy = new CrucibleRouter(CLUMSY_CRUCIBLE_RULE).search(map);
    expect(clumsy.goalHeat).toBe(102);
    expect(clumsy.turnCells[0]).toBe(0);
    expect(clumsy.turnCells[clumsy.turnCells.length - 1]).toBe(map.goalCell);
    expect(clumsy.expandPath()[0]).toBe(0);
    expect(clumsy.expandPath().slice(-1)[0]).toBe(map.goalCell);

    const ultra = new CrucibleRouter(ULTRA_CRUCIBLE_RULE).search(map);
    expect(ultra.goalHeat).toBe(94);
  });

  it('solves the Part 2 5x12 ultra-crucible example to 71', () => {
    const map = parseHeatMap(ULTRA_EXAMPLE);
    expect(new CrucibleRouter(ULTRA_CRUCIBLE_RULE).search(map).goalHeat).toBe(71);
  });

  it('handles 1x1 fast-path, 1x5 reachable, and unreachable fast-path/queue-exhaustion cases', () => {
    const oneByOne = HeatMap.fromLines(['7']);
    const oneRes = new CrucibleRouter(ULTRA_CRUCIBLE_RULE).search(oneByOne);
    expect(oneRes.goalHeat).toBe(0);
    expect(oneRes.turnCells).toEqual([0]);

    const oneByFive = HeatMap.fromLines(['91111']);
    expect(new CrucibleRouter(ULTRA_CRUCIBLE_RULE).search(oneByFive).goalHeat).toBe(4);

    const ultraRouter = new CrucibleRouter(ULTRA_CRUCIBLE_RULE);
    expect(() => ultraRouter.search(HeatMap.fromLines(['12', '34']))).toThrow('unreachable');
    expect(() => ultraRouter.search(HeatMap.fromLines(['1234']))).toThrow('unreachable');
    expect(() => ultraRouter.search(HeatMap.fromLines(['111111', '111111']))).toThrow('unreachable');
  });

  it('produces sampled, frozen trace frames ending at goalHeat and validates maxSteps', () => {
    const map = parseHeatMap(OFFICIAL_EXAMPLE);
    const router = new CrucibleRouter(CLUMSY_CRUCIBLE_RULE);
    const frames = router.trace(map, { maxSteps: 10 });
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(10);
    expect(frames[0]!.heatThreshold).toBe(0);
    expect(frames[0]!.isComplete).toBe(false);
    expect(frames[9]!.heatThreshold).toBe(102);
    expect(frames[9]!.isComplete).toBe(true);

    const defaultFrames = router.trace(map);
    expect(defaultFrames.length).toBeLessThanOrEqual(DEFAULT_MAX_TRACE_STEPS);
    expect(defaultFrames[defaultFrames.length - 1]!.heatThreshold).toBe(102);

    expect(() => router.trace(map, { maxSteps: 0 })).toThrow(RangeError);
  });
});
