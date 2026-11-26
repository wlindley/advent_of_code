import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { computePassword } from '../../shared';
import { solver } from './index';

type V3 = readonly [number, number, number];
interface Sticker {
  readonly row: number; readonly col: number; readonly wall: boolean;
  readonly p: V3; readonly n: V3; readonly r: V3; readonly d: V3;
}

const OFFICIAL_EXAMPLE = [
  '        ...#', '        .#..', '        #...', '        ....',
  '...#.......#', '........#...', '..#....#....', '..........#.',
  '        ...#....', '        .....#..', '        .#......', '        ......#.',
  '', '10R5L5R10L4R5L5',
].join('\n');

const ALT_NET_S3 = [
  '   ......', '   ......', '   ......',
  '   ...', '   ...', '   ...',
  '......', '.....#', '......',
  '...', '...', '...', '', '1L5L11',
].join('\n');

const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const neg = (v: V3): V3 => [0 - v[0], 0 - v[1], 0 - v[2]];
const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const z = (n: number): number => (n === 0 ? 0 : n);
const cross = (a: V3, b: V3): V3 => [
  z(a[1] * b[2] - a[2] * b[1]), z(a[2] * b[0] - a[0] * b[2]), z(a[0] * b[1] - a[1] * b[0]),
];
const inCube = (v: V3, s: number): boolean => v.every((c) => c >= 0 && c < s);
const sKey = (p: V3, n: V3): string => `${p.join(',')}|${n.join(',')}`;

function expandStickerNeighbors(
  cur: Sticker,
  lines: readonly string[],
  s: number,
  seen: Set<string>,
  q: Sticker[],
): void {
  const dirs: readonly [number, number, V3, V3, V3][] = [
    [0, 1, cur.r, neg(cur.n), cur.d], [1, 0, cur.d, cur.r, neg(cur.n)],
    [0, -1, neg(cur.r), cur.n, cur.d], [-1, 0, neg(cur.d), cur.r, cur.n],
  ];
  for (const [dr, dc, v, nr, nd] of dirs) {
    const nrw = cur.row + dr;
    const ncl = cur.col + dc;
    const ch = lines[nrw]?.[ncl];
    if ((ch !== '.' && ch !== '#') || seen.has(`${nrw},${ncl}`)) continue;
    seen.add(`${nrw},${ncl}`);
    const np = add(cur.p, v);
    const inFace = inCube(np, s);
    q.push({
      row: nrw, col: ncl, wall: ch === '#', p: inFace ? np : cur.p,
      n: inFace ? cur.n : v, r: inFace ? cur.r : nr, d: inFace ? cur.d : nd,
    });
  }
}

function buildVoxelCube(lines: readonly string[], s: number) {
  const c0 = lines[0]!.search(/[.#]/);
  const q: Sticker[] = [{
    row: 0, col: c0, wall: lines[0]![c0] === '#',
    p: [0, 0, s - 1], n: [0, 0, 1], r: [1, 0, 0], d: [0, 1, 0],
  }];
  const seen = new Set([`0,${c0}`]);
  const byCoord = new Map<string, Sticker>();
  const byKey = new Map<string, Sticker>();
  while (q.length > 0) {
    const cur = q.shift()!;
    byCoord.set(`${cur.row},${cur.col}`, cur);
    byKey.set(sKey(cur.p, cur.n), cur);
    expandStickerNeighbors(cur, lines, s, seen, q);
  }
  expect(byKey.size).toBe(6 * s * s);
  return { byCoord, byKey };
}

function walkVoxelOracle(raw: string, s: number): number {
  const [boardText, pathText] = raw.split('\n\n');
  const lines = boardText!.split('\n');
  const { byCoord, byKey } = buildVoxelCube(lines, s);
  let cur = byCoord.get(`0,${lines[0]!.indexOf('.')}`)!;
  let h = cur.r;
  for (const tok of pathText!.trim().match(/\d+|[LR]/g)!) {
    if (tok === 'R') { h = cross(cur.n, h); continue; }
    if (tok === 'L') { h = cross(h, cur.n); continue; }
    for (let i = 0; i < Number(tok); i += 1) {
      const np = add(cur.p, h);
      const inFace = inCube(np, s);
      const nextH = inFace ? h : neg(cur.n);
      const nxt = byKey.get(sKey(inFace ? np : cur.p, inFace ? cur.n : h))!;
      if (nxt.wall) break;
      cur = nxt;
      h = nextH;
    }
  }
  const f = dot(h, cur.r) === 1 ? 0 : dot(h, cur.d) === 1 ? 1 : dot(h, cur.r) === -1 ? 2 : 3;
  return 1000 * (cur.row + 1) + 4 * (cur.col + 1) + f;
}

describe('Day 22 Part 2 solver', () => {
  it('solves the official example via executeSolver and matches 3D voxel oracle', () => {
    let tick = 10;
    const fakeClock: Clock = { nowMs: () => (tick += 5) };
    const exec = executeSolver(solver, OFFICIAL_EXAMPLE, fakeClock);
    expect(exec.answer).toBe(5031);
    expect(exec.elapsedMs).toBe(5);
    expect(exec.runtime).toBe('main-thread');
    expect(exec.answer).toBe(walkVoxelOracle(OFFICIAL_EXAMPLE, 4));
  });

  it('handles 90/180-deg seams and seam wall blocking on 011/010/110/100 net', () => {
    const answer = solver.solve(solver.parse(ALT_NET_S3));
    expect(answer).toBe(2036);
    expect(answer).toBe(walkVoxelOracle(ALT_NET_S3, 3));
  });

  it('produces bounded trace with wraps and final password 5031', () => {
    const input = solver.parse(OFFICIAL_EXAMPLE);
    const full = solver.trace(input);
    const bounded = solver.trace(input, { maxSteps: 6 });
    expect(full.length).toBeGreaterThan(6);
    expect(bounded).toHaveLength(6);
    expect(computePassword(bounded[bounded.length - 1]!.pose)).toBe(5031);
    expect(bounded.some((f) => f.lastWrap !== null)).toBe(true);
  });

  it('rejects malformed puzzle input in parse', () => {
    expect(() => solver.parse('missing-blank-line')).toThrow();
  });

  it('rejects non-cube playable tile count in solve', () => {
    expect(() => solver.solve(solver.parse('..\n..\n\n1'))).toThrow(/6 square faces/);
  });

  it('rejects disconnected cube net in trace', () => {
    expect(() => solver.trace(solver.parse('... ...\n\n1'))).toThrow(/Disconnected/i);
  });

  it('rejects maxSteps <= 0 with RangeError in trace', () => {
    expect(() => solver.trace(solver.parse(OFFICIAL_EXAMPLE), { maxSteps: 0 })).toThrow(RangeError);
  });
});
