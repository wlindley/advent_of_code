import { describe, expect, it } from 'vitest';
import { Crate, MoveInstruction, SupplyProcedure } from './model';
import {
  CraneTraceFrame,
  DEFAULT_MAX_TRACE_STEPS,
  executeProcedure,
  traceProcedure,
  type CraneStrategy,
} from './simulator';

const LIFO_CRANE: CraneStrategy = {
  name: 'Test LIFO',
  modelNumber: 9000,
  arrangeLifted(lifted) {
    return Object.freeze([...lifted].reverse());
  },
};

const FIFO_CRANE: CraneStrategy = {
  name: 'Test FIFO',
  modelNumber: 9001,
  arrangeLifted(lifted) {
    return lifted;
  },
};

function makeExampleProcedure(): SupplyProcedure {
  return new SupplyProcedure(
    [
      [new Crate('Z'), new Crate('N')],
      [new Crate('M'), new Crate('C'), new Crate('D')],
      [new Crate('P')],
    ],
    [
      new MoveInstruction(1, 2, 1),
      new MoveInstruction(3, 1, 3),
      new MoveInstruction(2, 2, 1),
      new MoveInstruction(1, 1, 2),
    ],
  );
}

describe('executeProcedure', () => {
  it('executes moves according to crane strategy without mutating procedure', () => {
    const proc = makeExampleProcedure();
    expect(executeProcedure(proc, LIFO_CRANE)).toBe('CMZ');
    expect(executeProcedure(proc, FIFO_CRANE)).toBe('MCD');
    expect(proc.initialTopMessage).toBe('NDP');
  });

  it('handles zero moves and empty stacks', () => {
    const proc = new SupplyProcedure([[], [new Crate('A')]], []);
    expect(executeProcedure(proc, LIFO_CRANE)).toBe('A');
  });

  it('throws RangeError when a move requests more crates than available', () => {
    const proc = new SupplyProcedure(
      [[new Crate('A')], [new Crate('B')]],
      [new MoveInstruction(2, 1, 2)],
    );
    expect(() => executeProcedure(proc, LIFO_CRANE)).toThrow(RangeError);
  });
});

describe('traceProcedure', () => {
  it('emits initial frame plus one frame per move when within default maxSteps', () => {
    const proc = makeExampleProcedure();
    const frames = traceProcedure(proc, LIFO_CRANE);

    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(frames).toHaveLength(5);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[0]!.totalSteps).toBe(5);
    expect(frames[0]!.moveIndex).toBe(0);
    expect(frames[0]!.totalMoves).toBe(4);
    expect(frames[0]!.appliedMove).toBeNull();
    expect(frames[0]!.placedCrates).toEqual([]);
    expect(frames[0]!.topMessage).toBe('NDP');
    expect(frames[0]!.currentPeakHeight).toBe(3);
    expect(frames[0]!.globalPeakHeight).toBe(4);

    expect(frames[4]!.stepIndex).toBe(4);
    expect(frames[4]!.moveIndex).toBe(4);
    expect(frames[4]!.appliedMove?.summary).toBe('move 1 from 1 to 2');
    expect(frames[4]!.placedCrates.map((c) => c.label)).toEqual(['M']);
    expect(frames[4]!.topMessage).toBe('CMZ');
    expect(frames[4]!.currentPeakHeight).toBe(4);
    expect(frames[4]!.globalPeakHeight).toBe(4);

    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames[0]).toBeInstanceOf(CraneTraceFrame);
    expect(Object.isFrozen(frames[0])).toBe(true);
    expect(Object.isFrozen(frames[0]!.stacks)).toBe(true);
    expect(Object.isFrozen(frames[0]!.stacks[0])).toBe(true);
    expect(Object.isFrozen(frames[0]!.placedCrates)).toBe(true);
  });

  it('handles zero moves in traceProcedure', () => {
    const proc = new SupplyProcedure([[new Crate('Q')], []], []);
    const frames = traceProcedure(proc, LIFO_CRANE);
    expect(frames).toHaveLength(1);
    expect(frames[0]!.topMessage).toBe('Q');
    expect(frames[0]!.globalPeakHeight).toBe(1);
  });

  it('samples uniformly while tracking true globalPeakHeight across unsampled moves', () => {
    // Stack 1 starts with 5 crates; move 3 to stack 2 (peak=5), move 2 more to stack 2 (unsampled peak=7),
    // then distribute back down so final peak is 3.
    const proc = new SupplyProcedure(
      [
        [new Crate('A'), new Crate('B'), new Crate('C'), new Crate('D'), new Crate('E')],
        [new Crate('F'), new Crate('G')],
        [],
      ],
      [
        new MoveInstruction(3, 1, 2),
        new MoveInstruction(2, 1, 2), // unsampled intermediate state reaches height 7 on stack 2
        new MoveInstruction(4, 2, 3),
        new MoveInstruction(1, 3, 1),
      ],
    );
    const frames = traceProcedure(proc, LIFO_CRANE, { maxSteps: 3 });
    expect(frames).toHaveLength(3);
    expect(frames.map((f) => f.moveIndex)).toEqual([0, 2, 4]);
    expect(frames[0]!.globalPeakHeight).toBe(7);
    expect(frames[2]!.globalPeakHeight).toBe(7);
    expect(frames[2]!.currentPeakHeight).toBe(3);
  });

  it('returns only the final frame when maxSteps is 1 and moves >= 1', () => {
    const proc = makeExampleProcedure();
    const frames = traceProcedure(proc, LIFO_CRANE, { maxSteps: 1 });
    expect(frames).toHaveLength(1);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[0]!.moveIndex).toBe(4);
    expect(frames[0]!.topMessage).toBe('CMZ');
  });

  it('rejects invalid maxSteps', () => {
    const proc = makeExampleProcedure();
    expect(() => traceProcedure(proc, LIFO_CRANE, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceProcedure(proc, LIFO_CRANE, { maxSteps: 1.5 })).toThrow(RangeError);
  });

  it('throws RangeError during trace when move underflows source stack', () => {
    const proc = new SupplyProcedure(
      [[new Crate('A')], [new Crate('B')]],
      [new MoveInstruction(2, 1, 2)],
    );
    expect(() => traceProcedure(proc, LIFO_CRANE)).toThrow(RangeError);
  });
});
