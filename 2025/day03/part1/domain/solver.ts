import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { BatteryBank, JoltageSelection, parseBatteryBanks } from '../../shared';

export const PART1_SELECTION_COUNT = 2;
export const DEFAULT_MAX_TRACE_STEPS = 250;

export interface BankSelectionFrame {
  readonly step: number;
  readonly bankIndex: number | null;
  readonly selection: JoltageSelection | null;
  readonly cumulativeJoltage: bigint;
}

export const solver: PuzzleSolver<readonly BatteryBank[], bigint, BankSelectionFrame> = {
  parse: parseBatteryBanks,

  solve(banks: readonly BatteryBank[]): bigint {
    let total = 0n;
    for (const bank of banks) {
      total += bank.selectMaxJoltage(PART1_SELECTION_COUNT).joltage;
    }
    return total;
  },

  trace(banks: readonly BatteryBank[], options?: TraceOptions): readonly BankSelectionFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    }
    const stride =
      maxSteps === 1
        ? Number.POSITIVE_INFINITY
        : banks.length + 1 <= maxSteps
          ? 1
          : Math.ceil(banks.length / (maxSteps - 1));

    const frames: BankSelectionFrame[] = [];
    let cumulativeJoltage = 0n;
    let lastFrame: BankSelectionFrame = {
      step: 0,
      bankIndex: null,
      selection: null,
      cumulativeJoltage,
    };
    if (maxSteps > 1) frames.push(lastFrame);

    for (let i = 0; i < banks.length; i += 1) {
      const selection = banks[i]!.selectMaxJoltage(PART1_SELECTION_COUNT);
      cumulativeJoltage += selection.joltage;
      const step = i + 1;
      lastFrame = { step, bankIndex: i, selection, cumulativeJoltage };
      if (step % stride === 0) frames.push(lastFrame);
    }

    // Retain the exact final state even when bank count is not divisible by stride.
    if (frames.at(-1) !== lastFrame) frames.push(lastFrame);
    return frames;
  },
};
