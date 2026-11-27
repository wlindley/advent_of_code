import { describe, expect, it } from 'vitest';
import {
  LastSeenTable,
  playMemoryGame,
  RecentTurnBuffer,
  type RecentTurnEntry,
} from './engine';
import { StartingSequence } from './model';

function makeEntry(turn: number, spoken: number): RecentTurnEntry {
  return {
    turn,
    spoken,
    origin: turn === 1 ? 'seed' : 'novel',
    considered: turn === 1 ? null : spoken,
    previousTurn: null,
  };
}

describe('LastSeenTable', () => {
  it('validates denseLimit and exchanges both dense and overflow keys', () => {
    expect(() => new LastSeenTable(-1)).toThrow(RangeError);
    expect(() => new LastSeenTable(1.5)).toThrow(RangeError);

    const table = new LastSeenTable(8);
    expect(table.exchange(3, 1)).toBe(0);
    expect(table.exchange(3, 4)).toBe(1);
    expect(table.exchange(3, 9)).toBe(4);

    expect(table.exchange(100, 2)).toBe(0);
    expect(table.exchange(100, 7)).toBe(2);
    expect(table.exchange(100, 12)).toBe(7);
  });

  it('supports zero denseLimit using overflow map exclusively', () => {
    const table = new LastSeenTable(0);
    expect(table.exchange(0, 1)).toBe(0);
    expect(table.exchange(0, 5)).toBe(1);
  });
});

describe('RecentTurnBuffer', () => {
  it('validates capacity and maintains frozen chronological snapshots across wrap-around', () => {
    expect(() => new RecentTurnBuffer(0)).toThrow(RangeError);
    expect(() => new RecentTurnBuffer(2.5)).toThrow(RangeError);

    const buffer = new RecentTurnBuffer(3);
    expect(buffer.snapshot()).toEqual([]);
    expect(Object.isFrozen(buffer.snapshot())).toBe(true);

    buffer.push(makeEntry(1, 10));
    buffer.push(makeEntry(2, 20));
    expect(buffer.snapshot().map((e) => e.turn)).toEqual([1, 2]);

    buffer.push(makeEntry(3, 30));
    buffer.push(makeEntry(4, 40));
    buffer.push(makeEntry(5, 50));

    const snap = buffer.snapshot();
    expect(snap.map((e) => [e.turn, e.spoken])).toEqual([
      [3, 30],
      [4, 40],
      [5, 50],
    ]);
    expect(Object.isFrozen(snap)).toBe(true);
    expect(Object.isFrozen(snap[0])).toBe(true);
  });
});

describe('playMemoryGame', () => {
  it('handles targetTurn within seed length and single-seed sequences', () => {
    const seq = new StartingSequence([0, 3, 6]);
    expect(playMemoryGame(seq, 1)).toBe(0);
    expect(playMemoryGame(seq, 2)).toBe(3);
    expect(playMemoryGame(seq, 3)).toBe(6);

    const single = new StartingSequence([0]);
    expect(playMemoryGame(single, 1)).toBe(0);
    expect(playMemoryGame(single, 2)).toBe(0);
    expect(playMemoryGame(single, 3)).toBe(1);
    expect(playMemoryGame(single, 4)).toBe(0);
    expect(playMemoryGame(single, 5)).toBe(2);
    expect(playMemoryGame(single, 6)).toBe(0);
    expect(playMemoryGame(single, 7)).toBe(2);
  });

  it('handles duplicate seeds, overflow seeds, and official example turns', () => {
    const dup = new StartingSequence([3, 3]);
    expect(playMemoryGame(dup, 3)).toBe(1);
    expect(playMemoryGame(dup, 4)).toBe(0);

    const overflow = new StartingSequence([100, 100]);
    expect(playMemoryGame(overflow, 3)).toBe(1);
    expect(playMemoryGame(overflow, 4)).toBe(0);

    const example = new StartingSequence([0, 3, 6]);
    const firstTen = Array.from({ length: 10 }, (_, idx) => playMemoryGame(example, idx + 1));
    expect(firstTen).toEqual([0, 3, 6, 0, 3, 3, 1, 0, 4, 0]);
    expect(playMemoryGame(example, 2020)).toBe(436);

    expect(() => playMemoryGame(example, 0)).toThrow(RangeError);
  });
});
