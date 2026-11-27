import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2021 Day 12 Part 1 manifest', () => {
  it('registers metadata, example input/answer, solver, and visualizer', () => {
    expect(manifest.meta.year).toBe(2021);
    expect(manifest.meta.day).toBe(12);
    expect(manifest.meta.part).toBe(1);
    expect(manifest.meta.title).toBe('Passage Pathing');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2021/day/12');
    expect(typeof manifest.Visualizer).toBe('function');

    const result = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(result.answer)).toBe(manifest.exampleAnswer);
    expect(manifest.exampleAnswer).toBe('10');
  });
});
