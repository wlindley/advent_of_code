import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2021 Day 8 Part 2 manifest', () => {
  it('registers metadata, example input/answer, solver, and visualizer', () => {
    expect(manifest.meta.year).toBe(2021);
    expect(manifest.meta.day).toBe(8);
    expect(manifest.meta.part).toBe(2);
    expect(manifest.meta.title).toBe('Seven Segment Search');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2021/day/8#part2');
    expect(typeof manifest.Visualizer).toBe('function');

    const result = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(result.answer)).toBe(manifest.exampleAnswer);
    expect(result.answer).toBe(61229);
  });
});
