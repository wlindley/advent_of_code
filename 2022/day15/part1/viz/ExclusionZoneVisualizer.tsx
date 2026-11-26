import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import { parseSensorReadings, type SensorReading } from '../../shared';
import { SensorMapSvg } from '../../shared/viz/SensorMapSvg';
import {
  buildExclusionTrace,
  DEFAULT_MAX_TRACE_STEPS,
  type ExclusionTraceFrame,
} from '../domain';

export interface ExclusionZoneVisualizerProps extends VisualizerProps {
  readonly targetY: number;
}

const LEGEND_ITEMS: ReadonlyArray<readonly [string, string]> = [
  ['Sensor / Diamond', 'var(--accent)'],
  ['Active Sensor / Slice', 'var(--gold)'],
  ['Known Beacon', 'var(--err)'],
  ['Merged Exclusion', 'var(--ok)'],
];

type VizState =
  | { readonly ok: true; readonly readings: readonly SensorReading[]; readonly frames: readonly ExclusionTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string, targetY: number): VizState {
  try {
    const readings = parseSensorReadings(rawInput);
    const frames = buildExclusionTrace(readings, targetY, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, readings, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function ExclusionKpis({ frame, targetY }: { readonly frame: ExclusionTraceFrame; readonly targetY: number }) {
  const sliceLabel = frame.activeSlice ? `[${frame.activeSlice.start}, ${frame.activeSlice.end}]` : 'none';
  return (
    <div className="meta-row">
      <span className="badge">Target y: <code>{targetY}</code></span>
      <span className="badge">Sensors: <code>{frame.processedCount} / {frame.totalSensors}</code></span>
      <span className="badge">Active Slice: <code>{sliceLabel}</code></span>
      <span className="badge">Covered: <code>{frame.coveredCount.toString()}</code></span>
      <span className="badge">Beacons on Row: <code>{frame.beaconCount}</code></span>
      <span className="badge status-solved">
        Excluded: <strong className="gold"><code>{frame.excludedCount.toString()}</code></strong>
      </span>
    </div>
  );
}

function ExclusionLegend() {
  return (
    <div className="meta-row">
      {LEGEND_ITEMS.map(([label, color]) => (
        <span key={label} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: color, display: 'inline-block' }} />
          {label}
        </span>
      ))}
    </div>
  );
}

/** Interactive step-by-step visualizer for Part 1 Manhattan row-exclusion sweep. */
export function ExclusionZoneVisualizer({ rawInput, targetY }: ExclusionZoneVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, targetY), [rawInput, targetY]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${rawInput}\n@${targetY}`, 160);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  return (
    <div className="stack">
      <ExclusionKpis frame={frame} targetY={targetY} />
      <SensorMapSvg
        readings={state.readings}
        activeSensorIndex={frame.activeSensorIndex}
        processedCount={frame.processedCount}
        targetY={targetY}
        mergedCoverage={frame.mergedCoverage}
        activeSlice={frame.activeSlice}
      />
      <ExclusionLegend />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={() => {
          if (!playback.isPlaying && playback.step >= frames.length - 1) playback.setStep(0);
          playback.togglePlay();
        }}
        onStepChange={(nextStep) => {
          if (playback.isPlaying) playback.togglePlay();
          playback.setStep(nextStep);
        }}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
