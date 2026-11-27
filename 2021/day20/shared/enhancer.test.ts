import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_TRACE_STEPS, enhanceImage, traceEnhancement } from './enhancer';
import { parseTrenchMap } from './parser';
import { EnhancementAlgorithm, TrenchImage, type PixelBit } from './types';

const EXAMPLE = [
  '..#.#..#####.#.#.#.###.##.....###.##.#..###.####..#####..#....#..#..##..##',
  '#..######.###...####..#..#####..##..#.#####...##.#.#..#.##..#.#......#.###',
  '.######.###.####...#.##.##..#..#..#####.....#.#....###..#.##......#.....#.',
  '.#..#..##..#...##.######.####.####.#.#...#.......#..#.#.#...####.##.#.....',
  '.#..#...##.#.##..#...##.#.##..###.#......#.#.......#.#.#.####.###.##...#..',
  '...####.#..#..#.##.#....##..#.####....##...##..#...#......#.#.......#.....',
  '..##..####..#...#.#.#...##..#.#..###..#####........#..####......#..#',
  '',
  '#..#.',
  '#....',
  '##..#',
  '..#..',
  '..###',
].join('\n');

function oracleStep(
  exceptions: ReadonlySet<string>,
  outside: PixelBit,
  bounds: readonly [number, number, number, number],
  algo: EnhancementAlgorithm,
): { exceptions: Set<string>; outside: PixelBit; bounds: readonly [number, number, number, number] } {
  const newOutside = algo.nextBackground(outside);
  const nextExceptions = new Set<string>();
  const [minR, maxR, minC, maxC] = [bounds[0] - 1, bounds[1] + 1, bounds[2] - 1, bounds[3] + 1];
  for (let r = minR; r <= maxR; r += 1) {
    for (let c = minC; c <= maxC; c += 1) {
      let code = 0;
      for (let dr = -1; dr <= 1; dr += 1) {
        for (let dc = -1; dc <= 1; dc += 1) {
          const bit = exceptions.has(`${r + dr},${c + dc}`) ? ((outside ^ 1) as PixelBit) : outside;
          code = (code << 1) | bit;
        }
      }
      if (algo.lookup(code) !== newOutside) nextExceptions.add(`${r},${c}`);
    }
  }
  return { exceptions: nextExceptions, outside: newOutside, bounds: [minR, maxR, minC, maxC] };
}

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function makeSeededAlgo(rand: () => number, b0: PixelBit, b511: PixelBit): EnhancementAlgorithm {
  const bits = new Uint8Array(512);
  for (let i = 1; i < 511; i += 1) bits[i] = rand() < 0.5 ? 1 : 0;
  bits[0] = b0;
  bits[511] = b511;
  return new EnhancementAlgorithm(bits);
}

describe('enhanceImage', () => {
  it('matches the official example at steps 0, 1, and 2', () => {
    const { algorithm, image } = parseTrenchMap(EXAMPLE);
    expect(enhanceImage(image, algorithm, 0).totalLitPixels).toBe(10);
    expect(enhanceImage(image, algorithm, 1).totalLitPixels).toBe(24);
    expect(enhanceImage(image, algorithm, 2).totalLitPixels).toBe(35);
  });

  it('handles 1x1 and rectangular grids across all four void regimes and step composition', () => {
    const rect = new TrenchImage(2, 5, new Uint8Array([1, 0, 1, 0, 1, 0, 1, 0, 1, 0]), 0);
    const tiny = new TrenchImage(1, 1, new Uint8Array([1]), 0);
    const rand = makeRng(42);
    const regimes: readonly (readonly [PixelBit, PixelBit])[] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ];
    for (const [b0, b511] of regimes) {
      const algo = makeSeededAlgo(rand, b0, b511);
      const step1 = enhanceImage(rect, algo, 1);
      const composed = enhanceImage(step1, algo, 1);
      const direct2 = enhanceImage(rect, algo, 2);
      expect(composed.background).toBe(direct2.background);
      expect(composed.height).toBe(direct2.height);
      expect(composed.width).toBe(direct2.width);
      expect(composed.copyPixels()).toEqual(direct2.copyPixels());
      expect(step1.background).toBe(b0);
      expect(enhanceImage(tiny, algo, 2).background).toBe(algo.nextBackground(b0));
    }
    const blinking = makeSeededAlgo(rand, 1, 0);
    const step1Blink = enhanceImage(tiny, blinking, 1);
    expect(() => step1Blink.totalLitPixels).toThrow(RangeError);
    expect(enhanceImage(tiny, blinking, 2).totalLitPixels).toBeGreaterThanOrEqual(0);
  });

  it('matches independent sparse differential oracle across 30 seeded grids and all 4 regimes', () => {
    const rand = makeRng(1337);
    const regimes: readonly (readonly [PixelBit, PixelBit])[] = [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ];
    for (let trial = 0; trial < 30; trial += 1) {
      const [b0, b511] = regimes[trial % 4]!;
      const algo = makeSeededAlgo(rand, b0, b511);
      const h = 1 + Math.floor(rand() * 5);
      const w = 1 + Math.floor(rand() * 5);
      const pixels = new Uint8Array(h * w);
      let state = {
        exceptions: new Set<string>(),
        outside: 0 as PixelBit,
        bounds: [0, h - 1, 0, w - 1] as readonly [number, number, number, number],
      };
      for (let r = 0; r < h; r += 1) {
        for (let c = 0; c < w; c += 1) {
          const bit = rand() < 0.5 ? 1 : 0;
          pixels[r * w + c] = bit;
          if (bit === 1) state.exceptions.add(`${r},${c}`);
        }
      }
      const steps = 1 + (trial % 4);
      const actual = enhanceImage(new TrenchImage(h, w, pixels, 0), algo, steps);
      for (let s = 0; s < steps; s += 1) {
        state = oracleStep(state.exceptions, state.outside, state.bounds, algo);
      }
      expect(actual.background).toBe(state.outside);
      for (let r = 0; r < actual.height; r += 1) {
        for (let c = 0; c < actual.width; c += 1) {
          const orR = state.bounds[0] + r;
          const orC = state.bounds[2] + c;
          const expectedBit = state.exceptions.has(`${orR},${orC}`)
            ? ((state.outside ^ 1) as PixelBit)
            : state.outside;
          expect(actual.pixelAt(r, c)).toBe(expectedBit);
        }
      }
    }
  });

  it('validates non-negative integer step counts', () => {
    const { algorithm, image } = parseTrenchMap(EXAMPLE);
    expect(() => enhanceImage(image, algorithm, -1)).toThrow(RangeError);
    expect(() => enhanceImage(image, algorithm, 1.5)).toThrow(RangeError);
  });
});

describe('traceEnhancement', () => {
  it('supports step 0, maxSteps=1, bounded sampling, and default options', () => {
    const input = parseTrenchMap(EXAMPLE);
    const zero = traceEnhancement(input, 0);
    expect(zero).toHaveLength(1);
    expect(zero[0]!.step).toBe(0);
    expect(zero[0]!.image.totalLitPixels).toBe(10);

    const lastOnly = traceEnhancement(input, 50, { maxSteps: 1 });
    expect(lastOnly).toHaveLength(1);
    expect(lastOnly[0]!.step).toBe(50);
    expect(lastOnly[0]!.totalSteps).toBe(50);

    const sampled = traceEnhancement(input, 50, { maxSteps: 10 });
    expect(sampled).toHaveLength(10);
    expect(sampled[0]!.step).toBe(0);
    expect(sampled[9]!.step).toBe(50);

    const full = traceEnhancement(input, 2);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(51);
    expect(full.map((f) => f.image.totalLitPixels)).toEqual([10, 24, 35]);
  });

  it('rejects invalid totalSteps and invalid maxSteps', () => {
    const input = parseTrenchMap(EXAMPLE);
    expect(() => traceEnhancement(input, -1)).toThrow(RangeError);
    expect(() => traceEnhancement(input, 2, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceEnhancement(input, 2, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
