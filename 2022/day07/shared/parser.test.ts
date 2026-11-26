import { describe, expect, it } from 'vitest';
import { isValidEntryName, parseTerminalLog } from './parser';

describe('isValidEntryName', () => {
  it('accepts normal file and directory names', () => {
    expect(isValidEntryName('a')).toBe(true);
    expect(isValidEntryName('b.txt')).toBe(true);
    expect(isValidEntryName('empty_0-dat')).toBe(true);
  });

  it('rejects empty, dot, slash, and whitespace names', () => {
    for (const bad of ['', '.', '..', '/', 'a/b', 'a b', 'a\tb']) {
      expect(isValidEntryName(bad)).toBe(false);
    }
  });
});

describe('parseTerminalLog', () => {
  it('parses all six terminal line kinds with CRLF and blank lines', () => {
    const raw = [
      '$ cd /',
      '',
      '$ ls',
      'dir a',
      '14848514 b.txt',
      '0 empty.dat',
      '$ cd a',
      '$ cd ..',
      '',
    ].join('\r\n');

    const lines = parseTerminalLog(raw);
    expect(lines).toEqual([
      { kind: 'cd-root' },
      { kind: 'ls' },
      { kind: 'dir-entry', name: 'a' },
      { kind: 'file-entry', name: 'b.txt', size: 14848514 },
      { kind: 'file-entry', name: 'empty.dat', size: 0 },
      { kind: 'cd-child', name: 'a' },
      { kind: 'cd-up' },
    ]);
    expect(Object.isFrozen(lines)).toBe(true);
    for (const line of lines) expect(Object.isFrozen(line)).toBe(true);
  });

  it.each([
    ['empty input', ''],
    ['whitespace-only input', '  \r\n  \n '],
    ['unknown command', '$ pwd'],
    ['ls with arguments', '$ ls /a'],
    ['cd without target', '$ cd'],
    ['cd with dot target', '$ cd .'],
    ['cd with nested path', '$ cd a/b'],
    ['cd with space in target', '$ cd a b'],
    ['listing without space separator', 'orphan'],
    ['dir with invalid name', 'dir ..'],
    ['dir with slash in name', 'dir a/b'],
    ['file with non-numeric size', '12x file.txt'],
    ['file with unsafe integer size', '9007199254740992 huge.bin'],
    ['file with invalid name', '42 a/b'],
    ['file with space in name', '42 bad name'],
  ])('rejects %s', (_label, input) => {
    expect(() => parseTerminalLog(input)).toThrow();
  });
});
