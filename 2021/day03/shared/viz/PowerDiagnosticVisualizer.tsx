import { useMemo } from 'react';
import type { PuzzleSolver } from '../../../../shared/core';
import { PlaybackControls, usePlayback } from '../../../../shared/viz';
import {
  DEFAULT_MAX_TRACE_STEPS,
  buildColumnChartGeometry,
  formatBitPreview,
  tallyAllColumns,
  type BitTally,
  type DiagnosticReport,
  type PowerTraceFrame,
} from '../index';
import { ColumnTallyChart } from './ColumnTallyChart';

export interface PowerDiagnosticVisualizerProps {
  readonly rawInput: string;
  readonly solver: PuzzleSolver<DiagnosticReport, bigint, PowerTraceFrame>;
}

interface PowerOk {
  readonly ok: true;
  readonly report: DiagnosticReport;
  readonly answer: bigint;
  readonly tallies: readonly BitTally[];
  readonly frames: readonly PowerTraceFrame[];
}

type PowerViewModel = PowerOk | { readonly ok: false; readonly message: string };

function buildPowerViewModel(
  rawInput: string,
  solver: PuzzleSolver<DiagnosticReport, bigint, PowerTraceFrame>,
): PowerViewModel {
  try {
    const report = solver.parse(rawInput);
    const answer = solver.solve(report);
    const tallies = tallyAllColumns(report);
    const frames = solver.trace ? solver.trace(report, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) : [];
    return { ok: true, report, answer, tallies, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function TelemetryBadges({ vm, frame }: { readonly vm: PowerOk; readonly frame: PowerTraceFrame | null }) {
  const prefix = frame?.prefixRates;
  return (
    <div className="meta-row">
      <span className="badge">
        Report: <code>{vm.report.rowCount} x {vm.report.bitWidth}b</code>
      </span>
      {frame && (
        <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
          Col {frame.column + 1}/{vm.report.bitWidth}: <code>1s={frame.tally.ones}</code>{' '}
          <code>0s={frame.tally.zeros}</code>
        </span>
      )}
      {prefix && (
        <span className="badge" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
          Gamma: <code>{formatBitPreview(prefix.gammaBinary, 16)}</code> ({String(prefix.gamma)})
        </span>
      )}
      {prefix && (
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
          Epsilon: <code>{formatBitPreview(prefix.epsilonBinary, 16)}</code> ({String(prefix.epsilon)})
        </span>
      )}
      <span className="badge status-solved">
        Power: <strong>{String(prefix ? prefix.powerConsumption : vm.answer)}</strong> / {String(vm.answer)}
      </span>
      {vm.report.bitWidth > vm.frames.length && (
        <span className="muted">Sampled {vm.frames.length} of {vm.report.bitWidth} cols</span>
      )}
    </div>
  );
}

/** Interactive column-tally and gamma/epsilon prefix playback visualizer. */
export function PowerDiagnosticVisualizer({ rawInput, solver }: PowerDiagnosticVisualizerProps) {
  const viewModel = useMemo(() => buildPowerViewModel(rawInput, solver), [rawInput, solver]);
  const frames = viewModel.ok ? viewModel.frames : [];
  const playback = usePlayback(frames.length, rawInput, 320);

  if (!viewModel.ok) {
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {viewModel.message}</p>
      </div>
    );
  }
  const activeFrame = frames[playback.step] ?? null;
  const activeColumn = activeFrame ? activeFrame.column : 0;
  const geometry = buildColumnChartGeometry(viewModel.tallies, activeColumn);

  return (
    <div className="stack">
      <TelemetryBadges vm={viewModel} frame={activeFrame} />
      <ColumnTallyChart geometry={geometry} activeColumn={activeColumn} />
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
