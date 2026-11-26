import type { MemoryAccess } from './memory';

/** Supported Intcode parameter addressing modes. */
export type ParameterMode = 'position' | 'immediate';

/** Positional parameter offset relative to the current instruction pointer. */
export type ParamOffset = 1 | 2 | 3;

/** Recorded memory read performed while executing an opcode. */
export interface MemoryRead {
  readonly address: bigint;
  readonly value: bigint;
}

/** Recorded memory read augmented with decoded parameter mode and raw parameter cell. */
export interface DecodedMemoryRead extends MemoryRead {
  readonly mode: ParameterMode;
  readonly rawParam: bigint;
}

/** Resolved parameter read returned by a parameter mode handler. */
export interface ResolvedRead {
  readonly address: bigint;
  readonly rawParam: bigint;
  readonly value: bigint;
}

/** Strategy contract for a single Intcode parameter addressing mode. */
export interface ParameterModeHandler {
  readonly code: bigint;
  readonly mode: ParameterMode;
  read(memory: MemoryAccess, paramAddress: bigint): ResolvedRead;
  resolveWriteAddress(memory: MemoryAccess, paramAddress: bigint): bigint;
}

const MODE_DIVISORS: Readonly<Record<ParamOffset, bigint>> = Object.freeze({
  1: 100n,
  2: 1000n,
  3: 10000n,
});

function assertNonNegativeInstruction(rawInstruction: bigint): void {
  if (rawInstruction < 0n) {
    throw new RangeError(`Intcode instruction cannot be negative: ${rawInstruction}`);
  }
}

/** Mode 0: parameter cell holds the memory address to read or write. */
export const POSITION_MODE: ParameterModeHandler = Object.freeze({
  code: 0n,
  mode: 'position',
  read(memory: MemoryAccess, paramAddress: bigint): ResolvedRead {
    const rawParam = memory.read(paramAddress);
    const value = memory.read(rawParam);
    return Object.freeze({ address: rawParam, rawParam, value });
  },
  resolveWriteAddress(memory: MemoryAccess, paramAddress: bigint): bigint {
    return memory.read(paramAddress);
  },
});

/** Mode 1: parameter cell itself holds the immediate value; writes are invalid. */
export const IMMEDIATE_MODE: ParameterModeHandler = Object.freeze({
  code: 1n,
  mode: 'immediate',
  read(memory: MemoryAccess, paramAddress: bigint): ResolvedRead {
    const rawParam = memory.read(paramAddress);
    return Object.freeze({ address: paramAddress, rawParam, value: rawParam });
  },
  resolveWriteAddress(_memory: MemoryAccess, paramAddress: bigint): bigint {
    throw new Error(`Immediate mode cannot be used for write parameter at address ${paramAddress}`);
  },
});

/** Core Intcode parameter modes (position and immediate). */
export const CORE_MODES: readonly ParameterModeHandler[] = Object.freeze([
  POSITION_MODE,
  IMMEDIATE_MODE,
]);

/** Builds a parameter mode lookup table while rejecting duplicate mode codes. */
export function createModeRegistry(
  handlers: readonly ParameterModeHandler[],
): ReadonlyMap<bigint, ParameterModeHandler> {
  const registry = new Map<bigint, ParameterModeHandler>();
  for (const handler of handlers) {
    if (registry.has(handler.code)) {
      throw new Error(`Duplicate parameter mode registration: ${handler.code}`);
    }
    registry.set(handler.code, handler);
  }
  return registry;
}

/** Extracts the two-digit opcode from a non-negative raw instruction word. */
export function decodeOpcode(rawInstruction: bigint): bigint {
  assertNonNegativeInstruction(rawInstruction);
  return rawInstruction % 100n;
}

/** Extracts the parameter mode digit for the given 1-based parameter offset. */
export function extractModeCode(rawInstruction: bigint, offset: ParamOffset): bigint {
  assertNonNegativeInstruction(rawInstruction);
  return (rawInstruction / MODE_DIVISORS[offset]) % 10n;
}
