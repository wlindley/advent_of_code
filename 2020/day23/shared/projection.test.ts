import { describe, expect, it } from 'vitest';
import { parseCupLabels } from './model';
import { projectCrabCups, SVG_HEIGHT, SVG_WIDTH } from './projection';
import { CupRing } from './ring';
import { captureTraceFrame } from './trace';

describe('2020 Day 23 projection', () => {
  it('projects full-ring frames with cup 1 anchored at 12 o clock and splice arc after move', () => {
    expect(SVG_WIDTH).toBe(760);
    expect(SVG_HEIGHT).toBe(340);

    const ring = new CupRing(parseCupLabels('389125467'), 9);
    const f0 = captureTraceFrame(ring, 0, 100, null);
    const p0 = projectCrabCups(f0);
    expect(p0.mode).toBe('ring');
    if (p0.mode !== 'ring') throw new Error('Expected ring mode');
    expect(p0.nodes.length).toBe(9);
    expect(p0.nodes[0]!.cup).toBe(1);
    expect(p0.nodes[0]!.isAnchorOne).toBe(true);
    expect(p0.nodes[0]!.x).toBe(210);
    expect(p0.nodes[0]!.y).toBe(54);
    expect(p0.spliceArc).toBeNull();

    const rec1 = ring.advance(1);
    const f1 = captureTraceFrame(ring, 1, 100, rec1);
    const p1 = projectCrabCups(f1);
    if (p1.mode !== 'ring') throw new Error('Expected ring mode');
    expect(p1.spliceArc).not.toBeNull();
    expect(p1.spliceArc!.sourceCup).toBe(3);
    expect(p1.spliceArc!.destination).toBe(2);
    expect(p1.spliceArc!.path).toMatch(/^M \d/);
    expect(p1.nodes.filter((n) => n.role === 'current').length).toBe(1);
    expect(p1.nodes.filter((n) => n.role === 'picked').length).toBe(3);

    const rec2 = ring.advance(1);
    const f2 = captureTraceFrame(ring, 2, 100, rec2);
    const p2 = projectCrabCups(f2);
    if (p2.mode !== 'ring') throw new Error('Expected ring mode');
    expect(p2.nodes.filter((n) => n.role === 'current').length).toBe(1);
    expect(p2.nodes.filter((n) => n.role === 'destination').length).toBe(1);
    expect(p2.nodes.filter((n) => n.role === 'picked').length).toBe(3);
    expect(p2.nodes.filter((n) => n.role === 'normal').length).toBe(4);
  });

  it('projects >20 cup rings in ribbon mode with star cups at indices 1 and 2', () => {
    const ring = new CupRing(parseCupLabels('389125467'), 25);
    const rec = ring.advance(1);
    const frame = captureTraceFrame(ring, 1, 10, rec);
    const proj = projectCrabCups(frame);
    expect(proj.mode).toBe('ribbon');
    if (proj.mode !== 'ribbon') throw new Error('Expected ribbon mode');
    expect(proj.anchorRibbon[0]!.isAnchorOne).toBe(true);
    expect(proj.anchorRibbon[1]!.isStarCup).toBe(true);
    expect(proj.anchorRibbon[2]!.isStarCup).toBe(true);
    expect(proj.anchorRibbon[3]!.isStarCup).toBe(false);
    expect(proj.currentRibbon[0]!.role).toBe('current');
    expect(proj.productAfterOne).toBe(frame.productAfterOne);
  });
});
