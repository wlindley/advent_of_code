import { describe, expect, it } from 'vitest';
import { manifest } from './index';

describe('2019 Day 9 Part 1 manifest', () => {
  it('registers metadata, solver, Visualizer, and passing official example', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(9);
    expect(manifest.meta.part).toBe(1);
    expect(manifest.meta.title).toBe('Sensor Boost');
    expect(manifest.exampleAnswer).toBe('1219070632396864');
    expect(typeof manifest.Visualizer).toBe('function');

    const parsed = manifest.solver.parse(manifest.exampleInput);
    expect(String(manifest.solver.solve(parsed))).toBe(manifest.exampleAnswer);
  });
});
