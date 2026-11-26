import { describe, expect, it } from 'vitest';
import { IntcodeMemory } from './memory';
import {
  COMPLETE_MODES,
  CORE_MODES,
  IMMEDIATE_MODE,
  POSITION_MODE,
  RELATIVE_MODE,
  createModeRegistry,
  decodeOpcode,
  extractModeCode,
  type ParameterModeHandler,
} from './modes';

describe('Intcode parameter modes', () => {
  it('decodes opcodes and extracts parameter mode digits for offsets 1, 2, and 3', () => {
    expect(decodeOpcode(1002n)).toBe(2n);
    expect(decodeOpcode(99n)).toBe(99n);
    expect(decodeOpcode(11108n)).toBe(8n);
    expect(() => decodeOpcode(-1n)).toThrow(RangeError);

    expect(extractModeCode(1002n, 1)).toBe(0n);
    expect(extractModeCode(1002n, 2)).toBe(1n);
    expect(extractModeCode(1002n, 3)).toBe(0n);
    expect(extractModeCode(21007n, 3)).toBe(2n);
    expect(() => extractModeCode(-5n, 1)).toThrow(RangeError);
  });

  it('reads and resolves write addresses in position mode and immediate mode', () => {
    const memory = new IntcodeMemory([1002n, 4n, 3n, 4n, 33n]);

    const posRead = POSITION_MODE.read(memory, 1n);
    expect(Object.isFrozen(posRead)).toBe(true);
    expect(posRead).toEqual({ address: 4n, rawParam: 4n, value: 33n });
    expect(POSITION_MODE.resolveWriteAddress(memory, 3n)).toBe(4n);

    const immRead = IMMEDIATE_MODE.read(memory, 2n);
    expect(Object.isFrozen(immRead)).toBe(true);
    expect(immRead).toEqual({ address: 2n, rawParam: 3n, value: 3n });
    expect(() => IMMEDIATE_MODE.resolveWriteAddress(memory, 2n)).toThrow(Error);
  });

  it('registers CORE_MODES and rejects duplicate mode codes', () => {
    expect(Object.isFrozen(CORE_MODES)).toBe(true);
    const registry = createModeRegistry(CORE_MODES);
    expect(registry.size).toBe(2);
    expect(registry.get(0n)).toBe(POSITION_MODE);
    expect(registry.get(1n)).toBe(IMMEDIATE_MODE);

    const duplicate: ParameterModeHandler = {
      code: 0n,
      mode: 'position',
      read: POSITION_MODE.read,
      resolveWriteAddress: POSITION_MODE.resolveWriteAddress,
    };
    expect(() => createModeRegistry([POSITION_MODE, duplicate])).toThrow(Error);
  });

  it('reads and resolves write addresses in relative mode and registers COMPLETE_MODES', () => {
    const memory = new IntcodeMemory([109n, 3n, -1n, 77n, 99n]);

    const defaultBaseRead = RELATIVE_MODE.read(memory, 1n);
    expect(Object.isFrozen(defaultBaseRead)).toBe(true);
    expect(defaultBaseRead).toEqual({ address: 3n, rawParam: 3n, value: 77n });

    const offsetRead = RELATIVE_MODE.read(memory, 2n, 4n);
    expect(offsetRead).toEqual({ address: 3n, rawParam: -1n, value: 77n });

    expect(RELATIVE_MODE.resolveWriteAddress(memory, 1n)).toBe(3n);
    expect(RELATIVE_MODE.resolveWriteAddress(memory, 2n, 4n)).toBe(3n);
    expect(() => RELATIVE_MODE.resolveWriteAddress(memory, 2n, 0n)).toThrow(RangeError);
    expect(() => RELATIVE_MODE.resolveWriteAddress(memory, 2n)).toThrow(RangeError);

    expect(Object.isFrozen(COMPLETE_MODES)).toBe(true);
    const complete = createModeRegistry(COMPLETE_MODES);
    expect(complete.size).toBe(3);
    expect(complete.get(2n)).toBe(RELATIVE_MODE);
  });
});
