import { describe, expect, it } from 'vitest';
import { computeCircuitLayout } from './layout';
import { parseCircuitBlueprint } from './parser';

describe('day20 computeCircuitLayout', () => {
  it('assigns BFS layers from broadcaster and centers columns horizontally left-to-right', () => {
    const bp = parseCircuitBlueprint([
      'broadcaster -> a, b',
      '%a -> inv',
      '%b -> inv',
      '&inv -> rx',
    ].join('\n'));

    const layout = computeCircuitLayout(bp);
    expect(layout.nodeByName.get('broadcaster')?.layer).toBe(0);
    expect(layout.nodeByName.get('a')?.layer).toBe(1);
    expect(layout.nodeByName.get('b')?.layer).toBe(1);
    expect(layout.nodeByName.get('inv')?.layer).toBe(2);
    expect(layout.nodeByName.get('rx')?.layer).toBe(3);

    const bNode = layout.nodeByName.get('broadcaster')!;
    const aNode = layout.nodeByName.get('a')!;
    const bBranch = layout.nodeByName.get('b')!;
    const invNode = layout.nodeByName.get('inv')!;

    expect(bNode.x).toBeLessThan(aNode.x);
    expect(aNode.x).toBe(bBranch.x);
    expect(aNode.x).toBeLessThan(invNode.x);
    expect(bNode.y).toBe(invNode.y);
    expect(bNode.y).toBe((aNode.y + bBranch.y) / 2);
  });

  it('places disconnected modules at maxBfsLayer + 1 and flags back-edges and self-loops', () => {
    const bp = parseCircuitBlueprint([
      'broadcaster -> a',
      '%a -> b',
      '&b -> a, b',
      '%island -> deadend',
    ].join('\n'));

    const layout = computeCircuitLayout(bp);
    expect(layout.nodeByName.get('broadcaster')?.layer).toBe(0);
    expect(layout.nodeByName.get('a')?.layer).toBe(1);
    expect(layout.nodeByName.get('b')?.layer).toBe(2);
    expect(layout.nodeByName.get('island')?.layer).toBe(3);
    expect(layout.nodeByName.get('deadend')?.layer).toBe(3);

    const backEdge = layout.edges.find((e) => e.from === 'b' && e.to === 'a');
    const selfLoop = layout.edges.find((e) => e.from === 'b' && e.to === 'b');
    const forwardEdge = layout.edges.find((e) => e.from === 'a' && e.to === 'b');

    expect(backEdge).toEqual({ from: 'b', to: 'a', isBackEdge: true, isSelfLoop: false });
    expect(selfLoop).toEqual({ from: 'b', to: 'b', isBackEdge: false, isSelfLoop: true });
    expect(forwardEdge).toEqual({ from: 'a', to: 'b', isBackEdge: false, isSelfLoop: false });
  });
});
