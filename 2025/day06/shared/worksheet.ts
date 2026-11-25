export type WorksheetOperator = '+' | '*';

const CELL_ROW_RE = /^[ 0-9]+$/;

/** Immutable contiguous column block representing a single cephalopod math problem. */
export class ProblemBlock {
  readonly startCol: number;
  readonly endCol: number;
  readonly operator: WorksheetOperator;
  readonly digitRows: readonly string[];

  constructor(
    startCol: number,
    endCol: number,
    operator: WorksheetOperator,
    digitRows: readonly string[],
  ) {
    if (!Number.isInteger(startCol) || startCol < 0) throw new RangeError(`Invalid startCol: ${startCol}`);
    if (!Number.isInteger(endCol) || endCol < startCol) throw new RangeError(`Invalid endCol: ${endCol}`);
    if (operator !== '+' && operator !== '*') throw new Error(`Invalid operator: "${operator}"`);
    if (digitRows.length < 1) throw new RangeError('ProblemBlock requires at least one digit row');

    const width = endCol - startCol + 1;
    let hasDigit = false;
    for (const row of digitRows) {
      if (row.length !== width || !CELL_ROW_RE.test(row)) {
        throw new Error(`Invalid digit row "${row}" for width ${width}`);
      }
      if (/\d/.test(row)) hasDigit = true;
    }
    if (!hasDigit) throw new Error(`ProblemBlock ${startCol}-${endCol} has no digits`);

    this.startCol = startCol;
    this.endCol = endCol;
    this.operator = operator;
    this.digitRows = Object.freeze([...digitRows]);
    Object.freeze(this);
  }

  get width(): number {
    return this.endCol - this.startCol + 1;
  }

  evaluate(operands: readonly bigint[]): bigint {
    if (operands.length === 0) throw new Error('Cannot evaluate ProblemBlock with zero operands');
    return this.operator === '+'
      ? operands.reduce((acc, n) => acc + n, 0n)
      : operands.reduce((acc, n) => acc * n, 1n);
  }
}

/** Parsed, frozen cephalopod worksheet preserving exact column alignment. */
export interface Worksheet {
  readonly blocks: readonly ProblemBlock[];
  readonly width: number;
}

/** Parse raw fixed-width worksheet text without trimming horizontal indentation. */
export function parseWorksheet(raw: string): Worksheet {
  const lines = raw.split(/\r?\n/);
  while (lines.length > 0 && lines[0]!.trim() === '') lines.shift();
  while (lines.length > 0 && lines[lines.length - 1]!.trim() === '') lines.pop();

  if (lines.length < 2) throw new Error(`Expected >= 2 non-blank lines, got ${lines.length}`);
  if (lines.some((l) => l.trim() === '')) throw new Error('Worksheet must not contain interior blank lines');

  const width = Math.max(...lines.map((l) => l.length));
  const padded = lines.map((l) => l.padEnd(width, ' '));
  const operandLines = padded.slice(0, -1);
  const operatorLine = padded[padded.length - 1]!;
  const isBlankCol = (col: number) => padded.every((row) => row[col] === ' ');

  const blocks: ProblemBlock[] = [];
  let col = 0;
  while (col < width) {
    if (isBlankCol(col)) { col += 1; continue; }
    const startCol = col;
    while (col < width && !isBlankCol(col)) col += 1;
    const endCol = col - 1;
    const opRaw = operatorLine.slice(startCol, endCol + 1).trim();
    if (opRaw !== '+' && opRaw !== '*') throw new Error(`Invalid operator "${opRaw}" at ${startCol}-${endCol}`);
    blocks.push(new ProblemBlock(startCol, endCol, opRaw, operandLines.map((r) => r.slice(startCol, endCol + 1))));
  }

  return Object.freeze({ blocks: Object.freeze(blocks), width });
}
