import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { Crate, MoveInstruction, SupplyProcedure } from '../../shared';
import { CRATE_MOVER_9000, CrateMover9000, solvePart1, solver, tracePart1 } from './solver';

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

/** Independent O(S * M) backward coordinate-tracking oracle (no stack simulation). */
function backwardTopTrackerOracle(procedure: SupplyProcedure): string {
  const heights = procedure.initialStacks.map((s) => s.length);
  for (const move of procedure.moves) {
    heights[move.from - 1]! -= move.count;
    heights[move.to - 1]! += move.count;
  }

  let result = '';
  for (let s = 0; s < procedure.stackCount; s += 1) {
    const finalHeight = heights[s]!;
    if (finalHeight === 0) continue;

    let col = s;
    let pos = finalHeight - 1;
    const curHeights = [...heights];

    for (let m = procedure.moveCount - 1; m >= 0; m -= 1) {
      const move = procedure.moves[m]!;
      const f = move.from - 1;
      const t = move.to - 1;
      const beforeTargetLen = curHeights[t]! - move.count;
      const afterSourceLen = curHeights[f]!;
      if (col === t && pos >= beforeTargetLen) {
        const k = pos - beforeTargetLen;
        col = f;
        pos = afterSourceLen + move.count - 1 - k;
      }
      curHeights[t] = beforeTargetLen;
      curHeights[f] = afterSourceLen + move.count;
    }
    result += procedure.initialStacks[col]![pos]!.label;
  }
  return result;
}

function makeSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function buildRandomProcedure(seed: number): SupplyProcedure {
  const rand = makeSeededRng(seed);
  const stackCount = 2 + Math.floor(rand() * 7);
  const stacks: Crate[][] = Array.from({ length: stackCount }, () => []);
  const totalCrates = 4 + Math.floor(rand() * 25);
  for (let i = 0; i < totalCrates; i += 1) {
    const col = Math.floor(rand() * stackCount);
    const letter = String.fromCharCode(65 + Math.floor(rand() * 26));
    stacks[col]!.push(new Crate(letter));
  }

  const simHeights = stacks.map((s) => s.length);
  const moves: MoveInstruction[] = [];
  const targetMoves = 5 + Math.floor(rand() * 35);
  for (let m = 0; m < targetMoves; m += 1) {
    const nonEmpty = simHeights
      .map((h, idx) => ({ h, idx }))
      .filter((entry) => entry.h > 0);
    if (nonEmpty.length === 0) break;
    const src = nonEmpty[Math.floor(rand() * nonEmpty.length)]!;
    const count = 1 + Math.floor(rand() * src.h);
    let dst = Math.floor(rand() * (stackCount - 1));
    if (dst >= src.idx) dst += 1;
    moves.push(new MoveInstruction(count, src.idx + 1, dst + 1));
    simHeights[src.idx]! -= count;
    simHeights[dst]! += count;
  }
  return new SupplyProcedure(stacks, moves);
}

describe('CrateMover9000', () => {
  it('reverses lifted crates one-by-one and is frozen', () => {
    const crane = new CrateMover9000();
    expect(crane.name).toBe('CrateMover 9000');
    expect(crane.modelNumber).toBe(9000);
    expect(Object.isFrozen(CRATE_MOVER_9000)).toBe(true);

    const arranged = crane.arrangeLifted([new Crate('A'), new Crate('B'), new Crate('C')]);
    expect(arranged.map((c) => c.label)).toEqual(['C', 'B', 'A']);
    expect(Object.isFrozen(arranged)).toBe(true);
  });
});

describe('Part 1 solver', () => {
  it('solves the official example to CMZ via executeSolver with fake clock', () => {
    let ticks = 0;
    const fakeClock: Clock = {
      nowMs: () => {
        ticks += 10;
        return ticks;
      },
    };
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(result.answer).toBe('CMZ');
    expect(result.elapsedMs).toBe(10);
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('produces accurate trace frames for the official example', () => {
    const proc = solver.parse(OFFICIAL_EXAMPLE);
    const frames = tracePart1(proc);
    expect(frames).toHaveLength(5);
    expect(frames[0]!.topMessage).toBe('NDP');
    expect(frames[4]!.topMessage).toBe('CMZ');
    expect(frames[4]!.globalPeakHeight).toBe(4);
  });

  it('handles duplicate crate labels, empty final stack, and high peaks (46+ crates)', () => {
    const stack1 = Array.from({ length: 46 }, (_, i) => new Crate(i % 2 === 0 ? 'A' : 'B'));
    const proc = new SupplyProcedure(
      [stack1, [new Crate('A')], [new Crate('Z')]],
      [
        new MoveInstruction(46, 1, 2),
        new MoveInstruction(1, 3, 1),
      ],
    );
    expect(solvePart1(proc)).toBe('ZA');
    expect(solvePart1(proc)).toBe(backwardTopTrackerOracle(proc));
    const frames = tracePart1(proc);
    expect(frames[0]!.globalPeakHeight).toBe(47);
  });

  it('matches backward-top-tracker differential oracle on official example and 45 random procedures', () => {
    const officialProc = solver.parse(OFFICIAL_EXAMPLE);
    expect(solvePart1(officialProc)).toBe(backwardTopTrackerOracle(officialProc));

    for (let seed = 1; seed <= 45; seed += 1) {
      const proc = buildRandomProcedure(seed * 7919);
      expect(solvePart1(proc)).toBe(backwardTopTrackerOracle(proc));
    }
  });
});
