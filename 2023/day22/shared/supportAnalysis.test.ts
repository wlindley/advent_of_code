import { describe, expect, it } from 'vitest';
import { Brick, BrickSnapshot, parseBrickSnapshot } from './brickSnapshot';
import { settleBricks } from './settleStack';
import { SupportGraph } from './supportAnalysis';

const OFFICIAL_EXAMPLE = [
  '1,0,1~1,2,1',
  '0,0,2~2,0,2',
  '0,2,3~2,2,3',
  '0,0,4~0,2,4',
  '2,0,5~2,2,5',
  '0,1,6~2,1,6',
  '1,1,8~1,1,9',
].join('\n');

interface Box { readonly id: number; readonly x1: number; readonly x2: number; readonly y1: number; readonly y2: number; z1: number; z2: number; }

function boxCollides(a: Box, b: Box): boolean {
  return a.x1 <= b.x2 && a.x2 >= b.x1 && a.y1 <= b.y2 && a.y2 >= b.y1 && a.z1 <= b.z2 && a.z2 >= b.z1;
}

function naiveGravitySettle(boxes: readonly Box[]): Box[] {
  const state = boxes.map((b) => ({ ...b }));
  let moved = true;
  while (moved) {
    moved = false;
    for (let i = 0; i < state.length; i += 1) {
      const cur = state[i]!;
      while (cur.z1 > 1) {
        cur.z1 -= 1;
        cur.z2 -= 1;
        const hits = state.some((other, j) => j !== i && boxCollides(cur, other));
        if (hits) { cur.z1 += 1; cur.z2 += 1; break; }
        moved = true;
      }
    }
  }
  return state;
}

function generateRandomSnapshot(seed: number, count: number): BrickSnapshot {
  let s = seed >>> 0;
  const nextInt = (bound: number): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s % bound;
  };
  const boxes: Box[] = [];
  const bricks: Brick[] = [];
  while (bricks.length < count) {
    const x = nextInt(4);
    const y = nextInt(4);
    const z = 1 + nextInt(14);
    const axis = nextInt(4);
    const len = 1 + nextInt(2);
    const dx = axis === 0 ? len : 0;
    const dy = axis === 1 ? len : 0;
    const dz = axis === 2 ? len : 0;
    const cand: Box = { id: bricks.length, x1: x, x2: x + dx, y1: y, y2: y + dy, z1: z, z2: z + dz };
    if (boxes.some((b) => boxCollides(cand, b))) continue;
    boxes.push(cand);
    bricks.push(new Brick(cand.id, cand.x1, cand.y1, cand.z1, cand.x2, cand.y2, cand.z2));
  }
  return new BrickSnapshot(bricks);
}

describe('SupportGraph', () => {
  it('solves the official 7-brick example for Part 1 and Part 2', () => {
    const graph = new SupportGraph(settleBricks(parseBrickSnapshot(OFFICIAL_EXAMPLE)));
    expect(graph.brickCount).toBe(7);
    expect(graph.safeCount).toBe(5);
    expect(graph.loadBearingCount).toBe(2);
    expect(graph.isSafe(0)).toBe(false);
    expect(graph.isSafe(1)).toBe(true);
    expect(graph.supportersOf(3)).toEqual([1, 2]);
    expect(graph.dependentsOf(0)).toEqual([1, 2]);
    expect(graph.cascadeFrom(0)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(graph.cascadeFrom(1)).toEqual([]);
    expect(graph.cascadeFrom(5)).toEqual([6]);
    expect(graph.totalChainReactionFalls()).toBe(7);
    expect(Object.isFrozen(graph)).toBe(true);
  });

  it('handles diamond A -> {B,C} -> D -> E, single brick, and 4-brick tower', () => {
    const diamond = new SupportGraph(settleBricks(parseBrickSnapshot(
      '1,0,1~1,2,1\n0,0,2~2,0,2\n0,2,2~2,2,2\n0,0,3~0,2,3\n0,1,4~0,1,4',
    )));
    expect(diamond.safeCount).toBe(3);
    expect(diamond.cascadeFrom(0)).toEqual([1, 2, 3, 4]);
    expect(diamond.cascadeFrom(1)).toEqual([]);
    expect(diamond.cascadeFrom(3)).toEqual([4]);
    expect(diamond.totalChainReactionFalls()).toBe(5);

    const single = new SupportGraph(settleBricks(parseBrickSnapshot('0,0,5~0,0,5')));
    expect(single.safeCount).toBe(1);
    expect(single.totalChainReactionFalls()).toBe(0);

    const tower = new SupportGraph(settleBricks(parseBrickSnapshot(
      '0,0,1~0,0,1\n0,0,3~0,0,3\n0,0,5~0,0,5\n0,0,7~0,0,7',
    )));
    expect(tower.safeCount).toBe(1);
    expect(tower.cascadeFrom(0)).toEqual([1, 2, 3]);
    expect(tower.totalChainReactionFalls()).toBe(6);
  });

  it('throws RangeError on invalid or out-of-bounds brick indices', () => {
    const graph = new SupportGraph(settleBricks(parseBrickSnapshot('0,0,1~0,0,1')));
    expect(() => graph.isSafe(-1)).toThrow(RangeError);
    expect(() => graph.supportersOf(1)).toThrow(RangeError);
    expect(() => graph.dependentsOf(0.5)).toThrow(RangeError);
    expect(() => graph.cascadeFrom(99)).toThrow(RangeError);
  });

  it('matches an independent iterative 3D voxel-gravity oracle across 25 random stacks', () => {
    for (let seed = 1; seed <= 25; seed += 1) {
      const snap = generateRandomSnapshot(seed * 7919, 6 + (seed % 8));
      const stack = settleBricks(snap);
      const graph = new SupportGraph(stack);
      const initialBoxes: Box[] = snap.bricks.map((b) => ({
        id: b.id, x1: b.xMin, x2: b.xMax, y1: b.yMin, y2: b.yMax, z1: b.zMin, z2: b.zMax,
      }));
      const oracleSettled = naiveGravitySettle(initialBoxes).sort((a, b) => a.id - b.id);
      const settledById = stack.bricks.slice().sort((a, b) => a.id - b.id);
      expect(settledById.map((b) => b.zMin)).toEqual(oracleSettled.map((b) => b.z1));

      let oracleSafe = 0;
      let oracleTotalFalls = 0;
      for (let i = 0; i < stack.length; i += 1) {
        const removedId = stack.bricks[i]!.id;
        const remaining = oracleSettled.filter((b) => b.id !== removedId);
        const after = naiveGravitySettle(remaining);
        const falls = after.filter((b, idx) => b.z1 < remaining[idx]!.z1).length;
        expect(graph.cascadeFrom(i).length).toBe(falls);
        expect(graph.isSafe(i)).toBe(falls === 0);
        if (falls === 0) oracleSafe += 1;
        oracleTotalFalls += falls;
      }
      expect(graph.safeCount).toBe(oracleSafe);
      expect(graph.totalChainReactionFalls()).toBe(oracleTotalFalls);
    }
  });
});
