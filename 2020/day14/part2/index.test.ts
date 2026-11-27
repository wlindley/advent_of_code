import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2020 Day 14 Part 2 manifest', () => {
  it('wires metadata, solver, example input/answer, and visualizer', () => {
    expect(manifest.meta.year).toBe(2020);
    expect(manifest.meta.day).toBe(14);
    expect(manifest.meta.part).toBe(2);
    expect(manifest.meta.title).toBe('Docking Data');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2020/day/14#part2');
    expect(typeof manifest.Visualizer).toBe('function');

    const result = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(result.answer)).toBe(manifest.exampleAnswer);
    expect(manifest.exampleAnswer).toBe('208');
  });
});
