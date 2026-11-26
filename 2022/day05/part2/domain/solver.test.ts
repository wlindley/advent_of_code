import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { Crate, MoveInstruction, SupplyProcedure } from '../../shared';
import { CRATE_MOVER_9001, CrateMover9001, solvePart2, solver, tracePart2 } from './index';

const OFFICIAL_EXAMPLE = [
  '    [D]    ',
  '[N] [C]    ',
  '[Z] [M] [P]',
  ' 1   2   3 ',
  '',
  'move 1 from 2 to 1',
  'move 3 from 1 to 3',
  'move 2 from 2 to 1',
  'move 1 from 1 to 2',
].join('\n');

function makeFakeClock(): Clock {
  let ticks = 0;
  return { nowMs: () => (ticks += 10) };
}

function nextLcg(state: { value: number }): number {
  state.value = (Math.imul(1664525, state.value) + 1013904223) >>> 0;
  return state.value / 0x100000000;
}

function traceOriginLabel(
  proc: SupplyProcedure,
  startCol: number,
  finalHeights: readonly number[],
): string {
  let col = startCol;
  let pos = finalHeights[startCol]! - 1;
  const cur = [...finalHeights];
  for (let m = proc.moveCount - 1; m >= 0; m -= 1) {
    const move = proc.moves[m]!;
    const f = move.from - 1;
    const t = move.to - 1;
    const beforeTarget = cur[t]! - move.count;
    const afterSource = cur[f]!;
    if (col === t && pos >= beforeTarget) {
      col = f;
      pos = afterSource + (pos - beforeTarget);
    }
    cur[t] = beforeTarget;
    cur[f] = afterSource + move.count;
  }
  return proc.initialStacks[col]![pos]!.label;
}

function backwardTopTrackerOracle(proc: SupplyProcedure): string {
  const heights = proc.initialStacks.map((s) => s.length);
  for (const move of proc.moves) {
    heights[move.from - 1]! -= move.count;
    heights[move.to - 1]! += move.count;
  }
  let result = '';
  for (let s = 0; s < proc.stackCount; s += 1) {
    if (heights[s]! > 0) result += traceOriginLabel(proc, s, heights);
  }
  return result;
}

function buildRandomProcedure(seed: number): SupplyProcedure {
  const rng = { value: seed >>> 0 };
  const stackCount = 2 + Math.floor(nextLcg(rng) * 7);
  const stacks: Crate[][] = Array.from({ length: stackCount }, () => []);
  const totalCrates = 4 + Math.floor(nextLcg(rng) * 25);
  for (let i = 0; i < totalCrates; i += 1) {
    const col = Math.floor(nextLcg(rng) * stackCount);
    stacks[col]!.push(new Crate(String.fromCharCode(65 + Math.floor(nextLcg(rng) * 26))));
  }
  const heights = stacks.map((s) => s.length);
  const moves: MoveInstruction[] = [];
  const targetMoves = 5 + Math.floor(nextLcg(rng) * 35);
  for (let m = 0; m < targetMoves; m += 1) {
    const nonEmpty: number[] = [];
    for (let i = 0; i < stackCount; i += 1) if (heights[i]! > 0) nonEmpty.push(i);
    if (nonEmpty.length === 0) break;
    const src = nonEmpty[Math.floor(nextLcg(rng) * nonEmpty.length)]!;
    const count = 1 + Math.floor(nextLcg(rng) * heights[src]!);
    let dst = Math.floor(nextLcg(rng) * (stackCount - 1));
    if (dst >= src) dst += 1;
    moves.push(new MoveInstruction(count, src + 1, dst + 1));
    heights[src]! -= count;
    heights[dst]! += count;
  }
  return new SupplyProcedure(stacks, moves);
}

describe('CrateMover9001', () => {
  it('preserves order, freezes output, and defensively clones input', () => {
    const crane = new CrateMover9001();
    expect(crane.name).toBe('CrateMover 9001');
    expect(crane.modelNumber).toBe(9001);
    expect(Object.isFrozen(CRATE_MOVER_9001)).toBe(true);

    const source = [new Crate('A'), new Crate('B'), new Crate('C')];
    const arranged = crane.arrangeLifted(source);
    source.reverse();
    expect(arranged.map((c) => c.label)).toEqual(['A', 'B', 'C']);
    expect(Object.isFrozen(arranged)).toBe(true);
    expect(crane.arrangeLifted([new Crate('X')]).map((c) => c.label)).toEqual(['X']);
    expect(crane.arrangeLifted([])).toEqual([]);
  });
});

describe('Part 2 solver', () => {
  it('solves the official example to MCD via executeSolver with fake clock', () => {
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, makeFakeClock());
    expect(result.answer).toBe('MCD');
    expect(result.elapsedMs).toBe(10);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('produces accurate trace frames and bounded sampling', () => {
    const frames = tracePart2(solver.parse(OFFICIAL_EXAMPLE));
    expect(frames).toHaveLength(5);
    expect(frames.map((f) => f.topMessage)).toEqual(['NDP', 'DCP', 'CD', 'CD', 'MCD']);
    expect(frames[2]!.placedCrates.map((c) => c.label)).toEqual(['Z', 'N', 'D']);
    expect(frames[4]!.globalPeakHeight).toBe(4);

    const moves20 = Array.from({ length: 20 }, (_, i) =>
      new MoveInstruction(1, (i % 2) + 1, ((i + 1) % 2) + 1),
    );
    const sampled = tracePart2(new SupplyProcedure([[new Crate('A')], [new Crate('B')]], moves20), {
      maxSteps: 5,
    });
    expect(sampled).toHaveLength(5);
    expect(sampled[0]!.moveIndex).toBe(0);
    expect(sampled[4]!.moveIndex).toBe(20);
  });

  it('handles full-stack lift, duplicate labels, empty final stack, and 47-crate peak', () => {
    const stack1 = Array.from({ length: 46 }, (_, i) => new Crate(i % 2 === 0 ? 'A' : 'B'));
    const proc = new SupplyProcedure(
      [stack1, [new Crate('A')], [new Crate('Z')]],
      [new MoveInstruction(46, 1, 2), new MoveInstruction(1, 3, 1)],
    );
    expect(solvePart2(proc)).toBe('ZB');
    expect(solvePart2(proc)).toBe(backwardTopTrackerOracle(proc));
    expect(tracePart2(proc)[0]!.globalPeakHeight).toBe(47);
  });

  it('rejects missing blank line', () => expect(() => solver.parse('[A]\n 1 \nmove 1 from 1 to 1')).toThrow());
  it('rejects malformed move line', () => expect(() => solver.parse('[A] [B]\n 1   2 \n\nbad move')).toThrow());
  it('rejects underflow on solvePart2', () => {
    expect(() => solvePart2(new SupplyProcedure([[new Crate('A')], []], [new MoveInstruction(2, 1, 2)]))).toThrow(RangeError);
  });
  it('rejects underflow on tracePart2', () => {
    expect(() => tracePart2(new SupplyProcedure([[new Crate('A')], []], [new MoveInstruction(2, 1, 2)]))).toThrow(RangeError);
  });
  it('rejects invalid maxSteps: 0', () => expect(() => tracePart2(solver.parse(OFFICIAL_EXAMPLE), { maxSteps: 0 })).toThrow(RangeError));

  it('matches backward-top-tracker oracle across official example and 50 random procedures', () => {
    const official = solver.parse(OFFICIAL_EXAMPLE);
    expect(solvePart2(official)).toBe(backwardTopTrackerOracle(official));
    for (let seed = 1; seed <= 50; seed += 1) {
      const proc = buildRandomProcedure(seed * 7919);
      expect(solvePart2(proc)).toBe(backwardTopTrackerOracle(proc));
    }
  });
});
