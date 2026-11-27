import { describe, expect, it } from 'vitest';
import { parseIntcodeProgram } from '../../shared/intcode';
import { executePaintingRobot } from './robotRunner';

interface OracleResult {
  readonly paintedCount: number;
  readonly whiteSet: readonly string[];
  readonly x: number;
  readonly y: number;
  readonly heading: number;
  readonly steps: number;
}

/** Independent flat-loop reference Intcode + Map<string, 0|1> oracle for cross-checking. */
function runOracle(cells: readonly number[], startColor: 0 | 1): OracleResult {
  const mem = new Map<number, number>(cells.map((v, i) => [i, v]));
  const read = (addr: number) => mem.get(addr) ?? 0;
  const param = (ip: number, offset: number, mode: number, rb: number) => {
    const raw = read(ip + offset);
    if (mode === 1) return raw;
    return read(mode === 2 ? rb + raw : raw);
  };
  const writeAddr = (ip: number, offset: number, mode: number, rb: number) => {
    const raw = read(ip + offset);
    return mode === 2 ? rb + raw : raw;
  };

  const panels = new Map<string, 0 | 1>();
  let x = 0, y = 0, heading = 0, steps = 0;
  let ip = 0, rb = 0;
  const outputs: number[] = [];
  const dx = [0, 1, 0, -1], dy = [-1, 0, 1, 0];

  while (true) {
    const instr = read(ip);
    const op = instr % 100;
    const m1 = Math.floor(instr / 100) % 10;
    const m2 = Math.floor(instr / 1000) % 10;
    const m3 = Math.floor(instr / 10000) % 10;

    if (op === 99) break;
    if (op === 1) {
      mem.set(writeAddr(ip, 3, m3, rb), param(ip, 1, m1, rb) + param(ip, 2, m2, rb));
      ip += 4;
    } else if (op === 2) {
      mem.set(writeAddr(ip, 3, m3, rb), param(ip, 1, m1, rb) * param(ip, 2, m2, rb));
      ip += 4;
    } else if (op === 3) {
      const key = `${x},${y}`;
      const cam = panels.get(key) ?? (x === 0 && y === 0 ? startColor : 0);
      mem.set(writeAddr(ip, 1, m1, rb), cam);
      ip += 2;
    } else if (op === 4) {
      outputs.push(param(ip, 1, m1, rb));
      if (outputs.length === 2) {
        panels.set(`${x},${y}`, outputs[0]! as 0 | 1);
        heading = (heading + (outputs[1]! === 0 ? 3 : 1)) & 3;
        x += dx[heading]!;
        y += dy[heading]!;
        outputs.length = 0;
        steps += 1;
      }
      ip += 2;
    } else if (op === 5) {
      ip = param(ip, 1, m1, rb) !== 0 ? param(ip, 2, m2, rb) : ip + 3;
    } else if (op === 6) {
      ip = param(ip, 1, m1, rb) === 0 ? param(ip, 2, m2, rb) : ip + 3;
    } else if (op === 7) {
      mem.set(writeAddr(ip, 3, m3, rb), param(ip, 1, m1, rb) < param(ip, 2, m2, rb) ? 1 : 0);
      ip += 4;
    } else if (op === 8) {
      mem.set(writeAddr(ip, 3, m3, rb), param(ip, 1, m1, rb) === param(ip, 2, m2, rb) ? 1 : 0);
      ip += 4;
    } else if (op === 9) {
      rb += param(ip, 1, m1, rb);
      ip += 2;
    }
  }

  const whiteSet = [...panels.entries()].filter(([, c]) => c === 1).map(([k]) => k);
  if (startColor === 1 && !panels.has('0,0')) whiteSet.push('0,0');
  whiteSet.sort();
  return { paintedCount: panels.size, whiteSet, x, y, heading, steps };
}

/** Generates a deterministic reactive Intcode loop: toggles panel color, turns by counter, repeats N times. */
function buildReactiveLoopProgram(iterations: number): string {
  return [
    109, 40,                   // 0: rb = 40
    203, 1,                    // 2: IN -> mem[rb+1] (cam)
    21208, 1, 0, 2,            // 4: mem[rb+2] = (cam == 0 ? 1 : 0)
    204, 2,                    // 8: OUT mem[rb+2]
    20207, 0, 29, 3,           // 10: mem[rb+3] = (counter < mem[29] ? 1 : 0)
    204, 3,                    // 14: OUT mem[rb+3]
    22101, 1, 0, 0,            // 16: mem[rb+0] = 1 + mem[rb+0]
    21207, 0, iterations, 4,   // 20: mem[rb+4] = (mem[rb+0] < iterations ? 1 : 0)
    1205, 4, 2,                // 24: if mem[rb+4] != 0 jump to 2
    99,                        // 27: HALT
    0, iterations >> 1,        // 28..29
    ...Array(15).fill(0),
  ].join(',');
}

describe('robotRunner differential oracle', () => {
  it('matches an independent flat Intcode + Map oracle across reactive programs and start colors', () => {
    const programs = [
      '3,43,104,1,104,0,3,43,104,0,104,0,3,43,104,1,104,0,3,43,104,1,104,0,3,43,104,0,104,1,3,43,104,1,104,0,3,43,104,1,104,0,99,0',
      buildReactiveLoopProgram(12),
      buildReactiveLoopProgram(37),
      buildReactiveLoopProgram(64),
    ];

    for (const raw of programs) {
      const cells = raw.split(',').map(Number);
      const parsed = parseIntcodeProgram(raw);
      for (const startColor of [0, 1] as const) {
        const expected = runOracle(cells, startColor);
        const actual = executePaintingRobot(parsed, startColor);
        expect(actual.paintedCount).toBe(expected.paintedCount);
        expect(actual.robotSteps).toBe(expected.steps);
        expect(actual.finalPosition).toEqual({ x: expected.x, y: expected.y });
        expect(actual.finalHeading).toBe(expected.heading);
        expect(actual.whitePanels.map((p) => `${p.x},${p.y}`).sort()).toEqual(expected.whiteSet);
      }
    }
  });
});
