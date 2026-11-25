import { useState } from 'react';
import { InputRunner, type PuzzlePartManifest } from '../../shared/viz';
import type { PartRecord } from '../data/status';

export interface SolvedPartViewProps {
  readonly record: Extract<PartRecord, { status: 'solved' }>;
  readonly manifest?: PuzzlePartManifest;
}

export function SolvedPartView({ record, manifest }: SolvedPartViewProps) {
  const [activeInput, setActiveInput] = useState(manifest?.exampleInput ?? '');
  const Visualizer = manifest?.Visualizer;

  return (
    <>
      <section className="card">
        <div className="meta-row">
          <span className="badge status-solved">Verified ★</span>
          <span className="badge">{record.runtime}</span>
          <span className="badge">{record.personalInputElapsedMs.toFixed(2)} ms (personal input)</span>
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
          Complexity: {record.complexity} · Verified {record.verifiedAt} (attempts: {record.attemptsCount})
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
