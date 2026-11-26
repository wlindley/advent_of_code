import type { CSSProperties } from 'react';
import type { DisassembledInstruction, ThreeBitValue } from '../types';

export interface DisassemblyTapeProps {
  readonly instructions: readonly ThreeBitValue[];
  readonly disassembly: readonly DisassembledInstruction[];
  readonly ip: number;
  readonly halted: boolean;
  readonly output: readonly ThreeBitValue[];
  readonly targetOutput?: readonly ThreeBitValue[];
}

const ROW_WRAP_STYLE: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '0.35rem', alignItems: 'center' };
const TABLE_BOX_STYLE: CSSProperties = { border: '1px solid var(--border)', borderRadius: 8, background: 'var(--surface)' };

function tapeCellStyle(isOpcode: boolean, isOperand: boolean): CSSProperties {
  const borderColor = isOpcode ? 'var(--accent)' : isOperand ? 'var(--gold)' : 'var(--border)';
  return {
    padding: '0.2rem 0.45rem',
    borderRadius: 6,
    border: `1.5px solid ${borderColor}`,
    background: 'var(--surface)',
    color: isOpcode ? 'var(--accent)' : isOperand ? 'var(--gold)' : 'var(--text)',
    fontSize: '0.82rem',
    fontWeight: isOpcode || isOperand ? 700 : 500,
  };
}

function RawTapeStrip({ instructions, ip, halted }: { readonly instructions: readonly ThreeBitValue[]; readonly ip: number; readonly halted: boolean }) {
  return (
    <div style={ROW_WRAP_STYLE}>
      <span className="eyebrow" style={{ marginRight: '0.35rem' }}>Tape</span>
      {instructions.map((token, idx) => {
        const isOp = !halted && idx === ip;
        const isArg = !halted && idx === ip + 1;
        return (
          <span key={idx} className="nowrap" title={isOp ? 'Opcode (IP)' : isArg ? 'Operand (IP+1)' : `Addr ${idx}`} style={tapeCellStyle(isOp, isArg)}>
            <span style={{ fontSize: '0.68rem', color: 'var(--muted)', marginRight: '0.25rem' }}>{idx}:</span>
            <code>{token}</code>
          </span>
        );
      })}
    </div>
  );
}

function DisassemblyTable({ disassembly, ip, halted }: { readonly disassembly: readonly DisassembledInstruction[]; readonly ip: number; readonly halted: boolean }) {
  return (
    <div className="table-scroll" style={TABLE_BOX_STYLE}>
      <table className="quality-table">
        <thead>
          <tr><th>IP</th><th>Pair</th><th>Op</th><th>Arg</th><th>Mode</th></tr>
        </thead>
        <tbody>
          {disassembly.map((row) => (
            <tr key={row.ip} style={!halted && row.ip === ip ? { outline: '2px solid var(--accent)', outlineOffset: '-2px', fontWeight: 700 } : undefined}>
              <td className="nowrap"><code>{row.ip}</code></td>
              <td className="nowrap"><code>{row.opcode},{row.operand}</code></td>
              <td><code>{row.mnemonic}</code></td>
              <td><code>{row.operandLabel}</code></td>
              <td className="muted">{row.operandMode}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OutputStrip({ output, targetOutput }: { readonly output: readonly ThreeBitValue[]; readonly targetOutput?: readonly ThreeBitValue[] }) {
  return (
    <div style={ROW_WRAP_STYLE}>
      <span className="eyebrow" style={{ marginRight: '0.35rem' }}>Output</span>
      {output.length === 0 ? <span className="muted" style={{ fontSize: '0.84rem' }}>∅</span> : output.map((val, idx) => {
        const hasTarget = targetOutput !== undefined;
        const matches = hasTarget && targetOutput[idx] === val;
        const color = hasTarget ? (matches ? 'var(--ok)' : 'var(--err)') : 'var(--text)';
        const borderColor = hasTarget ? color : 'var(--accent)';
        return <span key={idx} className="badge" style={{ borderColor, color }}><code>{val}</code></span>;
      })}
    </div>
  );
}

/** Renders indexed raw 3-bit tape, even-aligned disassembly table, and emitted output chips. */
export function DisassemblyTape({ instructions, disassembly, ip, halted, output, targetOutput }: DisassemblyTapeProps) {
  return (
    <div className="stack" style={{ gap: '0.65rem' }}>
      <RawTapeStrip instructions={instructions} ip={ip} halted={halted} />
      {!halted && ip % 2 === 1 && (
        <span className="badge" style={{ borderColor: 'var(--gold)', color: 'var(--gold)', alignSelf: 'flex-start' }}>
          Unaligned odd IP={ip} executing ({instructions[ip]},{instructions[ip + 1]})
        </span>
      )}
      <DisassemblyTable disassembly={disassembly} ip={ip} halted={halted} />
      <OutputStrip output={output} targetOutput={targetOutput} />
    </div>
  );
}
