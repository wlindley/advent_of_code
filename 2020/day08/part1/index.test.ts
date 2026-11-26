import { describe, expect, it } from 'vitest';
import { manifest } from './index';

describe('2020 Day 8 Part 1 manifest', () => {
  it('wires metadata, solver, example input/answer, and visualizer', () => {
    expect(manifest.meta.year).toBe(2020);
    expect(manifest.meta.day).toBe(8);
    expect(manifest.meta.part).toBe(1);
    expect(manifest.meta.title).toBe('Handheld Halting');
    expect(typeof manifest.Visualizer).toBe('function');

    const parsed = manifest.solver.parse(manifest.exampleInput);
    expect(String(manifest.solver.solve(parsed))).toBe(manifest.exampleAnswer);
  });
});
