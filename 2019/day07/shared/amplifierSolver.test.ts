import { describe, expect, it } from 'vitest';
import { AmplifierCircuitSolver } from './amplifierSolver';
import { FEEDBACK_LOOP_MODE, SERIES_CIRCUIT_MODE } from './circuitModes';

const PART1_EXAMPLES: readonly { raw: string; expected: bigint }[] = [
  { raw: '3,15,3,16,1002,16,10,16,1,16,15,15,4,15,99,0,0', expected: 43210n },
  { raw: '3,23,3,24,1002,24,10,24,1002,23,-1,23,101,5,23,23,1,24,23,23,4,23,99,0,0', expected: 54321n },
  { raw: '3,31,3,32,1002,32,10,32,1001,31,-2,31,1007,31,0,33,1002,33,7,33,1,33,31,31,1,32,31,31,4,31,99,0,0,0', expected: 65210n },
];

const PART2_EXAMPLES: readonly { raw: string; expected: bigint }[] = [
  { raw: '3,26,1001,26,-4,26,3,27,1002,27,2,27,1,27,26,27,4,27,1001,28,-1,28,1005,28,6,99,0,0,5', expected: 139629729n },
  { raw: '3,52,1001,52,-5,52,3,53,1,52,56,54,1007,54,5,55,1005,55,26,1001,54,-5,54,1105,1,12,1,53,54,53,1008,54,0,55,1001,55,1,55,2,53,55,53,4,53,1001,56,-1,56,1005,56,6,99,0,0,0,0,10', expected: 18216n },
];

// Independent minimal flat-loop Intcode VM + recursive permutation oracle for differential tests.
function oraclePermute(items: readonly bigint[]): bigint[][] {
  if (items.length <= 1) return [[...items]];
  const out: bigint[][] = [];
  for (let i = 0; i < items.length; i += 1) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)];
    for (const tail of oraclePermute(rest)) {
      out.push([items[i]!, ...tail]);
    }
  }
  return out;
}

function oracleStepUntilPause(tape: bigint[], state: { ip: number; halted: boolean }, inputs: bigint[]): bigint[] {
  const outputs: bigint[] = [];
  const rd = (mode: number, off: number) => (mode === 1 ? tape[state.ip + off]! : tape[Number(tape[state.ip + off]!)]!);
  while (!state.halted) {
    const instr = Number(tape[state.ip]!);
    const op = instr % 100;
    const m1 = Math.floor(instr / 100) % 10;
    const m2 = Math.floor(instr / 1000) % 10;
    if (op === 99) { state.halted = true; break; }
    if (op === 1) { tape[Number(tape[state.ip + 3]!)] = rd(m1, 1) + rd(m2, 2); state.ip += 4; }
    else if (op === 2) { tape[Number(tape[state.ip + 3]!)] = rd(m1, 1) * rd(m2, 2); state.ip += 4; }
    else if (op === 3) {
      if (inputs.length === 0) break;
      tape[Number(tape[state.ip + 1]!)] = inputs.shift()!;
      state.ip += 2;
    } else if (op === 4) { outputs.push(rd(m1, 1)); state.ip += 2; }
    else if (op === 5) { state.ip = rd(m1, 1) !== 0n ? Number(rd(m2, 2)) : state.ip + 3; }
    else if (op === 6) { state.ip = rd(m1, 1) === 0n ? Number(rd(m2, 2)) : state.ip + 3; }
    else if (op === 7) { tape[Number(tape[state.ip + 3]!)] = rd(m1, 1) < rd(m2, 2) ? 1n : 0n; state.ip += 4; }
    else { tape[Number(tape[state.ip + 3]!)] = rd(m1, 1) === rd(m2, 2) ? 1n : 0n; state.ip += 4; }
  }
  return outputs;
}

function oracleMaxSignal(raw: string, phasesBase: readonly bigint[], feedback: boolean): bigint {
  const baseTape = raw.split(',').map((t) => BigInt(t));
  let best: bigint | null = null;
  for (const phases of oraclePermute(phasesBase)) {
    const tapes = phases.map(() => [...baseTape]);
    const states = phases.map(() => ({ ip: 0, halted: false }));
    const queues = phases.map((p) => [p]);
    queues[0]!.push(0n);
    let lastE = 0n;
    while (states.some((s) => !s.halted)) {
      for (let i = 0; i < 5; i += 1) {
        const out = oracleStepUntilPause(tapes[i]!, states[i]!, queues[i]!);
        if (i === 4 && out.length > 0) lastE = out[out.length - 1]!;
        if (feedback || i < 4) queues[(i + 1) % 5]!.push(...out);
      }
      if (!feedback) break;
    }
    if (best === null || lastE > best) best = lastE;
  }
  return best!;
}

describe('AmplifierCircuitSolver', () => {
  it('solves all official Part 1 and Part 2 examples', () => {
    const seriesSolver = new AmplifierCircuitSolver(SERIES_CIRCUIT_MODE);
    for (const ex of PART1_EXAMPLES) {
      expect(seriesSolver.solve(seriesSolver.parse(ex.raw))).toBe(ex.expected);
    }
    const feedbackSolver = new AmplifierCircuitSolver(FEEDBACK_LOOP_MODE);
    for (const ex of PART2_EXAMPLES) {
      expect(feedbackSolver.solve(feedbackSolver.parse(ex.raw))).toBe(ex.expected);
    }
  });

  it('matches an independent flat-loop oracle on negative, branching, and >64-bit BigInt tapes', () => {
    // Negative + branching series tape; > 2^63 multiplication feedback tape.
    const negBranchTape = '3,22,3,23,1007,22,2,24,1005,24,15,1001,23,-500,23,1001,23,-10,23,4,23,99,0,0,0';
    const bigIntLoopTape =
      '3,32,1001,32,-5,32,3,33,1001,33,1000000000000,33,1002,33,1000000000,33,1,33,32,33,4,33,1001,34,-1,34,1005,34,6,99,0,0,0,0,2';

    const sSolver = new AmplifierCircuitSolver(SERIES_CIRCUIT_MODE);
    expect(sSolver.solve(sSolver.parse(negBranchTape))).toBe(
      oracleMaxSignal(negBranchTape, [0n, 1n, 2n, 3n, 4n], false),
    );
    const fSolver = new AmplifierCircuitSolver(FEEDBACK_LOOP_MODE);
    expect(fSolver.solve(fSolver.parse(bigIntLoopTape))).toBe(
      oracleMaxSignal(bigIntLoopTape, [5n, 6n, 7n, 8n, 9n], true),
    );
  });

  it('produces bounded trace frames with accurate best, top-5, and signal envelope', () => {
    const solver = new AmplifierCircuitSolver(SERIES_CIRCUIT_MODE, 5000);
    const program = solver.parse(PART1_EXAMPLES[0]!.raw);
    expect(solver.evaluate(program, [4n, 3n, 2n, 1n, 0n]).thrusterSignal).toBe(43210n);

    const frames = solver.trace(program, { maxSteps: 10 });
    expect(frames).toHaveLength(10);
    expect(frames[0]!.permutationIndex).toBe(0);
    expect(frames[0]!.isNewBest).toBe(true);
    expect(frames[9]!.permutationIndex).toBe(119);
    expect(frames[9]!.totalPermutations).toBe(120);
    expect(frames[9]!.bestEntry.run.thrusterSignal).toBe(43210n);
    expect(frames[9]!.topEntries).toHaveLength(5);
    expect(frames[9]!.minSignal <= frames[9]!.maxSignal).toBe(true);

    const fullFrames = solver.trace(program);
    expect(fullFrames).toHaveLength(120);
    expect(Object.isFrozen(fullFrames)).toBe(true);

    const ex2Frames = solver.trace(solver.parse(PART1_EXAMPLES[1]!.raw), { maxSteps: 5 });
    expect(ex2Frames[4]!.minSignal < ex2Frames[4]!.maxSignal).toBe(true);
    expect(ex2Frames[4]!.maxSignal).toBe(54321n);
  });

  it('validates maxStepsPerAmp and trace maxSteps options', () => {
    expect(() => new AmplifierCircuitSolver(SERIES_CIRCUIT_MODE, 0)).toThrow(RangeError);
    const solver = new AmplifierCircuitSolver(SERIES_CIRCUIT_MODE);
    const program = solver.parse(PART1_EXAMPLES[0]!.raw);
    expect(() => solver.trace(program, { maxSteps: -1 })).toThrow(RangeError);
  });
});
