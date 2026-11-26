import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solveFocusingPower, solver } from './solver';

const OFFICIAL_EXAMPLE = 'rn=1,cm-,qp=3,cm=2,qp-,pc=4,ot=9,ab=5,pc-,pc=6,ot=7';

class FakeClock implements Clock {
  private index = 0;

  constructor(private readonly samples: readonly number[]) {}

  nowMs(): number {
    const value = this.samples[this.index] ?? this.samples[this.samples.length - 1] ?? 0;
    this.index += 1;
    return value;
  }
}

describe('solveFocusingPower & solver', () => {
  it('solves the official example to 145', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    expect(solveFocusingPower(parsed)).toBe(145);
    expect(solver.solve(parsed)).toBe(145);
  });

  it('freezes the exported solver object', () => {
    expect(Object.isFrozen(solver)).toBe(true);
  });

  it('returns 0 for an empty instruction list', () => {
    expect(solveFocusingPower([])).toBe(0);
  });

  it('handles box-0 and box-255 boundary labels (rn -> 0, sl -> 255)', () => {
    const instructions = solver.parse('rn=4,sl=9');
    expect(instructions[0]!.boxIndex).toBe(0);
    expect(instructions[1]!.boxIndex).toBe(255);
    expect(solver.solve(instructions)).toBe(1 * 1 * 4 + 256 * 1 * 9);
  });

  it('returns 0 when all inserted lenses are later removed', () => {
    const instructions = solver.parse('rn=1,cm=2,sl=9,rn-,cm-,sl-');
    expect(solver.solve(instructions)).toBe(0);
  });

  it('executes via executeSolver with a deterministic FakeClock', () => {
    const clock = new FakeClock([12.5, 19.25]);
    const execution = executeSolver(solver, OFFICIAL_EXAMPLE, clock);
    expect(execution).toEqual({
      answer: 145,
      elapsedMs: 6.75,
      runtime: 'main-thread',
    });
  });
});
