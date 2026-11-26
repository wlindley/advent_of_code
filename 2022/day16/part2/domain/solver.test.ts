import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { PART2_TIME_LIMIT, solver } from './index';

const OFFICIAL_EXAMPLE = [
  'Valve AA has flow rate=0; tunnels lead to valves DD, II, BB',
  'Valve BB has flow rate=13; tunnels lead to valves CC, AA',
  'Valve CC has flow rate=2; tunnels lead to valves DD, BB',
  'Valve DD has flow rate=20; tunnels lead to valves CC, AA, EE',
  'Valve EE has flow rate=3; tunnels lead to valves FF, DD',
  'Valve FF has flow rate=0; tunnels lead to valves EE, GG',
  'Valve GG has flow rate=0; tunnels lead to valves FF, HH',
  'Valve HH has flow rate=22; tunnel leads to valve GG',
  'Valve II has flow rate=0; tunnels lead to valves AA, JJ',
  'Valve JJ has flow rate=21; tunnel leads to valve II',
].join('\n');

describe('2022 Day 16 Part 2 solver', () => {
  it('solves the official example to 1707 within 26 minutes', () => {
    expect(PART2_TIME_LIMIT).toBe(26);
    const result = executeSolver(solver, OFFICIAL_EXAMPLE);
    expect(result.answer).toBe(1707);
  });

  it('produces a bounded dual-agent timeline trace matching 1707', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace!(parsed);
    expect(frames.length).toBe(27);
    expect(frames[0]!.minute).toBe(0);
    expect(frames[0]!.agents.map((a) => a.label)).toEqual(['You', 'Elephant']);
    expect(frames[frames.length - 1]!.minute).toBe(26);
    expect(frames[frames.length - 1]!.cumulativePressure).toBe(1707);

    const sampled = solver.trace!(parsed, { maxSteps: 10 });
    expect(sampled.length).toBe(10);
    expect(sampled[sampled.length - 1]!.cumulativePressure).toBe(1707);
  });

  it('rejects invalid raw input during parse', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('Valve BB has flow rate=10; tunnel leads to valve BB')).toThrow();
  });
});
