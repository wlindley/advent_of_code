import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { solver } from './solver';

const OFFICIAL_EXAMPLE = [
  '$ cd /',
  '$ ls',
  'dir a',
  '14848514 b.txt',
  '8504156 c.dat',
  'dir d',
  '$ cd a',
  '$ ls',
  'dir e',
  '29116 f',
  '2557 g',
  '62596 h.lst',
  '$ cd e',
  '$ ls',
  '584 i',
  '$ cd ..',
  '$ cd ..',
  '$ cd d',
  '$ ls',
  '4060174 j',
  '8033020 d.log',
  '5626152 d.ext',
  '7214296 k',
].join('\n');

function createFakeClock(times: readonly number[]): Clock {
  let index = 0;
  return {
    nowMs: () => {
      const value = times[index] ?? times[times.length - 1] ?? 0;
      index += 1;
      return value;
    },
  };
}

function createPrng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function oracleSolvePart1(raw: string): number {
  const stack: string[] = ['/'];
  const dirTotals = new Map<string, number>([['/'.trim(), 0]]);
  const seenFiles = new Set<string>();
  let inLs = false;

  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line === '$ cd /') {
      stack.length = 1;
      inLs = false;
    } else if (line === '$ cd ..') {
      stack.pop();
      inLs = false;
    } else if (line.startsWith('$ cd ')) {
      const name = line.slice(5).trim();
      const parent = stack[stack.length - 1]!;
      const next = parent === '/' ? `/${name}` : `${parent}/${name}`;
      if (!dirTotals.has(next)) dirTotals.set(next, 0);
      stack.push(next);
      inLs = false;
    } else if (line === '$ ls') {
      inLs = true;
    } else if (inLs) {
      const space = line.indexOf(' ');
      const head = line.slice(0, space);
      const name = line.slice(space + 1).trim();
      const parent = stack[stack.length - 1]!;
      if (head === 'dir') {
        const child = parent === '/' ? `/${name}` : `${parent}/${name}`;
        if (!dirTotals.has(child)) dirTotals.set(child, 0);
      } else {
        const fileKey = `${parent}\0${name}`;
        if (!seenFiles.has(fileKey)) {
          seenFiles.add(fileKey);
          const size = Number(head);
          for (const prefix of stack) {
            dirTotals.set(prefix, (dirTotals.get(prefix) ?? 0) + size);
          }
        }
      }
    }
  }

  let sum = 0;
  for (const total of dirTotals.values()) {
    if (total <= 100_000) sum += total;
  }
  return sum;
}

function generateSeededLog(seed: number): string {
  const rand = createPrng(seed);
  const names = ['a', 'sub', 'x', 'leaf'];
  const lines = ['$ cd /', '$ ls', 'dir a', 'dir sub', '0 zero.dat'];
  let depth = 0;
  for (let step = 0; step < 35; step += 1) {
    const pick = rand();
    if (pick < 0.2 && depth > 0) {
      lines.push('$ cd ..');
      depth -= 1;
    } else if (pick < 0.3) {
      lines.push('$ cd /');
      depth = 0;
    } else if (pick < 0.65 && depth < 5) {
      const dirName = names[Math.floor(rand() * names.length)]!;
      lines.push(`$ cd ${dirName}`);
      depth += 1;
    } else {
      lines.push('$ ls');
      const dirName = names[Math.floor(rand() * names.length)]!;
      lines.push(`dir ${dirName}`);
      const sizeOptions = [0, 500, 49_999, 50_001, 100_000, 100_001];
      const fSize = sizeOptions[Math.floor(rand() * sizeOptions.length)]!;
      const fName = `f${Math.floor(rand() * 4)}.dat`;
      if (!lines.some((l) => l.endsWith(` ${fName}`) && !l.startsWith('dir '))) {
        lines.push(`${fSize} ${fName}`);
      } else {
        lines.push(`${fSize} u_${step}.dat`);
      }
    }
  }
  return lines.join('\n');
}

function generateDeep200DirLog(): string {
  const lines: string[] = ['$ cd /'];
  let created = 1;
  for (let branch = 0; branch < 25; branch += 1) {
    lines.push('$ cd /');
    for (let d = 1; d <= 8; d += 1) {
      lines.push(`$ cd d${d === 1 ? branch : d}`);
      created += 1;
      lines.push('$ ls');
      lines.push(`${d * 1700} f_${d}.bin`);
    }
  }
  expect(created).toBeGreaterThanOrEqual(200);
  return lines.join('\n');
}

describe('part1 solver', () => {
  it('executes with fake clock on official example', () => {
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, createFakeClock([10, 24.5]));
    expect(result.answer).toBe(95437);
    expect(result.elapsedMs).toBe(14.5);
    expect(result.runtime).toBe('main-thread');
  });

  it('produces end-to-end trace frames matching solver answer', () => {
    const tree = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace(tree, { maxSteps: 3 });
    expect(frames).toHaveLength(3);
    expect(frames[frames.length - 1]?.runningSum).toBe(solver.solve(tree));
  });

  it('matches independent path-stack oracle across example, 30 seeded logs, and a 200-dir depth-9 tree', () => {
    expect(solver.solve(solver.parse(OFFICIAL_EXAMPLE))).toBe(oracleSolvePart1(OFFICIAL_EXAMPLE));
    for (let seed = 1; seed <= 30; seed += 1) {
      const log = generateSeededLog(seed);
      expect(solver.solve(solver.parse(log))).toBe(oracleSolvePart1(log));
    }
    const deepLog = generateDeep200DirLog();
    expect(solver.solve(solver.parse(deepLog))).toBe(oracleSolvePart1(deepLog));
  });
});
