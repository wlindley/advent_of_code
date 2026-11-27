import { describe, expect, it } from 'vitest';
import { manifest } from './index';

describe('2019 Day 9 Part 2 manifest', () => {
  it('registers metadata, solver, Visualizer, and passing official example', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(9);
    expect(manifest.meta.part).toBe(2);
    expect(manifest.meta.title).toBe('Sensor Boost');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2019/day/9#part2');
    expect(manifest.exampleAnswer).toBe('2000000000000');
    expect(typeof manifest.Visualizer).toBe('function');

    const parsed = manifest.solver.parse(manifest.exampleInput);
    expect(String(manifest.solver.solve(parsed))).toBe(manifest.exampleAnswer);
  });
});
