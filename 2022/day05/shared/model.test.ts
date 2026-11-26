import { describe, expect, it } from 'vitest';
import { Crate, MoveInstruction, SupplyProcedure, readTopMessage } from './model';

describe('Crate', () => {
  it('stores valid uppercase single-letter label and is frozen', () => {
    const crate = new Crate('Z');
    expect(crate.label).toBe('Z');
    expect(Object.isFrozen(crate)).toBe(true);
  });

  it('rejects empty string', () => {
    expect(() => new Crate('')).toThrow(RangeError);
  });

  it('rejects lowercase letter', () => {
    expect(() => new Crate('a')).toThrow(RangeError);
  });

  it('rejects multi-character string', () => {
    expect(() => new Crate('AB')).toThrow(RangeError);
  });

  it('rejects digit or symbol', () => {
    expect(() => new Crate('1')).toThrow(RangeError);
  });
});

describe('MoveInstruction', () => {
  it('stores valid count/from/to, computes summary, and is frozen', () => {
    const move = new MoveInstruction(3, 1, 2);
    expect(move.count).toBe(3);
    expect(move.from).toBe(1);
    expect(move.to).toBe(2);
    expect(move.summary).toBe('move 3 from 1 to 2');
    expect(Object.isFrozen(move)).toBe(true);
  });

  it('rejects non-positive count', () => {
    expect(() => new MoveInstruction(0, 1, 2)).toThrow(RangeError);
  });

  it('rejects non-integer count', () => {
    expect(() => new MoveInstruction(1.5, 1, 2)).toThrow(RangeError);
  });

  it('rejects non-positive from stack', () => {
    expect(() => new MoveInstruction(1, 0, 2)).toThrow(RangeError);
  });

  it('rejects non-positive to stack', () => {
    expect(() => new MoveInstruction(1, 1, 0)).toThrow(RangeError);
  });

  it('rejects unsafe integer count', () => {
    expect(() => new MoveInstruction(Number.MAX_SAFE_INTEGER + 1, 1, 2)).toThrow(RangeError);
  });

  it('rejects moving from a stack onto itself', () => {
    expect(() => new MoveInstruction(2, 3, 3)).toThrow(RangeError);
  });
});

describe('readTopMessage', () => {
  it('reads top crate labels and skips empty stacks', () => {
    const stacks = [
      [new Crate('Z'), new Crate('N')],
      [],
      [new Crate('P')],
    ];
    expect(readTopMessage(stacks)).toBe('NP');
  });
});

describe('SupplyProcedure', () => {
  it('clones and deep-freezes stacks and moves and computes dynamic getters', () => {
    const col1 = [new Crate('Z'), new Crate('N')];
    const col2 = [new Crate('M'), new Crate('C'), new Crate('D')];
    const rawStacks = [col1, col2];
    const rawMoves = [new MoveInstruction(1, 2, 1)];

    const proc = new SupplyProcedure(rawStacks, rawMoves);
    col1.push(new Crate('X'));
    rawStacks.push([new Crate('Y')]);
    rawMoves.push(new MoveInstruction(1, 1, 2));

    expect(proc.stackCount).toBe(2);
    expect(proc.totalCrates).toBe(5);
    expect(proc.moveCount).toBe(1);
    expect(proc.initialTopMessage).toBe('ND');
    expect(Object.isFrozen(proc)).toBe(true);
    expect(Object.isFrozen(proc.initialStacks)).toBe(true);
    expect(Object.isFrozen(proc.initialStacks[0])).toBe(true);
    expect(Object.isFrozen(proc.moves)).toBe(true);
  });

  it('allows zero moves and empty initial stacks', () => {
    const proc = new SupplyProcedure([[], [new Crate('A')]], []);
    expect(proc.stackCount).toBe(2);
    expect(proc.totalCrates).toBe(1);
    expect(proc.moveCount).toBe(0);
    expect(proc.initialTopMessage).toBe('A');
  });

  it('rejects empty initialStacks array', () => {
    expect(() => new SupplyProcedure([], [])).toThrow(RangeError);
  });

  it('rejects move.from exceeding stackCount', () => {
    expect(
      () => new SupplyProcedure([[new Crate('A')], [new Crate('B')]], [new MoveInstruction(1, 3, 1)]),
    ).toThrow(RangeError);
  });

  it('rejects move.to exceeding stackCount', () => {
    expect(
      () => new SupplyProcedure([[new Crate('A')], [new Crate('B')]], [new MoveInstruction(1, 1, 3)]),
    ).toThrow(RangeError);
  });
});
