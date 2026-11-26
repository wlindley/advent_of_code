import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import { DEFAULT_MAX_TRACE_STEPS, type WarehouseFrame, type WarehouseSpec } from '../index';
import { WarehouseCanvas } from './WarehouseCanvas';

export interface WarehouseVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<WarehouseSpec, number, WarehouseFrame>;
  readonly partLabel: string;
  readonly maxTraceSteps?: number;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly WarehouseFrame[] }
  | { readonly ok: false; readonly message: string };

const LEGEND: ReadonlyArray<readonly [string, string]> = [
  ['Wall #', '#334155'],
  ['Crate', '#d97706'],
  ['Robot @', '#0891b2'],
  ['Blocked ring', '#e11d48'],
];

function buildTraceState(
  rawInput: string,
  solver: PuzzleSolver<WarehouseSpec, number, WarehouseFrame>,
  maxSteps: number,
): TraceState {
  try {
    const spec = solver.parse(rawInput);
    const frames = solver.trace?.(spec, { maxSteps }) ?? [];
    return { ok: true, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function WarehouseHud({
  frame,
  partLabel,
}: {
  readonly frame: WarehouseFrame;
  readonly partLabel: string;
}) {
  const { snapshot } = frame;
  const isFinal = frame.step === frame.totalMoves;
  const statusLabel = frame.move === null ? 'Start' : frame.moved ? 'Moved' : 'Blocked';
  const statusColor = frame.move === null ? 'var(--muted)' : frame.moved ? 'var(--ok)' : 'var(--err)';

  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">{partLabel}</span>
      <span className="badge">
        Grid: <code>{snapshot.width}×{snapshot.height}</code>
      </span>
      <span className="badge">
        Boxes: <code>{snapshot.boxCount}</code>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Move: <code>{frame.step}/{frame.totalMoves}</code> ({frame.move ?? 'init'})
      </span>
      <span className="badge" style={{ borderColor: statusColor, color: statusColor }}>
        Status: <code>{statusLabel}</code>
      </span>
      <span
        className={isFinal ? 'badge status-solved' : 'badge'}
        style={isFinal ? { borderColor: 'var(--gold)' } : undefined}
      >
        GPS Sum:{' '}
        <strong className={isFinal ? 'gold' : undefined}>
          <code>{snapshot.gpsSum}</code>
        </strong>
      </span>
    </div>
  );
}

/** Interactive step-by-step warehouse robot simulation visualizer. */
export function WarehouseVisualizer({
  rawInput,
  solver,
  partLabel,
  maxTraceSteps = DEFAULT_MAX_TRACE_STEPS,
}: WarehouseVisualizerProps) {
  const state = useMemo(
    () => buildTraceState(rawInput, solver, maxTraceSteps),
    [rawInput, solver, maxTraceSteps],
  );
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${partLabel}`, 140);

  if (!state.ok) {
    return <p className="error-text">Unable to visualize input: {state.message}</p>;
  }
  const frame = state.frames[playback.step];
  if (!frame) {
    return <p className="error-text">Unable to visualize input: No trace frames</p>;
  }

  return (
    <div className="stack">
      <WarehouseHud frame={frame} partLabel={partLabel} />
      <WarehouseCanvas frame={frame} />
      <div className="meta-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
        {LEGEND.map(([label, color]) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <span
              style={{
                width: 11,
                height: 11,
                borderRadius: 3,
                background: color,
                border: '1px solid var(--border)',
              }}
            />
            {label}
          </span>
        ))}
      </div>
      <PlaybackControls
        step={playback.step}
        totalSteps={totalSteps}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => {
          if (!playback.isPlaying && playback.step >= totalSteps - 1) playback.setStep(0);
          playback.togglePlay();
        }}
        onStepChange={(next) => {
          if (playback.isPlaying) playback.togglePlay();
          playback.setStep(next);
        }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
