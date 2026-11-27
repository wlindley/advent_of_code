import { describe, expect, it } from 'vitest';
import { WORD_MASK } from '../../shared';
import { solver } from './solver';

const OFFICIAL_EXAMPLE = [
  'mask = XXXXXXXXXXXXXXXXXXXXXXXXXXXXX1XXXX0X',
  'mem[8] = 11',
  'mem[7] = 101',
  'mem[8] = 0',
].join('\n');

describe('2020 Day 14 Part 1 solver', () => {
  it('solves the official Part 1 example to 165n', () => {
    const program = solver.parse(OFFICIAL_EXAMPLE);
    expect(solver.solve(program)).toBe(165n);
  });

  it('handles multiple masks, high 36-bit values, and zero-clearing writes', () => {
    const raw = [
      'mask = 1XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX0',
      'mem[10] = 3',
      'mem[20] = 1',
      'mask = 0XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
      'mem[10] = 7',
      'mask = 000000000000000000000000000000000000',
      'mem[20] = 999',
    ].join('\n');
    const program = solver.parse(raw);
    // mem[10] = 7 (MSB forced 0), mem[20] = 0 -> sum = 7n
    expect(solver.solve(program)).toBe(7n);

    const highMask = `mask = ${'X'.repeat(36)}\nmem[0] = ${WORD_MASK}`;
    expect(solver.solve(solver.parse(highMask))).toBe(WORD_MASK);
  });

  it('produces bounded trace frames preserving final sum across sampled steps', () => {
    const program = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(program);
    expect(full).toHaveLength(4);
    expect(full[3]!.isFinal).toBe(true);
    expect(full[3]!.memorySum).toBe(165n);

    const bounded = solver.trace(program, { maxSteps: 2 });
    expect(bounded).toHaveLength(2);
    expect(bounded[1]!.memorySum).toBe(165n);

    expect(() => solver.trace(program, { maxSteps: 0 })).toThrow(RangeError);
  });
});
