import { describe, expect, it } from 'vitest';
import { ClawMachine, solveClawMachine, Vector2D } from '../../shared';
import { PART1_CONFIG } from './index';

function bruteForceMinTokens(machine: ClawMachine): bigint | null {
  let best: bigint | null = null;
  for (let a = 0n; a <= 100n; a += 1n) {
    for (let b = 0n; b <= 100n; b += 1n) {
      const x = a * machine.buttonA.x + b * machine.buttonB.x;
      const y = a * machine.buttonA.y + b * machine.buttonB.y;
      if (x === machine.prize.x && y === machine.prize.y) {
        const cost = 3n * a + b;
        if (best === null || cost < best) best = cost;
      }
    }
  }
  return best;
}

function makeRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
}

function nextRange(rng: () => number, min: number, max: number): bigint {
  return BigInt(min + (rng() % (max - min + 1)));
}

describe('Part 1 differential oracle against [0..100]^2 brute force', () => {
  it('matches brute force on curated collinear and boundary machines', () => {
    const cases: readonly ClawMachine[] = [
      new ClawMachine(new Vector2D(2n, 4n), new Vector2D(4n, 8n), new Vector2D(3n, 5n)),
      new ClawMachine(new Vector2D(2n, 4n), new Vector2D(4n, 8n), new Vector2D(3n, 6n)),
      new ClawMachine(new Vector2D(4n, 4n), new Vector2D(6n, 6n), new Vector2D(2n, 2n)),
      new ClawMachine(new Vector2D(1n, 1n), new Vector2D(1n, 1n), new Vector2D(205n, 205n)),
      new ClawMachine(new Vector2D(10n, 10n), new Vector2D(1n, 1n), new Vector2D(25n, 25n)),
      new ClawMachine(new Vector2D(2n, 2n), new Vector2D(1n, 1n), new Vector2D(25n, 25n)),
      new ClawMachine(new Vector2D(3n, 3n), new Vector2D(1n, 1n), new Vector2D(7n, 7n)),
      new ClawMachine(new Vector2D(5n, 7n), new Vector2D(3n, 2n), new Vector2D(0n, 0n)),
    ];

    for (const machine of cases) {
      const outcome = solveClawMachine(machine, PART1_CONFIG);
      const actual = outcome.winnable ? outcome.solution.tokens : null;
      expect(actual).toBe(bruteForceMinTokens(machine));
    }
  });

  it('matches brute force across 150 seeded random machines including 30 collinear cases', () => {
    const rng = makeRng(20241213);
    for (let i = 0; i < 150; i += 1) {
      let machine: ClawMachine;
      if (i < 30) {
        const base = new Vector2D(nextRange(rng, 1, 8), nextRange(rng, 1, 8));
        const mA = nextRange(rng, 1, 6);
        const mB = nextRange(rng, 1, 6);
        const a = new Vector2D(base.x * mA, base.y * mA);
        const b = new Vector2D(base.x * mB, base.y * mB);
        const kA = nextRange(rng, 0, 105);
        const kB = nextRange(rng, 0, 105);
        const off = i % 5 === 0 ? 1n : 0n;
        machine = new ClawMachine(a, b, new Vector2D(kA * a.x + kB * b.x + off, kA * a.y + kB * b.y));
      } else {
        const a = new Vector2D(nextRange(rng, 1, 25), nextRange(rng, 1, 25));
        const b = new Vector2D(nextRange(rng, 1, 25), nextRange(rng, 1, 25));
        const kA = nextRange(rng, 0, 105);
        const kB = nextRange(rng, 0, 105);
        const jitterX = i % 3 === 0 ? nextRange(rng, 0, 2) : 0n;
        const prize = new Vector2D(kA * a.x + kB * b.x + jitterX, kA * a.y + kB * b.y);
        machine = new ClawMachine(a, b, prize);
      }

      const outcome = solveClawMachine(machine, PART1_CONFIG);
      const actual = outcome.winnable ? outcome.solution.tokens : null;
      expect(actual).toBe(bruteForceMinTokens(machine));
    }
  });
});
