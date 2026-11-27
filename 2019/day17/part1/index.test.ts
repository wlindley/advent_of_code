import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2019 Day 17 Part 1 manifest', () => {
  it('registers metadata, Visualizer, and passing official example via executeSolver', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(17);
    expect(manifest.meta.part).toBe(1);
    expect(manifest.meta.title).toBe('Set and Forget');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2019/day/17');
    expect(manifest.exampleAnswer).toBe('76');
    expect(typeof manifest.Visualizer).toBe('function');

    const result = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(result.answer)).toBe(manifest.exampleAnswer);
  });
});
