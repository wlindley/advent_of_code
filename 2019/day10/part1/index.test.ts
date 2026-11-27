import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2019 Day 10 Part 1 manifest', () => {
  it('registers metadata, solves the 5x5 example via executeSolver, and renders SSR visualizer', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(10);
    expect(manifest.meta.part).toBe(1);
    expect(manifest.meta.title).toBe('Monitoring Station');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2019/day/10');
    expect(manifest.exampleAnswer).toBe('8');
    expect(typeof manifest.Visualizer).toBe('function');

    const execution = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(execution.answer)).toBe(manifest.exampleAnswer);

    const html = renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: manifest.exampleInput }));
    expect(html).toContain('Best Monitor Station');
    expect(html).toContain('Result: 8');

    const errorHtml = renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: '..' }));
    expect(errorHtml).toContain('Unable to visualize input');
  });
});
