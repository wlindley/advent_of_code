import { describe, expect, it } from 'vitest';
import { type MonkeyJob, MonkeyRiddle } from './riddle';

const lit = (name: string, value: bigint): MonkeyJob => ({ kind: 'literal', name, value });
const op = (name: string, left: string, operator: '+' | '-' | '*' | '/', right: string): MonkeyJob => ({
  kind: 'op',
  name,
  left,
  op: operator,
  right,
});

describe('MonkeyRiddle', () => {
  it('stores frozen jobs and exposes dynamic counts and topological orders', () => {
    const riddle = new MonkeyRiddle([
      op('root', 'aa', '+', 'bb'),
      lit('aa', 5n),
      lit('bb', 7n),
      lit('dead', 99n),
    ]);

    expect(riddle.monkeyCount).toBe(4);
    expect(riddle.literalCount).toBe(3);
    expect(riddle.operationCount).toBe(1);
    expect(riddle.names).toEqual(['root', 'aa', 'bb', 'dead']);
    expect(riddle.has('root')).toBe(true);
    expect(riddle.has('missing')).toBe(false);
    expect(riddle.get('aa')).toEqual(lit('aa', 5n));
    expect(Object.isFrozen(riddle.require('root'))).toBe(true);
    expect(() => riddle.require('missing')).toThrow(Error);

    const topDown = riddle.topDownOrder;
    expect(topDown.indexOf('root')).toBeLessThan(topDown.indexOf('aa'));
    expect(topDown.indexOf('root')).toBeLessThan(topDown.indexOf('bb'));

    const reachable = riddle.reachableBottomUp('root');
    expect(reachable).not.toContain('dead');
    expect(reachable[reachable.length - 1]).toBe('root');
    expect(reachable.indexOf('aa')).toBeLessThan(reachable.indexOf('root'));
    expect(reachable.indexOf('bb')).toBeLessThan(reachable.indexOf('root'));
  });

  it('handles shared DAG subexpressions in reachableBottomUp', () => {
    const riddle = new MonkeyRiddle([
      op('root', 'x', '+', 'y'),
      op('x', 'z', '*', 'z'),
      op('y', 'z', '+', 'z'),
      lit('z', 3n),
    ]);

    const reachable = riddle.reachableBottomUp('root');
    expect(reachable).toHaveLength(4);
    expect(reachable[0]).toBe('z');
    expect(reachable[3]).toBe('root');
  });

  it('rejects empty riddles, duplicate names, missing operands, and cycles', () => {
    expect(() => new MonkeyRiddle([])).toThrow(RangeError);
    expect(() => new MonkeyRiddle([lit('a', 1n), lit('a', 2n)])).toThrow(Error);
    expect(() => new MonkeyRiddle([op('root', 'missingLeft', '+', 'b'), lit('b', 1n)])).toThrow(Error);
    expect(() => new MonkeyRiddle([op('root', 'a', '+', 'missingRight'), lit('a', 1n)])).toThrow(Error);
    expect(() => new MonkeyRiddle([op('a', 'b', '+', 'c'), op('b', 'a', '+', 'c'), lit('c', 1n)])).toThrow(Error);
  });
});
