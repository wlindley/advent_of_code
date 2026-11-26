import { describe, expect, it } from 'vitest';
import {
  ADD_OPCODE,
  CORE_OPCODES,
  HALT_OPCODE,
  MUL_OPCODE,
  createOpcodeRegistry,
  type ExecutionContext,
  type OpcodeHandler,
  type ParamOffset,
} from './opcodes';

class FakeExecutionContext implements ExecutionContext {
  private readonly params: ReadonlyMap<ParamOffset, bigint>;
  writtenOffset: ParamOffset | null = null;
  writtenValue: bigint | null = null;
  advancedBy: bigint | null = null;
  halted = false;

  constructor(params: ReadonlyMap<ParamOffset, bigint>) {
    this.params = params;
  }

  readParam(offset: ParamOffset): bigint {
    return this.params.get(offset)!;
  }

  writeParam(offset: ParamOffset, value: bigint): void {
    this.writtenOffset = offset;
    this.writtenValue = value;
  }

  advance(delta: bigint): void {
    this.advancedBy = delta;
  }

  halt(): void {
    this.halted = true;
  }
}

describe('core Intcode opcodes', () => {
  it('executes ADD_OPCODE by summing params 1 and 2 into param 3 and advancing by 4', () => {
    const ctx = new FakeExecutionContext(new Map([[1, 17n], [2, -5n]]));
    expect(ADD_OPCODE.code).toBe(1n);
    expect(ADD_OPCODE.mnemonic).toBe('ADD');
    ADD_OPCODE.execute(ctx);
    expect(ctx.writtenOffset).toBe(3);
    expect(ctx.writtenValue).toBe(12n);
    expect(ctx.advancedBy).toBe(4n);
    expect(ctx.halted).toBe(false);
  });

  it('executes MUL_OPCODE by multiplying params 1 and 2 into param 3 and advancing by 4', () => {
    const ctx = new FakeExecutionContext(new Map([[1, 9007199254740993n], [2, 3n]]));
    expect(MUL_OPCODE.code).toBe(2n);
    expect(MUL_OPCODE.mnemonic).toBe('MUL');
    MUL_OPCODE.execute(ctx);
    expect(ctx.writtenOffset).toBe(3);
    expect(ctx.writtenValue).toBe(27021597764222979n);
    expect(ctx.advancedBy).toBe(4n);
    expect(ctx.halted).toBe(false);
  });

  it('executes HALT_OPCODE by halting without writing or advancing', () => {
    const ctx = new FakeExecutionContext(new Map());
    expect(HALT_OPCODE.code).toBe(99n);
    expect(HALT_OPCODE.mnemonic).toBe('HALT');
    HALT_OPCODE.execute(ctx);
    expect(ctx.halted).toBe(true);
    expect(ctx.writtenValue).toBeNull();
    expect(ctx.advancedBy).toBeNull();
  });
});

describe('createOpcodeRegistry', () => {
  it('registers CORE_OPCODES by code and freezes CORE_OPCODES', () => {
    expect(Object.isFrozen(CORE_OPCODES)).toBe(true);
    const registry = createOpcodeRegistry(CORE_OPCODES);
    expect(registry.size).toBe(3);
    expect(registry.get(1n)).toBe(ADD_OPCODE);
    expect(registry.get(2n)).toBe(MUL_OPCODE);
    expect(registry.get(99n)).toBe(HALT_OPCODE);
  });

  it('rejects duplicate opcode registrations', () => {
    const duplicate: OpcodeHandler = { code: 1n, mnemonic: 'DUP', execute: ADD_OPCODE.execute };
    expect(() => createOpcodeRegistry([ADD_OPCODE, duplicate])).toThrow(Error);
  });
});
