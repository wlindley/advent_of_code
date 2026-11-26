export type WireBit = 0 | 1;
export type GateOp = 'AND' | 'OR' | 'XOR';
export type BusPrefix = 'x' | 'y' | 'z';

export const WIRE_NAME_PATTERN = /^[a-z0-9]+$/;

/** Validates that `wire` is a lowercase alphanumeric wire identifier. */
export function assertValidWireName(wire: string): void {
  if (!WIRE_NAME_PATTERN.test(wire)) {
    throw new Error(`Invalid wire name: "${wire}"`);
  }
}

/** Formats a zero-padded bus wire such as `x00` or `z45`. */
export function formatBitWire(prefix: BusPrefix, bit: number): string {
  if (!Number.isInteger(bit) || bit < 0) {
    throw new RangeError(`Bit index must be a non-negative integer, got ${bit}`);
  }
  return `${prefix}${String(bit).padStart(2, '0')}`;
}

/** Parses a canonical bus wire like `z09` into its bit index, or `null` otherwise. */
export function parseBitWire(wire: string, prefix: BusPrefix): number | null {
  if (!wire.startsWith(prefix)) return null;
  const suffix = wire.slice(prefix.length);
  if (!/^\d{2,}$/.test(suffix)) return null;
  const bit = Number(suffix);
  return formatBitWire(prefix, bit) === wire ? bit : null;
}

/** Canonical immutable pair of swapped gate output wires (`first < second`). */
export class WireSwap {
  readonly first: string;
  readonly second: string;

  constructor(a: string, b: string) {
    assertValidWireName(a);
    assertValidWireName(b);
    if (a === b) throw new Error(`Cannot swap wire "${a}" with itself`);
    if (a < b) {
      this.first = a;
      this.second = b;
    } else {
      this.first = b;
      this.second = a;
    }
    Object.freeze(this);
  }
}
