/** Positional parameter offset relative to the current instruction pointer. */
export type ParamOffset = 1 | 2 | 3;

/** Execution capability interface exposed to Intcode opcode handlers. */
export interface ExecutionContext {
  readParam(offset: ParamOffset): bigint;
  writeParam(offset: ParamOffset, value: bigint): void;
  advance(delta: bigint): void;
  halt(): void;
}

/** Strategy contract for a single Intcode instruction opcode. */
export interface OpcodeHandler {
  readonly code: bigint;
  readonly mnemonic: string;
  execute(ctx: ExecutionContext): void;
}

/** Opcode 1: add parameter 1 and parameter 2, store at parameter 3, advance IP by 4. */
export const ADD_OPCODE: OpcodeHandler = Object.freeze({
  code: 1n,
  mnemonic: 'ADD',
  execute(ctx: ExecutionContext): void {
    ctx.writeParam(3, ctx.readParam(1) + ctx.readParam(2));
    ctx.advance(4n);
  },
});

/** Opcode 2: multiply parameter 1 and parameter 2, store at parameter 3, advance IP by 4. */
export const MUL_OPCODE: OpcodeHandler = Object.freeze({
  code: 2n,
  mnemonic: 'MUL',
  execute(ctx: ExecutionContext): void {
    ctx.writeParam(3, ctx.readParam(1) * ctx.readParam(2));
    ctx.advance(4n);
  },
});

/** Opcode 99: halt execution immediately without advancing IP. */
export const HALT_OPCODE: OpcodeHandler = Object.freeze({
  code: 99n,
  mnemonic: 'HALT',
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
