import { describe, expect, it } from 'vitest';
import { computeCaveLayout } from './layout';
import { parseCaveSystem } from './parser';

describe('computeCaveLayout', () => {
  it('pins start at col 0, end rightmost, and positions direct start-end edge', () => {
    const system = parseCaveSystem('start-end');
    const layout = computeCaveLayout(system, 720, 380);

    expect(layout.width).toBe(720);
    expect(layout.height).toBe(380);
    const start = layout.nodes.find((n) => n.name === 'start')!;
    const end = layout.nodes.find((n) => n.name === 'end')!;
    expect(start.col).toBe(0);
    expect(end.col).toBe(1);
    expect(start.y).toBe(190);
    expect(end.y).toBe(190);
    expect(layout.edges).toHaveLength(1);
    expect(Object.isFrozen(layout)).toBe(true);
  });

  it('places BFS intermediates by hop distance, does not expand through end, and puts unreachable caves in overflow column', () => {
    const system = parseCaveSystem('start-a\na-b\nstart-end\nend-z');
    const layout = computeCaveLayout(system, 720, 380);

    const byName = new Map(layout.nodes.map((n) => [n.name, n]));
    expect(byName.get('start')?.col).toBe(0);
    expect(byName.get('a')?.col).toBe(1);
    expect(byName.get('b')?.col).toBe(2);
    expect(byName.get('z')?.col).toBe(3);
    expect(byName.get('end')?.col).toBe(4);
  });

  it('curves both same-column edges and multi-column colinear skip edges', () => {
    const system = parseCaveSystem('start-a\nstart-b\na-b\na-c\nc-end\nstart-end');
    const layout = computeCaveLayout(system, 720, 380);

    const sameCol = layout.edges.find(
      (e) => (e.from === 'a' && e.to === 'b') || (e.from === 'b' && e.to === 'a'),
    )!;
    expect(sameCol.cx).not.toBe((sameCol.x1 + sameCol.x2) / 2);
    expect(sameCol.cy).toBe((sameCol.y1 + sameCol.y2) / 2);

    const skip = layout.edges.find(
      (e) => (e.from === 'end' && e.to === 'start') || (e.from === 'start' && e.to === 'end'),
    )!;
    expect(skip.cx).toBe((skip.x1 + skip.x2) / 2);
    expect(skip.cy).not.toBe((skip.y1 + skip.y2) / 2);
  });

  it('keeps multi-column non-colinear edges straight when vertical positions differ', () => {
    const system = parseCaveSystem('start-a\nstart-b\na-c\nb-d\nd-end\na-end');
    const layout = computeCaveLayout(system, 720, 380);

    const diag = layout.edges.find(
      (e) => (e.from === 'a' && e.to === 'end') || (e.from === 'end' && e.to === 'a'),
    )!;
    expect(diag.y1).not.toBe(diag.y2);
    expect(diag.cx).toBe((diag.x1 + diag.x2) / 2);
    expect(diag.cy).toBe((diag.y1 + diag.y2) / 2);
  });

  it('rejects non-finite or non-positive viewport dimensions', () => {
    const system = parseCaveSystem('start-end');
    expect(() => computeCaveLayout(system, 0, 380)).toThrow(RangeError);
    expect(() => computeCaveLayout(system, -1, 380)).toThrow(RangeError);
    expect(() => computeCaveLayout(system, Number.NaN, 380)).toThrow(RangeError);
    expect(() => computeCaveLayout(system, 720, 0)).toThrow(RangeError);
    expect(() => computeCaveLayout(system, 720, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
