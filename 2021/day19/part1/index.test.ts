import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2021 Day 19 Part 1 manifest', () => {
  it('registers metadata, example input/answer, solver, and visualizer', () => {
    expect(manifest.meta.year).toBe(2021);
    expect(manifest.meta.day).toBe(19);
    expect(manifest.meta.part).toBe(1);
    expect(manifest.meta.title).toBe('Beacon Scanner');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2021/day/19');
    expect(typeof manifest.Visualizer).toBe('function');

    const result = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(result.answer)).toBe(manifest.exampleAnswer);
    expect(manifest.exampleAnswer).toBe('79');
  });
});
