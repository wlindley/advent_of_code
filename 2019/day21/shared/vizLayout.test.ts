import { describe, expect, it } from 'vitest';
import { EXAMPLE_SPRINGDROID_PROGRAM } from './exampleProgram';
import { RUN_POLICY, SpringdroidSolver, WALK_POLICY } from './springdroidSolver';
import {
  SVG_HEIGHT,
  SVG_PADDING,
  TILE_GAP,
  TILE_SIZE,
  buildSpringdroidSvgLayout,
} from './vizLayout';

describe('vizLayout', () => {
  it('builds WALK SVG layout for both walk and jump ticks', () => {
    expect(SVG_HEIGHT).toBe(210);
    expect(TILE_SIZE).toBe(34);
    expect(TILE_GAP).toBe(4);
    expect(SVG_PADDING).toBe(20);

    const solver = new SpringdroidSolver(WALK_POLICY);
    const frames = solver.trace(solver.parse(EXAMPLE_SPRINGDROID_PROGRAM));
    const walkFrame = frames.find((f) => !f.tick.evaluation.registerJ)!;
    const jumpFrame = frames.find((f) => f.tick.evaluation.registerJ)!;

    const walkLayout = buildSpringdroidSvgLayout(walkFrame);
    expect(walkLayout.height).toBe(SVG_HEIGHT);
    expect(walkLayout.viewBox).toBe(`0 0 ${walkLayout.width} ${SVG_HEIGHT}`);
    expect(walkLayout.sensorPins.map((p) => p.register)).toEqual(['A', 'B', 'C', 'D']);
    expect(walkLayout.isJump).toBe(false);
    expect(walkLayout.arcPath.startsWith('M ')).toBe(true);
    expect(walkLayout.arcPath).not.toContain(' Q ');
    expect(walkLayout.tiles.some((t) => !t.solid)).toBe(true);
    expect(walkLayout.tiles.some((t) => t.virtual)).toBe(true);

    const jumpLayout = buildSpringdroidSvgLayout(jumpFrame);
    expect(jumpLayout.isJump).toBe(true);
    expect(jumpLayout.arcPath).toContain(' Q ');
    expect(jumpLayout.targetX).toBeGreaterThan(jumpLayout.droidX);
  });

  it('builds RUN SVG layout with 9 sensor pins A..I', () => {
    const solver = new SpringdroidSolver(RUN_POLICY);
    const frames = solver.trace(solver.parse(EXAMPLE_SPRINGDROID_PROGRAM));
    const layout = buildSpringdroidSvgLayout(frames[0]!);
    expect(layout.sensorPins.map((p) => p.register)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I']);
  });
});
