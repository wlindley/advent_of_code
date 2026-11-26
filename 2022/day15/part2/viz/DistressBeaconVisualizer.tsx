import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import { parseSensorReadings, type SensorReading } from '../../shared';
import { SensorMapSvg } from '../../shared/viz/SensorMapSvg';
import {
  buildDistressTrace,
  DEFAULT_MAX_TRACE_STEPS,
  type DistressTraceFrame,
} from '../domain';

export interface DistressBeaconVisualizerProps extends VisualizerProps {
  readonly maxCoord: number;
}

const LEGEND_ITEMS: ReadonlyArray<readonly [string, string]> = [
  ['Sensor / Diamond', 'var(--accent)'],
  ['Covering Sensor / Distress', 'var(--gold)'],
  ['Known Beacon', 'var(--err)'],
  ['Candidate Point', 'var(--warn)'],
  ['Search Box', 'var(--text)'],
];

type VizState =
  | { readonly ok: true; readonly readings: readonly SensorReading[]; readonly frames: readonly DistressTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVizState(rawInput: string, maxCoord: number): VizState {
  try {
    const readings = parseSensorReadings(rawInput);
    const frames = buildDistressTrace(readings, maxCoord, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, readings, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function DistressKpis({ frame, maxCoord }: { readonly frame: DistressTraceFrame; readonly maxCoord: number }) {
  const activeLabel = frame.activeCandidate ? `(${frame.activeCandidate.x}, ${frame.activeCandidate.y})` : 'none';
  const coverLabel = frame.coveringSensorIndex !== null ? `#${frame.coveringSensorIndex + 1}` : 'none';
  const distressLabel = frame.distressPoint ? `(${frame.distressPoint.x}, ${frame.distressPoint.y})` : 'pending';
  const freqLabel = frame.tuningFrequency !== null ? frame.tuningFrequency.toString() : 'pending';
  return (
    <div className="meta-row">
      <span className="badge">Search Box: <code>[0, {maxCoord}]^2</code></span>
      <span className="badge">Candidates: <code>{frame.checkedCount} / {frame.totalCandidates}</code></span>
      <span className="badge">Active Candidate: <code>{activeLabel}</code></span>
      <span className="badge">Covering Sensor: <code>{coverLabel}</code></span>
      <span className="badge">Distress: <code>{distressLabel}</code></span>
      <span className="badge status-solved">
        Tuning Frequency: <strong className="gold"><code>{freqLabel}</code></strong>
      </span>
    </div>
  );
}

function DistressLegend() {
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

/** Interactive visualizer for Part 2 distress beacon outer-diagonal candidate search. */
export function DistressBeaconVisualizer({ rawInput, maxCoord }: DistressBeaconVisualizerProps) {
  const state = useMemo(() => buildVizState(rawInput, maxCoord), [rawInput, maxCoord]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${rawInput}\n@${maxCoord}`, 140);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return <p className="error-text">Unable to visualize input: {state.ok ? 'No trace frames' : state.message}</p>;
  }

  return (
    <div className="stack">
      <DistressKpis frame={frame} maxCoord={maxCoord} />
      <SensorMapSvg
        readings={state.readings}
        activeSensorIndex={frame.coveringSensorIndex}
        searchBox={{ minX: 0, maxX: maxCoord, minY: 0, maxY: maxCoord }}
        candidatePoints={frame.revealedCandidates}
        activeCandidate={frame.activeCandidate}
        distressPoint={frame.distressPoint}
      />
      <DistressLegend />
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
