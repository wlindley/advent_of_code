import { bitCount } from '../../../shared/core';

export const WORD_BITS = 36;
export const WORD_MASK = (1n << 36n) - 1n;
export const MAX_FLOATING_BITS = 18;

export type MaskChar = '0' | '1' | 'X';

const MASK_PATTERN_RE = /^[01X]{36}$/;
const MASK_LINE_RE = /^mask = (\S+)$/;
const MEM_LINE_RE = /^mem\[(\d+)\] = (\d+)$/;

/** Validates that a BigInt falls within the unsigned 36-bit integer range. */
export function assertUint36(value: bigint, label: string): bigint {
  if (value < 0n || value > WORD_MASK) {
    throw new RangeError(`${label} must be an unsigned 36-bit integer, got ${value}`);
  }
  return value;
}

function buildMaskForChar(pattern: string, target: MaskChar): bigint {
  let mask = 0n;
  for (let i = 0; i < WORD_BITS; i += 1) {
    if (pattern.charAt(i) === target) {
      mask |= 1n << BigInt(WORD_BITS - 1 - i);
    }
  }
  return mask;
}

function* iterateExpandedAddresses(base: bigint, floatingMask: bigint): IterableIterator<bigint> {
  let sub = floatingMask;
  while (true) {
    yield base | (floatingMask ^ sub);
    // Check termination before subtracting 1n to prevent BigInt -1n wraparound.
    if (sub === 0n) return;
    sub = (sub - 1n) & floatingMask;
  }
}

/** Immutable 36-bit initialization bitmask supporting Part 1 value and Part 2 address masking. */
export class Bitmask {
  readonly pattern: string;

  constructor(pattern: string) {
    if (!MASK_PATTERN_RE.test(pattern)) {
      throw new RangeError(`Bitmask must be 36 chars of [01X], got "${pattern}"`);
    }
    this.pattern = pattern;
    Object.freeze(this);
  }

  get setMask(): bigint {
    return buildMaskForChar(this.pattern, '1');
  }

  get floatingMask(): bigint {
    return buildMaskForChar(this.pattern, 'X');
  }

  get floatingCount(): number {
    return bitCount(this.floatingMask);
  }

  get forcedOneCount(): number {
    return bitCount(this.setMask);
  }

  get forcedZeroCount(): number {
    return WORD_BITS - this.floatingCount - this.forcedOneCount;
  }

  get expandedAddressCount(): bigint {
    return 1n << BigInt(this.floatingCount);
  }

  applyToValue(value: bigint): bigint {
    return (assertUint36(value, 'value') & this.floatingMask) | this.setMask;
  }

  baseAddressFor(address: bigint): bigint {
    return (assertUint36(address, 'address') | this.setMask) & (WORD_MASK ^ this.floatingMask);
  }

  expandedAddresses(address: bigint): IterableIterator<bigint> {
    const base = this.baseAddressFor(address);
    const floating = this.floatingMask;
    const count = bitCount(floating);
    if (count > MAX_FLOATING_BITS) {
      throw new RangeError(
        `Floating bit count ${count} exceeds MAX_FLOATING_BITS (${MAX_FLOATING_BITS})`,
      );
    }
    return iterateExpandedAddresses(base, floating);
  }
}

export interface SetMaskInstruction {
  readonly kind: 'mask';
  readonly mask: Bitmask;
}

export interface WriteMemoryInstruction {
  readonly kind: 'mem';
  readonly address: bigint;
  readonly value: bigint;
}

export type DockingInstruction = SetMaskInstruction | WriteMemoryInstruction;

/** Validated, frozen docking program guaranteed to start with a mask instruction. */
export class DockingProgram {
  readonly instructions: readonly DockingInstruction[];

  constructor(instructions: readonly DockingInstruction[]) {
    const first = instructions[0];
    if (first === undefined) {
      throw new RangeError('DockingProgram requires at least one instruction');
    }
    if (first.kind !== 'mask') {
      throw new Error('DockingProgram must start with a mask instruction');
    }
    this.instructions = Object.freeze([...instructions]);
    Object.freeze(this);
  }

  get length(): number {
    return this.instructions.length;
  }

  get initialMask(): Bitmask {
    return (this.instructions[0] as SetMaskInstruction).mask;
  }
}

function parseInstructionLine(line: string, lineNumber: number): DockingInstruction {
  const maskMatch = MASK_LINE_RE.exec(line);
  if (maskMatch !== null) {
    return Object.freeze({ kind: 'mask', mask: new Bitmask(maskMatch[1]!) });
  }
  const memMatch = MEM_LINE_RE.exec(line);
  if (memMatch !== null) {
    return Object.freeze({
      kind: 'mem',
      address: assertUint36(BigInt(memMatch[1]!), 'address'),
      value: assertUint36(BigInt(memMatch[2]!), 'value'),
    });
  }
  throw new Error(`Invalid docking instruction at line ${lineNumber}: ${line}`);
}

/** Parses a docking initialization program from CRLF/LF lines, ignoring blank lines. */
export function parseDockingProgram(raw: string): DockingProgram {
  const lines = raw.split(/\r?\n/);
  const instructions: DockingInstruction[] = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i]!.trim();
    if (trimmed.length === 0) continue;
    instructions.push(parseInstructionLine(trimmed, i + 1));
  }
  return new DockingProgram(instructions);
}
