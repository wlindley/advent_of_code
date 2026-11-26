import { describe, expect, it } from 'vitest';
import { LOOP_ACCUMULATOR_POLICY, REPAIR_BOOT_POLICY } from './policy';
import { BootCodeSolver } from './solver';

const EXAMPLE_INPUT = [
  'nop +0',
  'acc +1',
  'jmp +4',
  'acc +3',
  'jmp -3',
  'acc -99',
  'acc +1',
  'jmp -4',
  'acc +6',
].join('\n');

describe('BootCodeSolver', () => {
  it('implements parse, solve, and trace for any BootDiagnosisPolicy', () => {
    const part1 = new BootCodeSolver(LOOP_ACCUMULATOR_POLICY);
    const part2 = new BootCodeSolver(REPAIR_BOOT_POLICY);

    expect(part1.policy).toBe(LOOP_ACCUMULATOR_POLICY);
    expect(part2.policy).toBe(REPAIR_BOOT_POLICY);

    const parsed = part1.parse(EXAMPLE_INPUT);
    expect(part1.solve(parsed)).toBe(5n);
    expect(part2.solve(parsed)).toBe(8n);

    const trace1 = part1.trace(parsed, { maxSteps: 3 });
    expect(trace1).toHaveLength(3);
    expect(trace1[2]!.accumulator).toBe(5n);

    const trace2 = part2.trace(parsed);
    expect(trace2[trace2.length - 1]!.accumulator).toBe(8n);
  });
});
