import { useMemo } from 'react';
import { sampleTraceIndices } from '../../../../shared/core';
import { PlaybackControls, type PlaybackState, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import {
  buildRockTrace, DEFAULT_ROCK_TRACE_STEPS, parseHailstones,
  type RockTraceFrame, type RockTrajectory, solveRockTrajectory, type Vec3,
} from '../../shared';
import { type ProjectedPoint, RockProjectionSvg } from './RockProjectionSvg';

interface AxisBounds {
  readonly x: readonly [bigint, bigint];
  readonly y: readonly [bigint, bigint];
  readonly z: readonly [bigint, bigint];
}

type VizData =
  | {
      readonly ok: true;
      readonly trajectory: RockTrajectory;
      readonly frames: readonly RockTraceFrame[];
      readonly bounds: AxisBounds;
      readonly startPos: Vec3;
      readonly endPos: Vec3;
      readonly maxTime: bigint;
      readonly markersXY: readonly ProjectedPoint[];
      readonly markersXZ: readonly ProjectedPoint[];
    }
  | { readonly ok: false; readonly message: string };

function normalizeAxis(val: bigint, min: bigint, max: bigint): number {
  return min === max ? 0.5 : Number(((val - min) * 1000n) / (max - min)) / 1000;
}

function projectXY(pos: Vec3, b: AxisBounds, time: bigint): ProjectedPoint {
  return { x: normalizeAxis(pos.x, b.x[0], b.x[1]), y: normalizeAxis(pos.y, b.y[0], b.y[1]), time };
}

function projectXZ(pos: Vec3, b: AxisBounds, time: bigint): ProjectedPoint {
  return { x: normalizeAxis(pos.x, b.x[0], b.x[1]), y: normalizeAxis(pos.z, b.z[0], b.z[1]), time };
}

function axisRange(a: bigint, b: bigint): readonly [bigint, bigint] {
  return a < b ? [a, b] : [b, a];
}

function buildVizData(rawInput: string): VizData {
  try {
    const trajectory = solveRockTrajectory(parseHailstones(rawInput));
    const frames = buildRockTrace(trajectory, { maxSteps: DEFAULT_ROCK_TRACE_STEPS });
    const sorted = frames[0]!.sortedCollisions;
    const maxTime = sorted.length === 0 ? 0n : sorted[sorted.length - 1]!.time;
    const startPos = trajectory.positionAt(0n);
    const endPos = trajectory.positionAt(maxTime);
    const bounds: AxisBounds = { x: axisRange(startPos.x, endPos.x), y: axisRange(startPos.y, endPos.y), z: axisRange(startPos.z, endPos.z) };
    const sampled = sampleTraceIndices(sorted.length, DEFAULT_ROCK_TRACE_STEPS);
    const markersXY = sampled.map((i) => projectXY(trajectory.positionAt(sorted[i]!.time), bounds, sorted[i]!.time));
    const markersXZ = sampled.map((i) => projectXZ(trajectory.positionAt(sorted[i]!.time), bounds, sorted[i]!.time));
    return { ok: true, trajectory, frames, bounds, startPos, endPos, maxTime, markersXY, markersXZ };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function formatVec3(v: Vec3): string {
  return `(${v.x.toString()}, ${v.y.toString()}, ${v.z.toString()})`;
}

function togglePlayback(playback: PlaybackState, totalFrames: number): void {
  if (!playback.isPlaying && playback.step >= totalFrames - 1) playback.setStep(0);
  playback.togglePlay();
}

function jumpToStep(playback: PlaybackState, nextStep: number): void {
  if (playback.isPlaying) playback.togglePlay();
  playback.setStep(nextStep);
}

function renderCollisionTable(trajectory: RockTrajectory, frame: RockTraceFrame) {
  const sorted = frame.sortedCollisions;
  const activeIndex = frame.step - 1;
  const start = activeIndex < 0 ? 0 : Math.min(Math.max(0, sorted.length - 7), Math.max(0, activeIndex - 3));
  const rows = sorted.slice(start, start + 7);
  return (
    <div className="table-scroll">
      <table className="quality-table" aria-label="Chronological rock-hailstone collisions">
        <thead><tr><th>#</th><th>Hailstone</th><th>Time (t)</th><th>Collision Position</th></tr></thead>
        <tbody>
          {rows.map((c, offset) => {
            const idx = start + offset;
            const style = idx === activeIndex ? { background: 'rgba(9, 105, 218, 0.1)', fontWeight: 700, color: 'var(--accent)' } : undefined;
            return (
              <tr key={c.hailstoneId} style={style}>
                <td className="nowrap">{idx + 1}</td>
                <td className="nowrap">#{c.hailstoneId}</td>
                <td className="nowrap">{c.time.toString()}</td>
                <td className="nowrap">{formatVec3(trajectory.positionAt(c.time))}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Interactive 3D rock trajectory visualizer (XY + XZ projections) for AoC 2023 Day 24 Part 2. */
export function RockPart2Visualizer({ rawInput }: VisualizerProps) {
  const data = useMemo(() => buildVizData(rawInput), [rawInput]);
  const totalFrames = data.ok ? data.frames.length : 0;
  const playback = usePlayback(totalFrames, rawInput, 120);
  const frame = data.ok ? data.frames[playback.step] : undefined;
  if (!data.ok) return <p className="error-text" role="alert">Invalid hailstones: {data.message}</p>;
  if (!frame) return <p className="muted">No trace frames available.</p>;

  const activeTime = frame.activeCollision === null ? 0n : frame.activeCollision.time;
  const banner = frame.activeCollision === null
    ? `Initial throw at t = 0: ${formatVec3(frame.rockPosition)}`
    : `t = ${frame.activeCollision.time.toString()}: Hits hailstone #${frame.activeCollision.hailstoneId} at ${formatVec3(frame.rockPosition)}`;

  return (
    <div className="stack">
      <div className="meta-row">
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>Position Sum: <strong>{data.trajectory.positionSum.toString()}</strong></span>
        <span className="badge">Rock Pos: <strong>{formatVec3(data.trajectory.position)}</strong></span>
        <span className="badge">Rock Vel: <strong>{formatVec3(data.trajectory.velocity)}</strong></span>
        <span className="badge">Collisions: <strong>{frame.step} / {frame.totalCollisions}</strong></span>
      </div>
      <div style={{ padding: '0.45rem 0.7rem', borderRadius: '6px', border: `1px solid ${frame.activeCollision ? 'var(--ok)' : 'var(--accent)'}`, background: 'var(--surface)', color: 'var(--text)', fontWeight: 600, fontSize: '0.88rem' }}>{banner}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.9rem' }}>
        <RockProjectionSvg title="XY Projection" xLabel="X" yLabel="Y" start={projectXY(data.startPos, data.bounds, 0n)} end={projectXY(data.endPos, data.bounds, data.maxTime)} active={projectXY(frame.rockPosition, data.bounds, activeTime)} markers={data.markersXY} />
        <RockProjectionSvg title="XZ Projection" xLabel="X" yLabel="Z" start={projectXZ(data.startPos, data.bounds, 0n)} end={projectXZ(data.endPos, data.bounds, data.maxTime)} active={projectXZ(frame.rockPosition, data.bounds, activeTime)} markers={data.markersXZ} />
      </div>
      {renderCollisionTable(data.trajectory, frame)}
      <PlaybackControls step={playback.step} totalSteps={totalFrames} isPlaying={playback.isPlaying} speedMs={playback.speedMs} onTogglePlay={() => togglePlayback(playback, totalFrames)} onStepChange={(next) => jumpToStep(playback, next)} onSpeedChange={playback.setSpeedMs} />
    </div>
  );
}
