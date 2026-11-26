import { describe, expect, it } from 'vitest';
import { DirectoryMetrics, parseFilesystem } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DirectoryAuditTraceFrame,
  MAX_ELIGIBLE_DIR_SIZE,
  sumDirectoriesAtMost,
  traceDirectoryAudit,
} from './audit';

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

describe('sumDirectoriesAtMost', () => {
  it('solves the official example (95437) with nested double-counting', () => {
    const tree = parseFilesystem(OFFICIAL_EXAMPLE);
    expect(MAX_ELIGIBLE_DIR_SIZE).toBe(100_000);
    expect(sumDirectoriesAtMost(tree)).toBe(95437);
  });

  it('includes root, exact 100000 boundary, empty dirs, and excludes 100001', () => {
    const smallTree = parseFilesystem([
      '$ cd /',
      '$ ls',
      'dir empty',
      'dir exact',
      '1000 a.txt',
      '$ cd exact',
      '$ ls',
      '99000 b.txt',
    ].join('\n'));
    // /empty = 0, /exact = 99000, / = 100000 => 0 + 99000 + 100000 = 199000
    expect(sumDirectoriesAtMost(smallTree)).toBe(199_000);

    const overTree = parseFilesystem([
      '$ cd /',
      '$ ls',
      'dir at_limit',
      'dir over_limit',
      '$ cd at_limit',
      '$ ls',
      '100000 exact.bin',
      '$ cd ..',
      '$ cd over_limit',
      '$ ls',
      '100001 big.bin',
    ].join('\n'));
    expect(sumDirectoriesAtMost(overTree)).toBe(100_000);
  });

  it('supports maxSize = 0 and rejects invalid maxSize values', () => {
    const tree = parseFilesystem(['$ cd /', '$ ls', 'dir empty', '0 z.bin', '10 a.bin'].join('\n'));
    expect(sumDirectoriesAtMost(tree, 0)).toBe(0);
    expect(() => sumDirectoriesAtMost(tree, -1)).toThrow(RangeError);
    expect(() => sumDirectoriesAtMost(tree, 1.5)).toThrow(RangeError);
  });
});

describe('DirectoryAuditTraceFrame', () => {
  it('computes dynamic getters and freezes instance', () => {
    const dirs = [
      new DirectoryMetrics('/a/e', 'e', 2, 584, 0, 1, 0),
      new DirectoryMetrics('/', '/', 0, 200_000, 584, 1, 1),
    ];
    const first = new DirectoryAuditTraceFrame(dirs, 0, 100_000, 584, 1, 2);
    expect(Object.isFrozen(first)).toBe(true);
    expect(first.current.path).toBe('/a/e');
    expect(first.isQualifying).toBe(true);
    expect(first.auditedCount).toBe(1);
    expect(first.totalDirectories).toBe(2);
    expect(first.rootTotalSize).toBe(200_584);
    expect(first.isComplete).toBe(false);

    const last = new DirectoryAuditTraceFrame(dirs, 1, 100_000, 584, 1, 2);
    expect(last.isQualifying).toBe(false);
    expect(last.isComplete).toBe(true);
  });

  it('rejects empty directories and invalid auditedIndex', () => {
    const dirs = [new DirectoryMetrics('/', '/', 0, 10, 0, 1, 0)];
    expect(() => new DirectoryAuditTraceFrame([], 0, 100_000, 0, 0, 1)).toThrow();
    expect(() => new DirectoryAuditTraceFrame(dirs, -1, 100_000, 0, 0, 1)).toThrow(RangeError);
    expect(() => new DirectoryAuditTraceFrame(dirs, 1, 100_000, 0, 0, 1)).toThrow(RangeError);
    expect(() => new DirectoryAuditTraceFrame(dirs, 0.5, 100_000, 0, 0, 1)).toThrow(RangeError);
  });
});

describe('traceDirectoryAudit', () => {
  it('produces unsampled post-order frames matching final answer', () => {
    const tree = parseFilesystem(OFFICIAL_EXAMPLE);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    const frames = traceDirectoryAudit(tree);
    expect(Object.isFrozen(frames)).toBe(true);
    expect(frames).toHaveLength(4);
    expect(frames.map((f) => f.current.path)).toEqual(['/a/e', '/a', '/d', '/']);
    expect(frames.map((f) => f.runningSum)).toEqual([584, 95437, 95437, 95437]);
    expect(frames.map((f) => f.qualifyingCount)).toEqual([1, 2, 2, 2]);
    expect(frames[3]?.isComplete).toBe(true);
  });

  it('supports sampled traces (maxSteps 2 and 1) and rejects invalid maxSteps', () => {
    const tree = parseFilesystem(OFFICIAL_EXAMPLE);
    const two = traceDirectoryAudit(tree, MAX_ELIGIBLE_DIR_SIZE, { maxSteps: 2 });
    expect(two).toHaveLength(2);
    expect(two[0]?.current.path).toBe('/a/e');
    expect(two[1]?.current.path).toBe('/');
    expect(two[1]?.runningSum).toBe(95437);

    const one = traceDirectoryAudit(tree, MAX_ELIGIBLE_DIR_SIZE, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]?.current.path).toBe('/');
    expect(one[0]?.runningSum).toBe(95437);

    expect(() => traceDirectoryAudit(tree, MAX_ELIGIBLE_DIR_SIZE, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceDirectoryAudit(tree, MAX_ELIGIBLE_DIR_SIZE, { maxSteps: 1.5 })).toThrow(RangeError);
  });
});
