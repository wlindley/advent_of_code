import { describe, expect, it } from 'vitest';
import {
  SubmarineCourse,
  isCommandDirection,
  parseSubmarineCourse,
  type SubmarineCommand,
} from './course';
import { SubmarinePose } from './pose';

describe('SubmarinePose', () => {
  it('freezes ORIGIN and computes dynamic product without storing it', () => {
    expect(Object.isFrozen(SubmarinePose.ORIGIN)).toBe(true);
    expect(SubmarinePose.ORIGIN.horizontal).toBe(0n);
    expect(SubmarinePose.ORIGIN.depth).toBe(0n);
    expect(SubmarinePose.ORIGIN.aim).toBe(0n);
    expect(SubmarinePose.ORIGIN.product).toBe(0n);

    const moved = SubmarinePose.ORIGIN.withDelta(15n, 10n, 3n);
    expect(Object.isFrozen(moved)).toBe(true);
    expect(moved.horizontal).toBe(15n);
    expect(moved.depth).toBe(10n);
    expect(moved.aim).toBe(3n);
    expect(moved.product).toBe(150n);
    expect(SubmarinePose.ORIGIN.horizontal).toBe(0n);
  });

  it('handles negative and >2^63 BigInt coordinates in product and withDelta', () => {
    const huge = 1n << 70n;
    const pose = new SubmarinePose(huge, -3n, 7n);
    expect(pose.product).toBe(-3n * huge);
    const next = pose.withDelta(1n, 3n, -7n);
    expect(next.horizontal).toBe(huge + 1n);
    expect(next.depth).toBe(0n);
    expect(next.aim).toBe(0n);
    expect(next.product).toBe(0n);
  });
});

describe('isCommandDirection', () => {
  it('accepts valid directions and rejects unknown or prototype-key tokens', () => {
    expect(isCommandDirection('forward')).toBe(true);
    expect(isCommandDirection('down')).toBe(true);
    expect(isCommandDirection('up')).toBe(true);
    for (const bad of ['left', 'FORWARD', 'toString', 'constructor', '__proto__', '']) {
      expect(isCommandDirection(bad)).toBe(false);
    }
  });
});

describe('SubmarineCourse', () => {
  it('freezes course and defensive-copied commands and exposes dynamic count', () => {
    const cmd: SubmarineCommand = { direction: 'forward', units: 5n };
    const source = [cmd];
    const course = new SubmarineCourse(source);
    source.push({ direction: 'down', units: 2n });

    expect(Object.isFrozen(course)).toBe(true);
    expect(Object.isFrozen(course.commands)).toBe(true);
    expect(Object.isFrozen(course.commandAt(0))).toBe(true);
    expect(course.count).toBe(1);
    expect(course.commandAt(0)).toEqual({ direction: 'forward', units: 5n });
    expect(course.commandAt(0)).not.toBe(cmd);
  });

  it('rejects empty courses, negative units, and out-of-bounds commandAt indices', () => {
    expect(() => new SubmarineCourse([])).toThrow(RangeError);
    expect(() => new SubmarineCourse([{ direction: 'up', units: -1n }])).toThrow(RangeError);

    const course = new SubmarineCourse([{ direction: 'down', units: 0n }]);
    expect(course.commandAt(0).units).toBe(0n);
    for (const bad of [-1, 1, 0.5, Number.NaN]) {
      expect(() => course.commandAt(bad)).toThrow(RangeError);
    }
  });
});

describe('parseSubmarineCourse', () => {
  it('parses CRLF/LF inputs, trims whitespace, ignores blanks, and supports >2^63 units', () => {
    const huge = '18446744073709551617';
    const raw = `\n  forward   5 \r\n\r\n down 0\n up  ${huge}\r\n`;
    const course = parseSubmarineCourse(raw);
    expect(course.count).toBe(3);
    expect(course.commandAt(0)).toEqual({ direction: 'forward', units: 5n });
    expect(course.commandAt(1)).toEqual({ direction: 'down', units: 0n });
    expect(course.commandAt(2)).toEqual({ direction: 'up', units: BigInt(huge) });
  });

  it('rejects empty input, bad token count, prototype keys, unknown directions, and invalid units', () => {
    expect(() => parseSubmarineCourse('  \r\n\n ')).toThrow(RangeError);
    for (const bad of ['forward', 'forward 5 extra', 'forward\t5\t6']) {
      expect(() => parseSubmarineCourse(bad)).toThrow(SyntaxError);
    }
    for (const badDir of ['toString 5', 'constructor 5', 'left 3', 'FORWARD 2']) {
      expect(() => parseSubmarineCourse(badDir)).toThrow(SyntaxError);
    }
    for (const badUnits of ['forward -5', 'down +2', 'up 1.5', 'forward abc']) {
      expect(() => parseSubmarineCourse(badUnits)).toThrow(SyntaxError);
    }
  });
});
