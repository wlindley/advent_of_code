import { useId, useMemo, useState } from 'react';
import { executeSolver, type PuzzleSolver } from '../core';

export interface InputRunnerProps {
  readonly exampleInput: string;
  readonly exampleAnswer: string;
  readonly solver: PuzzleSolver<unknown, unknown>;
  readonly activeInput: string;
  readonly onInputChange: (rawInput: string) => void;
}

export function InputRunner({
  exampleInput,
  exampleAnswer,
  solver,
  activeInput,
  onInputChange,
}: InputRunnerProps) {
  const [draft, setDraft] = useState(activeInput);
  const textareaId = useId();
  const isExample = activeInput === exampleInput;

  const execution = useMemo(() => {
    try {
      return { ok: true as const, result: executeSolver(solver, activeInput) };
    } catch (error) {
      return { ok: false as const, message: error instanceof Error ? error.message : String(error) };
    }
  }, [solver, activeInput]);

  return (
    <section className="card input-runner">
      <div className="runner-header">
        <div>
          <span className="eyebrow">{isExample ? 'Example Input' : 'Custom Input (Local Only)'}</span>
          {execution.ok ? (
            <p className="runner-answer">
              Answer: <code>{String(execution.result.answer)}</code>
              <span className="muted"> ({execution.result.elapsedMs.toFixed(2)} ms)</span>
            </p>
          ) : (
            <p className="error-text">Error: {execution.message}</p>
          )}
          {isExample && (
            <p className="muted">Expected example answer: <code>{exampleAnswer}</code></p>
          )}
        </div>
        {!isExample && (
          <button
            type="button"
            onClick={() => {
              setDraft(exampleInput);
              onInputChange(exampleInput);
            }}
          >
            Reset to Example
          </button>
        )}
      </div>
      <details>
        <summary>Run on Your Own Input (executes locally in your browser)</summary>
        <div className="runner-form">
          <label htmlFor={textareaId}>Paste puzzle input</label>
          <textarea
            id={textareaId}
            rows={6}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            spellCheck={false}
          />
          <button type="button" className="primary" onClick={() => onInputChange(draft)}>
            Run &amp; Visualize
          </button>
        </div>
      </details>
    </section>
  );
}
