import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import { RoutinePlan } from './routineCompressor';
import {
  DEFAULT_MAX_VM_STEPS,
  DEFAULT_SCAFFOLD_LIMITS,
  captureScaffoldMap,
  runDustCollection,
} from './scaffoldRunner';

const CAMERA_TAPE = [
  4, 15, 1001, 1, 1, 1, 1008, 1, 27, 14, 1006, 14, 0, 99, 0,
  46, 35, 46, 10,
  35, 35, 35, 10,
  46, 94, 46, 10,
].join(',');

// Address 0 is ADD (1); patching it to MUL (2) yields 3*4=12, enabling dust output.
const DUST_TAPE = '1,20,21,22,1008,22,12,23,1006,23,19,3,24,4,24,104,10,104,98765,99,3,4,0,0,0';

describe('scaffoldRunner', () => {
  it('captures a ScaffoldMap from an unmodified Intcode camera program', () => {
    expect(DEFAULT_SCAFFOLD_LIMITS.maxVmSteps).toBe(DEFAULT_MAX_VM_STEPS);
    const program = parseIntcodeProgram(CAMERA_TAPE);

    const mapDefault = captureScaffoldMap(program);
    expect(mapDefault.width).toBe(3);
    expect(mapDefault.height).toBe(3);
    expect(mapDefault.robot).toEqual({ x: 1, y: 2, direction: 'U' });

    const mapBounded = captureScaffoldMap(program, 500);
    expect(mapBounded.alignmentParameterSum).toBe(1n);
  });

  it('patches address 0 to 2, pre-queues ASCII routines, and drains dust output', () => {
    const program = parseIntcodeProgram(DUST_TAPE);
    const plan = new RoutinePlan(['A'], ['R', '4'], ['R'], ['R']);

    const resultDefault = runDustCollection(program, plan);
    expect(resultDefault).toEqual({ asciiLog: 'A\n', dust: 98765n });
    expect(program.at(0n)).toBe(1n);

    const resultBounded = runDustCollection(program, plan, 500);
    expect(resultBounded.dust).toBe(98765n);
  });

  it('rejects programs that pause waiting for input or exceed VM step limits', () => {
    const waitInput = parseIntcodeProgram('3,5,99,0,0,0');
    expect(() => captureScaffoldMap(waitInput)).toThrow('waiting-input');

    const camera = parseIntcodeProgram(CAMERA_TAPE);
    expect(() => captureScaffoldMap(camera, 2)).toThrow(RangeError);
    expect(() => captureScaffoldMap(camera, 0)).toThrow(RangeError);
  });
});
