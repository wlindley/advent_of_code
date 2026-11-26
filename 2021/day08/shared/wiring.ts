import type { DisplayEntry } from './entry';
import {
  CANONICAL_DIGIT_MASKS,
  CANONICAL_MASK_TO_DIGIT,
  WIRE_INDICES,
  WIRE_LETTERS,
  type Digit,
  type SignalPattern,
  type WireIndex,
} from './segments';

const WIRE_COUNT = 7;
const FULL_WIRE_MASK = 0x7f;

/** Closed-form frequency & overlap deduction rules indexed by canonical `WireIndex` (a..g). */
export const CANONICAL_DEDUCTION_RULES = Object.freeze([
  'freq 8, absent from digit 1',
  'freq 6 (unique)',
  'freq 8, present in digit 1',
  'freq 7, present in digit 4',
  'freq 4 (unique)',
  'freq 9 (unique)',
  'freq 7, absent from digit 4',
] as const);

export type DecodedOutputTuple = readonly [DecodedDigit, DecodedDigit, DecodedDigit, DecodedDigit];

function validateMapping(map: Uint8Array): Uint8Array {
  if (map.length !== WIRE_COUNT) throw new RangeError(`WireMapping requires ${WIRE_COUNT} entries, got ${map.length}`);
  let seenMask = 0;
  for (const wire of WIRE_INDICES) {
    const target = map[wire] as number;
    if (!Number.isInteger(target) || target < 0 || target > 6) {
      throw new RangeError(`Invalid canonical wire index ${target} at wire ${wire}`);
    }
    seenMask |= 1 << target;
  }
  if (seenMask !== FULL_WIRE_MASK) throw new RangeError('WireMapping must be a bijection over canonical wires 0..6');
  return new Uint8Array(map);
}

/** Bijective mapping from observed signal wires (0..6) to canonical 7-segment positions (a..g). */
export class WireMapping {
  private readonly map: Uint8Array;

  constructor(map: Uint8Array) {
    this.map = validateMapping(map);
    Object.freeze(this);
  }

  toCanonical(wire: WireIndex): WireIndex { return this.map[wire] as WireIndex; }

  translateMask(mask: number): number {
    let canonicalMask = 0;
    for (const wire of WIRE_INDICES) if ((mask & (1 << wire)) !== 0) canonicalMask |= 1 << this.toCanonical(wire);
    return canonicalMask;
  }

  decodeMask(mask: number): Digit | null {
    const digit = CANONICAL_MASK_TO_DIGIT.get(this.translateMask(mask));
    return digit === undefined ? null : digit;
  }
}

/** Immutable decoded output digit pairing its observed pattern with its canonical numeric value. */
export class DecodedDigit {
  readonly pattern: SignalPattern;
  readonly value: Digit;

  constructor(pattern: SignalPattern, value: Digit) {
    this.pattern = pattern;
    this.value = value;
    Object.freeze(this);
  }

  get canonicalMask(): number { return CANONICAL_DIGIT_MASKS[this.value]; }
  get isUniqueSegmentCount(): boolean { return this.pattern.isUniqueSegmentCount; }
}

/** Immutable decoded 7-segment display entry with wire bijection and 4 decoded output digits. */
export class DecodedDisplay {
  readonly entry: DisplayEntry;
  readonly mapping: WireMapping;
  readonly outputs: DecodedOutputTuple;

  constructor(entry: DisplayEntry, mapping: WireMapping, outputs: DecodedOutputTuple) {
    this.entry = entry;
    this.mapping = mapping;
    this.outputs = Object.freeze([...outputs]) as unknown as DecodedOutputTuple;
    Object.freeze(this);
  }

  get outputValue(): number {
    const [d0, d1, d2, d3] = this.outputs;
    return d0.value * 1000 + d1.value * 100 + d2.value * 10 + d3.value;
  }

  get uniqueDigitCount(): number {
    let count = 0;
    for (const digit of this.outputs) if (digit.isUniqueSegmentCount) count += 1;
    return count;
  }

  get formattedOutput(): string {
    const [d0, d1, d2, d3] = this.outputs;
    return `${d0.value}${d1.value}${d2.value}${d3.value}`;
  }
}

function classifyWire(freq: number, inOne: boolean, inFour: boolean, wire: WireIndex): WireIndex {
  if (freq === 4) return 4;
  if (freq === 6) return 1;
  if (freq === 9) return 5;
  if (freq === 8) return inOne ? 2 : 0;
  if (freq === 7) return inFour ? 3 : 6;
  throw new SyntaxError(`Invalid wire frequency ${freq} for wire '${WIRE_LETTERS[wire]}'`);
}

/** Deduces the unique wire-to-segment bijection for a 10-signal display entry and verifies all 10 signals. */
export function deduceWireMapping(entry: DisplayEntry): WireMapping {
  const one = entry.findSignalBySegmentCount(2);
  if (one === null) throw new SyntaxError('Display entry missing 2-segment signal pattern (digit 1)');
  const four = entry.findSignalBySegmentCount(4);
  if (four === null) throw new SyntaxError('Display entry missing 4-segment signal pattern (digit 4)');
  const freqs = entry.wireFrequencies;
  const candidate = new Uint8Array(WIRE_COUNT);
  for (const wire of WIRE_INDICES) {
    candidate[wire] = classifyWire(freqs[wire], one.hasWire(wire), four.hasWire(wire), wire);
  }
  const mapping = new WireMapping(candidate);
  for (const pattern of entry.signals) {
    if (mapping.decodeMask(pattern.mask) === null) {
      throw new SyntaxError(`Signal pattern "${pattern.letters}" failed canonical round-trip verification`);
    }
  }
  return mapping;
}

/** Deduces wire mapping and decodes all 4 output patterns of a display entry. */
export function decodeDisplayEntry(entry: DisplayEntry): DecodedDisplay {
  const mapping = deduceWireMapping(entry);
  const decoded: DecodedDigit[] = [];
  for (const pattern of entry.outputs) {
    const value = mapping.decodeMask(pattern.mask);
    if (value === null) throw new SyntaxError(`Output pattern "${pattern.letters}" does not decode to a valid digit`);
    decoded.push(new DecodedDigit(pattern, value));
  }
  return new DecodedDisplay(entry, mapping, decoded as unknown as DecodedOutputTuple);
}
