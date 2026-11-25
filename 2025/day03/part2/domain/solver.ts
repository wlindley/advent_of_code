import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { BatteryBank, JoltageSelection, parseBatteryBanks } from '../../shared';

export const PART2_SELECTION_COUNT = 12;
export const DEFAULT_MAX_TRACE_STEPS = 250;

export type CellDisposition = 'kept' | 'evicted' | 'truncated';

export interface BankDropBreakdown {
  readonly selection: JoltageSelection;
  readonly dispositions: readonly CellDisposition[];
  readonly dropBudget: number;
  readonly evictedCount: number;
  readonly truncatedCount: number;
}

export interface BankDropFrame {
  readonly step: number;
  readonly bankIndex: number | null;
  readonly breakdown: BankDropBreakdown | null;
  readonly cumulativeJoltage: bigint;
}

const countOf = (ds: readonly CellDisposition[], target: CellDisposition): number =>
  ds.reduce((acc, d) => acc + (d === target ? 1 : 0), 0);

/** Traces strict-`>` monotonic stack drops (`evicted` pops and `truncated` tail trims) for a bank. */
export function traceStackDrops(bank: BatteryBank, count: number): BankDropBreakdown {
  if (!Number.isInteger(count) || count < 1 || count > bank.length) {
    throw new RangeError(`Selection count ${count} must be an integer in [1, ${bank.length}]`);
  }
  const dispositions: CellDisposition[] = Array<CellDisposition>(bank.length).fill('kept');
  const stack: number[] = [];
  let drops = bank.length - count;
  for (let i = 0; i < bank.length; i += 1) {
    const code = bank.raw.charCodeAt(i);
    while (drops > 0 && stack.length > 0 && code > bank.raw.charCodeAt(stack[stack.length - 1]!)) {
      dispositions[stack.pop()!] = 'evicted';
      drops -= 1;
    }
    stack.push(i);
  }
  for (let j = count; j < stack.length; j += 1) dispositions[stack[j]!] = 'truncated';
  const selection = new JoltageSelection(bank, stack.slice(0, count));
  const frozenDispositions = Object.freeze(dispositions);
  return Object.freeze({
    selection,
    dispositions: frozenDispositions,
    get dropBudget() { return frozenDispositions.length - selection.count; },
    get evictedCount() { return countOf(frozenDispositions, 'evicted'); },
    get truncatedCount() { return countOf(frozenDispositions, 'truncated'); },
  });
}

export const solver: PuzzleSolver<readonly BatteryBank[], bigint, BankDropFrame> = {
  parse: parseBatteryBanks,

  solve(banks: readonly BatteryBank[]): bigint {
    let total = 0n;
    for (const bank of banks) total += bank.selectMaxJoltage(PART2_SELECTION_COUNT).joltage;
    return total;
  },

  trace(banks: readonly BatteryBank[], options?: TraceOptions): readonly BankDropFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    }
    const stride = maxSteps === 1
      ? Number.POSITIVE_INFINITY
      : banks.length + 1 <= maxSteps ? 1 : Math.ceil(banks.length / (maxSteps - 1));

    let cumulativeJoltage = 0n;
    const frames: BankDropFrame[] = maxSteps > 1 || banks.length === 0
      ? [{ step: 0, bankIndex: null, breakdown: null, cumulativeJoltage }]
      : [];
    for (let i = 0; i < banks.length; i += 1) {
      const bank = banks[i]!;
      const step = i + 1;
      const keep = step % stride === 0 || i === banks.length - 1;
      const breakdown = keep ? traceStackDrops(bank, PART2_SELECTION_COUNT) : null;
      // Validate skipped banks via selectMaxJoltage so length checks & totals stay exact.
      cumulativeJoltage += breakdown ? breakdown.selection.joltage : bank.selectMaxJoltage(PART2_SELECTION_COUNT).joltage;
      if (keep) frames.push({ step, bankIndex: i, breakdown, cumulativeJoltage });
    }
    return frames;
  },
};
