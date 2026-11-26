import { describe, expect, it } from 'vitest';
import { manifest } from './index';

describe('2019 Day 7 Part 1 manifest', () => {
  it('registers metadata, solver, Visualizer, and passing official example', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(7);
    expect(manifest.meta.part).toBe(1);
    expect(manifest.meta.title).toBe('Amplification Circuit');
    expect(manifest.exampleAnswer).toBe('43210');
    expect(typeof manifest.Visualizer).toBe('function');

    const parsed = manifest.solver.parse(manifest.exampleInput);
    expect(String(manifest.solver.solve(parsed))).toBe(manifest.exampleAnswer);
  });
});
