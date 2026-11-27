import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import { EXAMPLE_RUN_ANSWER, EXAMPLE_SPRINGDROID_PROGRAM, EXAMPLE_WALK_ANSWER } from './exampleProgram';
import { SpringscriptProgram } from './springscript';
import { extractHullDamage, runSpringdroidProgram } from './springdroidRunner';

describe('springdroidRunner', () => {
  it('runs WALK and RUN programs on the example Intcode ROM and extracts hull damage', () => {
    const program = parseIntcodeProgram(EXAMPLE_SPRINGDROID_PROGRAM);
    const walkScript = new SpringscriptProgram('WALK', [{ op: 'NOT', x: 'A', y: 'J' }]);
    const walkResult = runSpringdroidProgram(program, walkScript);
    expect(walkResult.asciiLog).toContain('Walking...');
    expect(extractHullDamage(walkResult)).toBe(EXAMPLE_WALK_ANSWER);
    expect(walkResult.vmSteps).toBeGreaterThan(0);

    const runScript = new SpringscriptProgram('RUN', [{ op: 'NOT', x: 'A', y: 'J' }]);
    const runResult = runSpringdroidProgram(program, runScript);
    expect(runResult.asciiLog).toContain('Running...');
    expect(extractHullDamage(runResult)).toBe(EXAMPLE_RUN_ANSWER);
  });

  it('rejects non-halting VMs and missing hull damage with ASCII failure details', () => {
    const program = parseIntcodeProgram(EXAMPLE_SPRINGDROID_PROGRAM);
    const emptyWalk = new SpringscriptProgram('WALK', []);
    const failed = runSpringdroidProgram(program, emptyWalk);
    expect(failed.hullDamage).toBeNull();
    expect(() => extractHullDamage(failed)).toThrow(/Didn't make it across/);

    expect(() => extractHullDamage({ asciiLog: '   ', hullDamage: null, vmSteps: 1 })).toThrow(/did not report/);

    const needsMoreInput = parseIntcodeProgram('3,0,3,0,3,0,3,0,3,0,3,0,99');
    expect(() => runSpringdroidProgram(needsMoreInput, emptyWalk)).toThrow(/waiting-input/);
  });
});
