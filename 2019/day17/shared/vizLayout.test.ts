import { describe, expect, it } from 'vitest';
import { RoutinePlan } from './routineCompressor';
import { ScaffoldMap } from './scaffoldMap';
import {
  ALIGNMENT_PARAMETERS_POLICY,
  DUST_COLLECTION_POLICY,
  type ScaffoldTraceFrame,
} from './scaffoldSolver';
import { CELL_SIZE, buildScaffoldSvgLayout } from './vizLayout';

const SAMPLE_MAP = ScaffoldMap.fromAscii([
  '.#.',
  '###',
  '^#.',
].join('\n'));

describe('buildScaffoldSvgLayout', () => {
  it('batches revealed scaffold beams and intersections for Part 1 scan frames', () => {
    expect(CELL_SIZE).toBe(12);
    const partialFrame: ScaffoldTraceFrame = {
      stepIndex: 1,
      totalSteps: 3,
      phase: 'scan',
      map: SAMPLE_MAP,
      revealedRows: 1,
      robot: null,
      sweptPath: [],
      plan: null,
      dust: null,
    };
    const partial = buildScaffoldSvgLayout(partialFrame, ALIGNMENT_PARAMETERS_POLICY);
    expect(partial.viewBox).toBe('-12 -12 60 60');
    expect(partial.scaffoldPath).toContain('M13 1h10v10h-10z');
    expect(partial.intersectionCount).toBe(0);
    expect(partial.robotMarker).toBeNull();
    expect(partial.sweptPolyline).toBe('');
    expect(partial.statusSummary).toContain('Scanned 1 / 3 rows');

    const fullFrame: ScaffoldTraceFrame = {
      ...partialFrame,
      stepIndex: 3,
      revealedRows: 3,
      robot: SAMPLE_MAP.robot,
    };
    const full = buildScaffoldSvgLayout(fullFrame, ALIGNMENT_PARAMETERS_POLICY);
    expect(full.intersectionCount).toBe(1);
    expect(full.intersectionPath).not.toBe('');
    expect(full.robotMarker).toEqual({
      center: { x: 6, y: 30 },
      direction: 'U',
      arrowPoints: '6,26 2.5,33 9.5,33',
    });
    expect(full.statusSummary).toContain('1 intersections');
  });

  it('formats swept polyline and dust status for Part 2 sweep frames', () => {
    const plan = new RoutinePlan(['A'], ['1', 'R', '2'], ['R'], ['R']);
    const sweepMid: ScaffoldTraceFrame = {
      stepIndex: 2,
      totalSteps: 4,
      phase: 'sweep',
      map: SAMPLE_MAP,
      revealedRows: 3,
      robot: { x: 0, y: 1, direction: 'R' },
      sweptPath: [{ x: 0, y: 2 }, { x: 0, y: 1 }],
      plan,
      dust: null,
    };
    const midLayout = buildScaffoldSvgLayout(sweepMid, DUST_COLLECTION_POLICY);
    expect(midLayout.sweptPolyline).toBe('6,30 6,18');
    expect(midLayout.robotMarker?.direction).toBe('R');
    expect(midLayout.statusSummary).toBe('Dust Collected · Sweep step 2 / 4');

    const sweepEnd: ScaffoldTraceFrame = { ...sweepMid, stepIndex: 4, dust: 54321n };
    const endLayout = buildScaffoldSvgLayout(sweepEnd, DUST_COLLECTION_POLICY);
    expect(endLayout.statusSummary).toBe('Dust Collected · Sweep step 4 / 4 · Dust 54321');
  });
});
