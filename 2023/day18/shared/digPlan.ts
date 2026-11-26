export type DigDirection = 'U' | 'D' | 'L' | 'R';

export interface DirectionDelta {
  readonly dx: bigint;
  readonly dy: bigint;
}

export const DIRECTION_DELTAS: Readonly<Record<DigDirection, DirectionDelta>> = Object.freeze({
  U: Object.freeze({ dx: 0n, dy: -1n }),
  D: Object.freeze({ dx: 0n, dy: 1n }),
  L: Object.freeze({ dx: -1n, dy: 0n }),
  R: Object.freeze({ dx: 1n, dy: 0n }),
});

const RAW_HEX_PATTERN = /^[0-9a-f]{6}$/i;
const CSS_HEX_PATTERN = /^#[0-9a-f]{6}$/;
const DIG_LINE_PATTERN = /^([UDLR])\s+(\d+)\s+\(#([0-9a-fA-F]{6})\)$/;

/** Un-decoded line from an AoC Day 18 dig plan (`<dir> <dist> (#<hex>)`). */
export class RawDigEntry {
  readonly direction: DigDirection;
  readonly distance: bigint;
  readonly hexCode: string;

  constructor(direction: DigDirection, distance: bigint, hexCode: string) {
    if (distance <= 0n) {
      throw new RangeError(`Dig distance must be positive, got ${distance}`);
    }
    if (!RAW_HEX_PATTERN.test(hexCode)) {
      throw new SyntaxError(`Invalid 6-digit hex code: "${hexCode}"`);
    }
    this.direction = direction;
    this.distance = distance;
    this.hexCode = hexCode.toLowerCase();
    Object.freeze(this);
  }

  get color(): string {
    return `#${this.hexCode}`;
  }
}

/** Decoded orthogonal dig instruction with validated positive distance and `#rrggbb` color. */
export class DigStep {
  readonly direction: DigDirection;
  readonly distance: bigint;
  readonly color: string;

  constructor(direction: DigDirection, distance: bigint, color: string) {
    if (distance <= 0n) {
      throw new RangeError(`Dig distance must be positive, got ${distance}`);
    }
    if (!CSS_HEX_PATTERN.test(color)) {
      throw new SyntaxError(`Invalid lowercase #rrggbb color: "${color}"`);
    }
    this.direction = direction;
    this.distance = distance;
    this.color = color;
    Object.freeze(this);
  }
}

/** Strategy interface allowing Part 1 (direct) and Part 2 (hex-encoded) dig-plan decoding. */
export interface DigPlanDecoder {
  decodeStep(entry: RawDigEntry): DigStep;
}

/** Part 1 decoder: uses the explicit direction, distance, and normalized RGB color directly. */
export const DIRECT_DIG_PLAN_DECODER: DigPlanDecoder = Object.freeze({
  decodeStep: (entry: RawDigEntry): DigStep =>
    new DigStep(entry.direction, entry.distance, entry.color),
});

function parseDigLine(line: string, lineNumber: number): RawDigEntry {
  const match = DIG_LINE_PATTERN.exec(line.trim());
  if (!match) {
    throw new SyntaxError(`Malformed dig plan at line ${lineNumber}: "${line}"`);
  }
  return new RawDigEntry(
    match[1] as DigDirection,
    BigInt(match[2]!),
    match[3]!,
  );
}

/** Parses raw dig-plan text into validated `RawDigEntry` values. */
export function parseDigPlan(raw: string): readonly RawDigEntry[] {
  const trimmed = raw.replace(/\r\n/g, '\n').trim();
  if (trimmed.length === 0) {
    throw new Error('Dig plan input must not be empty');
  }
  const lines = trimmed.split('\n');
  return Object.freeze(lines.map((line, index) => parseDigLine(line, index + 1)));
}
