import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PART1_EXAMPLE_DIMENSIONS, SpaceImage, STANDARD_IMAGE_DIMENSIONS } from '../shared';
import { manifest } from './index';

describe('2019 Day 8 Part 1 manifest', () => {
  it('registers metadata, solves and traces the 3x2 example without crashing on 3..9', () => {
    expect(manifest.meta.year).toBe(2019);
    expect(manifest.meta.day).toBe(8);
    expect(manifest.meta.part).toBe(1);
    expect(manifest.meta.title).toBe('Space Image Format');
    expect(manifest.exampleInput).toBe('123456789012');
    expect(manifest.exampleAnswer).toBe('1');
    expect(typeof manifest.Visualizer).toBe('function');

    const parsed = manifest.solver.parse(manifest.exampleInput) as SpaceImage;
    expect(parsed.dimensions.equals(PART1_EXAMPLE_DIMENSIONS)).toBe(true);
    expect(String(manifest.solver.solve(parsed))).toBe(manifest.exampleAnswer);

    const trace = manifest.solver.trace?.(parsed);
    expect(trace).toHaveLength(2);

    const html = renderToStaticMarkup(createElement(manifest.Visualizer, { rawInput: manifest.exampleInput }));
    expect(html).toContain('Min-Zero Layer Checksum');
    expect(html).toContain('Result: 1');
  });

  it('solves and traces standard 25x6 inputs via manifest solver', () => {
    const layer0 = '0'.repeat(4) + '1'.repeat(6) + '2'.repeat(140);
    const layer1 = '0'.repeat(2) + '1'.repeat(5) + '2'.repeat(143);
    const parsed = manifest.solver.parse(layer0 + layer1) as SpaceImage;

    expect(parsed.dimensions.equals(STANDARD_IMAGE_DIMENSIONS)).toBe(true);
    expect(manifest.solver.solve(parsed)).toBe(5 * 143);
    expect(manifest.solver.trace?.(parsed)).toHaveLength(2);
  });
});
