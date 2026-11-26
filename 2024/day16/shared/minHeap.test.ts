import { describe, expect, it } from 'vitest';
import { StateMinHeap } from './minHeap';

describe('StateMinHeap', () => {
  it('validates initial capacity and throws on empty topCost/pop', () => {
    expect(() => new StateMinHeap(0)).toThrow(RangeError);
    expect(() => new StateMinHeap(-4)).toThrow(RangeError);
    expect(() => new StateMinHeap(2.5)).toThrow(RangeError);

    const heap = new StateMinHeap();
    expect(heap.size).toBe(0);
    expect(() => heap.topCost).toThrow(RangeError);
    expect(() => heap.pop()).toThrow(RangeError);
  });

  it('pops states in non-decreasing cost order and grows dynamically', () => {
    const heap = new StateMinHeap(2);
    const entries: Array<[number, number]> = [
      [10, 50],
      [20, 10],
      [30, 30],
      [40, 20],
      [50, 5],
      [60, 40],
      [70, 15],
      [80, 25],
      [90, 35],
    ];
    for (const [state, cost] of entries) {
      heap.push(state, cost);
    }
    expect(heap.size).toBe(entries.length);
    expect(heap.topCost).toBe(5);

    const popped: Array<[number, number]> = [];
    while (heap.size > 0) {
      const cost = heap.topCost;
      const state = heap.pop();
      popped.push([state, cost]);
    }
    expect(popped).toEqual([
      [50, 5],
      [20, 10],
      [70, 15],
      [40, 20],
      [80, 25],
      [30, 30],
      [90, 35],
      [60, 40],
      [10, 50],
    ]);
    expect(heap.size).toBe(0);
  });

  it('handles equal-cost heapify and right-child vs left-child swaps', () => {
    const heap = new StateMinHeap(4);
    heap.push(1, 100);
    heap.push(2, 50);
    heap.push(3, 40);
    heap.push(4, 50);
    heap.push(5, 60);
    const popped: Array<[number, number]> = [];
    while (heap.size > 0) {
      const cost = heap.topCost;
      popped.push([heap.pop(), cost]);
    }
    expect(popped.map(([, c]) => c)).toEqual([40, 50, 50, 60, 100]);
    expect(popped.map(([s]) => s).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5]);
  });
});
