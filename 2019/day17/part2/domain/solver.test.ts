import { describe, expect, it } from 'vitest';
import { solver } from './index';

const OFFICIAL_PART2_ROM =
  '1,47,48,49,1006,49,21,4,53,1001,8,1,8,1008,8,293,50,1006,50,7,99,3,51,1008,51,10,50,1,52,50,52,1008,52,5,50,1006,50,21,104,79,104,75,104,10,104,1024,99,0,1,0,0,0,0,35,35,35,35,35,35,35,46,46,46,35,35,35,35,35,10,35,46,46,46,46,46,35,46,46,46,35,46,46,46,35,10,35,46,46,46,46,46,35,46,46,46,35,46,46,46,35,10,46,46,46,46,46,46,35,46,46,46,35,46,46,46,35,10,46,46,46,46,46,46,35,46,46,46,35,35,35,46,35,10,46,46,46,46,46,46,35,46,46,46,46,46,35,46,35,10,94,35,35,35,35,35,35,35,35,46,46,46,35,46,35,10,46,46,46,46,46,46,35,46,35,46,46,46,35,46,35,10,46,46,46,46,46,46,35,35,35,35,35,35,35,35,35,10,46,46,46,46,46,46,46,46,35,46,46,46,35,46,46,10,46,46,46,46,35,35,35,35,35,35,35,35,35,46,46,10,46,46,46,46,35,46,46,46,35,46,46,46,46,46,46,10,46,46,46,46,35,46,46,46,35,46,46,46,46,46,46,10,46,46,46,46,35,46,46,46,35,46,46,46,46,46,46,10,46,46,46,46,35,35,35,35,35,46,46,46,46,46,46,10';

const EXPECTED_PATH_TOKENS = [
  'R', '8', 'R', '8', 'R', '4', 'R', '4', 'R', '8', 'L', '6', 'L', '2',
  'R', '4', 'R', '4', 'R', '8', 'R', '8', 'R', '8', 'L', '6', 'L', '2',
];

type SimDir = 'U' | 'R' | 'D' | 'L';
const STEP_DX: Record<SimDir, number> = { U: 0, R: 1, D: 0, L: -1 };
const STEP_DY: Record<SimDir, number> = { U: -1, R: 0, D: 1, L: 0 };
const LEFT_OF: Record<SimDir, SimDir> = { U: 'L', L: 'D', D: 'R', R: 'U' };
const RIGHT_OF: Record<SimDir, SimDir> = { U: 'R', R: 'D', D: 'L', L: 'U' };

interface SimMap {
  readonly robot: { readonly x: number; readonly y: number; readonly direction: SimDir } | null;
  readonly scaffoldCount: number;
  isScaffold(x: number, y: number): boolean;
}

interface SimPlan {
  readonly main: readonly ('A' | 'B' | 'C')[];
  readonly routineA: readonly string[];
  readonly routineB: readonly string[];
  readonly routineC: readonly string[];
}

function patchRom(index: number, value: string): string {
  const cells = OFFICIAL_PART2_ROM.split(',');
  cells[index] = value;
  return cells.join(',');
}

function expandPlanTokens(plan: SimPlan): string[] {
  const dict = { A: plan.routineA, B: plan.routineB, C: plan.routineC };
  const expanded: string[] = [];
  for (const name of plan.main) {
    expanded.push(...dict[name]);
  }
  return expanded;
}

function simulatePlan(map: SimMap, plan: SimPlan): Set<string> {
  if (!map.robot) throw new Error('Expected robot on scaffold');
  let { x, y, direction } = map.robot;
  const visited = new Set<string>([`${x},${y}`]);
  for (const token of expandPlanTokens(plan)) {
    if (token === 'L') {
      direction = LEFT_OF[direction];
    } else if (token === 'R') {
      direction = RIGHT_OF[direction];
    } else {
      const steps = Number(token);
      for (let i = 0; i < steps; i += 1) {
        x += STEP_DX[direction];
        y += STEP_DY[direction];
        if (!map.isScaffold(x, y)) throw new Error(`Robot left scaffold at (${x},${y})`);
        visited.add(`${x},${y}`);
      }
    }
  }
  return visited;
}

describe('2019 Day 17 Part 2 solver', () => {
  it('solves the official 15x15 ROM immutably across repeated calls', () => {
    const program = solver.parse(OFFICIAL_PART2_ROM);
    expect(solver.solve(program)).toBe(1024n);
    expect(solver.solve(program)).toBe(1024n);
  });

  it('compresses into valid <=20-char routines whose expanded path visits all 77 scaffold cells', () => {
    const program = solver.parse(OFFICIAL_PART2_ROM);
    const firstFrame = solver.trace(program)[0]!;
    const plan = firstFrame.plan!;
    expect(plan).not.toBeNull();
    expect(plan.mainText.length).toBeLessThanOrEqual(20);
    expect(plan.routineAText.length).toBeLessThanOrEqual(20);
    expect(plan.routineBText.length).toBeLessThanOrEqual(20);
    expect(plan.routineCText.length).toBeLessThanOrEqual(20);
    expect(expandPlanTokens(plan)).toEqual(EXPECTED_PATH_TOKENS);

    const visited = simulatePlan(firstFrame.map, plan);
    expect(firstFrame.map.scaffoldCount).toBe(77);
    expect(visited.size).toBe(firstFrame.map.scaffoldCount);
  });

  it('preserves >2^63 BigInt dust outputs across solve and trace', () => {
    const hugeDust = '9223372036854775809';
    const program = solver.parse(patchRom(45, hugeDust));
    expect(solver.solve(program)).toBe(9223372036854775809n);
    const frames = solver.trace(program, { maxSteps: 5 });
    expect(frames[frames.length - 1]!.dust).toBe(9223372036854775809n);
  });

  it('produces bounded scan-then-sweep trace frames', () => {
    const program = solver.parse(OFFICIAL_PART2_ROM);
    const frames = solver.trace(program);
    expect(frames).toHaveLength(82);
    expect(frames[0]!.phase).toBe('scan');
    expect(frames[0]!.dust).toBeNull();
    expect(frames[81]!.phase).toBe('sweep');
    expect(frames[81]!.sweptPath).toHaveLength(81);
    expect(frames[81]!.dust).toBe(1024n);

    const five = solver.trace(program, { maxSteps: 5 });
    expect(five).toHaveLength(5);
    expect(five[4]!.dust).toBe(1024n);

    const one = solver.trace(program, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]!.phase).toBe('sweep');
    expect(one[0]!.dust).toBe(1024n);
  });

  it('rejects invalid inputs, trace limits, and malformed ROMs at boundaries', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('1,2,bad')).toThrow();

    const valid = solver.parse(OFFICIAL_PART2_ROM);
    expect(() => solver.trace(valid, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => solver.trace(valid, { maxSteps: -1 })).toThrow(RangeError);
    expect(() => solver.trace(valid, { maxSteps: 1.5 })).toThrow(RangeError);

    expect(() => solver.solve(solver.parse(patchRom(45, '65')))).toThrow();
    expect(() => solver.solve(solver.parse(patchRom(33, '6')))).toThrow();
    expect(() => solver.solve(solver.parse(patchRom(149, '35')))).toThrow();
  });
});
