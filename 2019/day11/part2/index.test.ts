import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../shared/core';
import { manifest } from './index';

describe('2019 Day 11 Part 2 manifest', () => {
  it('registers metadata, solves the HI example via executeSolver, and renders SSR visualizer states', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(11);
    expect(manifest.meta.part).toBe(2);
    expect(manifest.meta.title).toBe('Space Police');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2019/day/11#part2');
    expect(manifest.exampleAnswer).toBe('HI');
    expect(typeof manifest.Visualizer).toBe('function');

    const execution = executeSolver(manifest.solver, manifest.exampleInput);
    expect(String(execution.answer)).toBe(manifest.exampleAnswer);

    const html = renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: manifest.exampleInput }));
    expect(html).toContain('Registration ID');
    expect(html).toContain('Decoded Hull Registration');
    expect(html).toContain('HI');
    expect(html).toContain('Start White');

    const unknownHtml = renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: '99' }));
    expect(unknownHtml).toContain('Unrecognized 5x6 glyphs');

    const errorHtml = renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: '' }));
    expect(errorHtml).toContain('Unable to visualize input');
  });
});
