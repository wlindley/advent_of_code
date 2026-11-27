import { describe, expect, it } from 'vitest';
import { executeSolver } from '../../../../shared/core';
import { solver } from './index';

const EXAMPLE_1 = [
  '#########',
  '#b.A.@.a#',
  '#########',
].join('\n');

const EXAMPLE_2 = [
  '########################',
  '#f.D.E.e.C.b.A.@.a.B.c.#',
  '######################.#',
  '#d.....................#',
  '########################',
].join('\n');

const EXAMPLE_3 = [
  '########################',
  '#...............b.C.D.f#',
  '#.######################',
  '#.....@.a.B.c.d.A.e.F.g#',
  '########################',
].join('\n');

const EXAMPLE_4 = [
  '#################',
  '#i.G..c...e..H.p#',
  '########.########',
  '#j.A..b...f..D.o#',
  '########@########',
  '#k.E..a...g..B.n#',
  '########.########',
  '#l.F..d...h..C.m#',
  '#################',
].join('\n');

const EXAMPLE_5 = [
  '########################',
  '#@..............ac.GI.b#',
  '###d#e#f################',
  '###A#B#C################',
  '###g#h#i################',
  '########################',
].join('\n');

describe('2019 Day 18 Part 1 solver', () => {
  it('solves all 5 official examples accurately', () => {
    expect(executeSolver(solver, EXAMPLE_1).answer).toBe(8);
    expect(executeSolver(solver, EXAMPLE_2).answer).toBe(86);
    expect(executeSolver(solver, EXAMPLE_3).answer).toBe(132);
    expect(executeSolver(solver, EXAMPLE_4).answer).toBe(136);
    expect(executeSolver(solver, EXAMPLE_5).answer).toBe(81);
  });

  it('produces bounded trace frames ending with all keys collected', () => {
    const map = solver.parse(EXAMPLE_4);
    const frames = solver.trace(map, { maxSteps: 50 });
    expect(frames.length).toBe(50);
    expect(frames[0]!.stepIndex).toBe(0);
    expect(frames[0]!.collectedMask).toBe(0);
    const last = frames[frames.length - 1]!;
    expect(last.stepIndex).toBe(136);
    expect(last.totalSteps).toBe(136);
    expect(last.collectedMask).toBe(map.allKeysMask);
  });

  it('rejects invalid, multi-entrance, and unreachable maps', () => {
    expect(() => solver.parse('')).toThrow();
    expect(() => solver.parse('@.@\n.#.\n@.@')).toThrow(/single entrance/);
    expect(() => solver.solve(solver.parse('#####\n#@#a#\n#####'))).toThrow(/unreachable/);
  });
});
