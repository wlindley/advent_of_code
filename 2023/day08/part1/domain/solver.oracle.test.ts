import { describe, expect, it } from 'vitest';
import { solver } from './solver';

function oracleWalk(
  raw: string,
  startLabel: string,
  targetLabel: string,
): number | 'UNREACHABLE' {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const tape = lines[0]!;
  const edges = new Map<string, readonly [string, string]>();
  for (const line of lines.slice(1)) {
    const [, src, left, right] = /^([A-Za-z0-9]+)\s*=\s*\(([A-Za-z0-9]+),\s*([A-Za-z0-9]+)\)$/.exec(line)!;
    edges.set(src!, [left!, right!]);
  }
  const visited = new Set<string>();
  let node = startLabel;
  let ip = 0;
  let steps = 0;
  while (node !== targetLabel) {
    const state = `${node}:${ip}`;
    if (visited.has(state)) return 'UNREACHABLE';
    visited.add(state);
    const pair = edges.get(node)!;
    node = tape[ip] === 'L' ? pair[0] : pair[1];
    ip = (ip + 1) % tape.length;
    steps += 1;
  }
  return steps;
}

function makePrng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s;
  };
}

function generateRandomInput(seed: number): string {
  const next = makePrng(seed);
  const tapeLen = 1 + (next() % 11);
  const tape = Array.from({ length: tapeLen }, () => ((next() & 1) === 0 ? 'L' : 'R')).join('');
  const extraCount = 2 + (next() % 12);
  const labels = ['AAA', ...Array.from({ length: extraCount }, (_, i) => `N${i}A`), 'ZZZ'];
  const lines = labels.map((label) => {
    const left = labels[next() % labels.length]!;
    const right = labels[next() % labels.length]!;
    return `${label} = (${left}, ${right})`;
  });
  return [tape, '', ...lines].join('\n');
}

describe('2023 Day 8 Part 1 oracle cross-checks', () => {
  it('matches oracle on official examples, step 0, alphanumeric labels, and unreachable cycles', () => {
    const ex1 = 'RL\n\nAAA = (BBB, CCC)\nBBB = (DDD, EEE)\nCCC = (ZZZ, GGG)\nDDD = (DDD, DDD)\nEEE = (EEE, EEE)\nGGG = (GGG, GGG)\nZZZ = (ZZZ, ZZZ)';
    const ex2 = 'LLR\n\nAAA = (BBB, BBB)\nBBB = (AAA, ZZZ)\nZZZ = (ZZZ, ZZZ)';
    expect(solver.solve(solver.parse(ex1))).toBe(oracleWalk(ex1, 'AAA', 'ZZZ'));
    expect(solver.solve(solver.parse(ex2))).toBe(oracleWalk(ex2, 'AAA', 'ZZZ'));

    const stepZeroNet = solver.parse('LR\n\nAAA = (ZZZ, ZZZ)\nZZZ = (ZZZ, ZZZ)');
    expect(stepZeroNet.findFirstTarget(stepZeroNet.requireId('AAA'), (id) => id === stepZeroNet.requireId('AAA'))).toBe(
      oracleWalk('LR\n\nAAA = (ZZZ, ZZZ)\nZZZ = (ZZZ, ZZZ)', 'AAA', 'AAA'),
    );

    const alphaRaw = 'RL\n\n11A = (11B, 22Z)\n11B = (11A, 11B)\n22Z = (22Z, 22Z)';
    const alphaNet = solver.parse(alphaRaw);
    expect(alphaNet.findFirstTarget(alphaNet.requireId('11A'), (id) => id === alphaNet.requireId('22Z'))).toBe(
      oracleWalk(alphaRaw, '11A', '22Z'),
    );

    const cycleRaw = 'RL\n\nAAA = (BBB, BBB)\nBBB = (AAA, AAA)\nZZZ = (ZZZ, ZZZ)';
    expect(oracleWalk(cycleRaw, 'AAA', 'ZZZ')).toBe('UNREACHABLE');
    expect(() => solver.solve(solver.parse(cycleRaw))).toThrow();
  });

  it('matches independent Map/Set oracle across 50 seeded deterministic random graphs', () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      const raw = generateRandomInput(seed * 7919);
      const expected = oracleWalk(raw, 'AAA', 'ZZZ');
      const net = solver.parse(raw);
      if (expected === 'UNREACHABLE') {
        expect(() => solver.solve(net)).toThrow();
      } else {
        expect(solver.solve(net)).toBe(expected);
        const trace = solver.trace!(net);
        expect(trace[trace.length - 1]!.step).toBe(expected);
      }
    }
  });
});
