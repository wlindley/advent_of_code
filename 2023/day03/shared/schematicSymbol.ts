import { assertNonNegativeSafeInt } from './partNumber';

/** Returns true iff `ch` is a single ASCII digit character `'0'..'9'`. */
export function isAsciiDigit(ch: string): boolean {
  return ch.length === 1 && ch >= '0' && ch <= '9';
}

/** Returns true iff `ch` is a single non-dot, non-digit, non-whitespace schematic symbol. */
export function isSchematicSymbol(ch: string): boolean {
  return ch.length === 1 && ch !== '.' && !isAsciiDigit(ch) && !/\s/.test(ch);
}

/** Immutable schematic symbol located at `(row, col)`. */
export class SchematicSymbol {
  readonly id: number;
  readonly row: number;
  readonly col: number;
  readonly char: string;

  constructor(id: number, row: number, col: number, char: string) {
    assertNonNegativeSafeInt(id, 'SchematicSymbol id');
    assertNonNegativeSafeInt(row, 'SchematicSymbol row');
    assertNonNegativeSafeInt(col, 'SchematicSymbol col');
    if (!isSchematicSymbol(char)) {
      throw new SyntaxError(`Invalid schematic symbol ${JSON.stringify(char)} at (${row}, ${col})`);
    }
    this.id = id;
    this.row = row;
    this.col = col;
    this.char = char;
    Object.freeze(this);
  }

  /** Whether this symbol is `'*'` (a candidate gear in Part 2). */
  get isGearCandidate(): boolean {
    return this.char === '*';
  }
}
