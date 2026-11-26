import { describe, expect, it } from 'vitest';
import { parseCircuitBlueprint } from './parser';
import { CircuitSimulator } from './simulator';

interface OracleModule {
  kind: 'broadcaster' | '%' | '&' | 'sink';
  dests: string[];
  on: boolean;
  mem: Map<string, 'low' | 'high'>;
}

function runPlainOracle(raw: string, presses: number) {
  const mods = new Map<string, OracleModule>();
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    const [lhs, rhs] = line.split('->').map((s) => s.trim());
    const kind = lhs!.startsWith('%') ? '%' : lhs!.startsWith('&') ? '&' : 'broadcaster';
    const name = kind === 'broadcaster' ? lhs! : lhs!.slice(1);
    mods.set(name, { kind, dests: rhs!.split(',').map((s) => s.trim()), on: false, mem: new Map() });
  }
  for (const [name, mod] of mods) {
    for (const dest of mod.dests) {
      if (!mods.has(dest)) mods.set(dest, { kind: 'sink', dests: [], on: false, mem: new Map() });
      mods.get(dest)!.mem.set(name, 'low');
    }
  }
  const perPress: Array<{ press: number; lowPulses: number; highPulses: number }> = [];
  let totalLow = 0n;
  let totalHigh = 0n;
  for (let p = 1; p <= presses; p += 1) {
    const q: Array<[string, string, 'low' | 'high']> = [['button', 'broadcaster', 'low']];
    let low = 0;
    let high = 0;
    for (let i = 0; i < q.length; i += 1) {
      const [from, to, pulse] = q[i]!;
      if (pulse === 'low') low += 1;
      else high += 1;
      const target = mods.get(to)!;
      let out: 'low' | 'high' | null = null;
      if (target.kind === 'broadcaster') out = pulse;
      else if (target.kind === '%' && pulse === 'low') {
        target.on = !target.on;
        out = target.on ? 'high' : 'low';
      } else if (target.kind === '&') {
        target.mem.set(from, pulse);
        out = [...target.mem.values()].every((v) => v === 'high') ? 'low' : 'high';
      }
      if (out) for (const d of target.dests) q.push([to, d, out]);
    }
    totalLow += BigInt(low);
    totalHigh += BigInt(high);
    perPress.push({ press: p, lowPulses: low, highPulses: high });
  }
  return { perPress, product: totalLow * totalHigh };
}

function makeSeededRandomCircuit(seed: number): string {
  let s = seed >>> 0;
  const next = () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s;
  };
  const names = ['aa', 'bb', 'cc', 'dd', 'ee', 'ff'];
  const lines = [`broadcaster -> ${names[0]}, ${names[1]}`];
  for (let i = 0; i < names.length; i += 1) {
    const prefix = next() % 3 === 0 ? '&' : '%';
    const fanout = 1 + (next() % 2);
    const dests: string[] = [];
    for (let j = 0; j < fanout; j += 1) {
      const remaining = names.length - 1 - i;
      if (remaining <= 0 || next() % 5 === 0) {
        dests.push('rx');
      } else {
        dests.push(names[i + 1 + (next() % remaining)]!);
      }
    }
    lines.push(`${prefix}${names[i]} -> ${dests.join(', ')}`);
  }
  return lines.join('\n');
}

describe('day20 CircuitSimulator differential oracle', () => {
  const fixedCases = [
    {
      name: 'Example 1',
      raw: 'broadcaster -> a, b, c\n%a -> b\n%b -> c\n%c -> inv\n&inv -> a',
      expected: 32_000_000n,
    },
    {
      name: 'Example 2',
      raw: 'broadcaster -> a\n%a -> inv, con\n&inv -> b\n%b -> con\n&con -> output',
      expected: 11_687_500n,
    },
    {
      name: 'Multi-input conjunction with sink rx and feedback loop',
      raw: 'broadcaster -> a, b\n%a -> c, d\n%b -> d\n%c -> d\n&d -> a, rx',
      expected: null,
    },
  ];

  for (const tc of fixedCases) {
    it(`matches plain functional oracle on ${tc.name}`, () => {
      const sim = new CircuitSimulator(parseCircuitBlueprint(tc.raw));
      const actual = sim.runPresses(1000);
      const oracle = runPlainOracle(tc.raw, 1000);
      expect(actual).toEqual(oracle.perPress);
      expect(sim.product).toBe(oracle.product);
      if (tc.expected !== null) expect(sim.product).toBe(tc.expected);
    });
  }

  it('matches plain functional oracle across 10 seeded random circuits', () => {
    for (let seed = 1; seed <= 10; seed += 1) {
      const raw = makeSeededRandomCircuit(seed * 7919);
      const sim = new CircuitSimulator(parseCircuitBlueprint(raw));
      const actual = sim.runPresses(1000);
      const oracle = runPlainOracle(raw, 1000);
      expect(actual).toEqual(oracle.perPress);
      expect(sim.product).toBe(oracle.product);
    }
  });
});
