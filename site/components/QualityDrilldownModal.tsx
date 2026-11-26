import { useMemo, useState } from 'react';
import { githubBlobUrl, type FileQualityRow } from '../data/quality';

export type DrilldownSortKey = 'coverage' | 'maintainability' | 'cyclomatic' | 'length' | 'sloc';

export interface QualityDrilldownModalProps {
  readonly title: string;
  readonly files: readonly FileQualityRow[];
  readonly initialSort: DrilldownSortKey;
  readonly onClose: () => void;
}

function sortRows(files: readonly FileQualityRow[], sortKey: DrilldownSortKey): FileQualityRow[] {
  const copy = [...files];
  if (sortKey === 'coverage') {
    return copy.sort((a, b) => (a.coveragePct ?? 101) - (b.coveragePct ?? 101) || a.maintainabilityIndex - b.maintainabilityIndex);
  }
  if (sortKey === 'maintainability') return copy.sort((a, b) => a.maintainabilityIndex - b.maintainabilityIndex);
  if (sortKey === 'cyclomatic') return copy.sort((a, b) => b.maxCyclomatic - a.maxCyclomatic);
  if (sortKey === 'length') return copy.sort((a, b) => b.maxFunctionSloc - a.maxFunctionSloc);
  return copy.sort((a, b) => b.sloc - a.sloc);
}

export function QualityDrilldownModal({
  title,
  files,
  initialSort,
  onClose,
}: QualityDrilldownModalProps) {
  const [sortKey, setSortKey] = useState<DrilldownSortKey>(initialSort);
  const sorted = useMemo(() => sortRows(files, sortKey), [files, sortKey]);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="quality-header">
          <div>
            <strong>{title}</strong>
            <span className="muted"> · {files.length} files (worst-first)</span>
          </div>
          <button type="button" onClick={onClose}>Close ✕</button>
        </div>
        <div className="meta-row">
          <span className="muted">Sort by:</span>
          {(['coverage', 'maintainability', 'cyclomatic', 'length', 'sloc'] as const).map((key) => (
            <button
              key={key}
              type="button"
              className={sortKey === key ? 'primary' : undefined}
              onClick={() => setSortKey(key)}
            >
              {key}
            </button>
          ))}
        </div>
        <div className="table-scroll">
          <table className="quality-table">
            <thead>
              <tr>
                <th>File</th>
                <th>Coverage</th>
                <th>MI</th>
                <th>Max CC</th>
                <th>Depth</th>
                <th>Max Fn</th>
                <th>SLOC</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.path}>
                  <td>
                    <a href={githubBlobUrl(row.path)} target="_blank" rel="noreferrer">
                      <code>{row.path}</code> ↗
                    </a>
                  </td>
                  <td className="nowrap">{row.coveragePct === null ? 'UI / CLI' : `${row.coveragePct}%`}</td>
                  <td className="nowrap">{row.maintainabilityIndex}</td>
                  <td className="nowrap">{row.maxCyclomatic}</td>
                  <td className="nowrap">{row.maxNestingDepth}</td>
                  <td className="nowrap">{row.maxFunctionSloc} LoC</td>
                  <td className="nowrap">{row.sloc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
