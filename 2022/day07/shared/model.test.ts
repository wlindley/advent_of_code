import { describe, expect, it } from 'vitest';
import { DirectoryMetrics, DirectoryNode, FileEntry, FilesystemTree } from './model';

describe('FileEntry', () => {
  it('stores frozen name and size', () => {
    const file = new FileEntry('b.txt', 14848514);
    expect(file.name).toBe('b.txt');
    expect(file.size).toBe(14848514);
    expect(Object.isFrozen(file)).toBe(true);
    expect(new FileEntry('empty.dat', 0).size).toBe(0);
  });

  it('rejects invalid file names and invalid sizes', () => {
    expect(() => new FileEntry('a/b', 10)).toThrow();
    expect(() => new FileEntry('..', 10)).toThrow();
    expect(() => new FileEntry('a.txt', -1)).toThrow(RangeError);
    expect(() => new FileEntry('a.txt', 1.5)).toThrow(RangeError);
  });
});

describe('DirectoryNode', () => {
  it('computes directFileSize, totalSize, and isEmpty dynamically', () => {
    const e = new DirectoryNode('e', '/a/e', 2, [new FileEntry('i', 584)], []);
    const a = new DirectoryNode(
      'a',
      '/a',
      1,
      [new FileEntry('f', 29116), new FileEntry('g', 2557), new FileEntry('h.lst', 62596)],
      [e],
    );
    const empty = new DirectoryNode('empty', '/empty', 1, [], []);

    expect(Object.isFrozen(e)).toBe(true);
    expect(Object.isFrozen(e.files)).toBe(true);
    expect(Object.isFrozen(e.subdirectories)).toBe(true);
    expect(e.directFileSize).toBe(584);
    expect(e.totalSize).toBe(584);
    expect(e.isEmpty).toBe(false);
    expect(a.directFileSize).toBe(94269);
    expect(a.totalSize).toBe(94853);
    expect(empty.directFileSize).toBe(0);
    expect(empty.totalSize).toBe(0);
    expect(empty.isEmpty).toBe(true);
  });

  it('rejects invalid directory names, paths, and depths', () => {
    expect(() => new DirectoryNode('bad/name', '/bad', 1, [], [])).toThrow();
    expect(() => new DirectoryNode('a', 'a', 1, [], [])).toThrow();
    expect(() => new DirectoryNode('a', '/a', -1, [], [])).toThrow(RangeError);
  });
});

describe('DirectoryMetrics', () => {
  it('computes totalSize dynamically and freezes fields', () => {
    const m = new DirectoryMetrics('/a', 'a', 1, 94269, 584, 3, 1);
    expect(m.totalSize).toBe(94853);
    expect(m.fileCount).toBe(3);
    expect(m.childDirCount).toBe(1);
    expect(Object.isFrozen(m)).toBe(true);
  });

  it('rejects invalid metrics metadata', () => {
    expect(() => new DirectoryMetrics('a', 'a', 1, 0, 0, 0, 0)).toThrow();
    expect(() => new DirectoryMetrics('/a', 'a/b', 1, 0, 0, 0, 0)).toThrow();
    expect(() => new DirectoryMetrics('/a', 'a', -1, 0, 0, 0, 0)).toThrow(RangeError);
  });
});

describe('FilesystemTree', () => {
  it('collects directory metrics in post-order DFS and exposes root totalSize', () => {
    const e = new DirectoryNode('e', '/a/e', 2, [new FileEntry('i', 584)], []);
    const a = new DirectoryNode(
      'a',
      '/a',
      1,
      [new FileEntry('f', 29116), new FileEntry('g', 2557), new FileEntry('h.lst', 62596)],
      [e],
    );
    const d = new DirectoryNode(
      'd',
      '/d',
      1,
      [new FileEntry('j', 4060174), new FileEntry('d.log', 8033020), new FileEntry('d.ext', 5626152), new FileEntry('k', 7214296)],
      [],
    );
    const root = new DirectoryNode('/', '/', 0, [new FileEntry('b.txt', 14848514), new FileEntry('c.dat', 8504156)], [a, d]);
    const tree = new FilesystemTree(root);

    expect(Object.isFrozen(tree)).toBe(true);
    expect(tree.totalSize).toBe(48381165);
    const metrics = tree.collectDirectoryMetrics();
    expect(Object.isFrozen(metrics)).toBe(true);
    expect(metrics.map((m) => m.path)).toEqual(['/a/e', '/a', '/d', '/']);
    expect(metrics.map((m) => m.totalSize)).toEqual([584, 94853, 24933642, 48381165]);
  });

  it('rejects a non-root DirectoryNode', () => {
    const nonRoot = new DirectoryNode('a', '/a', 1, [], []);
    expect(() => new FilesystemTree(nonRoot)).toThrow();
    const wrongDepth = new DirectoryNode('/', '/', 1, [], []);
    expect(() => new FilesystemTree(wrongDepth)).toThrow();
  });
});
