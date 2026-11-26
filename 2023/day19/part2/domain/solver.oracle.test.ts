import { describe, expect, it } from 'vitest';
import { CATEGORIES, PartRating, RatingBox } from '../../shared';
import { solver } from './index';

const OFFICIAL_WORKFLOWS = [
  'px{a<2006:qkq,m>2090:A,rfg}',
  'pv{a>1716:R,A}',
  'lnx{m>1548:A,A}',
  'rfg{s<537:gd,x>2440:R,A}',
  'qs{s>3448:A,lnx}',
  'qkq{x<1416:A,crn}',
  'crn{x>2662:A,R}',
  'in{s<1351:px,qqz}',
  'qqz{s>2770:qs,m<1801:hdj,R}',
  'gd{a>3333:R,R}',
  'hdj{m>838:A,pv}',
].join('\n');

const SYNTHETIC_DAG = [
  'in{x<1500:left,x>2500:right,mid}',
  'left{m>2000:A,a<1200:leaf,R}',
  'mid{s<2000:leaf,m<1000:R,A}',
  'right{a>3000:A,s>3000:leaf,R}',
  'leaf{x<3000:A,s<1500:R,A}',
].join('\n');

type TupleInterval = readonly [bigint, bigint];
type TupleBox = readonly [TupleInterval, TupleInterval, TupleInterval, TupleInterval];
const CAT_INDEX: Record<string, number> = { x: 0, m: 1, a: 2, s: 3 };

function parseRuleMap(block: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of block.trim().split('\n')) {
    const open = line.indexOf('{');
    map.set(line.slice(0, open), line.slice(open + 1, -1));
  }
  return map;
}

function replaceCoord(box: TupleBox, idx: number, next: TupleInterval): TupleBox {
  const copy = [...box];
  copy[idx] = next;
  return copy as unknown as TupleBox;
}

function splitTuple(box: TupleBox, idx: number, op: string, thr: bigint): [TupleBox | null, TupleBox | null] {
  const [lo, hi] = box[idx]!;
  if (op === '<') {
    if (hi < thr) return [box, null];
    if (lo >= thr) return [null, box];
    return [replaceCoord(box, idx, [lo, thr - 1n]), replaceCoord(box, idx, [thr, hi])];
  }
  if (lo > thr) return [box, null];
  if (hi <= thr) return [null, box];
  return [replaceCoord(box, idx, [thr + 1n, hi]), replaceCoord(box, idx, [lo, thr])];
}

function tupleVolume(box: TupleBox): bigint {
  return box.reduce((acc, [lo, hi]) => acc * (hi - lo + 1n), 1n);
}

function countByTupleOracle(map: ReadonlyMap<string, string>, target: string, box: TupleBox): bigint {
  if (target === 'A') return tupleVolume(box);
  if (target === 'R') return 0n;
  const clauses = map.get(target)!.split(',');
  const fallback = clauses.pop()!;
  let total = 0n;
  let rem: TupleBox | null = box;
  for (const clause of clauses) {
    const [cond, nextTarget] = clause.split(':') as [string, string];
    const [matched, nextRem] = splitTuple(rem, CAT_INDEX[cond[0]!]!, cond[1]!, BigInt(cond.slice(2)));
    if (matched) total += countByTupleOracle(map, nextTarget, matched);
    if (!nextRem) return total;
    rem = nextRem;
  }
  return total + countByTupleOracle(map, fallback, rem);
}

function boxesOverlap(a: RatingBox, b: RatingBox): boolean {
  return CATEGORIES.every((c) => a.rangeFor(c).start <= b.rangeFor(c).end && b.rangeFor(c).start <= a.rangeFor(c).end);
}

function invertTerminals(block: string): string {
  return block.replace(/([:,])([AR])(?=[,}])/g, (_, sep: string, term: string) => `${sep}${term === 'A' ? 'R' : 'A'}`);
}

describe('Day 19 Part 2 independent differential oracles', () => {
  it.each([
    ['official workflows', OFFICIAL_WORKFLOWS],
    ['synthetic multi-branch DAG', SYNTHETIC_DAG],
  ])('matches plain-tuple recursive DFS oracle on %s', (_label, block) => {
    const oracleMap = parseRuleMap(block);
    const init: TupleBox = [[1n, 4000n], [1n, 4000n], [1n, 4000n], [1n, 4000n]];
    expect(solver.solve(solver.parse(block))).toBe(countByTupleOracle(oracleMap, 'in', init));
  });

  it('produces pairwise disjoint accepted boxes whose volumes sum to solver.solve', () => {
    const system = solver.parse(OFFICIAL_WORKFLOWS);
    const boxes = system.collectAcceptedBoxes(RatingBox.uniform(1n, 4000n));
    let sum = 0n;
    for (let i = 0; i < boxes.length; i += 1) {
      sum += boxes[i]!.volume;
      for (let j = i + 1; j < boxes.length; j += 1) {
        expect(boxesOverlap(boxes[i]!, boxes[j]!)).toBe(false);
      }
    }
    expect(sum).toBe(solver.solve(system));
  });

  it.each([OFFICIAL_WORKFLOWS, SYNTHETIC_DAG])('conserves total [1..4000]^4 volume under A<->R complement', (block) => {
    const accepted = solver.solve(solver.parse(block));
    const inverted = solver.solve(solver.parse(invertTerminals(block)));
    expect(accepted + inverted).toBe(256000000000000n);
  });

  it('matches exhaustive [1..5]^4 brute-force Part 1 enumeration end-to-end', () => {
    const raw = [
      'in{x>5:R,m>5:R,a>5:R,s>5:R,sub}',
      'sub{x<3:left,m>3:right,a<2:R,A}',
      'left{s>2:A,a>3:leaf,R}',
      'right{x>4:R,s<4:leaf,A}',
      'leaf{m<2:R,a>4:A,s<3:A,R}',
    ].join('\n');
    const system = solver.parse(raw);
    let brute = 0n;
    for (let x = 1; x <= 5; x += 1) {
      for (let m = 1; m <= 5; m += 1) {
        for (let a = 1; a <= 5; a += 1) {
          for (let s = 1; s <= 5; s += 1) {
            if (system.isAccepted(new PartRating({ x, m, a, s }))) brute += 1n;
          }
        }
      }
    }
    expect(solver.solve(system)).toBe(brute);
  });
});
