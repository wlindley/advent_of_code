import type { ClosedInterval, IntervalUnion } from '../../../../shared/core';
import type { SensorReading } from '../sensorReading';

const SVG_W = 720;
const SVG_H = 440;
const PAD = 24;

export interface MapPoint { readonly x: number; readonly y: number; }
export interface SearchBoxBounds { readonly minX: number; readonly maxX: number; readonly minY: number; readonly maxY: number; }
interface Projection { readonly toX: (x: number) => number; readonly toY: (y: number) => number; readonly scale: number; }
export interface SensorMapSvgProps {
  readonly readings: readonly SensorReading[];
  readonly activeSensorIndex?: number | null;
  readonly processedCount?: number;
  readonly targetY?: number;
  readonly mergedCoverage?: IntervalUnion;
  readonly activeSlice?: ClosedInterval | null;
  readonly searchBox?: SearchBoxBounds;
  readonly candidatePoints?: readonly MapPoint[];
  readonly activeCandidate?: MapPoint | null;
  readonly distressPoint?: MapPoint | null;
}

function computeProjection(readings: readonly SensorReading[], targetY?: number, searchBox?: SearchBoxBounds): Projection {
  let minX = searchBox ? searchBox.minX : Infinity;
  let maxX = searchBox ? searchBox.maxX : -Infinity;
  let minY = searchBox ? searchBox.minY : targetY ?? Infinity;
  let maxY = searchBox ? searchBox.maxY : targetY ?? -Infinity;
  for (const r of readings) {
    const rad = Number(r.radius);
    minX = Math.min(minX, r.sensorX - rad, r.beaconX);
    maxX = Math.max(maxX, r.sensorX + rad, r.beaconX);
    minY = Math.min(minY, r.sensorY - rad, r.beaconY);
    maxY = Math.max(maxY, r.sensorY + rad, r.beaconY);
  }
  if (!Number.isFinite(minX)) { minX = 0; maxX = 10; minY = 0; maxY = 10; }
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);
  const innerW = SVG_W - 2 * PAD;
  const innerH = SVG_H - 2 * PAD;
  const scale = Math.min(innerW / spanX, innerH / spanY);
  const ox = PAD + (innerW - spanX * scale) / 2;
  const oy = PAD + (innerH - spanY * scale) / 2;
  return { toX: (x) => ox + (x - minX) * scale, toY: (y) => oy + (y - minY) * scale, scale };
}

function diamondPoints(r: SensorReading, proj: Projection): string {
  const rad = Number(r.radius);
  return [
    `${proj.toX(r.sensorX)},${proj.toY(r.sensorY - rad)}`,
    `${proj.toX(r.sensorX + rad)},${proj.toY(r.sensorY)}`,
    `${proj.toX(r.sensorX)},${proj.toY(r.sensorY + rad)}`,
    `${proj.toX(r.sensorX - rad)},${proj.toY(r.sensorY)}`,
  ].join(' ');
}

function CoverageOverlay(props: {
  readonly proj: Projection;
  readonly targetY: number;
  readonly mergedCoverage?: IntervalUnion;
  readonly activeSlice?: ClosedInterval | null;
}) {
  const y = props.proj.toY(props.targetY);
  return (
    <g>
      <line x1={PAD} y1={y} x2={SVG_W - PAD} y2={y} stroke="var(--text)" strokeOpacity={0.35} strokeDasharray="5 4" />
      {props.mergedCoverage?.intervals.map((iv) => (
        <line
          key={`${iv.start}_${iv.end}`}
          x1={props.proj.toX(Number(iv.start))} y1={y} x2={props.proj.toX(Number(iv.end))} y2={y}
          stroke="var(--ok)" strokeWidth={6} strokeLinecap="round"
        />
      ))}
      {props.activeSlice && (
        <line
          x1={props.proj.toX(Number(props.activeSlice.start))} y1={y} x2={props.proj.toX(Number(props.activeSlice.end))} y2={y}
          stroke="var(--gold)" strokeWidth={3} strokeLinecap="round"
        />
      )}
    </g>
  );
}

function Part2Overlay(props: {
  readonly proj: Projection;
  readonly searchBox?: SearchBoxBounds;
  readonly candidatePoints?: readonly MapPoint[];
  readonly activeCandidate?: MapPoint | null;
  readonly distressPoint?: MapPoint | null;
}) {
  const { proj, searchBox, candidatePoints, activeCandidate, distressPoint } = props;
  return (
    <g>
      {searchBox && (
        <rect
          x={proj.toX(searchBox.minX)} y={proj.toY(searchBox.minY)}
          width={Math.max(1, (searchBox.maxX - searchBox.minX) * proj.scale)}
          height={Math.max(1, (searchBox.maxY - searchBox.minY) * proj.scale)}
          fill="none" stroke="var(--text)" strokeWidth={1.5} strokeDasharray="6 3"
        />
      )}
      {candidatePoints?.map((pt, i) => (
        <circle key={i} cx={proj.toX(pt.x)} cy={proj.toY(pt.y)} r={2.5} fill="var(--warn)" opacity={0.7} />
      ))}
      {activeCandidate && (
        <circle cx={proj.toX(activeCandidate.x)} cy={proj.toY(activeCandidate.y)} r={5} fill="none" stroke="var(--accent)" strokeWidth={2} />
      )}
      {distressPoint && (
        <circle cx={proj.toX(distressPoint.x)} cy={proj.toY(distressPoint.y)} r={6} fill="var(--gold)" stroke="var(--text)" strokeWidth={1.5} />
      )}
    </g>
  );
}

/** Isotropic SVG map of sensor diamonds, scanline coverage, and optional Part 2 overlays. */
export function SensorMapSvg(props: SensorMapSvgProps) {
  const { readings, activeSensorIndex = null, processedCount = readings.length, targetY } = props;
  const proj = computeProjection(readings, targetY, props.searchBox);
  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      role="img"
      aria-label={`Sensor exclusion map for ${readings.length} sensors`}
      style={{ width: '100%', maxWidth: SVG_W, height: 'auto', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}
    >
      {readings.map((r, i) => {
        const isActive = activeSensorIndex === i;
        const isProcessed = i < processedCount;
        return (
          <g key={`${r.sensorX},${r.sensorY},${i}`}>
            <polygon
              points={diamondPoints(r, proj)}
              fill={isActive ? 'var(--gold)' : 'var(--accent)'}
              fillOpacity={isActive ? 0.18 : isProcessed ? 0.08 : 0.02}
              stroke={isActive ? 'var(--gold)' : 'var(--accent)'}
              strokeOpacity={isActive ? 0.95 : isProcessed ? 0.45 : 0.15}
              strokeWidth={isActive ? 1.8 : 1}
            />
            <circle cx={proj.toX(r.sensorX)} cy={proj.toY(r.sensorY)} r={isActive ? 4.2 : 3} fill={isActive ? 'var(--gold)' : 'var(--accent)'} />
            <rect x={proj.toX(r.beaconX) - 3} y={proj.toY(r.beaconY) - 3} width={6} height={6} fill="var(--err)" stroke="var(--surface)" strokeWidth={1} />
          </g>
        );
      })}
      {targetY !== undefined && <CoverageOverlay proj={proj} targetY={targetY} mergedCoverage={props.mergedCoverage} activeSlice={props.activeSlice} />}
      <Part2Overlay proj={proj} searchBox={props.searchBox} candidatePoints={props.candidatePoints} activeCandidate={props.activeCandidate} distressPoint={props.distressPoint} />
    </svg>
  );
}
