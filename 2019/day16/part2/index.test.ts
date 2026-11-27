import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2019 Day 16 Part 2 manifest', () => {
  it('registers metadata, Visualizer, and passing official example via executeSolver', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(16);
    expect(manifest.meta.part).toBe(2);
    expect(manifest.meta.title).toBe('Flawed Frequency Transmission');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2019/day/16#part2');
    expect(manifest.meta.summary.length).toBeGreaterThan(0);
    expect(manifest.meta.algorithmSummary.length).toBeGreaterThan(0);
    expect(manifest.meta.complexity.length).toBeGreaterThan(0);
    expect(manifest.exampleAnswer).toBe('84462026');
    expect(typeof manifest.Visualizer).toBe('function');

    const result = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(result.answer)).toBe(manifest.exampleAnswer);
  });
});
