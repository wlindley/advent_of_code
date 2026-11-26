import { describe, expect, it } from 'vitest';
import {
  MAX_PROFILE_POINTS,
  PROFILE_VIEWBOX,
  buildComparisonOverlay,
  buildProfileGeometry,
  projectDepthPoint,
} from './profileGeometry';
import { SonarReport } from './sonarReport';
import { traceWindowIncreases } from './windowSweep';

describe('projectDepthPoint', () => {
  it('centers single-point and flat depth reports inside the plot box', () => {
    const single = new SonarReport([150]);
    const center = projectDepthPoint(single, 0);
    expect(center).toEqual({
      index: 0,
      depth: 150,
      x: PROFILE_VIEWBOX.width / 2,
      y: PROFILE_VIEWBOX.height / 2,
    });

    const flat = new SonarReport([100, 100, 100]);
    expect(projectDepthPoint(flat, 0).x).toBe(PROFILE_VIEWBOX.padX);
    expect(projectDepthPoint(flat, 2).x).toBe(PROFILE_VIEWBOX.width - PROFILE_VIEWBOX.padX);
    expect(projectDepthPoint(flat, 1).y).toBe(PROFILE_VIEWBOX.height / 2);
  });

  it('projects shallowest depth to top padding and deepest depth to bottom padding', () => {
    const report = new SonarReport([100, 200, 300]);
    expect(projectDepthPoint(report, 0).y).toBe(PROFILE_VIEWBOX.padY);
    expect(projectDepthPoint(report, 1).y).toBe(PROFILE_VIEWBOX.height / 2);
    expect(projectDepthPoint(report, 2).y).toBe(PROFILE_VIEWBOX.height - PROFILE_VIEWBOX.padY);
    expect(() => projectDepthPoint(report, 3)).toThrow(RangeError);
  });
});

describe('buildProfileGeometry', () => {
  it('builds polyline and area SVG paths for small reports', () => {
    const report = new SonarReport([199, 200, 208, 210]);
    const geometry = buildProfileGeometry(report);
    expect(Object.isFrozen(geometry)).toBe(true);
    expect(geometry.points).toHaveLength(4);
    expect(geometry.totalPoints).toBe(4);
    expect(geometry.minDepth).toBe(199);
    expect(geometry.maxDepth).toBe(210);
    expect(geometry.polylinePoints.split(' ')).toHaveLength(4);
    expect(geometry.areaPath.startsWith('M ')).toBe(true);
    expect(geometry.areaPath.endsWith(' Z')).toBe(true);
  });

  it('downsamples reports exceeding MAX_PROFILE_POINTS while preserving endpoints', () => {
    const depths = Array.from({ length: 500 }, (_, i) => 100 + i);
    const report = new SonarReport(depths);
    const geometry = buildProfileGeometry(report);
    expect(geometry.points).toHaveLength(MAX_PROFILE_POINTS);
    expect(geometry.totalPoints).toBe(500);
    expect(geometry.points[0]?.index).toBe(0);
    expect(geometry.points[MAX_PROFILE_POINTS - 1]?.index).toBe(499);
  });
});

describe('buildComparisonOverlay', () => {
  it('returns null sharedBand for W=1 and an overlapping band for W>1', () => {
    const report = new SonarReport([199, 200, 208, 210, 200]);
    const w1Frame = traceWindowIncreases(report, 1)[0]!;
    const w1Overlay = buildComparisonOverlay(report, w1Frame, 1);
    expect(w1Overlay.sharedBand).toBeNull();
    expect(w1Overlay.exitingPoint.index).toBe(0);
    expect(w1Overlay.enteringPoint.index).toBe(1);
    expect(w1Overlay.deltaKind).toBe('increase');

    const w3Frame = traceWindowIncreases(report, 3)[1]!;
    const w3Overlay = buildComparisonOverlay(report, w3Frame, 3);
    expect(w3Overlay.exitingPoint.index).toBe(1);
    expect(w3Overlay.enteringPoint.index).toBe(4);
    expect(w3Overlay.sharedBand).not.toBeNull();
    expect(w3Overlay.sharedBand?.startIndex).toBe(2);
    expect(w3Overlay.sharedBand?.endIndex).toBe(3);
    expect(w3Overlay.sharedBand!.width).toBeGreaterThan(0);

    expect(() => buildComparisonOverlay(report, w1Frame, 0)).toThrow(RangeError);
  });
});
