import { useMemo, type CSSProperties } from 'react';
import type { VisualizerProps } from '../../../../shared/viz';
import { parseChronospatialInput, type ThreeBitValue } from '../../shared';
import { ChronospatialDebugger } from '../../shared/viz/ChronospatialDebugger';
import { QuineSearchResult, searchLowestQuine, solver } from '../domain';

interface VisualQuineData {
  readonly instructions: readonly ThreeBitValue[];
  readonly result: QuineSearchResult;
}

const PANEL_STYLE: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--surface)',
  padding: '0.75rem',
  color: 'var(--text)',
};

const TABLE_BOX_STYLE: CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  background: 'var(--surface)',
  maxHeight: '16rem',
};

function computeVisualQuineData(rawInput: string): VisualQuineData | null {
  try {
    const program = parseChronospatialInput(rawInput);
    return {
      instructions: program.instructions,
      result: searchLowestQuine(program),
    };
  } catch {
    return null;
  }
}

function QuineSummaryBadges({ result }: { readonly result: QuineSearchResult }) {
  return (
    <div className="meta-row" style={{ color: 'var(--text)' }}>
      <span className="badge status-solved" style={{ borderColor: 'var(--ok)', color: 'var(--ok)' }}>
        Lowest A: <strong><code>{result.registerA.toString()}</code></strong>
      </span>
      <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)' }}>
        Octal: <code>0o{result.registerA.toString(8)}</code>
      </span>
      <span className="badge" style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
        Digits: <code>{result.steps.length}</code>
      </span>
      <span className="badge">
        Candidates Tested: <code>{result.candidatesTested}</code>
      </span>
      <span className="badge">
        Backtracks: <code>{result.backtracks}</code>
      </span>
    </div>
  );
}

function QuineOctalTable({ result }: { readonly result: QuineSearchResult }) {
  return (
    <div className="table-scroll" style={TABLE_BOX_STYLE}>
      <table className="quality-table">
        <thead>
          <tr>
            <th>Pos</th>
            <th>Target</th>
            <th>Prefix (oct)</th>
            <th>Digit</th>
            <th>Matching</th>
            <th>Candidate (oct)</th>
            <th>Candidate (dec)</th>
          </tr>
        </thead>
        <tbody>
          {result.steps.map((step) => (
            <tr key={step.position}>
              <td className="nowrap"><code>{step.position}</code></td>
              <td className="nowrap"><code>{step.targetToken}</code></td>
              <td className="nowrap"><code>0o{step.prefix.toString(8)}</code></td>
              <td className="nowrap" style={{ color: 'var(--accent)', fontWeight: 700 }}>
                <code>{step.digit}</code>
              </td>
              <td className="nowrap"><code>{step.matchingDigits.join(', ')}</code></td>
              <td className="nowrap"><code>0o{step.candidate.toString(8)}</code></td>
              <td className="nowrap"><code>{step.candidate.toString()}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuineOctalPanel({ result }: { readonly result: QuineSearchResult }) {
  return (
    <div className="stack" style={PANEL_STYLE}>
      <span className="eyebrow">Backward Octal Reconstruction</span>
      <QuineSummaryBadges result={result} />
      <QuineOctalTable result={result} />
    </div>
  );
}

/** Interactive Chronospatial VM verification debugger and octal quine panel for Day 17 Part 2. */
export function ChronospatialPart2Visualizer({ rawInput }: VisualizerProps) {
  const visualData = useMemo(() => computeVisualQuineData(rawInput), [rawInput]);
  return (
    <ChronospatialDebugger
      rawInput={rawInput}
      solver={solver}
      partLabel="Part 2 (Quine Verification)"
      targetOutput={visualData?.instructions}
      extraPanel={visualData ? <QuineOctalPanel result={visualData.result} /> : undefined}
    />
  );
}
