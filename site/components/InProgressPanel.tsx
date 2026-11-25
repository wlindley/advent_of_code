import type { PartRecord } from '../data/status';

export interface InProgressPanelProps {
  readonly record: Extract<PartRecord, { status: 'in_progress' | 'blocked' }>;
}

export function InProgressPanel({ record }: InProgressPanelProps) {
  const isBlocked = record.status === 'blocked';

  return (
    <section className="card">
      <div className="meta-row">
        <span className={`badge status-${record.status}`}>
          {isBlocked ? 'Blocked' : `In Progress · ${record.phase}`}
        </span>
        <a href={record.puzzleUrl} target="_blank" rel="noreferrer">
          Official Puzzle Page ↗
        </a>
        <span className="muted">Updated {record.updatedAt}</span>
      </div>
      <h2>
        {record.year} Day {record.day} Part {record.part}: {record.title}
      </h2>
      {isBlocked ? (
        <p className="error-text">Blocker: {record.reason}</p>
      ) : (
        <>
          <p>{record.summary}</p>
          <p>
            <strong>In-flight work:</strong> {record.inFlightWork}
          </p>
          {record.selectionRationale && (
            <p>
              <strong>Selection rationale:</strong> {record.selectionRationale}
            </p>
          )}
        </>
      )}

      {record.proposals.length > 0 && (
        <>
          <h3>Candidate Solutions</h3>
          <div className="proposal-grid">
            {record.proposals.map((proposal) => {
              const selected = !isBlocked && record.selectedProposalId === proposal.id;
              return (
                <article
                  key={proposal.id}
                  className={`proposal-card${selected ? ' proposal-selected' : ''}`}
                >
                  <div className="meta-row">
                    <strong>{proposal.name}</strong>
                    {selected && <span className="badge status-solved">Selected</span>}
                  </div>
                  <p>{proposal.summary}</p>
                  <p className="muted">Complexity: {proposal.complexity}</p>
                  <p className="muted">Tradeoffs: {proposal.tradeoffs}</p>
                </article>
              );
            })}
          </div>
        </>
      )}

      {record.attempts.length > 0 && (
        <>
          <h3>Submission Attempts</h3>
          <ul>
            {record.attempts.map((attempt) => (
              <li key={attempt.attempt}>
                Attempt #{attempt.attempt} (<code>{attempt.outcome}</code>): {attempt.note}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
