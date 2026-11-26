export const ROW_BITS = 7;
export const COLUMN_BITS = 3;
export const CODE_LENGTH = ROW_BITS + COLUMN_BITS;
export const ROW_COUNT = 1 << ROW_BITS;
export const COLUMN_COUNT = 1 << COLUMN_BITS;
export const CABIN_CAPACITY = ROW_COUNT * COLUMN_COUNT;
export const MAX_SEAT_ID = CABIN_CAPACITY - 1;
export const BOARDING_PASS_PATTERN = /^[FB]{7}[LR]{3}$/;

/** Validates that a seat ID is an integer within `[0, 1023]`. */
export function assertValidSeatId(seatId: number): void {
  if (!Number.isInteger(seatId) || seatId < 0 || seatId > MAX_SEAT_ID) {
    throw new RangeError(`Seat ID must be an integer in [0, ${MAX_SEAT_ID}], got ${seatId}`);
  }
}

/** Decodes a 10-character `F/B/L/R` boarding pass code into its numeric seat ID. */
export function decodeSeatId(code: string): number {
  if (!BOARDING_PASS_PATTERN.test(code)) {
    throw new SyntaxError(`Invalid boarding pass code: "${code}"`);
  }
  let seatId = 0;
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    const ch = code[i];
    seatId = (seatId << 1) | (ch === 'B' || ch === 'R' ? 1 : 0);
  }
  return seatId;
}

/** Encodes a valid seat ID in `[0, 1023]` back into its 10-character `F/B/L/R` code. */
export function encodeSeatCode(seatId: number): string {
  assertValidSeatId(seatId);
  let code = '';
  for (let bit = CODE_LENGTH - 1; bit >= 0; bit -= 1) {
    const isUpper = ((seatId >> bit) & 1) === 1;
    code += bit >= COLUMN_BITS ? (isUpper ? 'B' : 'F') : (isUpper ? 'R' : 'L');
  }
  return code;
}

/** Immutable boarding pass value object keyed by canonical `seatId`. */
export class BoardingPass {
  readonly seatId: number;

  constructor(seatId: number) {
    assertValidSeatId(seatId);
    this.seatId = seatId;
    Object.freeze(this);
  }

  static fromCode(code: string): BoardingPass {
    return new BoardingPass(decodeSeatId(code));
  }

  get row(): number {
    return this.seatId >> COLUMN_BITS;
  }

  get column(): number {
    return this.seatId & (COLUMN_COUNT - 1);
  }

  get code(): string {
    return encodeSeatCode(this.seatId);
  }
}

/** Non-empty immutable collection of parsed boarding passes. */
export class BoardingManifest {
  readonly passes: readonly BoardingPass[];

  constructor(passes: readonly BoardingPass[]) {
    if (passes.length === 0) {
      throw new RangeError('Boarding manifest must contain at least one boarding pass');
    }
    this.passes = Object.freeze([...passes]);
    Object.freeze(this);
  }

  get size(): number {
    return this.passes.length;
  }
}

function trimLine(line: string): string {
  return line.trim();
}

function isNonEmptyLine(line: string): boolean {
  return line.length > 0;
}

/** Parses newline-delimited boarding pass codes into a `BoardingManifest`. */
export function parseBoardingManifest(raw: string): BoardingManifest {
  const lines = raw.split(/\r?\n/).map(trimLine).filter(isNonEmptyLine);
  return new BoardingManifest(lines.map(BoardingPass.fromCode));
}
