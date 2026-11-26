import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import { type CircuitSnapshot, type LogicCircuit, parseCircuit } from '../index';
import { CircuitSvg } from './CircuitSvg';

export interface CircuitVisualizerProps {
  readonly rawInput: string;
  readonly cacheKey: string;
  readonly buildTrace: (circuit: LogicCircuit) => readonly CircuitSnapshot[];
  readonly summaryLabel: string;
  readonly formatAnswer: (snapshot: CircuitSnapshot) => string;
}

type TraceState =
  | { readonly ok: true; readonly frames: readonly CircuitSnapshot[] }
  | { readonly ok: false; readonly message: string };

function buildTraceState(
  rawInput: string,
  buildTrace: (circuit: LogicCircuit) => readonly CircuitSnapshot[],
): TraceState {
  try {
    return { ok: true, frames: buildTrace(parseCircuit(rawInput)) };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function CircuitHud({
  snapshot,
  summaryLabel,
  formatAnswer,
}: {
  readonly snapshot: CircuitSnapshot;
  readonly summaryLabel: string;
  readonly formatAnswer: (snapshot: CircuitSnapshot) => string;
}) {
  const done = snapshot.isComplete;
  const phaseColor = done ? 'var(--ok)' : 'var(--accent)';
  const zBits = snapshot.zValue.toString(2).padStart(Math.max(1, snapshot.zBitCount), '0');
  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge">
        Settled: <code>{snapshot.settledCount} / {snapshot.totalGates}</code>
      </span>
      <span className="badge" style={{ borderColor: phaseColor, color: phaseColor }}>
        Phase: <code>{snapshot.phase}</code>
      </span>
      <span className="badge">
        Z bits: <code>{zBits}</code>
      </span>
      <span className={done ? 'badge status-solved' : 'badge'} style={done ? { borderColor: 'var(--gold)' } : undefined}>
        {summaryLabel}: <strong className={done ? 'gold' : undefined}><code>{formatAnswer(snapshot)}</code></strong>
      </span>
    </div>
  );
}

function GateTable({ snapshot }: { readonly snapshot: CircuitSnapshot }) {
  const gates = snapshot.evaluationOrder.length > 0 ? snapshot.evaluationOrder : snapshot.circuit.gates;
  const values = snapshot.wireValues;
  const maxRows = 10;
  const anchor = Math.max(0, snapshot.settledCount - 1);
  const start = Math.max(0, Math.min(gates.length - maxRows, anchor - 4));
  const slice = gates.slice(start, start + maxRows);

  return (
    <div className="table-scroll" style={{ border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' }}>
      <table className="quality-table">
        <thead>
          <tr><th>#</th><th>Gate Expression</th><th>Output</th><th>Value</th></tr>
        </thead>
        <tbody>
          {slice.map((gate, offset) => {
            const index = start + offset;
            const settled = index < snapshot.settledCount;
            const active = index === snapshot.settledCount - 1;
            const bit = values.get(gate.out);
            return (
              <tr key={gate.out} style={{ background: active ? 'rgba(9, 105, 218, 0.09)' : undefined, opacity: settled ? 1 : 0.5 }}>
                <td><code>#{index + 1}</code></td>
                <td><code>{gate.in1} {gate.op} {gate.in2}</code></td>
                <td><code>{gate.out}</code></td>
                <td><code>{bit === undefined ? '?' : bit}</code></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Shared interactive Crossed Wires visualizer parameterized by trace builder and answer formatter. */
export function CircuitVisualizer({
  rawInput,
  cacheKey,
  buildTrace,
  summaryLabel,
  formatAnswer,
}: CircuitVisualizerProps) {
  const state = useMemo(() => buildTraceState(rawInput, buildTrace), [rawInput, buildTrace]);
  const totalSteps = state.ok ? state.frames.length : 0;
  const playback = usePlayback(totalSteps, `${rawInput}::${cacheKey}`, 180);
  if (!state.ok) return <p className="error-text">Unable to visualize input: {state.message}</p>;
  const snapshot = state.frames[playback.step];
  if (!snapshot) return <p className="error-text">Unable to visualize input: No trace frames</p>;

  return (
    <div className="stack">
      <CircuitHud snapshot={snapshot} summaryLabel={summaryLabel} formatAnswer={formatAnswer} />
      <CircuitSvg snapshot={snapshot} />
      <GateTable snapshot={snapshot} />
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
