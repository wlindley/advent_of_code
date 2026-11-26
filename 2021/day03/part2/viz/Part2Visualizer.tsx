import { useMemo } from 'react';
import { PlaybackControls, usePlayback, type VisualizerProps } from '../../../../shared/viz';
import type { DiagnosticReport } from '../../shared';
import {
  DEFAULT_MAX_TRACE_STEPS,
  LifeSupportRates,
  analyzeLifeSupport,
  buildFunnelGeometry,
  solver,
  type LifeSupportTraceFrame,
} from '../domain';
import { LaneDetailCards } from './LaneDetailCards';
import { NarrowingFunnelChart } from './NarrowingFunnelChart';

interface LifeSupportOk {
  readonly ok: true;
  readonly report: DiagnosticReport;
  readonly rates: LifeSupportRates;
  readonly frames: readonly LifeSupportTraceFrame[];
}

type LifeSupportViewModel = LifeSupportOk | { readonly ok: false; readonly message: string };

function buildLifeSupportViewModel(rawInput: string): LifeSupportViewModel {
  try {
    const report = solver.parse(rawInput);
    const rates = analyzeLifeSupport(report);
    const frames = solver.trace ? solver.trace(report, { maxSteps: DEFAULT_MAX_TRACE_STEPS }) : [];
    return { ok: true, report, rates, frames };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : String(error) };
  }
}

function SummaryBadges({
  vm,
  activeFrame,
}: {
  readonly vm: LifeSupportOk;
  readonly activeFrame: LifeSupportTraceFrame;
}) {
  const stepLabel = activeFrame.column === null ? 'Initial' : `Col ${activeFrame.column + 1}`;
  return (
    <div className="meta-row">
      <span className="badge">
        Report: <code>{vm.report.rowCount} x {vm.report.bitWidth}b</code>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Step {activeFrame.step} ({stepLabel})
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        O2: <strong>{String(vm.rates.oxygen.rating)}</strong> (r{vm.rates.oxygen.roundsApplied})
      </span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        CO2: <strong>{String(vm.rates.co2.rating)}</strong> (r{vm.rates.co2.roundsApplied})
      </span>
      <span className="badge status-solved">
        Life Support: <strong>{String(vm.rates.lifeSupportRating)}</strong>
      </span>
    </div>
  );
}

/** Interactive visualizer for 2021 Day 3 Part 2 (oxygen and CO2 life-support rating filter). */
export function Part2Visualizer({ rawInput }: VisualizerProps) {
  const viewModel = useMemo(() => buildLifeSupportViewModel(rawInput), [rawInput]);
  const frames = viewModel.ok ? viewModel.frames : [];
  const playback = usePlayback(frames.length, rawInput, 360);

  if (!viewModel.ok || frames.length === 0) {
    const message = viewModel.ok ? 'No trace frames available.' : viewModel.message;
    return (
      <div className="stack">
        <p className="error-text">Unable to visualize input: {message}</p>
      </div>
    );
  }
  const activeFrame = frames[playback.step]!;
  const geometry = buildFunnelGeometry(frames, playback.step, viewModel.report.rowCount);

  return (
    <div className="stack">
      <SummaryBadges vm={viewModel} activeFrame={activeFrame} />
      <NarrowingFunnelChart geometry={geometry} activeFrame={activeFrame} />
      <LaneDetailCards frame={activeFrame} />
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
