import { describe, expect, it } from 'vitest';
import {
  ADD_OPCODE,
  CONTROL_OPCODES,
  CORE_OPCODES,
  EQUALS_OPCODE,
  HALT_OPCODE,
  INPUT_OPCODE,
  IO_OPCODES,
  JUMP_IF_FALSE_OPCODE,
  JUMP_IF_TRUE_OPCODE,
  LESS_THAN_OPCODE,
  MUL_OPCODE,
  OUTPUT_OPCODE,
  STANDARD_OPCODES,
  createOpcodeRegistry,
  type ExecutionContext,
  type OpcodeHandler,
  type ParamOffset,
} from './opcodes';

class FakeExecutionContext implements ExecutionContext {
  private readonly params: ReadonlyMap<ParamOffset, bigint>;
  private readonly inputs: (bigint | null)[];
  private readonly writableFailure: Error | null;
  readonly callLog: string[] = [];
  readonly readOffsets: ParamOffset[] = [];
  writtenOffset: ParamOffset | null = null;
  writtenValue: bigint | null = null;
  advancedBy: bigint | null = null;
  jumpedTo: bigint | null = null;
  emittedOutputs: bigint[] = [];
  waitingForInput = false;
  halted = false;

  constructor(
    params: ReadonlyMap<ParamOffset, bigint>,
    inputs: readonly (bigint | null)[],
    writableFailure: Error | null,
  ) {
    this.params = params;
    this.inputs = [...inputs];
    this.writableFailure = writableFailure;
  }

  readParam(offset: ParamOffset): bigint {
    this.readOffsets.push(offset);
    return this.params.get(offset)!;
  }

  assertWritable(offset: ParamOffset): void {
    this.callLog.push(`assertWritable:${offset}`);
    if (this.writableFailure !== null) throw this.writableFailure;
  }

  writeParam(offset: ParamOffset, value: bigint): void {
    this.writtenOffset = offset;
    this.writtenValue = value;
  }

  advance(delta: bigint): void {
    this.advancedBy = delta;
  }

  jump(targetAddress: bigint): void {
    this.jumpedTo = targetAddress;
  }

  readInput(): bigint | null {
    this.callLog.push('readInput');
    return this.inputs.shift() ?? null;
  }

  writeOutput(value: bigint): void {
    this.emittedOutputs.push(value);
  }

  waitForInput(): void {
    this.waitingForInput = true;
  }

  halt(): void {
    this.halted = true;
  }
}

describe('core and extended Intcode opcodes', () => {
  it('executes ADD, MUL, and HALT with expected arities', () => {
    const addCtx = new FakeExecutionContext(new Map([[1, 17n], [2, -5n]]), [], null);
    expect(ADD_OPCODE.arity).toBe(3);
    ADD_OPCODE.execute(addCtx);
    expect(addCtx.writtenOffset).toBe(3);
    expect(addCtx.writtenValue).toBe(12n);
    expect(addCtx.advancedBy).toBe(4n);

    const mulCtx = new FakeExecutionContext(new Map([[1, 9007199254740993n], [2, 3n]]), [], null);
    expect(MUL_OPCODE.arity).toBe(3);
    MUL_OPCODE.execute(mulCtx);
    expect(mulCtx.writtenValue).toBe(27021597764222979n);
    expect(mulCtx.advancedBy).toBe(4n);

    const haltCtx = new FakeExecutionContext(new Map(), [], null);
    expect(HALT_OPCODE.arity).toBe(0);
    HALT_OPCODE.execute(haltCtx);
    expect(haltCtx.halted).toBe(true);
    expect(haltCtx.advancedBy).toBeNull();
  });

  it('executes INPUT_OPCODE: asserts writability before readInput, handles empty and present input', () => {
    expect(INPUT_OPCODE.arity).toBe(1);
    const badCtx = new FakeExecutionContext(new Map(), [99n], new Error('immediate write'));
    expect(() => INPUT_OPCODE.execute(badCtx)).toThrow(Error);
    expect(badCtx.callLog).toEqual(['assertWritable:1']);

    const waitCtx = new FakeExecutionContext(new Map(), [], null);
    INPUT_OPCODE.execute(waitCtx);
    expect(waitCtx.callLog).toEqual(['assertWritable:1', 'readInput']);
    expect(waitCtx.waitingForInput).toBe(true);
    expect(waitCtx.advancedBy).toBeNull();

    const okCtx = new FakeExecutionContext(new Map(), [42n], null);
    INPUT_OPCODE.execute(okCtx);
    expect(okCtx.callLog).toEqual(['assertWritable:1', 'readInput']);
    expect(okCtx.writtenOffset).toBe(1);
    expect(okCtx.writtenValue).toBe(42n);
    expect(okCtx.advancedBy).toBe(2n);
  });

  it('executes OUTPUT, JUMP_IF_TRUE, and JUMP_IF_FALSE with lazy param 2', () => {
    expect(OUTPUT_OPCODE.arity).toBe(1);
    const outCtx = new FakeExecutionContext(new Map([[1, -13n]]), [], null);
    OUTPUT_OPCODE.execute(outCtx);
    expect(outCtx.emittedOutputs).toEqual([-13n]);
    expect(outCtx.advancedBy).toBe(2n);

    expect(JUMP_IF_TRUE_OPCODE.arity).toBe(2);
    const jnzTaken = new FakeExecutionContext(new Map([[1, -3n], [2, 19n]]), [], null);
    JUMP_IF_TRUE_OPCODE.execute(jnzTaken);
    expect(jnzTaken.readOffsets).toEqual([1, 2]);
    expect(jnzTaken.jumpedTo).toBe(19n);

    const jnzFall = new FakeExecutionContext(new Map([[1, 0n]]), [], null);
    JUMP_IF_TRUE_OPCODE.execute(jnzFall);
    expect(jnzFall.readOffsets).toEqual([1]);
    expect(jnzFall.advancedBy).toBe(3n);

    expect(JUMP_IF_FALSE_OPCODE.arity).toBe(2);
    const jzTaken = new FakeExecutionContext(new Map([[1, 0n], [2, 25n]]), [], null);
    JUMP_IF_FALSE_OPCODE.execute(jzTaken);
    expect(jzTaken.readOffsets).toEqual([1, 2]);
    expect(jzTaken.jumpedTo).toBe(25n);

    const jzFall = new FakeExecutionContext(new Map([[1, 7n]]), [], null);
    JUMP_IF_FALSE_OPCODE.execute(jzFall);
    expect(jzFall.readOffsets).toEqual([1]);
    expect(jzFall.advancedBy).toBe(3n);
  });

  it('executes LESS_THAN_OPCODE and EQUALS_OPCODE for both true and false outcomes', () => {
    const ltTrue = new FakeExecutionContext(new Map([[1, -2n], [2, 5n]]), [], null);
    LESS_THAN_OPCODE.execute(ltTrue);
    expect(ltTrue.writtenValue).toBe(1n);
    expect(ltTrue.advancedBy).toBe(4n);

    const ltFalse = new FakeExecutionContext(new Map([[1, 5n], [2, 5n]]), [], null);
    LESS_THAN_OPCODE.execute(ltFalse);
    expect(ltFalse.writtenValue).toBe(0n);

    const eqTrue = new FakeExecutionContext(new Map([[1, 8n], [2, 8n]]), [], null);
    EQUALS_OPCODE.execute(eqTrue);
    expect(eqTrue.writtenValue).toBe(1n);
    expect(eqTrue.advancedBy).toBe(4n);

    const eqFalse = new FakeExecutionContext(new Map([[1, 8n], [2, 9n]]), [], null);
    EQUALS_OPCODE.execute(eqFalse);
    expect(eqFalse.writtenValue).toBe(0n);
  });
});

describe('opcode suites and createOpcodeRegistry', () => {
  it('registers opcode suites and rejects duplicate opcode codes', () => {
    expect(Object.isFrozen(CORE_OPCODES)).toBe(true);
    expect(Object.isFrozen(IO_OPCODES)).toBe(true);
    expect(Object.isFrozen(CONTROL_OPCODES)).toBe(true);
    expect(Object.isFrozen(STANDARD_OPCODES)).toBe(true);

    expect(createOpcodeRegistry(CORE_OPCODES).size).toBe(3);
    const std = createOpcodeRegistry(STANDARD_OPCODES);
    expect(std.size).toBe(9);
    expect(std.get(3n)).toBe(INPUT_OPCODE);
    expect(std.get(4n)).toBe(OUTPUT_OPCODE);
    expect(std.get(5n)).toBe(JUMP_IF_TRUE_OPCODE);
    expect(std.get(6n)).toBe(JUMP_IF_FALSE_OPCODE);
    expect(std.get(7n)).toBe(LESS_THAN_OPCODE);
    expect(std.get(8n)).toBe(EQUALS_OPCODE);

    const duplicate: OpcodeHandler = { code: 1n, mnemonic: 'DUP', arity: 3, execute: ADD_OPCODE.execute };
    expect(() => createOpcodeRegistry([ADD_OPCODE, duplicate])).toThrow(Error);
  });
});
