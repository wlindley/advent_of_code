/** Validates that `value` is a non-negative safe integer, throwing `RangeError` otherwise. */
export function assertNonNegativeSafeInt(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer, got ${value}`);
  }
}

/** Immutable horizontal span of digits representing a schematic part number. */
export class PartNumber {
  readonly id: number;
  readonly row: number;
  readonly startCol: number;
  readonly endCol: number;
  readonly value: number;

  constructor(id: number, row: number, startCol: number, endCol: number, value: number) {
    assertNonNegativeSafeInt(id, 'PartNumber id');
    assertNonNegativeSafeInt(row, 'PartNumber row');
    assertNonNegativeSafeInt(startCol, 'PartNumber startCol');
    assertNonNegativeSafeInt(endCol, 'PartNumber endCol');
    assertNonNegativeSafeInt(value, 'PartNumber value');
    if (endCol < startCol) {
      throw new RangeError(`PartNumber endCol (${endCol}) must be >= startCol (${startCol})`);
    }
    this.id = id;
    this.row = row;
    this.startCol = startCol;
    this.endCol = endCol;
    this.value = value;
    Object.freeze(this);
  }

  /** Number of grid cells spanned horizontally by this part number. */
  get length(): number {
    return this.endCol - this.startCol + 1;
  }
}
