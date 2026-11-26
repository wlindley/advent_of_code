import { useMemo } from 'react';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  computeSignalViewport,
  DEFAULT_MAX_TRACE_STEPS,
  DEFAULT_VIEWPORT_SLOTS,
  type XmasAttackSolver,
  type XmasStream,
  type XmasTraceFrame,
} from '../index';
import { XmasSignalChart } from './XmasSignalChart';

export interface XmasSignalVisualizerProps {
  readonly rawInput: string;
  readonly solver: XmasAttackSolver;
}

type TraceState =
  | { readonly ok: true; readonly stream: XmasStream; readonly frames: readonly XmasTraceFrame[] }
  | { readonly ok: false; readonly message: string };

function buildSignalTrace(rawInput: string, solver: XmasAttackSolver): TraceState {
  try {
    const stream = solver.parse(rawInput);
    const frames = solver.trace(stream, { maxSteps: DEFAULT_MAX_TRACE_STEPS });
    return { ok: true, stream, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBadges({ solver, stream, frame }: { readonly solver: XmasAttackSolver; readonly stream: XmasStream; readonly frame: XmasTraceFrame }) {
  if (frame.phase === 'preamble') {
    const targetVal = stream.at(frame.check.targetIndex);
    const statusClass = frame.isInvalid ? 'status-blocked' : 'status-solved';
    return (
      <div className="meta-row">
        <span className="badge">{solver.policy.label}</span>
        <span className="badge">{`Preamble W = ${frame.windowLength}`}</span>
        <span className="badge">{`Check: ${frame.step} / ${frame.totalSteps}`}</span>
        <span className="badge">{`Window: [${frame.check.windowStart}..${frame.check.targetIndex - 1}]`}</span>
        <span className={`badge ${statusClass}`}>{`#${frame.check.targetIndex}: ${targetVal.toString()}`}</span>
      </div>
    );
  }
  const targetVal = stream.at(frame.invalidIndex);
  const statusClass = frame.isFound ? 'status-solved' : 'status-in_progress';
  const metric = frame.weakness ? frame.weakness.encryptionWeakness(stream).toString() : frame.probe.runningSum.toString();
  return (
    <div className="meta-row">
      <span className="badge">{solver.policy.label}</span>
      <span className="badge">{`Target #${frame.invalidIndex}: ${targetVal.toString()}`}</span>
      <span className="badge">{`Probe: ${frame.step} / ${frame.totalSteps}`}</span>
      <span className="badge">{`Range: [${frame.probe.windowStart}..${Math.max(frame.probe.windowStart, frame.probe.windowEnd - 1)}]`}</span>
      <span className={`badge ${statusClass}`}>{`${frame.isFound ? 'Weakness' : 'Sum'}: ${metric}`}</span>
    </div>
  );
}

function StatusStrip({ stream, frame }: { readonly stream: XmasStream; readonly frame: XmasTraceFrame }) {
  if (frame.phase === 'preamble') {
    const { check } = frame;
    const target = stream.at(check.targetIndex);
    const msg = check.pairMatch
      ? `Match: #${check.pairMatch.leftIndex} (${stream.at(check.pairMatch.leftIndex)}) + #${check.pairMatch.rightIndex} (${stream.at(check.pairMatch.rightIndex)}) = ${target}`
      : `Encoding Error at #${check.targetIndex}: no distinct pair sums to ${target}`;
    return (
      <div className="badge" style={{ borderColor: check.isValid ? 'var(--ok)' : 'var(--err)', color: check.isValid ? 'var(--ok)' : 'var(--err)' }}>
        {msg}
      </div>
    );
  }
  const target = stream.at(frame.invalidIndex);
  const pct = Math.min(100, Number((frame.probe.runningSum * 100n) / target));
  const detail = frame.weakness
    ? `Found [${frame.weakness.startIndex}..${frame.weakness.endIndex}]: min ${stream.at(frame.weakness.minIndex)} + max ${stream.at(frame.weakness.maxIndex)} = ${frame.weakness.encryptionWeakness(stream)}`
    : `Running sum: ${frame.probe.runningSum} / ${target}`;
  return (
    <div className="stack" style={{ gap: '0.35rem' }}>
      <div style={{ fontSize: '0.84rem', fontWeight: 600, color: frame.isFound ? 'var(--ok)' : 'var(--text)' }}>{detail}</div>
      <div style={{ height: '8px', borderRadius: '999px', background: 'var(--bg)', border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: frame.isFound ? 'var(--ok)' : 'var(--accent)' }} />
      </div>
    </div>
  );
}

/** Shared interactive XMAS signal visualizer for Day 9 parts. */
export function XmasSignalVisualizer({ rawInput, solver }: XmasSignalVisualizerProps) {
  const state = useMemo(() => buildSignalTrace(rawInput, solver), [rawInput, solver]);
  const frames = state.ok ? state.frames : [];
  const playback = usePlayback(frames.length, `${solver.policy.id}:${rawInput}`, 180);
  const frame = frames[playback.step];

  if (!state.ok || !frame) {
    return (
      <div className="stack">
        <p className="error-text">{`Unable to visualize input: ${state.ok ? 'No trace frames' : state.message}`}</p>
      </div>
    );
  }

  const [focusStart, focusEnd] = frame.phase === 'preamble'
    ? [frame.check.windowStart, frame.check.targetIndex + 1]
    : frame.weakness
      ? [frame.weakness.startIndex, frame.weakness.endIndex + 1]
      : [frame.probe.windowStart, frame.probe.windowEnd];
  const viewport = computeSignalViewport(state.stream, focusStart, focusEnd, DEFAULT_VIEWPORT_SLOTS);

  return (
    <div className="stack">
      <TelemetryBadges solver={solver} stream={state.stream} frame={frame} />
      <StatusStrip stream={state.stream} frame={frame} />
      <XmasSignalChart viewport={viewport} frame={frame} />
      <PlaybackControls
        step={playback.step}
        totalSteps={frames.length}
        isPlaying={playback.isPlaying}
        speedMs={playback.speedMs}
        onTogglePlay={playback.togglePlay}
        onStepChange={playback.setStep}
        onSpeedChange={playback.setSpeedMs}
      />
    </div>
  );
}
