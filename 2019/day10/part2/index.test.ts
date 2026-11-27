import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2019 Day 10 Part 2 manifest', () => {
  it('registers metadata, solves the 20x20 example via executeSolver, and renders SSR visualizer', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(10);
    expect(manifest.meta.part).toBe(2);
    expect(manifest.meta.title).toBe('Monitoring Station');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2019/day/10#part2');
    expect(manifest.exampleAnswer).toBe('802');
    expect(typeof manifest.Visualizer).toBe('function');

    const execution = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(execution.answer)).toBe(manifest.exampleAnswer);

    const html = renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: manifest.exampleInput }));
    expect(html).toContain('Vaporization #200');
    expect(html).toContain('Station (11, 13)');
    expect(html).toContain('Laser poised at 12:00');
    expect(html).toContain('Result: 802');

    expect(renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: '..' }))).toContain('Unable to visualize input');
    expect(renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: '#' }))).toContain('Unable to visualize input');
  });
});
