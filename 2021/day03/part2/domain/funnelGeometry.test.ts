import { describe, expect, it } from 'vitest';
import { DiagnosticReport, parseDiagnosticReport } from '../../shared';
import { traceLifeSupport } from './lifeSupportTrace';
import { FUNNEL_VIEWBOX, buildFunnelGeometry } from './funnelGeometry';

const AOC_EXAMPLE = [
  '00100',
  '11110',
  '10110',
  '10111',
  '10101',
  '01111',
  '00111',
  '11100',
  '10000',
  '11001',
  '00010',
  '01010',
].join('\n');

describe('buildFunnelGeometry', () => {
  it('projects multi-frame traces onto bounded SVG coordinates and polylines', () => {
    const report = parseDiagnosticReport(AOC_EXAMPLE);
    const frames = traceLifeSupport(report);
    const geo = buildFunnelGeometry(frames, 3, report.rowCount);

    expect(geo.plotLeft).toBe(FUNNEL_VIEWBOX.padLeft);
    expect(geo.plotRight).toBe(FUNNEL_VIEWBOX.width - FUNNEL_VIEWBOX.padRight);
    expect(geo.plotTop).toBe(FUNNEL_VIEWBOX.padTop);
    expect(geo.plotBottom).toBe(FUNNEL_VIEWBOX.height - FUNNEL_VIEWBOX.padBottom);
    expect(geo.points).toHaveLength(6);
    expect(geo.points[0]!.x).toBe(geo.plotLeft);
    expect(geo.points[0]!.oxygenY).toBe(geo.plotTop);
    expect(geo.points[5]!.x).toBe(geo.plotRight);
    expect(geo.points[3]!.isActive).toBe(true);
    expect(geo.activeX).toBe(geo.points[3]!.x);
    expect(geo.points[3]!.co2Locked).toBe(true);
    expect(geo.points[3]!.oxygenLocked).toBe(false);
    expect(geo.oxygenPath.split(' ')).toHaveLength(6);
    expect(geo.co2Path.split(' ')).toHaveLength(6);
    expect(Object.isFrozen(geo)).toBe(true);
    expect(Object.isFrozen(geo.points)).toBe(true);
  });

  it('centers a single-frame trace without 0/0 NaN coordinates', () => {
    const report = new DiagnosticReport(['101']);
    const frames = traceLifeSupport(report);
    const geo = buildFunnelGeometry(frames, 0, report.rowCount);

    const midX = (geo.plotLeft + geo.plotRight) / 2;
    expect(geo.points).toHaveLength(1);
    expect(geo.points[0]!.x).toBe(midX);
    expect(Number.isNaN(geo.points[0]!.x)).toBe(false);
    expect(geo.activeX).toBe(midX);
    expect(geo.points[0]!.oxygenLocked).toBe(true);
    expect(geo.points[0]!.co2Locked).toBe(true);
  });

  it('rejects empty frames, out-of-range activeIndex, and invalid initialRowCount', () => {
    const frames = traceLifeSupport(new DiagnosticReport(['101', '010']));
    expect(() => buildFunnelGeometry([], 0, 2)).toThrow(RangeError);
    expect(() => buildFunnelGeometry(frames, -1, 2)).toThrow(RangeError);
    expect(() => buildFunnelGeometry(frames, 0.5, 2)).toThrow(RangeError);
    expect(() => buildFunnelGeometry(frames, frames.length, 2)).toThrow(RangeError);
    expect(() => buildFunnelGeometry(frames, 0, 0)).toThrow(RangeError);
    expect(() => buildFunnelGeometry(frames, 0, 1.5)).toThrow(RangeError);
  });
});
