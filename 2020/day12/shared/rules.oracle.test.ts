import { describe, expect, it } from 'vitest';
import {
  absBigInt,
  NavigationInstruction,
  parseNavigationInstructions,
  type NavigationAction,
} from './model';
import {
  HEADING_NAVIGATION_RULE,
  simulateNavigation,
  WAYPOINT_NAVIGATION_RULE,
  type NavigationRuleId,
} from './rules';

interface Gaussian {
  readonly re: bigint;
  readonly im: bigint;
}

function mulGaussian(a: Gaussian, b: Gaussian): Gaussian {
  return {
    re: a.re * b.re - a.im * b.im,
    im: a.re * b.im + a.im * b.re,
  };
}

function addGaussian(a: Gaussian, b: Gaussian): Gaussian {
  return { re: a.re + b.re, im: a.im + b.im };
}

function scaleGaussian(z: Gaussian, factor: bigint): Gaussian {
  return { re: z.re * factor, im: z.im * factor };
}

function gaussianOracle(
  instructions: readonly NavigationInstruction[],
  mode: NavigationRuleId,
): { readonly east: bigint; readonly north: bigint; readonly manhattan: bigint } {
  let pos: Gaussian = { re: 0n, im: 0n };
  let vec: Gaussian = mode === 'heading' ? { re: 1n, im: 0n } : { re: 10n, im: 1n };

  const applyShift = (delta: Gaussian): void => {
    if (mode === 'heading') {
      pos = addGaussian(pos, delta);
    } else {
      vec = addGaussian(vec, delta);
    }
  };

  for (const { action, value } of instructions) {
    if (action === 'N') applyShift({ re: 0n, im: value });
    else if (action === 'S') applyShift({ re: 0n, im: -value });
    else if (action === 'E') applyShift({ re: value, im: 0n });
    else if (action === 'W') applyShift({ re: -value, im: 0n });
    else if (action === 'F') pos = addGaussian(pos, scaleGaussian(vec, value));
    else {
      const unit: Gaussian = action === 'L' ? { re: 0n, im: 1n } : { re: 0n, im: -1n };
      const quarterTurns = Number((value / 90n) % 4n);
      for (let i = 0; i < quarterTurns; i += 1) {
        vec = mulGaussian(vec, unit);
      }
    }
  }

  return { east: pos.re, north: pos.im, manhattan: absBigInt(pos.re) + absBigInt(pos.im) };
}

function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const ACTIONS: readonly NavigationAction[] = ['N', 'S', 'E', 'W', 'L', 'R', 'F'];

function generateVoyage(rng: () => number, length: number, bigScale: boolean): NavigationInstruction[] {
  const list: NavigationInstruction[] = [];
  for (let i = 0; i < length; i += 1) {
    const action = ACTIONS[Math.floor(rng() * ACTIONS.length)]!;
    if (action === 'L' || action === 'R') {
      const step = Math.floor(rng() * 13); // 0..1080 degrees
      list.push(new NavigationInstruction(action, BigInt(step) * 90n));
    } else {
      const base = rng() < 0.08 ? 0n : BigInt(Math.floor(rng() * 200));
      const value = bigScale ? base * 10n ** 24n : base;
      list.push(new NavigationInstruction(action, value));
    }
  }
  return list;
}

describe('2020 Day 12 rules differential oracle', () => {
  it('matches Gaussian-integer oracle on the official example for both rules', () => {
    const example = parseNavigationInstructions(['F10', 'N3', 'F7', 'R90', 'F11'].join('\n'));
    const h = simulateNavigation(example, HEADING_NAVIGATION_RULE);
    const w = simulateNavigation(example, WAYPOINT_NAVIGATION_RULE);

    expect(h.manhattanDistance).toBe(25n);
    expect(w.manhattanDistance).toBe(286n);
    expect({ east: h.position.east, north: h.position.north, manhattan: h.manhattanDistance }).toEqual(
      gaussianOracle(example, 'heading'),
    );
    expect({ east: w.position.east, north: w.position.north, manhattan: w.manhattanDistance }).toEqual(
      gaussianOracle(example, 'waypoint'),
    );
  });

  it('matches Gaussian-integer oracle across 50 seeded PRNG voyages for both rules', () => {
    const rng = createPrng(20201201);
    for (let trial = 0; trial < 50; trial += 1) {
      const length = 1 + Math.floor(rng() * 150);
      const voyage = generateVoyage(rng, length, trial % 5 === 0);

      const h = simulateNavigation(voyage, HEADING_NAVIGATION_RULE);
      const hRef = gaussianOracle(voyage, 'heading');
      expect({ east: h.position.east, north: h.position.north, manhattan: h.manhattanDistance }).toEqual(hRef);

      const w = simulateNavigation(voyage, WAYPOINT_NAVIGATION_RULE);
      const wRef = gaussianOracle(voyage, 'waypoint');
      expect({ east: w.position.east, north: w.position.north, manhattan: w.manhattanDistance }).toEqual(wRef);
    }
  });
});
