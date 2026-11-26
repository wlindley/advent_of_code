import { describe, expect, it } from 'vitest';
import { DirectoryMetrics, parseFilesystem } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  DirectoryDeletionTraceFrame,
  REQUIRED_FREE_SPACE,
  TOTAL_DISK_SPACE,
  findSmallestDirectoryToDelete,
  traceDirectoryDeletion,
} from './deletion';

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

describe('findSmallestDirectoryToDelete', () => {
  it('solves the official example (24933642) with AoC constants', () => {
    expect(TOTAL_DISK_SPACE).toBe(70_000_000);
    expect(REQUIRED_FREE_SPACE).toBe(30_000_000);
    expect(DEFAULT_MAX_TRACE_STEPS).toBe(120);
    expect(findSmallestDirectoryToDelete(parseFilesystem(OFFICIAL_EXAMPLE))).toBe(24_933_642);
  });

  it('enforces exact neededSpace boundary and keeps earliest post-order tie', () => {
    // total=100, required=50, root=80 => unused=20, needed=30
    const boundary = parseFilesystem([
      '$ cd /', '$ ls', 'dir small', 'dir exact', '21 root.bin',
      '$ cd small', '$ ls', '29 under.bin', '$ cd ..',
      '$ cd exact', '$ ls', '30 hit.bin',
    ].join('\n'));
    expect(findSmallestDirectoryToDelete(boundary, 100, 50)).toBe(30);

    // Ties: /a (40) and /b (40) qualify under needed=35; /c (45) is larger; /a wins earliest
    const tieTree = parseFilesystem([
      '$ cd /', '$ ls', 'dir a', 'dir b', 'dir c',
      '$ cd a', '$ ls', '40 f1', '$ cd ..',
      '$ cd b', '$ ls', '40 f2', '$ cd ..',
      '$ cd c', '$ ls', '45 f3',
    ].join('\n'));
    const frames = traceDirectoryDeletion(tieTree, 200, 110); // root=125, unused=75, needed=35
    expect(frames[frames.length - 1]?.bestIndex).toBe(0);
    expect(frames[frames.length - 1]?.bestCandidate?.path).toBe('/a');
    expect(findSmallestDirectoryToDelete(tieTree, 200, 110)).toBe(40);
  });

  it('selects root when only root qualifies and handles neededSpace === 0', () => {
    const rootOnly = parseFilesystem([
      '$ cd /', '$ ls', 'dir a', 'dir b', '50 root.bin',
      '$ cd a', '$ ls', '20 a.bin', '$ cd ..',
      '$ cd b', '$ ls', '20 b.bin',
    ].join('\n'));
    // total=100, required=40, root=90 => unused=10, needed=30 -> only root (90) qualifies
    expect(findSmallestDirectoryToDelete(rootOnly, 100, 40)).toBe(90);

    const withEmpty = parseFilesystem([
      '$ cd /', '$ ls', 'dir empty', 'dir non_empty',
      '$ cd non_empty', '$ ls', '10 a.bin',
    ].join('\n'));
    expect(findSmallestDirectoryToDelete(withEmpty, 100, 20)).toBe(0);

    const noEmpty = parseFilesystem(['$ cd /', '$ ls', 'dir sub', '5 r.bin', '$ cd sub', '$ ls', '3 s.bin'].join('\n'));
    expect(findSmallestDirectoryToDelete(noEmpty, 100, 20)).toBe(3);
  });

  it('supports full-disk and zero-capacity boundaries', () => {
    const fullDisk = parseFilesystem(['$ cd /', '$ ls', 'dir half', '50 r.bin', '$ cd half', '$ ls', '50 h.bin'].join('\n'));
    expect(findSmallestDirectoryToDelete(fullDisk, 100, 40)).toBe(50);

    const zeroDisk = parseFilesystem(['$ cd /', '$ ls', '0 empty.bin'].join('\n'));
    expect(findSmallestDirectoryToDelete(zeroDisk, 0, 0)).toBe(0);
  });

  it('rejects every invalid disk configuration with RangeError', () => {
    const tree = parseFilesystem(['$ cd /', '$ ls', '10 a.bin'].join('\n'));
    expect(() => findSmallestDirectoryToDelete(tree, -1, 0)).toThrow(RangeError);
    expect(() => findSmallestDirectoryToDelete(tree, 10.5, 5)).toThrow(RangeError);
    expect(() => findSmallestDirectoryToDelete(tree, 100, -1)).toThrow(RangeError);
    expect(() => findSmallestDirectoryToDelete(tree, 100, 1.5)).toThrow(RangeError);
    expect(() => findSmallestDirectoryToDelete(tree, 10, 11)).toThrow(RangeError);
    expect(() => findSmallestDirectoryToDelete(tree, 9, 5)).toThrow(RangeError);
  });
});

describe('DirectoryDeletionTraceFrame', () => {
  it('computes dynamic getters, null best before first qualifier, and freezes instance', () => {
    const dirs = [
      new DirectoryMetrics('/a', 'a', 1, 10, 0, 1, 0),
      new DirectoryMetrics('/b', 'b', 1, 50, 0, 1, 0),
      new DirectoryMetrics('/c', 'c', 1, 30, 0, 1, 0),
      new DirectoryMetrics('/', '/', 0, 0, 90, 0, 3),
    ];
    const f0 = new DirectoryDeletionTraceFrame(dirs, 0, 100, 35, 4); // unused=10, needed=25
    expect(Object.isFrozen(f0)).toBe(true);
    expect(Object.isFrozen(f0.directories)).toBe(true);
    expect(f0.current.path).toBe('/a');
    expect(f0.rootTotalSize).toBe(90);
    expect(f0.unusedSpace).toBe(10);
    expect(f0.neededSpace).toBe(25);
    expect(f0.isQualifying).toBe(false);
    expect(f0.bestIndex).toBeNull();
    expect(f0.bestCandidate).toBeNull();
    expect(f0.bestSize).toBeNull();
    expect(f0.qualifyingCount).toBe(0);
    expect(f0.auditedCount).toBe(1);
    expect(f0.totalDirectories).toBe(4);
    expect(f0.isComplete).toBe(false);

    const f2 = new DirectoryDeletionTraceFrame(dirs, 2, 100, 35, 4);
    expect(f2.isQualifying).toBe(true);
    expect(f2.bestIndex).toBe(2);
    expect(f2.bestCandidate?.path).toBe('/c');
    expect(f2.bestSize).toBe(30);
    expect(f2.qualifyingCount).toBe(2);

    const f3 = new DirectoryDeletionTraceFrame(dirs, 3, 100, 35, 4);
    expect(f3.bestIndex).toBe(2);
    expect(f3.isComplete).toBe(true);
  });

  it('rejects empty directories, invalid indices, invalid totalSteps, and invalid disk config', () => {
    const dirs = [new DirectoryMetrics('/', '/', 0, 10, 0, 1, 0)];
    expect(() => new DirectoryDeletionTraceFrame([], 0, 100, 30, 1)).toThrow(Error);
    expect(() => new DirectoryDeletionTraceFrame(dirs, -1, 100, 30, 1)).toThrow(RangeError);
    expect(() => new DirectoryDeletionTraceFrame(dirs, 1, 100, 30, 1)).toThrow(RangeError);
    expect(() => new DirectoryDeletionTraceFrame(dirs, 0.5, 100, 30, 1)).toThrow(RangeError);
    expect(() => new DirectoryDeletionTraceFrame(dirs, 0, 100, 30, 0)).toThrow(RangeError);
    expect(() => new DirectoryDeletionTraceFrame(dirs, 0, 100, 30, 1.5)).toThrow(RangeError);
    expect(() => new DirectoryDeletionTraceFrame(dirs, 0, 100, 101, 1)).toThrow(RangeError);
    expect(() => new DirectoryDeletionTraceFrame(dirs, 0, 9, 5, 1)).toThrow(RangeError);
  });
});

describe('traceDirectoryDeletion', () => {
  it('produces unsampled and sampled traces matching final answer and validates options', () => {
    const tree = parseFilesystem(OFFICIAL_EXAMPLE);
    const full = traceDirectoryDeletion(tree);
    expect(Object.isFrozen(full)).toBe(true);
    expect(full.map((f) => f.current.path)).toEqual(['/a/e', '/a', '/d', '/']);
    expect(full.map((f) => f.bestSize)).toEqual([null, null, 24_933_642, 24_933_642]);
    expect(full[3]?.isComplete).toBe(true);

    const two = traceDirectoryDeletion(tree, TOTAL_DISK_SPACE, REQUIRED_FREE_SPACE, { maxSteps: 2 });
    expect(two.map((f) => f.current.path)).toEqual(['/a/e', '/']);
    expect(two[1]?.bestSize).toBe(24_933_642);

    const one = traceDirectoryDeletion(tree, TOTAL_DISK_SPACE, REQUIRED_FREE_SPACE, { maxSteps: 1 });
    expect(one).toHaveLength(1);
    expect(one[0]?.bestSize).toBe(24_933_642);

    expect(() => traceDirectoryDeletion(tree, TOTAL_DISK_SPACE, REQUIRED_FREE_SPACE, { maxSteps: 0 })).toThrow(RangeError);
    expect(() => traceDirectoryDeletion(tree, 10, 20)).toThrow(RangeError);
  });
});
