import { describe, expect, it } from 'vitest';
import { SquarePlacement } from './beamSquare';
import {
  CLOSEST_SQUARE_POLICY,
  EXAMPLE_BEAM_PROGRAM,
  TractorBeamSolver,
  type ScanTraceFrame,
} from './beamSolver';
import { VIEWBOX_SIZE, buildTractorBeamSvgLayout } from './vizLayout';

describe('vizLayout', () => {
  it('projects scan trace frames into bounded SVG span bars and scanline', () => {
    const frame: ScanTraceFrame = {
      kind: 'scan',
      stepIndex: 3,
      totalSteps: 50,
      gridSize: 50,
      activeY: 2,
      spans: [{ y: 0, left: 0, right: 0 }, null, { y: 2, left: 2, right: 3 }],
      affectedCount: 3,
      probeCount: 9,
    };

    const layout = buildTractorBeamSvgLayout(frame);
    expect(layout.kind).toBe('scan');
    expect(layout.viewBox).toBe(`0 0 ${VIEWBOX_SIZE} ${VIEWBOX_SIZE}`);
    if (layout.kind === 'scan') {
      expect(layout.bars).toHaveLength(2);
      expect(layout.bars[0]!.x).toBeGreaterThanOrEqual(24);
      expect(layout.bars[1]!.width).toBeGreaterThan(layout.bars[0]!.width);
      expect(layout.scanlineY).toBeGreaterThan(layout.emitter.y);
      expect(layout.statusSummary).toContain('Affected 3');
      expect(layout.statusSummary).toContain('Probes 9');
    }
  });

  it('projects square trace frames with null and fitted candidates into SVG coordinates', () => {
    const solver = new TractorBeamSolver(CLOSEST_SQUARE_POLICY);
    const frames = solver.trace(solver.parse(EXAMPLE_BEAM_PROGRAM), { maxSteps: 8 });

    const firstLayout = buildTractorBeamSvgLayout(frames[0]!);
    expect(firstLayout.kind).toBe('square');
    if (firstLayout.kind === 'square') {
      expect(firstLayout.candidateRect).toBeNull();
      expect(firstLayout.leftEdgePoints.length).toBeGreaterThan(0);
      expect(firstLayout.statusSummary).toContain('Phase jump');
    }

    const lastLayout = buildTractorBeamSvgLayout(frames[frames.length - 1]!);
    expect(lastLayout.kind).toBe('square');
    if (lastLayout.kind === 'square') {
      expect(lastLayout.candidateRect).not.toBeNull();
      expect(lastLayout.candidateRect!.width).toBeGreaterThan(0);
      expect(lastLayout.maxCoord).toBeGreaterThanOrEqual(380);
      expect(lastLayout.probeDot.x).toBeGreaterThan(lastLayout.emitter.x);
      expect(lastLayout.statusSummary).toContain('2810228');
    }
  });

  it('scales cleanly when a custom square frame has leftEdge points beyond candidate', () => {
    const placement = new SquarePlacement(10, 10, 5);
    const layout = buildTractorBeamSvgLayout({
      kind: 'square',
      stepIndex: 1,
      totalSteps: 1,
      squareSize: 5,
      anchor: { x: 1, y: 1 },
      leftEdge: [{ x: 1, y: 1 }, { x: 12, y: 20 }],
      candidate: placement,
      probePoint: { x: 14, y: 10 },
      fits: false,
      phase: 'walk',
      probeCount: 12,
    });
    expect(layout.kind).toBe('square');
    if (layout.kind === 'square') {
      expect(layout.maxCoord).toBeGreaterThanOrEqual(20);
      expect(layout.statusSummary).toContain('Phase walk');
    }
  });
});
