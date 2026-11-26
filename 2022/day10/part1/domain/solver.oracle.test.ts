import { describe, expect, it } from 'vitest';
import { CpuTimeline } from '../../shared';
import { STANDARD_PROBE_CYCLES, solver } from './index';

const SMALL_EXAMPLE = 'noop\naddx 3\naddx -5';
const OFFICIAL_EXAMPLE = [
  'addx 15', 'addx -11', 'addx 6', 'addx -3', 'addx 5', 'addx -1', 'addx -8', 'addx 13',
  'addx 4', 'noop', 'addx -1', 'addx 5', 'addx -1', 'addx 5', 'addx -1', 'addx 5',
  'addx -1', 'addx 5', 'addx -1', 'addx -35', 'addx 1', 'addx 24', 'addx -19', 'addx 1',
  'addx 16', 'addx -11', 'noop', 'noop', 'addx 21', 'addx -15', 'noop', 'noop',
  'addx -3', 'addx 9', 'addx 1', 'addx -3', 'addx 8', 'addx 1', 'addx 5', 'noop',
  'noop', 'noop', 'noop', 'noop', 'addx -36', 'noop', 'addx 1', 'addx 7',
  'noop', 'noop', 'noop', 'addx 2', 'addx 6', 'noop', 'noop', 'noop',
  'noop', 'noop', 'addx 1', 'noop', 'noop', 'addx 7', 'addx 1', 'noop',
  'addx -13', 'addx 13', 'addx 7', 'noop', 'addx 1', 'addx -33', 'noop', 'noop',
  'noop', 'addx 2', 'noop', 'noop', 'noop', 'addx 8', 'noop', 'addx -1',
  'addx 2', 'addx 1', 'noop', 'addx 17', 'addx -9', 'addx 1', 'addx 1', 'addx -3',
  'addx 11', 'noop', 'noop', 'addx 1', 'noop', 'addx 1', 'noop', 'noop',
  'addx -13', 'addx -19', 'addx 1', 'addx 3', 'addx 26', 'addx -30', 'addx 12', 'addx -1',
  'addx 3', 'addx 1', 'noop', 'noop', 'noop', 'addx -9', 'addx 18', 'addx 1',
  'addx 2', 'noop', 'noop', 'addx 9', 'noop', 'noop', 'noop', 'addx -1',
  'addx 2', 'addx -37', 'addx 1', 'addx 3', 'noop', 'addx 15', 'addx -21', 'addx 22',
  'addx -6', 'addx 1', 'noop', 'addx 2', 'addx 1', 'noop', 'addx -10', 'noop',
  'noop', 'addx 20', 'addx 1', 'addx 2', 'addx 2', 'addx -6', 'addx -11', 'noop',
  'noop', 'noop',
].join('\n');

function microOpQueueOracle(raw: string): { xDuring: number[]; finalX: number; sum: number } {
  const queue: number[] = [];
  for (const line of raw.trim().split('\n')) {
    if (line === 'noop') {
      queue.push(0);
    } else {
      queue.push(0, Number(line.slice(5)));
    }
  }
  let x = 1;
  let sum = 0;
  const probeSet = new Set<number>(STANDARD_PROBE_CYCLES);
  const xDuring: number[] = [];
  for (let i = 0; i < queue.length; i += 1) {
    const cycle = i + 1;
    xDuring.push(x);
    if (probeSet.has(cycle)) sum += cycle * x;
    x += queue[i]!;
  }
  return { xDuring, finalX: x, sum };
}

function eventDrivenProbeOracle(raw: string): { finalX: number; sum: number } {
  let x = 1;
  let clock = 0;
  let probeIdx = 0;
  let sum = 0;
  for (const line of raw.trim().split('\n')) {
    const duration = line === 'noop' ? 1 : 2;
    const delta = line === 'noop' ? 0 : Number(line.slice(5));
    const nextClock = clock + duration;
    while (probeIdx < STANDARD_PROBE_CYCLES.length && STANDARD_PROBE_CYCLES[probeIdx]! <= nextClock) {
      sum += STANDARD_PROBE_CYCLES[probeIdx]! * x;
      probeIdx += 1;
    }
    clock = nextClock;
    x += delta;
  }
  return { finalX: x, sum };
}

function makeSeededPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildRandomProgram(rand: () => number, count: number): string {
  const lines: string[] = [];
  for (let i = 0; i < count; i += 1) {
    if (rand() < 0.35) {
      lines.push('noop');
    } else {
      const delta = Math.floor(rand() * 101) - 50;
      lines.push(`addx ${delta}`);
    }
  }
  return lines.join('\n');
}

describe('Day 10 Part 1 differential oracles', () => {
  it('matches both independent oracles on small and official examples', () => {
    for (const raw of [SMALL_EXAMPLE, OFFICIAL_EXAMPLE]) {
      const program = solver.parse(raw);
      const timeline = CpuTimeline.execute(program);
      const micro = microOpQueueOracle(raw);
      const event = eventDrivenProbeOracle(raw);

      expect(timeline.totalCycles).toBe(micro.xDuring.length);
      for (let c = 1; c <= timeline.totalCycles; c += 1) {
        expect(timeline.xDuringCycle(c)).toBe(micro.xDuring[c - 1]);
      }
      expect(timeline.finalX).toBe(micro.finalX);
      expect(timeline.finalX).toBe(event.finalX);
      expect(solver.solve(program)).toBe(micro.sum);
      expect(solver.solve(program)).toBe(event.sum);
    }
  });

  it('matches both oracles across 200 seeded programs and boundary instruction counts', () => {
    const rand = makeSeededPrng(20221001);
    const boundaryCounts = [19, 20, 21, 219, 220, 221, 240, 400];
    const counts = [
      ...boundaryCounts,
      ...Array.from({ length: 192 }, () => 1 + Math.floor(rand() * 300)),
    ];

    for (const count of counts) {
      const raw = buildRandomProgram(rand, count);
      const program = solver.parse(raw);
      const timeline = CpuTimeline.execute(program);
      const micro = microOpQueueOracle(raw);
      const event = eventDrivenProbeOracle(raw);

      expect(timeline.totalCycles).toBe(micro.xDuring.length);
      for (let c = 1; c <= timeline.totalCycles; c += 1) {
        expect(timeline.xDuringCycle(c)).toBe(micro.xDuring[c - 1]);
      }
      expect(timeline.finalX).toBe(micro.finalX);
      expect(timeline.finalX).toBe(event.finalX);
      expect(solver.solve(program)).toBe(micro.sum);
      expect(solver.solve(program)).toBe(event.sum);
    }
  });
});
