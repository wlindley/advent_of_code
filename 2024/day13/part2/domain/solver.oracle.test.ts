import { describe, expect, it } from 'vitest';
import { gcdBigInt, Rational } from '../../../../shared/core';
import { ClawMachine, parseClawMachines, solveClawMachine, Vector2D } from '../../shared';
import { PART2_CONFIG, PART2_PRIZE_OFFSET } from './index';

class SeededRng {
  private state: number;
  constructor(seed: number) {
    this.state = seed >>> 0;
  }
  next(): number {
    this.state = (Math.imul(this.state, 1664525) + 1013904223) >>> 0;
    return this.state;
  }
  range(min: number, max: number): bigint {
    return BigInt(min + (this.next() % (max - min + 1)));
  }
}

function mk(ax: bigint, ay: bigint, bx: bigint, by: bigint, px: bigint, py: bigint): ClawMachine {
  return new ClawMachine(new Vector2D(ax, ay), new Vector2D(bx, by), new Vector2D(px, py));
}

function euclideanMod(n: bigint, m: bigint): bigint {
  const r = n % m;
  return r < 0n ? r + m : r;
}

function modInverse(a: bigint, m: bigint): bigint {
  if (m === 1n) return 0n;
  let [oldR, r, oldS, s] = [euclideanMod(a, m), m, 1n, 0n];
  while (r !== 0n) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  return euclideanMod(oldS, m);
}

function solveNonSingularRational(m: ClawMachine, tx: bigint, ty: bigint): readonly [bigint, bigint] | null {
  const ax = new Rational(m.buttonA.x);
  const ay = new Rational(m.buttonA.y);
  const r0b = new Rational(m.buttonB.x).div(ax);
  const r0t = new Rational(tx).div(ax);
  const r1b = new Rational(m.buttonB.y).sub(ay.mul(r0b));
  const r1t = new Rational(ty).sub(ay.mul(r0t));
  const bRat = r1t.div(r1b);
  const aRat = r0t.sub(r0b.mul(bRat));
  if (aRat.den !== 1n || bRat.den !== 1n || aRat.num < 0n || bRat.num < 0n) return null;
  return [aRat.num, bRat.num];
}

function solveCollinearModular(m: ClawMachine, tx: bigint, ty: bigint): readonly [bigint, bigint] | null {
  const { x: ax, y: ay } = m.buttonA;
  const bx = m.buttonB.x;
  if (ax * ty !== ay * tx) return null;
  const g = gcdBigInt(ax, bx);
  if (tx % g !== 0n) return null;
  const [axp, bxp, txp] = [ax / g, bx / g, tx / g];
  const aMin = euclideanMod(txp * modInverse(axp, bxp), bxp);
  if (axp * aMin > txp) return null;
  const bMin = euclideanMod(txp * modInverse(bxp, axp), axp);
  if (bxp * bMin > txp) return null;
  const bMax = (txp - axp * aMin) / bxp;
  const aMax = (txp - bxp * bMin) / axp;
  return 3n * bxp < axp ? [aMax, bMin] : [aMin, bMax];
}

function oracleMinTokens(m: ClawMachine): bigint | null {
  const tx = m.prize.x + PART2_PRIZE_OFFSET;
  const ty = m.prize.y + PART2_PRIZE_OFFSET;
  const pair = m.determinant !== 0n ? solveNonSingularRational(m, tx, ty) : solveCollinearModular(m, tx, ty);
  if (!pair) return null;
  const [a, b] = pair;
  expect(a * m.buttonA.x + b * m.buttonB.x).toBe(tx);
  expect(a * m.buttonA.y + b * m.buttonB.y).toBe(ty);
  return 3n * a + b;
}

function actualMinTokens(m: ClawMachine): bigint | null {
  const outcome = solveClawMachine(m, PART2_CONFIG);
  return outcome.winnable ? outcome.solution.tokens : null;
}

function curatedCases(): readonly ClawMachine[] {
  const O = PART2_PRIZE_OFFSET;
  const T = 1_000_000_000_000n;
  return [
    mk(1n, 2n, 2n, 1n, 2n, 2n),
    mk(3n, 1n, 1n, 3n, 0n, 0n),
    mk(2n, 1n, 1n, 5n, 0n, 3n * O),
    mk(1n, 5n, 2n, 1n, 3n * O, 0n),
    mk(2n, 4n, 4n, 8n, 0n, 1n),
    mk(2n, 2n, 4n, 4n, 1n, 1n),
    mk(6n * T, 6n * T, 8n * T, 8n * T, 0n, 0n),
    mk(7n, 7n, 2n, 2n, 1n, 1n),
    mk(3n, 3n, 1n, 1n, 2n, 2n),
    mk(2n, 2n, 3n, 3n, 4n, 4n),
  ];
}

function randomMachine(rng: SeededRng, index: number): ClawMachine {
  if (index < 30) {
    const [bx, by, mA, mB] = [rng.range(1, 9), rng.range(1, 9), rng.range(1, 10), rng.range(1, 10)];
    const [ax, ay, pxB, pyB] = [bx * mA, by * mA, bx * mB, by * mB];
    const [kA, kB] = [PART2_PRIZE_OFFSET + rng.range(0, 500), PART2_PRIZE_OFFSET + rng.range(0, 500)];
    const off = index % 5 === 0 ? 1n : 0n;
    return mk(ax, ay, pxB, pyB, kA * ax + kB * pxB + off - PART2_PRIZE_OFFSET, kA * ay + kB * pyB - PART2_PRIZE_OFFSET);
  }
  const [ax, ay, bx, by] = [rng.range(10, 99), rng.range(10, 99), rng.range(10, 99), rng.range(10, 99)];
  if (index % 3 === 0) return mk(ax, ay, bx, by, rng.range(0, 20_000), rng.range(0, 20_000));
  const [kA, kB] = [1_000_000_000_000n + rng.range(1, 5_000_000), 1_000_000_000_000n + rng.range(1, 5_000_000)];
  const jitter = index % 2 === 0 ? rng.range(0, 5) : 0n;
  return mk(ax, ay, bx, by, kA * ax + kB * bx + jitter - PART2_PRIZE_OFFSET, kA * ay + kB * by - PART2_PRIZE_OFFSET);
}

const EXAMPLE_INPUT = [
  'Button A: X+94, Y+34\nButton B: X+22, Y+67\nPrize: X=8400, Y=5400',
  'Button A: X+26, Y+66\nButton B: X+67, Y+21\nPrize: X=12748, Y=12176',
  'Button A: X+17, Y+86\nButton B: X+84, Y+37\nPrize: X=7870, Y=6450',
  'Button A: X+69, Y+23\nButton B: X+27, Y+71\nPrize: X=18641, Y=10279',
].join('\n\n');

describe('Part 2 differential oracle (Rational Gauss-Jordan + modular collinear)', () => {
  it('matches oracle on the official 4 example machines', () => {
    for (const machine of parseClawMachines(EXAMPLE_INPUT)) {
      expect(actualMinTokens(machine)).toBe(oracleMinTokens(machine));
    }
  });

  it('matches oracle on curated 10^13 edge cases', () => {
    for (const machine of curatedCases()) {
      expect(actualMinTokens(machine)).toBe(oracleMinTokens(machine));
    }
  });

  it('matches oracle across 150 seeded random 10^13 machines', () => {
    const rng = new SeededRng(2024121302);
    for (let i = 0; i < 150; i += 1) {
      const machine = randomMachine(rng, i);
      expect(actualMinTokens(machine)).toBe(oracleMinTokens(machine));
    }
  });
});
