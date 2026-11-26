import {
  BufferedIoChannel,
  IntcodeMachine,
  STANDARD_OPCODES,
  createOpcodeRegistry,
  type IntcodeProgram,
  type MachineStatus,
} from '../../shared/intcode';
import { StageTelemetry } from './circuitModels';

const STANDARD_OPCODE_REGISTRY = createOpcodeRegistry(STANDARD_OPCODES);
const EMPTY_SIGNALS: readonly bigint[] = Object.freeze([]);

/** Stateful single-amplifier Intcode VM wrapper with incremental output draining. */
export class AmplifierStage {
  readonly label: string;
  readonly phase: bigint;
  private readonly machine: IntcodeMachine;
  private readonly received: bigint[] = [];
  private emittedCursor = 0;

  constructor(label: string, phase: bigint, program: IntcodeProgram) {
    this.label = label;
    this.phase = phase;
    this.machine = IntcodeMachine.fromProgram(program, STANDARD_OPCODE_REGISTRY, {
      io: new BufferedIoChannel([phase]),
    });
  }

  get status(): MachineStatus {
    return this.machine.status;
  }

  get stepCount(): number {
    return this.machine.stepCount;
  }

  get emittedCount(): number {
    return this.machine.outputCount;
  }

  enqueueSignal(signal: bigint): void {
    this.received.push(signal);
    this.machine.pushInput(signal);
  }

  /**
   * Executes until paused or halted and returns newly emitted outputs.
   * Note: `IntcodeMachine.run(maxSteps)` enforces a cumulative lifetime step budget
   * across all pause/resume calls on this stage.
   */
  runAndDrainOutputs(maxSteps: number): readonly bigint[] {
    this.machine.run(maxSteps);
    if (this.machine.outputCount === this.emittedCursor) {
      return EMPTY_SIGNALS;
    }
    const fresh = this.machine.snapshotOutputs().slice(this.emittedCursor);
    this.emittedCursor = this.machine.outputCount;
    return Object.freeze(fresh);
  }

  toTelemetry(): StageTelemetry {
    return new StageTelemetry(
      this.label,
      this.phase,
      this.received,
      this.machine.snapshotOutputs(),
      this.machine.stepCount,
      this.machine.status,
    );
  }
}
