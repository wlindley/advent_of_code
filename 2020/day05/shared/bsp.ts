import { BOARDING_PASS_PATTERN, CODE_LENGTH, COLUMN_COUNT, ROW_COUNT } from './seat';

export type BspSymbol = 'F' | 'B' | 'L' | 'R';
export type BspAxis = 'row' | 'column';
export type BspHalf = 'lower' | 'upper';

interface SymbolMeta {
  readonly axis: BspAxis;
  readonly half: BspHalf;
}

const SYMBOL_META: Readonly<Record<BspSymbol, SymbolMeta>> = Object.freeze({
  F: Object.freeze({ axis: 'row', half: 'lower' }),
  B: Object.freeze({ axis: 'row', half: 'upper' }),
  L: Object.freeze({ axis: 'column', half: 'lower' }),
  R: Object.freeze({ axis: 'column', half: 'upper' }),
});

function assertValidBounds(low: number, high: number, max: number, label: string): void {
  if (!Number.isInteger(low) || !Number.isInteger(high) || low < 0 || high > max || low > high) {
    throw new RangeError(`Invalid ${label} bounds: [${low}, ${high}]`);
  }
}

/** Immutable snapshot of a single binary space partitioning narrowing step. */
export class BspStep {
  readonly #stepIndex: number;
  readonly #rowLow: number;
  readonly #rowHigh: number;
  readonly #columnLow: number;
  readonly #columnHigh: number;
  readonly #symbol: BspSymbol | null;

  constructor(
    stepIndex: number,
    rowLow: number,
    rowHigh: number,
    columnLow: number,
    columnHigh: number,
    symbol: BspSymbol | null,
  ) {
    if (!Number.isInteger(stepIndex) || stepIndex < 0 || stepIndex > CODE_LENGTH) {
      throw new RangeError(`Invalid stepIndex: ${stepIndex}`);
    }
    if ((stepIndex === 0) !== (symbol === null)) {
      throw new RangeError('BspStep symbol must be null iff stepIndex is 0');
    }
    assertValidBounds(rowLow, rowHigh, ROW_COUNT - 1, 'row');
    assertValidBounds(columnLow, columnHigh, COLUMN_COUNT - 1, 'column');
    this.#stepIndex = stepIndex;
    this.#rowLow = rowLow;
    this.#rowHigh = rowHigh;
    this.#columnLow = columnLow;
    this.#columnHigh = columnHigh;
    this.#symbol = symbol;
    Object.freeze(this);
  }

  get stepIndex(): number { return this.#stepIndex; }
  get rowLow(): number { return this.#rowLow; }
  get rowHigh(): number { return this.#rowHigh; }
  get columnLow(): number { return this.#columnLow; }
  get columnHigh(): number { return this.#columnHigh; }
  get symbol(): BspSymbol | null { return this.#symbol; }
  get axis(): BspAxis | null { return this.#symbol === null ? null : SYMBOL_META[this.#symbol].axis; }
  get half(): BspHalf | null { return this.#symbol === null ? null : SYMBOL_META[this.#symbol].half; }
  get rowCount(): number { return this.#rowHigh - this.#rowLow + 1; }
  get columnCount(): number { return this.#columnHigh - this.#columnLow + 1; }
  get candidateSeatCount(): number { return this.rowCount * this.columnCount; }
}

function halveRange(low: number, high: number, half: BspHalf): readonly [number, number] {
  const mid = Math.floor((low + high) / 2);
  return half === 'lower' ? [low, mid] : [mid + 1, high];
}

/** Traces all 11 binary space partitioning steps for a raw 10-character boarding code. */
export function traceSeatNarrowing(code: string): readonly BspStep[] {
  if (!BOARDING_PASS_PATTERN.test(code)) {
    throw new SyntaxError(`Invalid boarding pass code: "${code}"`);
  }
  let rowLow = 0;
  let rowHigh = ROW_COUNT - 1;
  let colLow = 0;
  let colHigh = COLUMN_COUNT - 1;
  const steps: BspStep[] = [new BspStep(0, rowLow, rowHigh, colLow, colHigh, null)];
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    const symbol = code[i] as BspSymbol;
    const meta = SYMBOL_META[symbol];
    if (meta.axis === 'row') {
      [rowLow, rowHigh] = halveRange(rowLow, rowHigh, meta.half);
    } else {
      [colLow, colHigh] = halveRange(colLow, colHigh, meta.half);
    }
    steps.push(new BspStep(i + 1, rowLow, rowHigh, colLow, colHigh, symbol));
  }
  return Object.freeze(steps);
}
