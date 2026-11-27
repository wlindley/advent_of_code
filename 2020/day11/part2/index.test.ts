import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2020 Day 11 Part 2 manifest', () => {
  it('wires metadata, solver, example input/answer, and visualizer', () => {
    expect(manifest.meta.year).toBe(2020);
    expect(manifest.meta.day).toBe(11);
    expect(manifest.meta.part).toBe(2);
    expect(manifest.meta.title).toBe('Seating System');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2020/day/11#part2');
    expect(typeof manifest.Visualizer).toBe('function');

    const result = executeSolver(manifest.solver, manifest.exampleInput);
    expect(result.answer).toBe(26);
    expect(String(result.answer)).toBe(manifest.exampleAnswer);
  });
});
