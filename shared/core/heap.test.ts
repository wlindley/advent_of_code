import { describe, expect, it } from 'vitest';
import { MinHeap } from './heap';

function compareNumbers(a: number, b: number): number {
  return a - b;
}

function compareDescending(a: number, b: number): number {
  return b - a;
}

interface ScoredNode {
  readonly id: string;
  readonly cost: number;
}

function compareScoredNodes(a: ScoredNode, b: ScoredNode): number {
  if (a.cost !== b.cost) return a.cost - b.cost;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

describe('MinHeap', () => {
  it('handles empty state and single-element push/peek/pop', () => {
    const heap = new MinHeap<number>(compareNumbers);
    expect(heap.size).toBe(0);
    expect(heap.isEmpty).toBe(true);
    expect(heap.peek()).toBeUndefined();
    expect(heap.pop()).toBeUndefined();

    heap.push(42);
    expect(heap.size).toBe(1);
    expect(heap.isEmpty).toBe(false);
    expect(heap.peek()).toBe(42);
    expect(heap.pop()).toBe(42);
    expect(heap.size).toBe(0);
    expect(heap.isEmpty).toBe(true);
    expect(heap.peek()).toBeUndefined();
  });

  it('pops numbers in ascending order across duplicates, negatives, and left/right sifts', () => {
    const values = [9, 1, 7, 3, -5, 3, 0, 8, 2, 6, 4, -5];
    const heap = new MinHeap<number>(compareNumbers);
    for (const value of values) {
      heap.push(value);
    }
    expect(heap.size).toBe(values.length);
    expect(heap.peek()).toBe(-5);

    const drained: number[] = [];
    while (!heap.isEmpty) {
      drained.push(heap.pop()!);
    }
    expect(drained).toEqual([-5, -5, 0, 1, 2, 3, 3, 4, 6, 7, 8, 9]);
    expect(heap.pop()).toBeUndefined();
  });

  it('supports custom object priority comparators and max-heap ordering', () => {
    const pq = new MinHeap<ScoredNode>(compareScoredNodes);
    pq.push({ id: 'b', cost: 10 });
    pq.push({ id: 'a', cost: 10 });
    pq.push({ id: 'c', cost: 4 });
    pq.push({ id: 'd', cost: 7 });

    expect(pq.pop()).toEqual({ id: 'c', cost: 4 });
    expect(pq.pop()).toEqual({ id: 'd', cost: 7 });
    expect(pq.pop()).toEqual({ id: 'a', cost: 10 });
    expect(pq.pop()).toEqual({ id: 'b', cost: 10 });

    const maxHeap = new MinHeap<number>(compareDescending);
    for (const v of [2, 10, 5, 10, 1]) maxHeap.push(v);
    expect([maxHeap.pop(), maxHeap.pop(), maxHeap.pop(), maxHeap.pop(), maxHeap.pop()]).toEqual([10, 10, 5, 2, 1]);
  });

  it('matches sorted oracle across interleaved pushes and pops', () => {
    const heap = new MinHeap<number>(compareNumbers);
    const oracle: number[] = [];
    let seed = 1337;
    for (let step = 0; step < 120; step += 1) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      const value = (seed % 41) - 20;
      heap.push(value);
      oracle.push(value);
      oracle.sort(compareNumbers);
      expect(heap.peek()).toBe(oracle[0]);
      if (step % 3 === 2) {
        expect(heap.pop()).toBe(oracle.shift());
      }
      expect(heap.size).toBe(oracle.length);
    }
    while (oracle.length > 0) {
      expect(heap.pop()).toBe(oracle.shift());
    }
    expect(heap.isEmpty).toBe(true);
  });
});
