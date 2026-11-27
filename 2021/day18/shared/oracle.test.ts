import { describe, expect, it } from 'vitest';
import { parseSnailfishNumber } from './parser';
import { addSnailfish, addSnailfishMagnitude } from './reducer';

type TreeNode = number | readonly [TreeNode, TreeNode];

function parseTree(raw: string): TreeNode {
  return JSON.parse(raw) as TreeNode;
}

function formatTree(node: TreeNode): string {
  return typeof node === 'number' ? String(node) : `[${formatTree(node[0])},${formatTree(node[1])}]`;
}

function treeMagnitude(node: TreeNode): number {
  return typeof node === 'number' ? node : 3 * treeMagnitude(node[0]) + 2 * treeMagnitude(node[1]);
}

function addLeftmost(node: TreeNode, val: number): TreeNode {
  if (typeof node === 'number') return node + val;
  return [addLeftmost(node[0], val), node[1]];
}

function addRightmost(node: TreeNode, val: number): TreeNode {
  if (typeof node === 'number') return node + val;
  return [node[0], addRightmost(node[1], val)];
}

function tryExplode(
  node: TreeNode,
  depth: number,
): { readonly hit: boolean; readonly node: TreeNode; readonly left: number; readonly right: number } {
  if (typeof node === 'number') return { hit: false, node, left: 0, right: 0 };
  if (depth >= 4 && typeof node[0] === 'number' && typeof node[1] === 'number') {
    return { hit: true, node: 0, left: node[0], right: node[1] };
  }
  const leftRes = tryExplode(node[0], depth + 1);
  if (leftRes.hit) {
    const rightNode = leftRes.right > 0 ? addLeftmost(node[1], leftRes.right) : node[1];
    return { hit: true, node: [leftRes.node, rightNode], left: leftRes.left, right: 0 };
  }
  const rightRes = tryExplode(node[1], depth + 1);
  if (rightRes.hit) {
    const leftNode = rightRes.left > 0 ? addRightmost(node[0], rightRes.left) : node[0];
    return { hit: true, node: [leftNode, rightRes.node], left: 0, right: rightRes.right };
  }
  return { hit: false, node, left: 0, right: 0 };
}

function trySplit(node: TreeNode): { readonly hit: boolean; readonly node: TreeNode } {
  if (typeof node === 'number') {
    if (node >= 10) return { hit: true, node: [Math.floor(node / 2), Math.ceil(node / 2)] };
    return { hit: false, node };
  }
  const leftRes = trySplit(node[0]);
  if (leftRes.hit) return { hit: true, node: [leftRes.node, node[1]] };
  const rightRes = trySplit(node[1]);
  if (rightRes.hit) return { hit: true, node: [node[0], rightRes.node] };
  return { hit: false, node };
}

function oracleAdd(a: TreeNode, b: TreeNode): TreeNode {
  let cur: TreeNode = [a, b];
  while (true) {
    const exp = tryExplode(cur, 0);
    if (exp.hit) {
      cur = exp.node;
      continue;
    }
    const spl = trySplit(cur);
    if (spl.hit) {
      cur = spl.node;
      continue;
    }
    return cur;
  }
}

function sumWithOracle(lines: readonly string[]): { readonly expr: string; readonly mag: number } {
  const trees = lines.map(parseTree);
  const finalTree = trees.slice(1).reduce((acc, next) => oracleAdd(acc, next), trees[0]!);
  return { expr: formatTree(finalTree), mag: treeMagnitude(finalTree) };
}

function sumWithFlat(lines: readonly string[]): { readonly expr: string; readonly mag: number } {
  const nums = lines.map(parseSnailfishNumber);
  const finalNum = nums.slice(1).reduce((acc, next) => addSnailfish(acc, next), nums[0]!);
  return { expr: finalNum.toString(), mag: finalNum.magnitude };
}

describe('independent recursive tree oracle cross-check', () => {
  it('matches official list sums 445, 791, 1137, and 3488', () => {
    const lists: readonly [readonly string[], number][] = [
      [['[1,1]', '[2,2]', '[3,3]', '[4,4]'], 445],
      [['[1,1]', '[2,2]', '[3,3]', '[4,4]', '[5,5]'], 791],
      [['[1,1]', '[2,2]', '[3,3]', '[4,4]', '[5,5]', '[6,6]'], 1137],
      [
        [
          '[[[0,[4,5]],[0,0]],[[[4,5],[2,6]],[9,5]]]',
          '[7,[[[3,7],[4,3]],[[6,3],[8,8]]]]',
          '[[2,[[0,8],[3,4]]],[[[6,7],1],[7,[1,6]]]]',
          '[[[[2,4],7],[6,[0,5]]],[[[6,8],[2,8]],[[2,1],[4,5]]]]',
          '[7,[5,[[3,8],[1,4]]]]',
          '[[2,[2,2]],[8,[8,1]]]',
          '[2,9]',
          '[1,[[[9,3],9],[[9,0],[0,7]]]]',
          '[[[5,[7,4]],7],1]',
          '[[[[4,2],2],6],[8,7]]',
        ],
        3488,
      ],
    ];
    for (const [lines, expectedMag] of lists) {
      const oracle = sumWithOracle(lines);
      const flat = sumWithFlat(lines);
      expect(flat).toEqual(oracle);
      expect(flat.mag).toBe(expectedMag);
    }
  });

  it('matches official 10-line homework sum (4140) and max pair (3993)', () => {
    const homework = [
      '[[[0,[5,8]],[[1,7],[9,6]]],[[4,[1,2]],[[1,4],2]]]',
      '[[[5,[2,8]],4],[5,[[9,9],0]]]',
      '[6,[[[6,2],[5,6]],[[7,6],[4,7]]]]',
      '[[[6,[0,7]],[0,9]],[4,[9,[9,0]]]]',
      '[[[7,[6,4]],[3,[1,3]]],[[[5,5],1],9]]',
      '[[6,[[7,3],[3,2]]],[[[3,8],[5,7]],4]]',
      '[[[[5,4],[7,7]],8],[[8,3],8]]',
      '[[9,3],[[9,9],[6,[4,9]]]]',
      '[[2,[[7,7],7]],[[5,8],[[9,3],[0,2]]]]',
      '[[[[5,2],5],[8,[3,7]]],[[5,[7,5]],[4,4]]]',
    ];
    const oracleSum = sumWithOracle(homework);
    const flatSum = sumWithFlat(homework);
    expect(flatSum).toEqual(oracleSum);
    expect(flatSum.mag).toBe(4140);

    const parsed = homework.map(parseSnailfishNumber);
    const trees = homework.map(parseTree);
    let bestFlat = -1;
    let bestOracle = -1;
    for (let i = 0; i < parsed.length; i += 1) {
      for (let j = 0; j < parsed.length; j += 1) {
        if (i === j) continue;
        bestFlat = Math.max(bestFlat, addSnailfishMagnitude(parsed[i]!, parsed[j]!));
        bestOracle = Math.max(bestOracle, treeMagnitude(oracleAdd(trees[i]!, trees[j]!)));
      }
    }
    expect(bestFlat).toBe(3993);
    expect(bestOracle).toBe(3993);
  });

  it('matches oracle on depth-6 asymmetric trees and cascading split-explode chains', () => {
    const chains: readonly [string, string][] = [
      ['[[[[9,9],[9,9]],[[9,9],[9,9]]],[[[9,9],[9,9]],[[9,9],[9,9]]]]', '[[[[1,2],[3,4]],[5,6]],[7,8]]'],
      ['[[[[[1,[2,3]],4],5],6],7]', '[19,21]'],
    ];
    for (const [left, right] of chains) {
      const oracle = oracleAdd(parseTree(left), parseTree(right));
      const flat = addSnailfish(parseSnailfishNumber(left), parseSnailfishNumber(right));
      expect(flat.toString()).toBe(formatTree(oracle));
      expect(flat.magnitude).toBe(treeMagnitude(oracle));
    }
  });
});
