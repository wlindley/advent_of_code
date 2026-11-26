import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2020 Day 10 Part 1 manifest', () => {
  it('wires metadata, solver, example input/answer, and visualizer', () => {
    expect(manifest.meta.year).toBe(2020);
    expect(manifest.meta.day).toBe(10);
    expect(manifest.meta.part).toBe(1);
    expect(manifest.meta.title).toBe('Adapter Array');
    expect(typeof manifest.Visualizer).toBe('function');

    const result = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(result.answer)).toBe(manifest.exampleAnswer);
  });
});
