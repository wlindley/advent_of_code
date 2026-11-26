import { describe, expect, it } from 'vitest';
import { ALL_QUESTIONS_MASK } from './question';
import { CustomsBatch, CustomsGroup, PersonDeclaration, parseCustomsBatch } from './declaration';

describe('2020 day06 declarations and parsing', () => {
  it('constructs frozen PersonDeclaration with derived properties and mask === 0 support', () => {
    const empty = new PersonDeclaration(0);
    expect(Object.isFrozen(empty)).toBe(true);
    expect(empty.yesCount).toBe(0);
    expect(empty.letters).toBe('');
    expect(empty.answered(0)).toBe(false);

    const person = PersonDeclaration.fromLine('cba');
    expect(person.mask).toBe(0b111);
    expect(person.yesCount).toBe(3);
    expect(person.letters).toBe('abc');
    expect(person.answered(2)).toBe(true);
    expect(person.answered(3)).toBe(false);
    expect(() => new PersonDeclaration(-1)).toThrow(RangeError);
    expect(() => PersonDeclaration.fromLine('')).toThrow(SyntaxError);
    expect(() => person.answered(26)).toThrow(RangeError);
  });

  it('constructs frozen CustomsGroup with defensive copy and consensus masks', () => {
    const source = [PersonDeclaration.fromLine('ab'), PersonDeclaration.fromLine('ac')];
    const group = new CustomsGroup(source);
    source.push(PersonDeclaration.fromLine('z'));

    expect(Object.isFrozen(group)).toBe(true);
    expect(Object.isFrozen(group.people)).toBe(true);
    expect(group.size).toBe(2);
    expect(group.anyYesMask).toBe(0b111);
    expect(group.allYesMask).toBe(0b001);
    expect(group.countResponders(0)).toBe(2);
    expect(group.countResponders(1)).toBe(1);
    expect(group.countResponders(3)).toBe(0);
    expect(() => new CustomsGroup([])).toThrow(RangeError);
    expect(() => group.countResponders(-1)).toThrow(RangeError);
  });

  it('constructs frozen CustomsBatch with groupCount and totalPeople', () => {
    const g1 = new CustomsGroup([PersonDeclaration.fromLine('a')]);
    const g2 = new CustomsGroup([new PersonDeclaration(ALL_QUESTIONS_MASK), PersonDeclaration.fromLine('b')]);
    const source = [g1, g2];
    const batch = new CustomsBatch(source);
    source.pop();

    expect(Object.isFrozen(batch)).toBe(true);
    expect(Object.isFrozen(batch.groups)).toBe(true);
    expect(batch.groupCount).toBe(2);
    expect(batch.totalPeople).toBe(3);
    expect(() => new CustomsBatch([])).toThrow(RangeError);
  });

  it('parses blank-line-separated groups across CRLF, extra blank lines, and trailing newlines', () => {
    const raw = '\n\r\n  abc  \n\n\na\r\nb\nc\n\nab\nac\n\n';
    const batch = parseCustomsBatch(raw);
    expect(batch.groupCount).toBe(3);
    expect(batch.totalPeople).toBe(6);
    expect(batch.groups[0]?.anyYesMask).toBe(0b111);
    expect(batch.groups[1]?.allYesMask).toBe(0);
    expect(batch.groups[2]?.allYesMask).toBe(1);

    const noTrailingNewline = parseCustomsBatch('a\n\nb');
    expect(noTrailingNewline.groupCount).toBe(2);
  });

  it('rejects empty or whitespace-only inputs and invalid characters', () => {
    expect(() => parseCustomsBatch('')).toThrow(RangeError);
    expect(() => parseCustomsBatch('   \n\r\n  ')).toThrow(RangeError);
    expect(() => parseCustomsBatch('ab\nc!')).toThrow(SyntaxError);
  });
});
