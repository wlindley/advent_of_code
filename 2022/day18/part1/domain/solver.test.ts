import { describe, expect, it } from 'vitest';
import { solver } from './index';

const OFFICIAL_13 = [
  '2,2,2', '1,2,2', '3,2,2', '2,1,2', '2,3,2', '2,2,1', '2,2,3',
  '2,2,4', '2,2,6', '1,2,5', '3,2,5', '2,1,5', '2,3,5',
].join('\n');

describe('2022 Day 18 Part 1 solver', () => {
  it('solves the 2-cube and official 13-cube examples', () => {
    expect(solver.solve(solver.parse('1,1,1\n2,1,1'))).toBe(10);
    expect(solver.solve(solver.parse(OFFICIAL_13))).toBe(64);
  });

  it('produces bounded total-surface trace frames ending at 64', () => {
    const droplet = solver.parse(OFFICIAL_13);
    const frames = solver.trace!(droplet, { maxSteps: 4 });
    expect(frames).toHaveLength(4);
    expect(frames[0]!.mode).toBe('total');
    expect(frames[0]!.worldZ).toBe(1);
    const last = frames[frames.length - 1]!;
    expect(last.worldZ).toBe(6);
    expect(last.cumulativeExposedFaces).toBe(64);
    expect(last.totalSurfaceArea).toBe(64);
  });

  it('rejects malformed input at parse boundary', () => {
    expect(() => solver.parse('1,2,bad')).toThrow(SyntaxError);
  });
});
