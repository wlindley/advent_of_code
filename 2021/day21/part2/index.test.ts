import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2021 Day 21 Part 2 manifest', () => {
  it('registers metadata, example input/answer, solver, and visualizer', () => {
    expect(manifest.meta.year).toBe(2021);
    expect(manifest.meta.day).toBe(21);
    expect(manifest.meta.part).toBe(2);
    expect(manifest.meta.title).toBe('Dirac Dice');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2021/day/21#part2');
    expect(typeof manifest.Visualizer).toBe('function');

    const result = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(result.answer)).toBe(manifest.exampleAnswer);
    expect(manifest.exampleAnswer).toBe('444356092776315');
  });
});
