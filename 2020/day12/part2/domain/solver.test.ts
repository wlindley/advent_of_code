import { describe, expect, it } from 'vitest';
import { WAYPOINT_NAVIGATION_RULE } from '../../shared';
import { solver } from './index';

const EXAMPLE_INPUT = ['F10', 'N3', 'F7', 'R90', 'F11'].join('\n');
const ACTIONS = ['N', 'S', 'E', 'W', 'L', 'R', 'F'] as const;

interface Gaussian {
  readonly re: bigint;
  readonly im: bigint;
}

interface OracleState {
  readonly ship: Gaussian;
  readonly wp: Gaussian;
}

function nextRand(seed: number): number {
  return (Math.imul(seed, 1664525) + 1013904223) >>> 0;
}

function mulGaussian(a: Gaussian, b: Gaussian): Gaussian {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}

function rotateGaussian(z: Gaussian, unit: Gaussian, turns: number): Gaussian {
  let out = z;
  for (let i = 0; i < turns; i += 1) {
    out = mulGaussian(out, unit);
  }
  return out;
}

function stepGaussianWaypoint(state: OracleState, line: string): OracleState {
  const action = line[0]!;
  const value = BigInt(line.slice(1));
  const { ship, wp } = state;
  if (action === 'N') return { ship, wp: { re: wp.re, im: wp.im + value } };
  if (action === 'S') return { ship, wp: { re: wp.re, im: wp.im - value } };
  if (action === 'E') return { ship, wp: { re: wp.re + value, im: wp.im } };
  if (action === 'W') return { ship, wp: { re: wp.re - value, im: wp.im } };
  if (action === 'F') {
    return { ship: { re: ship.re + wp.re * value, im: ship.im + wp.im * value }, wp };
  }
  const unit: Gaussian = action === 'L' ? { re: 0n, im: 1n } : { re: 0n, im: -1n };
  return { ship, wp: rotateGaussian(wp, unit, Number((value / 90n) % 4n)) };
}

function oracleWaypointManhattan(raw: string): bigint {
  let state: OracleState = { ship: { re: 0n, im: 0n }, wp: { re: 10n, im: 1n } };
  for (const line of raw.trim().split('\n')) {
    state = stepGaussianWaypoint(state, line);
  }
  const absRe = state.ship.re < 0n ? -state.ship.re : state.ship.re;
  const absIm = state.ship.im < 0n ? -state.ship.im : state.ship.im;
  return absRe + absIm;
}

function buildRandomProgram(seed: number, length: number, oddBigScale: boolean): { raw: string; seed: number } {
  const lines: string[] = [];
  let s = seed;
  for (let i = 0; i < length; i += 1) {
    s = nextRand(s);
    const action = ACTIONS[s % ACTIONS.length]!;
    s = nextRand(s);
    if (action === 'L' || action === 'R') {
      lines.push(`${action}${BigInt(s % 9) * 90n}`);
    } else {
      const base = BigInt(s % 250);
      lines.push(`${action}${oddBigScale ? base * ((1n << 64n) + 1n) : base}`);
    }
  }
  return { raw: lines.join('\n'), seed: s };
}

describe('2020 Day 12 Part 2 solver', () => {
  it('uses WAYPOINT_NAVIGATION_RULE and traces all 6 official example frames to 286n', () => {
    expect(solver.rule).toBe(WAYPOINT_NAVIGATION_RULE);
    const instructions = solver.parse(EXAMPLE_INPUT);
    expect(solver.solve(instructions)).toBe(286n);

    const trace = solver.trace(instructions);
    expect(trace.map((f) => [f.state.position.east, f.state.position.north, f.state.vector.east, f.state.vector.north])).toEqual([
      [0n, 0n, 10n, 1n],
      [100n, 10n, 10n, 1n],
      [100n, 10n, 10n, 4n],
      [170n, 38n, 10n, 4n],
      [170n, 38n, 4n, -10n],
      [214n, -72n, 4n, -10n],
    ]);
  });

  it('bounds traces with maxSteps while preserving final state', () => {
    const instructions = solver.parse(EXAMPLE_INPUT);
    expect(solver.trace(instructions, { maxSteps: 3 }).map((f) => f.stepIndex)).toEqual([0, 3, 5]);
    const single = solver.trace(instructions, { maxSteps: 1 });
    expect(single.map((f) => f.stepIndex)).toEqual([5]);
    expect(single[0]!.isFinal).toBe(true);
    expect(single[0]!.state.manhattanDistance).toBe(286n);
  });

  it('handles zero waypoint, negative coordinates, and odd-low-bit > 2^63 BigInt values', () => {
    const oddBig = (1n << 64n) + 1n;
    expect(solver.solve(solver.parse('W10\nS1\nF999'))).toBe(0n);
    expect(solver.solve(solver.parse('W20\nS5\nF3'))).toBe(42n);
    expect(solver.solve(solver.parse(`F${oddBig}`))).toBe(11n * oddBig);
    expect(solver.solve(solver.parse(`E${oddBig}\nS1\nR90\nF3`))).toBe(30n + 3n * oddBig);
  });

  it('preserves multi-turn L/R invariance across 0..450 degrees', () => {
    for (const deg of [0, 90, 180, 270, 360, 450]) {
      const opp = (360 - (deg % 360)) % 360;
      const left = solver.trace(solver.parse(`L${deg}\nF7`)).at(-1)!.state;
      const right = solver.trace(solver.parse(`R${opp}\nF7`)).at(-1)!.state;
      const mod = solver.trace(solver.parse(`L${deg % 360}\nF7`)).at(-1)!.state;
      expect([left.position.east, left.position.north]).toEqual([right.position.east, right.position.north]);
      expect([left.position.east, left.position.north]).toEqual([mod.position.east, mod.position.north]);
    }
  });

  it('rejects invalid instructions and invalid maxSteps', () => {
    for (const bad of ['', 'Q10', 'F-5', 'L45', 'R135']) {
      expect(() => solver.parse(bad)).toThrow(Error);
    }
    const instructions = solver.parse(EXAMPLE_INPUT);
    for (const badMax of [0, -1, 1.5]) {
      expect(() => solver.trace(instructions, { maxSteps: badMax })).toThrow(RangeError);
    }
  });

  it('matches Gaussian-integer oracle across 40 seeded PRNG programs including odd > 2^63 scale', () => {
    let seed = 20201212;
    for (let trial = 0; trial < 40; trial += 1) {
      const length = 1 + (trial % 40);
      const built = buildRandomProgram(seed, length, trial % 4 === 0);
      seed = built.seed;
      expect(solver.solve(solver.parse(built.raw))).toBe(oracleWaypointManhattan(built.raw));
    }
  });
});
