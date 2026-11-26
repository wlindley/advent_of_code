import { describe, expect, it } from 'vitest';
import { AmplifierCircuitSolver, FEEDBACK_LOOP_MODE } from '../../shared';
import { solver } from './index';

const EX1 =
  '3,26,1001,26,-4,26,3,27,1002,27,2,27,1,27,26,27,4,27,1001,28,-1,28,1005,28,6,99,0,0,5';
const EX2 =
  '3,52,1001,52,-5,52,3,53,1,52,56,54,1007,54,5,55,1005,55,26,1001,54,-5,54,1105,1,12,1,53,54,53,1008,54,0,55,1001,55,1,55,2,53,55,53,4,53,1001,56,-1,56,1005,56,6,99,0,0,0,0,10';

interface OracleStage {
  mem: bigint[];
  ip: number;
  halted: boolean;
  q: bigint[];
}

function oraclePermute(items: readonly bigint[]): bigint[][] {
  if (items.length <= 1) return [[...items]];
  const out: bigint[][] = [];
  for (let i = 0; i < items.length; i += 1) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of oraclePermute(rest)) out.push([items[i]!, ...tail]);
  }
  return out;
}

function oracleArg(mem: bigint[], ip: number, offset: number, modeDiv: bigint): bigint {
  const mode = (mem[ip]! / modeDiv) % 10n;
  const raw = mem[ip + offset]!;
  return mode === 1n ? raw : (mem[Number(raw)] ?? 0n);
}

function oracleRunStage(s: OracleStage): bigint[] {
  const outputs: bigint[] = [];
  while (!s.halted) {
    const instr = s.mem[s.ip]!;
    const op = instr % 100n;
    if (op === 99n) {
      s.halted = true;
      break;
    }
    if (op === 3n) {
      if (s.q.length === 0) break;
      s.mem[Number(s.mem[s.ip + 1]!)] = s.q.shift()!;
      s.ip += 2;
      continue;
    }
    const a = oracleArg(s.mem, s.ip, 1, 100n);
    if (op === 4n) {
      outputs.push(a);
      s.ip += 2;
      continue;
    }
    const b = oracleArg(s.mem, s.ip, 2, 1000n);
    if (op === 5n || op === 6n) {
      s.ip = (op === 5n ? a !== 0n : a === 0n) ? Number(b) : s.ip + 3;
      continue;
    }
    const dst = Number(s.mem[s.ip + 3]!);
    if (op === 1n) s.mem[dst] = a + b;
    else if (op === 2n) s.mem[dst] = a * b;
    else if (op === 7n) s.mem[dst] = a < b ? 1n : 0n;
    else if (op === 8n) s.mem[dst] = a === b ? 1n : 0n;
    s.ip += 4;
  }
  return outputs;
}

function oracleSolveFeedback(cells: readonly bigint[]): bigint {
  let best: bigint | null = null;
  for (const phases of oraclePermute([5n, 6n, 7n, 8n, 9n])) {
    const stages: OracleStage[] = phases.map((p) => ({
      mem: [...cells],
      ip: 0,
      halted: false,
      q: [p],
    }));
    stages[0]!.q.push(0n);
    let lastE = 0n;
    while (stages.some((st) => !st.halted)) {
      for (let i = 0; i < 5; i += 1) {
        const out = oracleRunStage(stages[i]!);
        if (i === 4 && out.length > 0) lastE = out[out.length - 1]!;
        const next = stages[(i + 1) % 5]!;
        if (!next.halted) next.q.push(...out);
      }
    }
    if (best === null || lastE > best) best = lastE;
  }
  return best!;
}

describe('2019 Day 7 Part 2 solver', () => {
  it('exposes feedback loop mode metadata', () => {
    expect(solver.mode.id).toBe('feedback');
    expect(solver.mode.hasFeedbackLoop).toBe(true);
    expect(solver.mode.phaseSettings).toEqual([5n, 6n, 7n, 8n, 9n]);
  });

  it('solves both official Part 2 examples with rounds and halted stages', () => {
    const res1 = solver.search(solver.parse(EX1));
    expect(res1.bestRun.thrusterSignal).toBe(139629729n);
    expect(res1.bestRun.phases).toEqual([9n, 8n, 7n, 6n, 5n]);
    expect(res1.bestRun.rounds).toBe(5);
    expect(res1.bestRun.stages.map((s) => s.status)).toEqual(Array(5).fill('halted'));

    const res2 = solver.search(solver.parse(EX2));
    expect(res2.bestRun.thrusterSignal).toBe(18216n);
    expect(res2.bestRun.phases).toEqual([9n, 7n, 8n, 5n, 6n]);
    expect(res2.bestRun.rounds).toBe(10);
    expect(res2.bestRun.stages.map((s) => s.status)).toEqual(Array(5).fill('halted'));
  });

  it('produces bounded trace frames and descending leaderboard for Ex 1', () => {
    const frames = solver.trace(solver.parse(EX1), { maxSteps: 12 });
    const last = frames[11]!;
    expect(frames).toHaveLength(12);
    expect(last.bestEntry.run.thrusterSignal).toBe(139629729n);
    expect(last.topEntries).toHaveLength(5);
    expect(last.minSignal <= last.maxSignal && last.maxSignal === 139629729n).toBe(true);
    for (let i = 1; i < last.topEntries.length; i += 1) {
      expect(last.topEntries[i - 1]!.run.thrusterSignal >= last.topEntries[i]!.run.thrusterSignal).toBe(true);
    }
  });

  it('retains negative maximum when all thruster signals are negative', () => {
    const prog = solver.parse(
      '3,23,3,24,1002,24,2,24,1002,23,-1,23,1,23,24,24,1001,24,-10,24,4,24,99,0,0',
    );
    expect(solver.solve(prog)).toBe(-491n);
  });

  it('preserves exact >2^63 odd-low-bit BigInt arithmetic across feedback rounds', () => {
    const prog = solver.parse(
      '3,26,1002,26,2,26,3,27,101,9223372036854775809,27,27,1,26,27,27,4,27,1001,28,-1,28,1005,28,6,99,0,0,3',
    );
    expect(solver.solve(prog)).toBe(138350580552821637345n);
  });

  it('delivers multiple outputs per round in FIFO order and uses E last output after A halts', () => {
    const prog = solver.parse(
      '3,25,3,26,1,25,26,26,4,26,1001,26,1,26,4,26,3,26,3,27,4,26,4,27,99,0,0,0',
    );
    const run = solver.evaluate(prog, [5n, 6n, 7n, 8n, 9n]);
    expect(run.rounds).toBe(2);
    expect(run.stages[0]!.status).toBe('halted');
    expect(run.stages[4]!.emittedSignals).toEqual([35n, 36n, 27n, 19n]);
    expect(run.thrusterSignal).toBe(19n);
  });

  it('rejects deadlock, silent E, perpetual livelock, malformed inputs, and invalid phases', () => {
    expect(() => solver.evaluate(solver.parse('3,5,3,5,3,5,99,0'), [5n, 6n, 7n, 8n, 9n])).toThrow(/deadlock/i);
    expect(() => solver.evaluate(solver.parse('3,5,99,0,0,0'), [5n, 6n, 7n, 8n, 9n])).toThrow(/no thruster signal/i);
    const boundedSolver = new AmplifierCircuitSolver(FEEDBACK_LOOP_MODE, 500);
    expect(() =>
      boundedSolver.evaluate(
        boundedSolver.parse('3,14,3,15,1001,15,1,15,4,15,1105,1,2,99,0,0'),
        [5n, 6n, 7n, 8n, 9n],
      ),
    ).toThrow(RangeError);
    expect(() => solver.parse('')).toThrow(/empty/i);
    expect(() => solver.parse('3,abc,99')).toThrow(/Invalid Intcode/);
    expect(() => solver.evaluate(solver.parse(EX1), [5n, 6n])).toThrow(RangeError);
  });

  it('matches independent differential oracle on examples and synthetic feedback programs', () => {
    const branching =
      '3,32,3,33,1008,32,7,34,1005,34,18,1001,33,-3,33,1105,1,22,1002,33,2,33,4,33,1001,35,-1,35,1005,35,2,99,0,0,0,3';
    const negativeLoop =
      '3,32,3,33,1007,33,0,34,1005,34,18,1001,33,-5,33,1105,1,22,1,32,33,33,4,33,1001,35,-1,35,1005,35,2,99,0,0,0,2';
    for (const raw of [EX1, EX2, branching, negativeLoop]) {
      const prog = solver.parse(raw);
      expect(solver.solve(prog)).toBe(oracleSolveFeedback(prog.cells));
    }
  });
});
