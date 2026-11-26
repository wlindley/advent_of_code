import { describe, expect, it } from 'vitest';
import { parseWorkflowSystem } from './parser';
import { PartRating } from './partRating';
import { RatingBox } from './ratingBox';

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

/** Independent recursive string-rule evaluator (zero shared evaluation code). */
function evalWorkflowOracle(
  rawMap: ReadonlyMap<string, string>,
  wfName: string,
  part: PartRating,
): 'A' | 'R' {
  if (wfName === 'A' || wfName === 'R') return wfName;
  const clauses = rawMap.get(wfName)!.split(',');
  const fallback = clauses.pop()!;
  for (const clause of clauses) {
    const [cond, target] = clause.split(':') as [string, string];
    const cat = cond[0] as 'x' | 'm' | 'a' | 's';
    const op = cond[1]!;
    const threshold = Number(cond.slice(2));
    const val = part[cat];
    if ((op === '<' && val < threshold) || (op === '>' && val > threshold)) {
      return evalWorkflowOracle(rawMap, target, part);
    }
  }
  return evalWorkflowOracle(rawMap, fallback, part);
}

function buildRawMap(block: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of block.trim().split('\n')) {
    const open = line.indexOf('{');
    map.set(line.slice(0, open), line.slice(open + 1, -1));
  }
  return map;
}

describe('WorkflowSystem differential oracles', () => {
  it('matches recursive string oracle and disjoint box containment on deterministic grid', () => {
    const system = parseWorkflowSystem(OFFICIAL_WORKFLOWS);
    const rawMap = buildRawMap(OFFICIAL_WORKFLOWS);
    const boxes = system.collectAcceptedBoxes(RatingBox.uniform(1n, 4000n));
    const coords = [1, 536, 537, 1350, 1351, 1416, 2006, 2091, 2663, 4000];

    for (let i = 0; i < coords.length; i += 1) {
      const part = new PartRating({
        x: coords[i]!,
        m: coords[(i * 3 + 1) % coords.length]!,
        a: coords[(i * 7 + 2) % coords.length]!,
        s: coords[(i * 5 + 3) % coords.length]!,
      });
      const expected = evalWorkflowOracle(rawMap, 'in', part);
      const route = system.routePart(part);
      expect(route.outcome).toBe(expected);
      expect(boxes.filter((b) => b.contains(part))).toHaveLength(expected === 'A' ? 1 : 0);
    }
  });

  it('matches exhaustive [1..6]^4 brute force count on multi-branching DAG with redundant/dead rules', () => {
    const dagBlock = [
      'in{x<4:left,x>2:right,R}',
      'left{m>4:A,m<2:dead,a<3:A,R}',
      'right{s>3:leaf,x<3:A,leaf}',
      'dead{x>10:A,R}',
      'leaf{a>4:A,s<5:R,A}',
    ].join('\n');
    const system = parseWorkflowSystem(dagBlock);

    let bruteAccepted = 0n;
    for (let x = 1; x <= 6; x += 1) {
      for (let m = 1; m <= 6; m += 1) {
        for (let a = 1; a <= 6; a += 1) {
          for (let s = 1; s <= 6; s += 1) {
            if (system.isAccepted(new PartRating({ x, m, a, s }))) bruteAccepted += 1n;
          }
        }
      }
    }
    expect(system.countAcceptedCombinations(RatingBox.uniform(1n, 6n))).toBe(bruteAccepted);
  });

  it('computes exact official Part 2 example count 167409079868000n on [1..4000]^4', () => {
    const system = parseWorkflowSystem(OFFICIAL_WORKFLOWS);
    expect(system.countAcceptedCombinations(RatingBox.uniform(1n, 4000n))).toBe(
      167409079868000n,
    );
  });
});
