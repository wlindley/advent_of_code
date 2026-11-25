import type { PuzzleSolver, TraceOptions } from '../../../../shared/core';
import { parseWorksheet, type ProblemBlock, type Worksheet } from '../../shared';

export const DEFAULT_MAX_TRACE_STEPS = 200;

/** Single vertical base-10 column operand decoded top-to-bottom within a ProblemBlock. */
export interface ColumnOperand { readonly col: number; readonly value: bigint; }

/** Snapshot of evaluating one problem block right-to-left using vertical column operands. */
export interface VerticalEvalFrame {
  readonly step: number;
  readonly problemIndex: number | null;
  readonly block: ProblemBlock | null;
  readonly columns: readonly ColumnOperand[];
  readonly problemResult: bigint | null;
  readonly grandTotal: bigint;
}

/** Extract right-to-left vertical base-10 column operands (MSD top -> LSD bottom) from a ProblemBlock. */
export function extractVerticalColumns(block: ProblemBlock): readonly ColumnOperand[] {
  const columns: ColumnOperand[] = [];
  for (let c = block.width - 1; c >= 0; c -= 1) {
    let state: 0 | 1 | 2 = 0; // 0: before digits, 1: in digits, 2: after digits
    let value = 0n;
    for (const row of block.digitRows) {
      const code = row.charCodeAt(c);
      if (code === 32) {
        if (state === 1) state = 2;
      } else {
        if (state === 2) throw new Error(`Invalid vertical operand gap at col ${block.startCol + c}`);
        state = 1;
        value = value * 10n + BigInt(code - 48);
      }
    }
    // Preserve 0n columns while skipping operator-only all-space columns.
    if (state !== 0) columns.push(Object.freeze({ col: block.startCol + c, value }));
  }
  return Object.freeze(columns);
}

function evaluateVerticalBlock(block: ProblemBlock) {
  const columns = extractVerticalColumns(block);
  return { columns, problemResult: block.evaluate(columns.map((c) => c.value)) };
}

export const solver: PuzzleSolver<Worksheet, bigint, VerticalEvalFrame> = {
  parse: parseWorksheet,

  solve(worksheet: Worksheet): bigint {
    let total = 0n;
    for (let i = worksheet.blocks.length - 1; i >= 0; i -= 1) {
      total += evaluateVerticalBlock(worksheet.blocks[i]!).problemResult;
    }
    return total;
  },

  trace(worksheet: Worksheet, options?: TraceOptions): readonly VerticalEvalFrame[] {
    const maxSteps = options?.maxSteps ?? DEFAULT_MAX_TRACE_STEPS;
    if (!Number.isInteger(maxSteps) || maxSteps < 1) {
      throw new RangeError(`maxSteps must be a positive integer, got ${maxSteps}`);
    }
    const n = worksheet.blocks.length;
    const frames: VerticalEvalFrame[] = [];
    if (maxSteps > 1 || n === 0) {
      frames.push({ step: 0, problemIndex: null, block: null, columns: [], problemResult: null, grandTotal: 0n });
    }
    const stride = maxSteps === 1 ? Number.POSITIVE_INFINITY : n + 1 <= maxSteps ? 1 : Math.ceil(n / (maxSteps - 1));
    let grandTotal = 0n;
    for (let step = 1; step <= n; step += 1) {
      const problemIndex = n - step;
      const block = worksheet.blocks[problemIndex]!;
      const { columns, problemResult } = evaluateVerticalBlock(block);
      grandTotal += problemResult;
      // Always retain the final right-to-left block (problemIndex: 0) at exact grandTotal.
      if (step % stride === 0 || step === n) {
        frames.push({ step, problemIndex, block, columns, problemResult, grandTotal });
      }
    }
    return frames;
  },
};
