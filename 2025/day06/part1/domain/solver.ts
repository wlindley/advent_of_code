import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseWorksheet, type ProblemBlock, type Worksheet } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Snapshot of evaluating one problem block on the cephalopod worksheet. */
export interface ProblemEvalFrame {
  readonly step: number;
  readonly problemIndex: number | null;
  readonly block: ProblemBlock | null;
  readonly operands: readonly bigint[];
  readonly problemResult: bigint | null;
  readonly grandTotal: bigint;
}

/** Extract horizontal base-10 operands row-by-row from a ProblemBlock. */
export function extractHorizontalOperands(block: ProblemBlock): readonly bigint[] {
  const operands: bigint[] = [];
  for (const row of block.digitRows) {
    const trimmed = row.trim();
    if (trimmed.length === 0) continue;
    if (!/^\d+$/.test(trimmed)) {
      throw new Error(`Invalid horizontal operand "${trimmed}" at cols ${block.startCol}-${block.endCol}`);
    }
    operands.push(BigInt(trimmed));
  }
  return Object.freeze(operands);
}

export const solver: PuzzleSolver<Worksheet, bigint, ProblemEvalFrame> = {
  parse: parseWorksheet,

  solve(worksheet: Worksheet): bigint {
    let total = 0n;
    for (const block of worksheet.blocks) {
      total += block.evaluate(extractHorizontalOperands(block));
    }
    return total;
  },

  trace(worksheet: Worksheet, options?: TraceOptions): readonly ProblemEvalFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    }

    const n = worksheet.blocks.length;
    const frames: ProblemEvalFrame[] = [];
    if (maxSteps > 1 || n === 0) {
      frames.push({
        step: 0, problemIndex: null, block: null, operands: [], problemResult: null, grandTotal: 0n,
      });
    }

    const stride =
      maxSteps === 1
        ? Number.POSITIVE_INFINITY
        : n + 1 <= maxSteps ? 1 : Math.ceil(n / (maxSteps - 1));

    let grandTotal = 0n;
    for (let i = 0; i < n; i += 1) {
      const block = worksheet.blocks[i]!;
      const operands = extractHorizontalOperands(block);
      const problemResult = block.evaluate(operands);
      grandTotal += problemResult;
      const step = i + 1;
      // Always retain the final problem frame so the trace ends at the exact grand total.
      if (step % stride === 0 || step === n) {
        frames.push({ step, problemIndex: i, block, operands, problemResult, grandTotal });
      }
    }
    return frames;
  },
};
