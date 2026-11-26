import { describe, expect, it } from 'vitest';
import { executeSolver, type Clock } from '../../../../shared/core';
import { parseTerminalLog } from '../../shared';
import { DEFAULT_MAX_TRACE_STEPS, REQUIRED_FREE_SPACE, TOTAL_DISK_SPACE, solver } from './index';

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

function oracleSolvePart2(raw: string): { readonly answer: number; readonly needed: number } {
  const stack: string[] = ['/'];
  const dirTotals = new Map<string, number>([['/', 0]]);
  const seenFiles = new Set<string>();
  let inLs = false;

  for (const entry of parseTerminalLog(raw)) {
    const parent = stack[stack.length - 1]!;
    if (entry.kind === 'cd-root') { stack.length = 1; inLs = false; }
    else if (entry.kind === 'cd-up') { stack.pop(); inLs = false; }
    else if (entry.kind === 'ls') inLs = true;
    else if (entry.kind === 'cd-child') {
      const next = parent === '/' ? `/${entry.name}` : `${parent}/${entry.name}`;
      if (!dirTotals.has(next)) dirTotals.set(next, 0);
      stack.push(next);
      inLs = false;
    } else if (inLs && entry.kind === 'dir-entry') {
      const child = parent === '/' ? `/${entry.name}` : `${parent}/${entry.name}`;
      if (!dirTotals.has(child)) dirTotals.set(child, 0);
    } else if (inLs && entry.kind === 'file-entry') {
      const fileKey = `${parent}\0${entry.name}`;
      if (!seenFiles.has(fileKey)) {
        seenFiles.add(fileKey);
        for (const prefix of stack) dirTotals.set(prefix, (dirTotals.get(prefix) ?? 0) + entry.size);
      }
    }
  }

  const rootTotal = dirTotals.get('/') ?? 0;
  const needed = Math.max(0, REQUIRED_FREE_SPACE - (TOTAL_DISK_SPACE - rootTotal));
  let best = rootTotal;
  for (const total of dirTotals.values()) {
    if (total >= needed && total < best) best = total;
  }
  return { answer: best, needed };
}

function generateSeededLog(seed: number): string {
  const rand = createPrng(seed);
  const names = ['a', 'sub', 'x', 'leaf'];
  const highUsage = seed % 2 === 0;
  const lines = ['$ cd /', '$ ls', 'dir a', 'dir empty', highUsage ? '38000000 base.img' : '0 zero.dat'];
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
      lines.push(`$ cd ${names[Math.floor(rand() * names.length)]!}`);
      depth += 1;
    } else {
      lines.push('$ ls');
      lines.push(`dir ${names[Math.floor(rand() * names.length)]!}`);
      const sizes = [0, 10_000, 400_000, 900_000];
      const idx = Math.floor(rand() * sizes.length);
      const fSize = sizes[idx]!;
      const fName = rand() < 0.35 ? `dup_${idx}.dat` : `u_${step}.dat`;
      lines.push(`${fSize} ${fName}`);
    }
  }
  return lines.join('\n');
}

function generateDeep200DirLog(): string {
  const lines: string[] = ['$ cd /'];
  let created = 1;
  for (let branch = 0; branch < 25; branch += 1) {
    lines.push('$ cd /');
    for (let d = 1; d <= 9; d += 1) {
      lines.push(`$ cd d${d === 1 ? branch : d}`);
      created += 1;
      lines.push('$ ls');
      lines.push(`${d * 40_000} f_${d}.bin`);
    }
  }
  expect(created).toBeGreaterThanOrEqual(200);
  return lines.join('\n');
}

describe('part2 solver', () => {
  it('executes with fake clock on official example', () => {
    const result = executeSolver(solver, OFFICIAL_EXAMPLE, createFakeClock([12, 28.5]));
    expect(result.answer).toBe(24_933_642);
    expect(result.elapsedMs).toBe(16.5);
    expect(result.runtime).toBe('main-thread');
  });

  it('produces end-to-end trace frames matching solver answer', () => {
    const tree = solver.parse(OFFICIAL_EXAMPLE);
    const frames = solver.trace(tree, { maxSteps: 3 });
    expect(frames).toHaveLength(3);
    expect(frames[frames.length - 1]?.bestSize).toBe(solver.solve(tree));
  });

  it('matches path-stack-prefix oracle across example, 30 seeded logs, and 200+ dir depth-9 tree', () => {
    expect(solver.solve(solver.parse(OFFICIAL_EXAMPLE))).toBe(oracleSolvePart2(OFFICIAL_EXAMPLE).answer);
    let sawPositiveNeed = false;
    let sawZeroNeed = false;
    for (let seed = 1; seed <= 30; seed += 1) {
      const log = generateSeededLog(seed);
      const oracle = oracleSolvePart2(log);
      if (oracle.needed > 0) sawPositiveNeed = true;
      else sawZeroNeed = true;
      expect(solver.solve(solver.parse(log))).toBe(oracle.answer);
    }
    expect(sawPositiveNeed).toBe(true);
    expect(sawZeroNeed).toBe(true);

    const deepTree = solver.parse(generateDeep200DirLog());
    const deepFrames = solver.trace(deepTree);
    expect(deepFrames).toHaveLength(DEFAULT_MAX_TRACE_STEPS);
    expect(deepFrames[deepFrames.length - 1]?.bestSize).toBe(solver.solve(deepTree));
    expect(solver.solve(deepTree)).toBe(oracleSolvePart2(generateDeep200DirLog()).answer);
  });
});
