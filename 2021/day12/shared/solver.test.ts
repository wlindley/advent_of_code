import { describe, expect, it } from 'vitest';
import { NO_REVISIT_POLICY, SINGLE_SMALL_REVISIT_POLICY } from './policy';
import { CavePathSolver } from './solver';

const EXAMPLE_1 = [
  'start-A',
  'start-b',
  'A-c',
  'A-b',
  'b-d',
  'A-end',
  'b-end',
].join('\n');

const EXAMPLE_2 = [
  'dc-end',
  'HN-start',
  'start-kj',
  'dc-start',
  'dc-HN',
  'LN-dc',
  'HN-end',
  'kj-sa',
  'kj-HN',
  'kj-dc',
].join('\n');

const EXAMPLE_3 = [
  'fs-end',
  'he-DX',
  'fs-he',
  'start-DX',
  'pj-DX',
  'end-zg',
  'zg-sl',
  'zg-pj',
  'pj-he',
  'RW-he',
  'fs-DX',
  'pj-RW',
  'zg-RW',
  'start-pj',
  'he-WI',
  'zg-he',
  'pj-fs',
  'start-RW',
].join('\n');

function makeBigName(index: number): string {
  const first = String.fromCharCode(65 + Math.floor(index / 26));
  const second = String.fromCharCode(65 + (index % 26));
  return `${first}${second}`;
}

function makeSmallName(index: number): string {
  const first = String.fromCharCode(97 + Math.floor(index / 26));
  const second = String.fromCharCode(97 + (index % 26));
  return `${first}${second}`;
}

describe('CavePathSolver', () => {
  const part1 = new CavePathSolver(NO_REVISIT_POLICY);
  const part2 = new CavePathSolver(SINGLE_SMALL_REVISIT_POLICY);

  it('solves all three official AoC examples for both policies', () => {
    expect(part1.solve(part1.parse(EXAMPLE_1))).toBe(10n);
    expect(part2.solve(part2.parse(EXAMPLE_1))).toBe(36n);

    expect(part1.solve(part1.parse(EXAMPLE_2))).toBe(19n);
    expect(part2.solve(part2.parse(EXAMPLE_2))).toBe(103n);

    expect(part1.solve(part1.parse(EXAMPLE_3))).toBe(226n);
    expect(part2.solve(part2.parse(EXAMPLE_3))).toBe(3509n);
  });

  it('solves edge-case topologies: direct, single big cave, disconnected, degree-1 big cave, and multi-big-cave loops', () => {
    expect(part1.solve(part1.parse('start-end'))).toBe(1n);
    expect(part1.solve(part1.parse('start-A\nA-end'))).toBe(1n);
    expect(part1.solve(part1.parse('start-a\nb-end'))).toBe(0n);

    expect(part1.solve(part1.parse('start-b\nb-A\nb-end'))).toBe(1n);
    expect(part2.solve(part2.parse('start-b\nb-A\nb-end'))).toBe(2n);

    expect(part1.solve(part1.parse('start-b\nb-A\nb-B\nb-end'))).toBe(1n);
    expect(part2.solve(part2.parse('start-b\nb-A\nb-B\nb-end'))).toBe(3n);

    expect(part1.solve(part1.parse('start-A\nstart-end\nB-end'))).toBe(1n);
    expect(part2.solve(part2.parse('start-A\nstart-end\nB-end'))).toBe(1n);
  });

  it('handles memoization hits across diamond and multi-order small-cave DAGs', () => {
    const diamond = 'start-a\nstart-b\na-c\nb-c\nc-d\nc-e\nd-end\ne-end';
    expect(part1.solve(part1.parse(diamond))).toBe(4n);
    expect(part2.solve(part2.parse(diamond))).toBe(12n);

    const sameMask = 'start-a\na-b\na-c\nb-c\nb-d\nc-d\nd-end';
    expect(part1.solve(part1.parse(sameMask))).toBe(4n);
  });

  it('produces exact BigInt answers exceeding Number.MAX_SAFE_INTEGER', () => {
    const smalls = Array.from({ length: 14 }, (_, i) => makeSmallName(i));
    const lines = [`start-${smalls[0]}`, `${smalls[13]}-end`];
    let bigIdx = 0;
    for (let i = 0; i < 13; i += 1) {
      for (let k = 0; k < 18; k += 1) {
        const big = makeBigName(bigIdx);
        bigIdx += 1;
        lines.push(`${smalls[i]}-${big}`, `${big}-${smalls[i + 1]}`);
      }
    }
    const answer = part1.solve(part1.parse(lines.join('\n')));
    expect(answer).toBe(18n ** 13n);
    expect(answer > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
  });

  it('supports > 31 small caves without 32-bit bitmask aliasing', () => {
    const smalls = Array.from({ length: 35 }, (_, i) => makeSmallName(i));
    const lines = [`start-${smalls[0]}`, `${smalls[34]}-end`];
    for (let i = 0; i < 34; i += 1) {
      lines.push(`${smalls[i]}-${smalls[i + 1]}`);
    }
    expect(part1.solve(part1.parse(lines.join('\n')))).toBe(1n);
  });

  it('delegates trace with omitted and explicit options', () => {
    const system = part1.parse(EXAMPLE_1);
    const full = part1.trace(system);
    expect(full.at(-1)?.totalPaths).toBe(10n);
    expect(full.at(-1)?.status).toBe('summary');

    const capped = part1.trace(system, { maxSteps: 5 });
    expect(capped).toHaveLength(5);
    expect(capped.at(-1)?.truncated).toBe(true);
  });
});
