import { useState } from 'react';
import type { RuntimeMode } from '../../shared/core';
import { InputRunner, type PuzzlePartManifest } from '../../shared/viz';
import type { FileQualityRow, ScopeQuality } from '../data/quality';
import { computeSolveDurationSeconds, formatDuration, type PartRecord } from '../data/status';
import { DayNavBar } from './DayNavBar';
import { QualityPanel } from './QualityPanel';

export interface SolvedPartViewProps {
  readonly record: Extract<PartRecord, { status: 'solved' }>;
  readonly manifest?: PuzzlePartManifest;
  readonly quality?: ScopeQuality;
  readonly qualityFiles?: readonly FileQualityRow[];
  readonly siblingPartStatus?: string;
}

const RUNTIME_LABELS: Record<RuntimeMode, string> = {
  'main-thread': 'Runs in browser (main thread)',
  'web-worker': 'Runs in browser (Web Worker)',
  'rust-cli': 'Runs via local Rust CLI',
};

export function SolvedPartView({
  record,
  manifest,
  quality,
  qualityFiles,
  siblingPartStatus,
}: SolvedPartViewProps) {
  const [activeInput, setActiveInput] = useState(manifest?.exampleInput ?? '');
  const Visualizer = manifest?.Visualizer;

  return (
    <>
      <DayNavBar
        year={record.year}
        day={record.day}
        activePart={record.part}
        part1Status={record.part === 1 ? record.status : siblingPartStatus}
        part2Status={record.part === 2 ? record.status : siblingPartStatus}
      />

      <section className="card">
        <div className="meta-row">
          <span className="badge status-solved">Verified ★</span>
          <span className="badge nowrap" title="Active agent solve duration (excluding time waiting on a human)">
            Solved in {formatDuration(computeSolveDurationSeconds(record))}
          </span>
          <span className="badge nowrap" title="Execution duration on the personal AoC puzzle input">
            Ran in {record.personalInputElapsedMs.toFixed(2)} ms
          </span>
          <span className="badge" title="Execution environment used by this solver">
            {RUNTIME_LABELS[record.runtime]}
          </span>
          <a href={record.puzzleUrl} target="_blank" rel="noreferrer">
            Official Puzzle Page ↗
          </a>
        </div>
        <h2>
          {record.year} Day {record.day} Part {record.part}: {record.title}
        </h2>
        <p>{record.summary}</p>
        <h3>Solution Approach</h3>
        <p>{record.algorithmSummary}</p>
        <p className="muted">
          Complexity: {record.complexity} · Verified {record.verifiedAt} (attempts: {record.attemptsCount}
          {record.humanWaitSeconds ? `, excluded ${formatDuration(record.humanWaitSeconds)} human wait` : ''})
        </p>
        {record.learnings.length > 0 && (
          <>
            <h3>Key Learnings</h3>
            <ul>
              {record.learnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      {quality && (
        <section className="card">
          <QualityPanel
            title="Code Quality Metrics"
            subtitle={`Part ${record.part} module`}
            scope={quality}
            files={qualityFiles}
          />
        </section>
      )}

      {manifest && Visualizer ? (
        <>
          <InputRunner
            exampleInput={manifest.exampleInput}
            exampleAnswer={manifest.exampleAnswer}
            solver={manifest.solver}
            activeInput={activeInput}
            onInputChange={setActiveInput}
          />
          <section className="card">
            <h3>Interactive Visualization</h3>
            <Visualizer rawInput={activeInput} />
          </section>
        </>
      ) : (
        <section className="card muted">
          Interactive visualization module is not registered for this part yet.
        </section>
      )}
    </>
  );
}
