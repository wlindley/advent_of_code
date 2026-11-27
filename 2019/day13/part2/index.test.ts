import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2019 Day 13 Part 2 manifest', () => {
  it('registers metadata, Visualizer, and passing example via executeSolver', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(13);
    expect(manifest.meta.part).toBe(2);
    expect(manifest.meta.title).toBe('Care Package');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2019/day/13#part2');
    expect(manifest.exampleAnswer).toBe('12345');
    expect(typeof manifest.Visualizer).toBe('function');

    const result = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(result.answer)).toBe(manifest.exampleAnswer);
  });
});
