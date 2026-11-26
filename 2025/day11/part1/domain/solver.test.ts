import { describe, expect, it } from 'vitest';
import { DEFAULT_MAX_TRACE_STEPS, PART1_TARGET, solveReactor, solver, traceReactor } from '.';

const EXAMPLE = [
  'aaa: you hhh', 'you: bbb ccc', 'bbb: ddd eee', 'ccc: ddd eee fff', 'ddd: ggg',
  'eee: out', 'fff: out', 'ggg: out', 'hhh: ccc fff iii', 'iii: out',
].join('\n');

function dfsMemoOracle(raw: string): bigint {
  const adj = new Map(raw.split('\n').map((line) => {
    const [src, rhs] = line.split(':');
    return [src!.trim(), rhs!.trim() ? rhs!.trim().split(/\s+/) : []] as const;
  }));
  const memo = new Map<string, bigint>();
  const dfs = (u: string): bigint => {
    if (u === 'out') return 1n;
    if (memo.has(u)) return memo.get(u)!;
    const total = (adj.get(u) ?? []).reduce((sum, v) => sum + dfs(v), 0n);
    memo.set(u, total);
    return total;
  };
  return adj.has('you') ? dfs('you') : 0n;
}

describe('day11 part1 solver', () => {
  it('solves the official example to 5n and handles disconnected/missing endpoints', () => {
    expect(solver.solve(solver.parse(EXAMPLE))).toBe(5n);
    expect([solveReactor(solver.parse('aaa: out')), solveReactor(solver.parse('you: aaa')), solveReactor(solver.parse('you: dead\nout:'))]).toEqual([0n, 0n, 0n]);
  });

  it('ignores off-path cycles and rejects on-path cycles', () => {
    expect(solveReactor(solver.parse('you: a side\na: out\nside: loop\nloop: side'))).toBe(1n);
    expect(() => solveReactor(solver.parse('you: a\na: b\nb: a out'))).toThrow(/Cycle/);
  });

  it('traces 8-node example, longest-path diamond shortcut, and unreachable graphs', () => {
    const frames = solver.trace!(solver.parse(EXAMPLE));
    expect([DEFAULT_MAX_TRACE_STEPS, frames.length, frames[0]!.totalGraphNodes]).toEqual([120, 8, 11]);
    expect([frames[0]!.isComplete, frames[7]!.isComplete, frames[7]!.ways.get(PART1_TARGET)]).toEqual([false, true, 5n]);

    const shortcut = traceReactor(solver.parse('you: a b\na: b\nb: out'));
    const byId = new Map(shortcut[0]!.relevantNodes.map((n) => [n.id, n.layer]));
    expect([byId.get('you'), byId.get('a'), byId.get('b'), byId.get('out')]).toEqual([0, 1, 2, 3]);

    const emptyTrace = traceReactor(solver.parse('you: dead\nout:'));
    expect(emptyTrace).toHaveLength(1);
    expect(emptyTrace[0]).toMatchObject({
      stepIndex: 0, totalSteps: 1, totalGraphNodes: 3, relevantNodes: [], edges: [], activeNode: null, isComplete: true,
    });
    expect(emptyTrace[0]!.ways.size).toBe(0);
  });

  it('bounds trace length and validates maxSteps', () => {
    const graph = solver.parse(EXAMPLE);
    const one = traceReactor(graph, { maxSteps: 1 });
    expect([one.length, one[0]!.ways.get('out'), one[0]!.isComplete]).toEqual([1, 5n, true]);

    const four = traceReactor(graph, { maxSteps: 4 });
    expect(four.map((f) => f.stepIndex)).toEqual([0, 1, 2, 3]);
    expect([four[3]!.ways.get('out'), four[3]!.isComplete]).toEqual([5n, true]);

    for (const bad of [0, -2, 2.5]) expect(() => traceReactor(graph, { maxSteps: bad })).toThrow(RangeError);
  });

  it('matches recursive memoized DFS across 30 seeded random wiring specs', () => {
    let seed = 0x13572468;
    const rand = (max: number) => ((seed = (seed * 1664525 + 1013904223) >>> 0) % max);
    for (let t = 0; t < 30; t++) {
      const k = 3 + rand(8);
      const names = ['you', ...Array.from({ length: k }, (_, i) => `d${i}`), 'out'];
      const raw = names.slice(0, -1).map((name, i) => {
        const outs: string[] = [];
        for (let j = i + 1; j < names.length; j++) if (rand(2) === 0) outs.push(names[j]!);
        return `${name}: ${outs.join(' ')}`;
      }).join('\n');
      expect(solver.solve(solver.parse(raw))).toBe(dfsMemoOracle(raw));
    }
  });
});
