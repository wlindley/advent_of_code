import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import { type TumblerInventory, type TumblerTraceFrame, parseSchematics } from '../index';
import { TumblerMeshSvg } from './TumblerMeshSvg';

export interface CodeChronicleVisualizerProps {
  readonly rawInput: string;
  readonly cacheKey: string;
  readonly buildTrace: (inventory: TumblerInventory) => readonly TumblerTraceFrame[];
  readonly summaryLabel: string;
  readonly formatAnswer: (frame: TumblerTraceFrame) => string;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly TumblerTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(
  rawInput: string,
  buildTrace: (inventory: TumblerInventory) => readonly TumblerTraceFrame[],
): TraceState {
  try {
    return { ok: true, frames: buildTrace(parseSchematics(rawInput)) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function ChronicleHud({
  frame,
  summaryLabel,
  formatAnswer,
}: {
  readonly frame: TumblerTraceFrame;
  readonly summaryLabel: string;
  readonly formatAnswer: (frame: TumblerTraceFrame) => string;
}) {
  const done = frame.isComplete;
  const phaseColor = done ? 'var(--ok)' : 'var(--accent)';
  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">
        Locks × Keys: <code>{frame.inventory.locks.length} × {frame.inventory.keys.length}</code>
      </span>
      <span className="badge">
        Tested: <code>{frame.testedCount} / {frame.totalPairs}</code>
      </span>
      <span className="badge" style={{ borderColor: phaseColor, color: phaseColor }}>
        Phase: <code>{frame.phase}</code>
      </span>
      <span className="badge">
        Fit rate: <code>{frame.fitRatePercent.toFixed(1)}%</code>
      </span>
      <span className={done ? 'badge status-solved' : 'badge'} style={done ? { borderColor: 'var(--gold)' } : undefined}>
        {summaryLabel}: <strong className={done ? 'gold' : undefined}><code>{formatAnswer(frame)}</code></strong>
      </span>
    </div>
  );
}

function PairFitTable({
  frames,
  activeStep,
}: {
  readonly frames: readonly TumblerTraceFrame[];
  readonly activeStep: number;
}) {
  const maxRows = 8;
  const start = Math.max(0, Math.min(frames.length - maxRows, activeStep - 3));
  const slice = frames.slice(start, start + maxRows);
  return (
    <div className="table-scroll" style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <table className="quality-table">
        <thead>
          <tr><th>Pair #</th><th>Lock + Key</th><th>Clearances</th><th>Verdict</th></tr>
        </thead>
        <tbody>
          {slice.map((frame, offset) => {
            const stepIndex = start + offset;
            const ev = frame.evaluation;
            const active = stepIndex === activeStep;
            const verdict = ev === null ? '—' : ev.fits ? 'FIT' : 'OVERLAP';
            const clrText = ev === null ? '—' : ev.columnClearances.join(', ');
            return (
              <tr key={frame.testedCount} style={{ background: active ? 'rgba(9, 105, 218, 0.09)' : undefined }}>
                <td><code>{frame.testedCount}</code></td>
                <td><code>{ev ? `${ev.lock.id} + ${ev.key.id}` : 'None'}</code></td>
                <td><code>[{clrText}]</code></td>
                <td style={{ color: ev?.fits ? 'var(--ok)' : 'var(--err)', fontWeight: 700 }}>{verdict}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Interactive Code Chronicle visualizer parameterized by trace builder and answer formatter. */
export function CodeChronicleVisualizer({
  rawInput,
  cacheKey,
  buildTrace,
  summaryLabel,
  formatAnswer,
}: CodeChronicleVisualizerProps) {
  const state = useMemo(() => buildTraceState(rawInput, buildTrace), [rawInput, buildTrace]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${cacheKey}`, 180);
  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const frame = state.frames[playback.step];
  if (!frame) return <p className="error-text">Unable to visualize input: No trace frames</p>;

  return (
    <div className="stack">
      <ChronicleHud frame={frame} summaryLabel={summaryLabel} formatAnswer={formatAnswer} />
      <TumblerMeshSvg evaluation={frame.evaluation} />
      <PairFitTable frames={state.frames} activeStep={playback.step} />
      <PlaybackControls
        step={playback.step}
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
