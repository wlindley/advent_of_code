import { describe, expect, it } from 'vitest';
import {
  Almanac,
  parseAlmanac,
  parseMapSection,
  parseRuleLine,
  parseSeedsLine,
  RangeMap,
  RangeRule,
} from './index';

const OFFICIAL_EXAMPLE = [
  'seeds: 79 14 55 13',
  '',
  'seed-to-soil map:',
  '50 98 2',
  '52 50 48',
  '',
  'soil-to-fertilizer map:',
  '0 15 37',
  '37 52 2',
  '39 0 15',
  '',
  'fertilizer-to-water map:',
  '49 53 8',
  '0 11 42',
  '42 0 7',
  '57 7 4',
  '',
  'water-to-light map:',
  '88 18 7',
  '18 25 70',
  '',
  'light-to-temperature map:',
  '45 77 23',
  '81 45 19',
  '68 64 13',
  '',
  'temperature-to-humidity map:',
  '0 69 1',
  '1 0 69',
  '',
  'humidity-to-location map:',
  '60 56 37',
  '56 93 4',
].join('\n');

describe('Almanac', () => {
  it('stores frozen seeds and maps and computes categories dynamically', () => {
    const m1 = new RangeMap('seed', 'soil', [RangeRule.fromTriple(50n, 98n, 2n)]);
    const m2 = new RangeMap('soil', 'location', [RangeRule.fromTriple(0n, 50n, 2n)]);
    const almanac = new Almanac([79n, 14n], [m1, m2]);

    expect(Object.isFrozen(almanac)).toBe(true);
    expect(Object.isFrozen(almanac.seeds)).toBe(true);
    expect(Object.isFrozen(almanac.maps)).toBe(true);
    expect(almanac.categories).toEqual(['seed', 'soil', 'location']);
  });

  it('rejects empty seeds, negative seeds, empty maps, and discontinuous chains', () => {
    const m1 = new RangeMap('seed', 'soil', [RangeRule.fromTriple(50n, 98n, 2n)]);
    const mBad = new RangeMap('water', 'light', [RangeRule.fromTriple(1n, 2n, 3n)]);

    expect(() => new Almanac([], [m1])).toThrow(RangeError);
    expect(() => new Almanac([-1n], [m1])).toThrow(RangeError);
    expect(() => new Almanac([1n], [])).toThrow(RangeError);
    expect(() => new Almanac([1n], [m1, mBad])).toThrow(RangeError);
  });
});

describe('parseSeedsLine / parseRuleLine / parseMapSection', () => {
  it('parses seeds including 0n and > 2^32 and rejects malformed seed lines', () => {
    expect(parseSeedsLine('seeds: 0 5000000000')).toEqual([0n, 5_000_000_000n]);
    expect(() => parseSeedsLine('seed: 1 2')).toThrow(SyntaxError);
    expect(() => parseSeedsLine('seeds:   ')).toThrow(SyntaxError);
    expect(() => parseSeedsLine('seeds: 1 -2')).toThrow(SyntaxError);
    expect(() => parseSeedsLine('seeds: 1 abc')).toThrow(SyntaxError);
  });

  it('parses rule triples and rejects bad syntax or zero length', () => {
    const rule = parseRuleLine('50 98 2');
    expect(rule.destStart).toBe(50n);
    expect(rule.source.start).toBe(98n);
    expect(rule.source.end).toBe(99n);

    expect(() => parseRuleLine('50 98')).toThrow(SyntaxError);
    expect(() => parseRuleLine('50 98 2 1')).toThrow(SyntaxError);
    expect(() => parseRuleLine('50 9x 2')).toThrow(SyntaxError);
    expect(() => parseRuleLine('50 98 0')).toThrow(RangeError);
  });

  it('parses map sections and rejects empty, bad-header, ruleless, or overlapping sections', () => {
    const section = parseMapSection(['seed-to-soil map:', '50 98 2']);
    expect(section.sourceCategory).toBe('seed');
    expect(section.destCategory).toBe('soil');
    expect(section.rules).toHaveLength(1);

    expect(() => parseMapSection([])).toThrow(SyntaxError);
    expect(() => parseMapSection(['seed to soil map:', '50 98 2'])).toThrow(SyntaxError);
    expect(() => parseMapSection(['seed-to-soil map:'])).toThrow(SyntaxError);
    expect(() => parseMapSection(['seed-to-soil map:', '10 5 4', '20 7 2'])).toThrow(RangeError);
  });
});

describe('parseAlmanac', () => {
  it('parses the official example across LF and CRLF with whitespace-only blank lines', () => {
    const lf = parseAlmanac(OFFICIAL_EXAMPLE);
    expect(lf.seeds).toEqual([79n, 14n, 55n, 13n]);
    expect(lf.maps).toHaveLength(7);
    expect(lf.categories).toEqual([
      'seed',
      'soil',
      'fertilizer',
      'water',
      'light',
      'temperature',
      'humidity',
      'location',
    ]);

    const crlfRaw = `  \r\n${OFFICIAL_EXAMPLE.replace(/\n\n/g, '\r\n   \r\n').replace(/\n/g, '\r\n')}\r\n  `;
    const crlf = parseAlmanac(crlfRaw);
    expect(crlf.seeds).toEqual(lf.seeds);
    expect(crlf.categories).toEqual(lf.categories);
  });

  it('rejects empty inputs, missing maps, and broken category chains', () => {
    expect(() => parseAlmanac('')).toThrow(SyntaxError);
    expect(() => parseAlmanac('   \n  \r\n ')).toThrow(SyntaxError);
    expect(() => parseAlmanac('seeds: 1 2')).toThrow(SyntaxError);
    expect(() => parseAlmanac('seeds: 1\n2\n\nseed-to-soil map:\n1 2 3')).toThrow(SyntaxError);
    expect(() =>
      parseAlmanac('seeds: 1\n\nseed-to-soil map:\n1 2 3\n\nwater-to-light map:\n1 2 3'),
    ).toThrow(RangeError);
  });
});
