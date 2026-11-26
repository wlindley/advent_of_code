import { describe, expect, it } from 'vitest';
import { DirectedGraph } from '../../../../shared/core';
import { PART2_DAC, PART2_FFT, PART2_SOURCE, PART2_TARGET, solveReactorWaypoints, solver } from './index';

const EXAMPLE = [
  'svr: aaa bbb', 'aaa: fft', 'fft: ccc', 'bbb: tty', 'tty: ccc', 'ccc: ddd eee',
  'ddd: hub', 'hub: fff', 'eee: dac', 'dac: fff', 'fff: ggg hhh', 'ggg: out', 'hhh: out',
].join('\n');

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function buildRandomDag(rand: () => number, n: number, p: number): DirectedGraph<string> {
  const names = Array.from({ length: n }, (_, i) => `n${i}`);
  const pick = () => {
    const idx = new Set<number>();
    while (idx.size < 4) idx.add(Math.floor(rand() * n));
    return [...idx];
  };
  const [iS, iT, iD, iF] = pick();
  names[iS!] = PART2_SOURCE;
  names[iT!] = PART2_TARGET;
  names[iD!] = PART2_DAC;
  names[iF!] = PART2_FFT;
  const entries = names.map((u, i): [string, string[]] => {
    const out: string[] = [];
    for (let j = i + 1; j < n; j++) {
      if (rand() < p) out.push(names[j]!);
      if (rand() < p * 0.15) out.push(names[j]!);
    }
    return [u, out];
  });
  return new DirectedGraph(entries);
}

function legsOracle(g: DirectedGraph<string>): bigint {
  const ab = g.countPaths(PART2_SOURCE, PART2_DAC) * g.countPaths(PART2_DAC, PART2_FFT) * g.countPaths(PART2_FFT, PART2_TARGET);
  const ba = g.countPaths(PART2_SOURCE, PART2_FFT) * g.countPaths(PART2_FFT, PART2_DAC) * g.countPaths(PART2_DAC, PART2_TARGET);
  return ab + ba;
}

function bruteForceOracle(g: DirectedGraph<string>): bigint {
  let total = 0n;
  const walk = (u: string, seenDac: boolean, seenFft: boolean) => {
    const d = seenDac || u === PART2_DAC;
    const f = seenFft || u === PART2_FFT;
    if (u === PART2_TARGET && d && f) total += 1n;
    for (const v of g.outNeighbors(u)) walk(v, d, f);
  };
  if (g.has(PART2_SOURCE)) walk(PART2_SOURCE, false, false);
  return total;
}

describe('day11 part2 solver', () => {
  it('solves official example (2n), symmetric dac->fft (1n), and incomparable branches (0n)', () => {
    expect(solver.solve(solver.parse(EXAMPLE))).toBe(2n);
    expect(solveReactorWaypoints(solver.parse('svr: dac\ndac: fft\nfft: out'))).toBe(1n);
    expect(solveReactorWaypoints(solver.parse('svr: dac fft\ndac: out\nfft: out'))).toBe(0n);
  });

  it('handles missing/disconnected nodes, off-path vs on-path cycles, and parallel multiedges', () => {
    expect(solveReactorWaypoints(solver.parse('aaa: out'))).toBe(0n);
    expect(solveReactorWaypoints(solver.parse('svr: dac\ndac: fft'))).toBe(0n);
    expect(solveReactorWaypoints(solver.parse('svr: dead\ndac: fft\nfft: out'))).toBe(0n);
    expect(solveReactorWaypoints(solver.parse('svr: dac side\ndac: fft\nfft: out\nside: loop\nloop: side'))).toBe(1n);
    expect(() => solveReactorWaypoints(solver.parse('svr: dac\ndac: a\na: dac fft\nfft: out'))).toThrow(/Cycle/);
    expect(solveReactorWaypoints(solver.parse('svr: dac dac\ndac: fft fft\nfft: out out'))).toBe(8n);
  });

  it('handles coincident endpoints and custom queries', () => {
    expect(solveReactorWaypoints(solver.parse('svr: fft\nfft: out'), { source: 'svr', target: 'out', dac: 'svr', fft: 'fft' })).toBe(1n);
    expect(solveReactorWaypoints(solver.parse('svr: dac\ndac: out'), { source: 'svr', target: 'out', dac: 'dac', fft: 'out' })).toBe(1n);
    expect(solveReactorWaypoints(solver.parse('svr: hub\nhub: out'), { source: 'svr', target: 'out', dac: 'hub', fft: 'hub' })).toBe(1n);
    expect(solveReactorWaypoints(solver.parse('svr:'), { source: 'svr', target: 'svr', dac: 'svr', fft: 'svr' })).toBe(1n);
    expect(solveReactorWaypoints(solver.parse('svr:'), { source: 'svr', target: 'svr', dac: 'dac', fft: 'fft' })).toBe(0n);
  });

  it('preserves exact 60-stage BigInt counts (2n ** 60n)', () => {
    const lines = ['svr: dac', 'dac: s0'];
    for (let i = 0; i < 60; i++) {
      lines.push(`s${i}: s${i + 1} s${i + 1}`);
    }
    lines.push('s60: fft', 'fft: out');
    expect(solveReactorWaypoints(solver.parse(lines.join('\n')))).toBe(1n << 60n);
  });

  it('matches topo-waypoint-legs oracle across 40 seeded random DAGs', () => {
    const rand = makeRng(20251102);
    for (let i = 0; i < 40; i++) {
      const g = buildRandomDag(rand, 14, 0.32);
      expect(solveReactorWaypoints(g)).toBe(legsOracle(g));
    }
  });

  it('matches brute-force walk enumeration oracle across 15 small DAGs', () => {
    const rand = makeRng(991102);
    for (let i = 0; i < 15; i++) {
      const g = buildRandomDag(rand, 8, 0.42);
      expect(solveReactorWaypoints(g)).toBe(bruteForceOracle(g));
    }
  });
});
