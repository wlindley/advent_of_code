import { describe, expect, it } from 'vitest';
import { solver } from './index';

const EXAMPLE_1 = [
  'start-A',
  'start-b',
  'A-c',
  'A-b',
  'b-d',
  'A-end',
  'b-end',
].join('\n');

const EXAMPLE_2 = [
  'dc-end',
  'HN-start',
  'start-kj',
  'dc-start',
  'dc-HN',
  'LN-dc',
  'HN-end',
  'kj-sa',
  'kj-HN',
  'kj-dc',
].join('\n');

const EXAMPLE_3 = [
  'fs-end',
  'he-DX',
  'fs-he',
  'start-DX',
  'pj-DX',
  'end-zg',
  'zg-sl',
  'zg-pj',
  'pj-he',
  'RW-he',
  'fs-DX',
  'pj-RW',
  'zg-RW',
  'start-pj',
  'he-WI',
  'zg-he',
  'pj-fs',
  'start-RW',
].join('\n');

describe('2021 Day 12 Part 1 solver', () => {
  it('solves all three official AoC examples', () => {
    expect(solver.solve(solver.parse(EXAMPLE_1))).toBe(10n);
    expect(solver.solve(solver.parse(EXAMPLE_2))).toBe(19n);
    expect(solver.solve(solver.parse(EXAMPLE_3))).toBe(226n);
  });

  it('captures full and bounded traces matching the solved count', () => {
    const system = solver.parse(EXAMPLE_1);
    const full = solver.trace(system);
    expect(full.at(-1)?.totalPaths).toBe(10n);
    expect(full.at(-1)?.discoveredPaths).toBe(10);
    expect(full.at(-1)?.truncated).toBe(false);

    const capped = solver.trace(system, { maxSteps: 6 });
    expect(capped).toHaveLength(6);
    expect(capped.at(-1)?.truncated).toBe(true);
    expect(capped.at(-1)?.totalPaths).toBe(10n);
  });
});
