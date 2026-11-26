import { describe, expect, it } from 'vitest';
import { buildFilesystem, parseFilesystem } from './builder';
import type { TerminalLine } from './parser';

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

describe('parseFilesystem and buildFilesystem', () => {
  it('builds the official 23-line example tree with canonical paths', () => {
    const tree = parseFilesystem(OFFICIAL_EXAMPLE);
    expect(tree.totalSize).toBe(48381165);
    const metrics = tree.collectDirectoryMetrics();
    expect(metrics.map((m) => [m.path, m.depth, m.totalSize])).toEqual([
      ['/a/e', 2, 584],
      ['/a', 1, 94853],
      ['/d', 1, 24933642],
      ['/', 0, 48381165],
    ]);
  });

  it('disambiguates duplicate basenames and nested identical basenames', () => {
    const tree = parseFilesystem([
      '$ cd /',
      '$ ls',
      'dir a',
      'dir b',
      '$ cd a',
      '$ ls',
      'dir a',
      'dir sub',
      '$ cd a',
      '$ ls',
      'dir a',
      '10 x.txt',
      '$ cd a',
      '$ ls',
      '5 leaf.txt',
      '$ cd /',
      '$ cd b',
      '$ ls',
      'dir sub',
      '$ cd sub',
      '$ ls',
      '20 y.txt',
      '$ cd /',
      '$ cd a',
      '$ cd sub',
      '$ ls',
      '30 z.txt',
    ].join('\n'));

    const byPath = new Map(tree.collectDirectoryMetrics().map((m) => [m.path, m.totalSize]));
    expect(byPath.get('/a/a/a')).toBe(5);
    expect(byPath.get('/a/a')).toBe(15);
    expect(byPath.get('/a/sub')).toBe(30);
    expect(byPath.get('/b/sub')).toBe(20);
    expect(byPath.get('/')).toBe(65);
  });

  it('supports idempotent repeated ls, lazy cd, multiple cd /, empty dirs, and zero-byte files', () => {
    const tree = parseFilesystem([
      '$ cd /',
      '$ ls',
      'dir empty',
      '0 zero.bin',
      '10 keep.txt',
      '$ cd lazy',
      '$ ls',
      '7 nested.txt',
      '$ cd /',
      '$ ls',
      'dir empty',
      '0 zero.bin',
      '10 keep.txt',
    ].join('\n'));

    const byPath = new Map(tree.collectDirectoryMetrics().map((m) => [m.path, m]));
    expect(byPath.get('/empty')?.totalSize).toBe(0);
    expect(byPath.get('/lazy')?.totalSize).toBe(7);
    expect(byPath.get('/')?.fileCount).toBe(2);
    expect(tree.totalSize).toBe(17);
  });

  it('rejects empty command list', () => {
    expect(() => buildFilesystem([])).toThrow();
  });

  it('rejects cd .. from root', () => {
    const lines: TerminalLine[] = [{ kind: 'cd-root' }, { kind: 'cd-up' }];
    expect(() => buildFilesystem(lines)).toThrow();
  });

  it('rejects dir or file listings outside ls mode', () => {
    expect(() => buildFilesystem([{ kind: 'dir-entry', name: 'a' }])).toThrow();
    expect(() => buildFilesystem([{ kind: 'file-entry', name: 'f', size: 1 }])).toThrow();
    expect(() =>
      buildFilesystem([{ kind: 'ls' }, { kind: 'cd-root' }, { kind: 'file-entry', name: 'f', size: 1 }]),
    ).toThrow();
  });

  it('rejects file/directory name collisions in all directions', () => {
    expect(() =>
      parseFilesystem(['$ cd /', '$ ls', '10 same', 'dir same'].join('\n')),
    ).toThrow();
    expect(() =>
      parseFilesystem(['$ cd /', '$ ls', 'dir same', '10 same'].join('\n')),
    ).toThrow();
    expect(() =>
      parseFilesystem(['$ cd /', '$ ls', '10 same', '$ cd same'].join('\n')),
    ).toThrow();
  });

  it('rejects conflicting file sizes on repeated ls', () => {
    expect(() =>
      parseFilesystem(['$ cd /', '$ ls', '10 a.txt', '$ ls', '20 a.txt'].join('\n')),
    ).toThrow();
  });
});
