import { describe, expect, it } from 'vitest';
import { type Clock, executeSolver } from '../../../../shared/core';
import { solver } from './index';

interface RawBox { readonly xMin: number; readonly xMax: number; readonly yMin: number; readonly yMax: number; readonly zMin: number; readonly zMax: number; }

class FakeClock implements Clock {
  private idx = 0;
  constructor(private readonly times: readonly number[]) {}
  nowMs(): number { return this.times[this.idx++] ?? 0; }
}

function parseRawBoxes(raw: string): RawBox[] {
  const boxes: RawBox[] = [];
  for (const line of raw.trim().split(/\r?\n/)) {
    const [x1, y1, z1, x2, y2, z2] = line.replace('~', ',').split(',').map(Number);
    boxes.push({
      xMin: Math.min(x1!, x2!), xMax: Math.max(x1!, x2!),
      yMin: Math.min(y1!, y2!), yMax: Math.max(y1!, y2!),
      zMin: Math.min(z1!, z2!), zMax: Math.max(z1!, z2!),
    });
  }
  return boxes;
}

function boxesCollide(a: RawBox, b: RawBox): boolean {
  return a.xMin <= b.xMax && a.xMax >= b.xMin && a.yMin <= b.yMax && a.yMax >= b.yMin && a.zMin <= b.zMax && a.zMax >= b.zMin;
}

function canDropOne(boxes: readonly RawBox[], idx: number): boolean {
  const box = boxes[idx]!;
  if (box.zMin <= 1) return false;
  const lowered: RawBox = { ...box, zMin: box.zMin - 1, zMax: box.zMax - 1 };
  for (let j = 0; j < boxes.length; j += 1) {
    if (j !== idx && boxesCollide(lowered, boxes[j]!)) return false;
  }
  return true;
}

function settleByDropOne(input: readonly RawBox[]): RawBox[] {
  const boxes: RawBox[] = [];
  for (const b of input) boxes.push({ ...b });
  let moved = true;
  while (moved) {
    moved = false;
    for (let i = 0; i < boxes.length; i += 1) {
      if (!canDropOne(boxes, i)) continue;
      boxes[i] = { ...boxes[i]!, zMin: boxes[i]!.zMin - 1, zMax: boxes[i]!.zMax - 1 };
      moved = true;
    }
  }
  return boxes;
}

function oracleChainReactionSum(raw: string): number {
  const settled = settleByDropOne(parseRawBoxes(raw));
  let total = 0;
  for (let k = 0; k < settled.length; k += 1) {
    const remaining: RawBox[] = [];
    for (let i = 0; i < settled.length; i += 1) if (i !== k) remaining.push(settled[i]!);
    const after = settleByDropOne(remaining);
    for (let i = 0; i < after.length; i += 1) {
      if (after[i]!.zMin < settled[i < k ? i : i + 1]!.zMin) total += 1;
    }
  }
  return total;
}

function stepLcg(state: number): number {
  return (Math.imul(state, 1664525) + 1013904223) >>> 0;
}

function buildRandomRawInput(seed: number, count: number): string {
  let s = seed >>> 0;
  const boxes: RawBox[] = [];
  const lines: string[] = [];
  while (lines.length < count) {
    const r: number[] = [];
    for (let i = 0; i < 5; i += 1) { s = stepLcg(s); r.push(s); }
    const x1 = r[0]! % 5, y1 = r[1]! % 5, z1 = 1 + (r[2]! % 12), axis = r[3]! % 3, len = r[4]! % 4;
    const x2 = axis === 0 ? x1 + len : x1, y2 = axis === 1 ? y1 + len : y1, z2 = axis === 2 ? z1 + len : z1;
    const cand: RawBox = { xMin: x1, xMax: x2, yMin: y1, yMax: y2, zMin: z1, zMax: z2 };
    let overlaps = false;
    for (const b of boxes) if (boxesCollide(cand, b)) { overlaps = true; break; }
    if (overlaps) continue;
    boxes.push(cand);
    lines.push(`${x1},${y1},${z1}~${x2},${y2},${z2}`);
  }
  return lines.join('\n');
}

const OFFICIAL_EXAMPLE = [
  '1,0,1~1,2,1', '0,0,2~2,0,2', '0,2,3~2,2,3',
  '0,0,4~0,2,4', '2,0,5~2,2,5', '0,1,6~2,1,6', '1,1,8~1,1,9',
].join('\n');

describe('AoC 2023 Day 22 Part 2 solver', () => {
  it('solves the official 7-brick example and executes with deterministic clock', () => {
    expect(solver.solve(solver.parse(OFFICIAL_EXAMPLE))).toBe(7);
    expect(oracleChainReactionSum(OFFICIAL_EXAMPLE)).toBe(7);
    expect(executeSolver(solver, OFFICIAL_EXAMPLE, new FakeClock([10, 27]))).toEqual({
      answer: 7, elapsedMs: 17, runtime: 'main-thread',
    });
  });

  it('solves multi-level diamond A -> {B, C} -> D -> E against oracle', () => {
    const diamond = '0,0,1~2,0,1\n0,0,2~0,0,2\n2,0,2~2,0,2\n0,0,3~2,0,3\n1,0,4~1,0,4';
    expect(solver.solve(solver.parse(diamond))).toBe(5);
    expect(oracleChainReactionSum(diamond)).toBe(5);
  });

  it('deduplicates multi-cell parallel supporters in horizontal stack', () => {
    const stack = '0,0,1~2,0,1\n0,0,2~1,0,2\n2,0,2~2,0,2\n0,0,3~2,0,3\n0,0,4~2,0,4';
    expect(solver.solve(solver.parse(stack))).toBe(5);
    expect(oracleChainReactionSum(stack)).toBe(5);
  });

  it('returns 0 for a single brick', () => {
    expect(solver.solve(solver.parse('1,1,5~1,1,7'))).toBe(0);
    expect(oracleChainReactionSum('1,1,5~1,1,7')).toBe(0);
  });

  it('matches brute-force 3D re-settling oracle across 15 seeded random stacks', () => {
    for (let seed = 1; seed <= 15; seed += 1) {
      const raw = buildRandomRawInput(seed * 97 + 13, 8 + (seed % 7));
      expect(solver.solve(solver.parse(raw))).toBe(oracleChainReactionSum(raw));
    }
  });

  it('builds default and bounded trace frames and validates maxSteps', () => {
    const parsed = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace?.(parsed);
    expect(full?.length).toBe(8);
    expect(full?.[7]?.isFinal).toBe(true);
    expect(full?.[7]?.settledCount).toBe(7);
    const bounded = solver.trace?.(parsed, { maxSteps: 3 });
    expect(bounded?.length).toBe(3);
    expect(bounded?.[0]?.step).toBe(0);
    expect(bounded?.[2]?.isFinal).toBe(true);
    expect(() => solver.trace?.(parsed, { maxSteps: 0 })).toThrow(RangeError);
  });

  it('rejects empty, malformed, diagonal, and out-of-range z inputs', () => {
    expect(() => solver.parse('')).toThrow(Error);
    expect(() => solver.parse('1,2,3~4,5')).toThrow(Error);
    expect(() => solver.parse('0,0,1~1,1,1')).toThrow(Error);
    expect(() => solver.parse('0,0,0~0,0,1')).toThrow(RangeError);
  });
});
