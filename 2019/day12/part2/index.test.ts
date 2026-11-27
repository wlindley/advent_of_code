import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2019 Day 12 Part 2 manifest', () => {
  it('registers metadata, Visualizer, and Example 1 via executeSolver', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(12);
    expect(manifest.meta.part).toBe(2);
    expect(manifest.meta.title).toBe('The N-Body Problem');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2019/day/12#part2');
    expect(manifest.exampleAnswer).toBe('2772');
    expect(typeof manifest.Visualizer).toBe('function');

    const result = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(result.answer)).toBe(manifest.exampleAnswer);
  });

  it('renders Part 2 Visualizer SSR smoke checks for valid and invalid inputs', () => {
    const validHtml = renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: manifest.exampleInput }));
    expect(validHtml).toContain('First Repeat Period');
    expect(validHtml).toContain('2772');
    expect(validHtml).toContain('Per-Axis Period Decomposition');
    expect(validHtml).toContain('LCM Period');

    const invalidHtml = renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: '' }));
    expect(invalidHtml).toContain('Unable to visualize input');
  });
});
