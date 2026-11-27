import { describe, expect, it } from 'vitest';
import { DeckRingBuffer, encodeStateKey } from './deck';

describe('DeckRingBuffer', () => {
  it('supports wrap-around draw and push without losing order', () => {
    const deck = new DeckRingBuffer(4, [9, 2, 6]);
    expect(deck.size).toBe(3);
    expect(deck.isEmpty).toBe(false);
    expect(deck.maxCard()).toBe(9);

    expect(deck.draw()).toBe(9);
    expect(deck.draw()).toBe(2);
    deck.push(11);
    deck.push(4);
    deck.push(7);
    expect(deck.size).toBe(4);
    expect(deck.maxCard()).toBe(11);

    const snapshot = deck.toArray();
    expect(snapshot).toEqual([6, 11, 4, 7]);
    expect(Object.isFrozen(snapshot)).toBe(true);

    expect(deck.draw()).toBe(6);
    expect(deck.draw()).toBe(11);
    expect(deck.draw()).toBe(4);
    expect(deck.draw()).toBe(7);
    expect(deck.isEmpty).toBe(true);
    expect(deck.maxCard()).toBe(0);
  });

  it('copies wrapped prefixes into new buffers and rejects invalid arguments', () => {
    const deck = new DeckRingBuffer(4, [1, 2, 3, 4]);
    expect(deck.draw()).toBe(1);
    expect(deck.draw()).toBe(2);
    deck.push(5);
    deck.push(6);

    const prefix = deck.copyPrefix(3, 5);
    expect(prefix.toArray()).toEqual([3, 4, 5]);
    expect(prefix.size).toBe(3);

    const zeroPrefix = deck.copyPrefix(0, 2);
    expect(zeroPrefix.toArray()).toEqual([]);

    expect(() => new DeckRingBuffer(0, [])).toThrow(RangeError);
    expect(() => new DeckRingBuffer(2, [1, 2, 3])).toThrow(RangeError);
    expect(() => new DeckRingBuffer(2.5, [1])).toThrow(RangeError);
    expect(() => deck.push(99)).toThrow(RangeError);
    expect(() => zeroPrefix.draw()).toThrow(RangeError);
    expect(() => deck.copyPrefix(-1, 4)).toThrow(RangeError);
    expect(() => deck.copyPrefix(5, 6)).toThrow(RangeError);
    expect(() => deck.copyPrefix(1.5, 4)).toThrow(RangeError);
    expect(() => deck.copyPrefix(3, 2)).toThrow(RangeError);
    expect(() => deck.copyPrefix(0, 0)).toThrow(RangeError);
    expect(() => deck.copyPrefix(2, 2.5)).toThrow(RangeError);
  });
});

describe('encodeStateKey', () => {
  it('encodes compact char keys and delimiter-safe fallback keys', () => {
    const d1 = new DeckRingBuffer(4, [9, 2]);
    const d2 = new DeckRingBuffer(4, [5, 10]);
    d1.draw();
    d1.push(6);

    const compact = encodeStateKey(d1, d2, true);
    expect(compact).toBe(`${String.fromCharCode(2, 6)}\0${String.fromCharCode(5, 10)}`);

    const large1 = new DeckRingBuffer(3, [70000, 1]);
    const large2 = new DeckRingBuffer(3, [2]);
    expect(encodeStateKey(large1, large2, false)).toBe('70000,1|2');
  });
});
