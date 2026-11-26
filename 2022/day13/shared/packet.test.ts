import { describe, expect, it } from 'vitest';
import { PacketInt, PacketList, PacketPair, SignalInput } from './packet';

describe('packet value objects', () => {
  it('constructs frozen non-negative integer packets and rejects invalid integers', () => {
    const zero = new PacketInt(0);
    const fortyTwo = new PacketInt(42);
    expect(zero.kind).toBe('int');
    expect(zero.value).toBe(0);
    expect(zero.format()).toBe('0');
    expect(fortyTwo.format()).toBe('42');
    expect(Object.isFrozen(zero)).toBe(true);

    expect(() => new PacketInt(-1)).toThrow(RangeError);
    expect(() => new PacketInt(1.5)).toThrow(RangeError);
    expect(() => new PacketInt(Number.NaN)).toThrow(RangeError);
    expect(() => new PacketInt(Number.MAX_SAFE_INTEGER + 1)).toThrow(RangeError);
  });

  it('constructs frozen list packets with defensive copy and dynamic getters', () => {
    const source = [new PacketInt(1), new PacketList([new PacketInt(2), new PacketInt(3)])];
    const list = new PacketList(source);
    source.push(new PacketInt(99));

    expect(list.kind).toBe('list');
    expect(list.length).toBe(2);
    expect(list.isEmpty).toBe(false);
    expect(list.format()).toBe('[1,[2,3]]');
    expect(Object.isFrozen(list)).toBe(true);
    expect(Object.isFrozen(list.items)).toBe(true);

    const empty = new PacketList([]);
    expect(empty.length).toBe(0);
    expect(empty.isEmpty).toBe(true);
    expect(empty.format()).toBe('[]');
  });

  it('constructs frozen PacketPair and SignalInput with derived packets getter', () => {
    const p1 = new PacketPair(new PacketList([new PacketInt(1)]), new PacketList([new PacketInt(2)]));
    const p2 = new PacketPair(new PacketList([]), new PacketList([new PacketInt(3)]));
    expect(Object.isFrozen(p1)).toBe(true);

    const pairs = [p1, p2];
    const signal = new SignalInput(pairs);
    pairs.push(p1);

    expect(signal.pairCount).toBe(2);
    expect(signal.packets.map((pkt) => pkt.format())).toEqual(['[1]', '[2]', '[]', '[3]']);
    expect(Object.isFrozen(signal)).toBe(true);
    expect(Object.isFrozen(signal.pairs)).toBe(true);
    expect(Object.isFrozen(signal.packets)).toBe(true);

    expect(() => new SignalInput([])).toThrow(Error);
  });
});
