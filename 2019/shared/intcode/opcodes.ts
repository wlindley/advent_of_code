import type { ParamOffset } from './modes';

export type { ParamOffset } from './modes';

/** Number of operand parameters consumed by an Intcode opcode. */
export type OpcodeArity = 0 | 1 | 2 | 3;

/** Execution capability interface exposed to Intcode opcode handlers. */
export interface ExecutionContext {
  readParam(offset: ParamOffset): bigint;
  assertWritable(offset: ParamOffset): void;
  writeParam(offset: ParamOffset, value: bigint): void;
  advance(delta: bigint): void;
  jump(targetAddress: bigint): void;
  readInput(): bigint | null;
  writeOutput(value: bigint): void;
  waitForInput(): void;
  halt(): void;
}

/** Strategy contract for a single Intcode instruction opcode. */
export interface OpcodeHandler {
  readonly code: bigint;
  readonly mnemonic: string;
  readonly arity: OpcodeArity;
  execute(ctx: ExecutionContext): void;
}

/** Opcode 1: add parameter 1 and parameter 2, store at parameter 3, advance IP by 4. */
export const ADD_OPCODE: OpcodeHandler = Object.freeze({
  code: 1n,
  mnemonic: 'ADD',
  arity: 3,
  execute(ctx: ExecutionContext): void {
    ctx.writeParam(3, ctx.readParam(1) + ctx.readParam(2));
    ctx.advance(4n);
  },
});

/** Opcode 2: multiply parameter 1 and parameter 2, store at parameter 3, advance IP by 4. */
export const MUL_OPCODE: OpcodeHandler = Object.freeze({
  code: 2n,
  mnemonic: 'MUL',
  arity: 3,
  execute(ctx: ExecutionContext): void {
    ctx.writeParam(3, ctx.readParam(1) * ctx.readParam(2));
    ctx.advance(4n);
  },
});

/** Opcode 3: validate destination writability first, then read input into parameter 1 or pause. */
export const INPUT_OPCODE: OpcodeHandler = Object.freeze({
  code: 3n,
  mnemonic: 'IN',
  arity: 1,
  execute(ctx: ExecutionContext): void {
    ctx.assertWritable(1);
    const value = ctx.readInput();
    if (value === null) {
      ctx.waitForInput();
      return;
    }
    ctx.writeParam(1, value);
    ctx.advance(2n);
  },
});

/** Opcode 4: emit parameter 1 to output stream and advance IP by 2. */
export const OUTPUT_OPCODE: OpcodeHandler = Object.freeze({
  code: 4n,
  mnemonic: 'OUT',
  arity: 1,
  execute(ctx: ExecutionContext): void {
    ctx.writeOutput(ctx.readParam(1));
    ctx.advance(2n);
  },
});

/** Opcode 5: jump to parameter 2 if parameter 1 is non-zero (lazy param 2), else advance by 3. */
export const JUMP_IF_TRUE_OPCODE: OpcodeHandler = Object.freeze({
  code: 5n,
  mnemonic: 'JNZ',
  arity: 2,
  execute(ctx: ExecutionContext): void {
    if (ctx.readParam(1) !== 0n) {
      ctx.jump(ctx.readParam(2));
      return;
    }
    ctx.advance(3n);
  },
});

/** Opcode 6: jump to parameter 2 if parameter 1 is zero (lazy param 2), else advance by 3. */
export const JUMP_IF_FALSE_OPCODE: OpcodeHandler = Object.freeze({
  code: 6n,
  mnemonic: 'JZ',
  arity: 2,
  execute(ctx: ExecutionContext): void {
    if (ctx.readParam(1) === 0n) {
      ctx.jump(ctx.readParam(2));
      return;
    }
    ctx.advance(3n);
  },
});

/** Opcode 7: store 1 if parameter 1 < parameter 2 else 0 at parameter 3, advance by 4. */
export const LESS_THAN_OPCODE: OpcodeHandler = Object.freeze({
  code: 7n,
  mnemonic: 'LT',
  arity: 3,
  execute(ctx: ExecutionContext): void {
    ctx.writeParam(3, ctx.readParam(1) < ctx.readParam(2) ? 1n : 0n);
    ctx.advance(4n);
  },
});

/** Opcode 8: store 1 if parameter 1 === parameter 2 else 0 at parameter 3, advance by 4. */
export const EQUALS_OPCODE: OpcodeHandler = Object.freeze({
  code: 8n,
  mnemonic: 'EQ',
  arity: 3,
  execute(ctx: ExecutionContext): void {
    ctx.writeParam(3, ctx.readParam(1) === ctx.readParam(2) ? 1n : 0n);
    ctx.advance(4n);
  },
});

/** Opcode 99: halt execution immediately without advancing IP. */
export const HALT_OPCODE: OpcodeHandler = Object.freeze({
  code: 99n,
  mnemonic: 'HALT',
  arity: 0,
  execute(ctx: ExecutionContext): void {
    ctx.halt();
  },
});

/** Core Intcode opcode suite for Day 2 and extensible later-day VMs. */
export const CORE_OPCODES: readonly OpcodeHandler[] = Object.freeze([
  ADD_OPCODE,
  MUL_OPCODE,
  HALT_OPCODE,
]);

/** Diagnostic I/O opcode suite introduced in Day 5 Part 1. */
export const IO_OPCODES: readonly OpcodeHandler[] = Object.freeze([
  INPUT_OPCODE,
  OUTPUT_OPCODE,
]);

/** Conditional jump and comparison opcode suite introduced in Day 5 Part 2. */
export const CONTROL_OPCODES: readonly OpcodeHandler[] = Object.freeze([
  JUMP_IF_TRUE_OPCODE,
  JUMP_IF_FALSE_OPCODE,
  LESS_THAN_OPCODE,
  EQUALS_OPCODE,
]);

/** Full standard Intcode opcode suite (opcodes 1..8 and 99). */
export const STANDARD_OPCODES: readonly OpcodeHandler[] = Object.freeze([
  ...CORE_OPCODES.slice(0, 2),
  ...IO_OPCODES,
  ...CONTROL_OPCODES,
  HALT_OPCODE,
]);

/** Builds an opcode lookup table from handlers while rejecting duplicate codes. */
export function createOpcodeRegistry(
  handlers: readonly OpcodeHandler[],
): ReadonlyMap<bigint, OpcodeHandler> {
  const registry = new Map<bigint, OpcodeHandler>();
  for (const handler of handlers) {
    if (registry.has(handler.code)) {
      throw new Error(`Duplicate opcode registration: ${handler.code}`);
    }
    registry.set(handler.code, handler);
  }
  return registry;
}
