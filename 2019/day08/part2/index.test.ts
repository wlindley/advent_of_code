import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SpaceImage, type SpaceImageTraceFrame, STANDARD_IMAGE_DIMENSIONS } from '../shared';
import { manifest } from './index';

describe('2019 Day 8 Part 2 manifest', () => {
  it('registers metadata, solves SPACE, and traces 6 progressive decoded-slot frames', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(8);
    expect(manifest.meta.part).toBe(2);
    expect(manifest.meta.title).toBe('Space Image Format');
    expect(manifest.meta.puzzleUrl).toBe('https://adventofcode.com/2019/day/8#part2');
    expect(manifest.exampleInput).toHaveLength(900);
    expect(manifest.exampleAnswer).toBe('SPACE');
    expect(typeof manifest.Visualizer).toBe('function');

    const parsed = manifest.solver.parse(manifest.exampleInput) as SpaceImage;
    expect(parsed.dimensions.equals(STANDARD_IMAGE_DIMENSIONS)).toBe(true);
    expect(parsed.layerCount).toBe(6);
    expect(String(manifest.solver.solve(parsed))).toBe('SPACE');

    const trace = (manifest.solver.trace?.(parsed) ?? []) as readonly SpaceImageTraceFrame[];
    expect(trace).toHaveLength(6);
    expect(trace.map((frame) => frame.decodedSlots?.map((ch) => ch ?? '?').join(' '))).toEqual([
      '? ? ? ? ?',
      'S ? ? ? ?',
      'S P ? ? ?',
      'S P A ? ?',
      'S P A C ?',
      'S P A C E',
    ]);
  });

  it('renders the OCR visualizer and falls back cleanly on malformed input', () => {
    const html = renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: manifest.exampleInput }));
    expect(html).toContain('Decoded BIOS Message');
    expect(html).toContain('Result: SPACE');
    expect(html).toContain('Decoded Slots');

    const errorHtml = renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: 'bad' }));
    expect(errorHtml).toContain('Unable to visualize input:');
  });
});
