import { describe, expect, it } from 'vitest';
import { parsePrintQueue, PrintQueue, PrintUpdate } from './queue';
import { PageOrderRule, PageOrderRules } from './rules';

const OFFICIAL_EXAMPLE = [
  '47|53',
  '97|13',
  '97|61',
  '97|47',
  '75|29',
  '61|13',
  '75|53',
  '29|13',
  '97|29',
  '53|29',
  '61|53',
  '97|53',
  '61|29',
  '47|13',
  '75|47',
  '97|75',
  '47|61',
  '75|61',
  '47|29',
  '75|13',
  '53|13',
  '',
  '75,47,61,53,29',
  '97,61,53,29,13',
  '75,29,13',
  '75,97,47,61,53',
  '61,13,29',
  '97,13,75,29,47',
].join('\n');

describe('PrintUpdate', () => {
  it('freezes a defensive copy and computes middlePage dynamically', () => {
    const raw = [75, 47, 61, 53, 29];
    const single = new PrintUpdate([42]);
    const multi = new PrintUpdate(raw);
    raw[0] = 999;

    expect(single.middlePage).toBe(42);
    expect(multi.pages).toEqual([75, 47, 61, 53, 29]);
    expect(multi.middlePage).toBe(61);
    expect(Object.isFrozen(multi)).toBe(true);
    expect(Object.isFrozen(multi.pages)).toBe(true);
  });

  it('rejects empty, even-length, non-positive, and duplicate page lists', () => {
    expect(() => new PrintUpdate([])).toThrow(RangeError);
    expect(() => new PrintUpdate([75, 47])).toThrow(RangeError);
    expect(() => new PrintUpdate([75, 0, 61])).toThrow(RangeError);
    expect(() => new PrintUpdate([75, 47, 75])).toThrow(RangeError);
  });
});

describe('PrintQueue', () => {
  it('stores rules and defensively frozen non-empty updates', () => {
    const rules = new PageOrderRules([new PageOrderRule(47, 53)]);
    const updates = [new PrintUpdate([47, 53, 61])];
    const queue = new PrintQueue(rules, updates);
    expect(queue.rules).toBe(rules);
    expect(queue.updates).toHaveLength(1);
    expect(Object.isFrozen(queue)).toBe(true);
    expect(Object.isFrozen(queue.updates)).toBe(true);
  });

  it('rejects an empty update list', () => {
    expect(() => new PrintQueue(new PageOrderRules([]), [])).toThrow(RangeError);
  });
});

describe('parsePrintQueue', () => {
  it('parses the official example and normalizes CRLF and outer whitespace', () => {
    const queue = parsePrintQueue(OFFICIAL_EXAMPLE);
    expect(queue.rules.ruleCount).toBe(21);
    expect(queue.updates).toHaveLength(6);
    expect(queue.updates[0]?.middlePage).toBe(61);

    const crlf = parsePrintQueue('  47|53\r\n \t \r\n75,47,53  \r');
    expect(crlf.rules.ruleCount).toBe(1);
    expect(crlf.updates[0]?.pages).toEqual([75, 47, 53]);
  });

  it('rejects empty input and missing or extra section separators', () => {
    expect(() => parsePrintQueue('   \r\n  ')).toThrow('empty');
    expect(() => parsePrintQueue('47|53\n75,47,53')).toThrow('Expected rules and updates');
    expect(() => parsePrintQueue('47|53\n\n75,47,53\n\n1,2,3')).toThrow('Expected rules and updates');
  });

  it('rejects malformed rules and delegates domain rule invariants', () => {
    expect(() => parsePrintQueue('47-53\n\n75,47,53')).toThrow('Invalid rule line');
    expect(() => parsePrintQueue('47|47\n\n75,47,53')).toThrow(RangeError);
    expect(() => parsePrintQueue('0|53\n\n75,47,53')).toThrow(RangeError);
  });

  it('rejects malformed update tokens and delegates PrintUpdate invariants', () => {
    expect(() => parsePrintQueue('47|53\n\n75,,53')).toThrow('Invalid page token');
    expect(() => parsePrintQueue('47|53\n\n75,abc,53')).toThrow('Invalid page token');
    expect(() => parsePrintQueue('47|53\n\n75,47')).toThrow(RangeError);
    expect(() => parsePrintQueue('47|53\n\n75,0,47')).toThrow(RangeError);
    expect(() => parsePrintQueue('47|53\n\n75,47,75')).toThrow(RangeError);
  });
});
