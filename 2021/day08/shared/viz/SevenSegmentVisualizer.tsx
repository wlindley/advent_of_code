import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  type DisplayTraceFrame,
  type SevenSegmentSolver,
} from '../index';
import { SevenSegmentDigitSvg } from './SevenSegmentDigitSvg';
import { WireDeductionCard } from './WireDeductionCard';

export interface SevenSegmentVisualizerProps {
  readonly rawInput: string;
  readonly solver: SevenSegmentSolver;
}

type VisualizerModel =
  | { readonly ok: true; readonly answer: number; readonly frames: readonly DisplayTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildVisualizerModel(rawInput: string, solver: SevenSegmentSolver): VisualizerModel {
  try {
    const entries = solver.parse(rawInput);
    const answer = solver.solve(entries);
    const frames = solver.trace(entries, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, answer, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryCard({
  frame,
  step,
  totalSteps,
  answer,
  playback,
}: {
  readonly frame: DisplayTraceFrame;
  readonly step: number;
  readonly totalSteps: number;
  readonly answer: number;
  readonly playback: ReturnType<typeof usePlayback>;
}) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="meta-row" style={{ margin: 0, justifyContent: 'space-between' }}>
        <div className="meta-row" style={{ margin: 0 }}>
          <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
            Entry <strong>{frame.entryIndex + 1}</strong> / {frame.totalEntries}
          </span>
          <span className="badge">{frame.policy.label}</span>
          <span className="badge">
            {frame.policy.contributionLabel}: <strong>{frame.contribution}</strong>
          </span>
          <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
            Running: <strong>{frame.runningTotal.toLocaleString()}</strong>
          </span>
        </div>
        <span className="badge status-solved">
          {frame.policy.totalLabel}: <strong>{answer.toLocaleString()}</strong>
        </span>
      </div>
      <PlaybackControls
        step={step}
        totalSteps={totalSteps}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}

function OutputReadoutCard({
  frame,
  solver,
}: {
  readonly frame: DisplayTraceFrame;
  readonly solver: SevenSegmentSolver;
}) {
  return (
    <div className="card" style={{ marginBottom: 0 }}>
      <div className="meta-row" style={{ margin: '0 0 0.75rem', justifyContent: 'space-between' }}>
        <span className="eyebrow">Decoded 4-Digit Output Readout</span>
        <span className="badge">
          Display: <strong>{frame.decoded.formattedOutput}</strong>
        </span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', justifyContent: 'center' }}>
        {frame.decoded.outputs.map((digit, index) => (
          <SevenSegmentDigitSvg
            key={index}
            digit={digit}
            highlighted={solver.policy.highlightsDigit(digit)}
          />
        ))}
      </div>
    </div>
  );
}

/** Interactive 7-segment display playback, LED readout, and wire-mapping visualizer. */
export function SevenSegmentVisualizer({ rawInput, solver }: SevenSegmentVisualizerProps) {
  const model = useMemo(() => buildVisualizerModel(rawInput, solver), [rawInput, solver]);
  const frames = model.ok ? model.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 220);
  const activeFrame = frames[playback.step] ?? null;

  if (!model.ok || activeFrame === null) {
    return (
      <div className="stack">
        <p className="error-text">
          Unable to visualize input: {model.ok ? 'No trace frames available' : model.message}
        </p>
      </div>
    );
  }

  return (
    <div className="stack">
      <TelemetryCard
        frame={activeFrame}
        step={playback.step}
        totalSteps={frames.length}
        answer={model.answer}
        playback={playback}
      />
      <OutputReadoutCard frame={activeFrame} solver={solver} />
      <WireDeductionCard frame={activeFrame} />
    </div>
  );
}
