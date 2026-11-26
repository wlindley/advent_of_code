import type { CommandDirection, SubmarineCommand } from './course';
import type { SubmarinePose } from './pose';

export type StepHandler = (pose: SubmarinePose, command: SubmarineCommand) => SubmarinePose;

export interface NavigationPolicy {
  readonly name: string;
  readonly usesAim: boolean;
  step(pose: SubmarinePose, command: SubmarineCommand): SubmarinePose;
}

/** Dispatch-table-backed NavigationPolicy avoiding duplicated switch/if chains. */
export class TableNavigationPolicy implements NavigationPolicy {
  readonly name: string;
  readonly usesAim: boolean;
  private readonly handlers: Readonly<Record<CommandDirection, StepHandler>>;

  constructor(
    name: string,
    usesAim: boolean,
    handlers: Readonly<Record<CommandDirection, StepHandler>>,
  ) {
    this.name = name;
    this.usesAim = usesAim;
    this.handlers = Object.freeze({ ...handlers });
    Object.freeze(this);
  }

  step(pose: SubmarinePose, command: SubmarineCommand): SubmarinePose {
    return this.handlers[command.direction](pose, command);
  }
}

function directForward(pose: SubmarinePose, command: SubmarineCommand): SubmarinePose {
  return pose.withDelta(command.units, 0n, 0n);
}

function directDown(pose: SubmarinePose, command: SubmarineCommand): SubmarinePose {
  return pose.withDelta(0n, command.units, 0n);
}

function directUp(pose: SubmarinePose, command: SubmarineCommand): SubmarinePose {
  return pose.withDelta(0n, -command.units, 0n);
}

function aimForward(pose: SubmarinePose, command: SubmarineCommand): SubmarinePose {
  return pose.withDelta(command.units, pose.aim * command.units, 0n);
}

function aimDown(pose: SubmarinePose, command: SubmarineCommand): SubmarinePose {
  return pose.withDelta(0n, 0n, command.units);
}

function aimUp(pose: SubmarinePose, command: SubmarineCommand): SubmarinePose {
  return pose.withDelta(0n, 0n, -command.units);
}

/** Part 1 navigation policy: direct horizontal and depth displacement without aim. */
export const DIRECT_NAVIGATION_POLICY: NavigationPolicy = new TableNavigationPolicy('direct', false, {
  forward: directForward,
  down: directDown,
  up: directUp,
});

/** Part 2 navigation policy: down/up adjust aim, forward advances horizontal and `aim * units` depth. */
export const AIM_NAVIGATION_POLICY: NavigationPolicy = new TableNavigationPolicy('aim', true, {
  forward: aimForward,
  down: aimDown,
  up: aimUp,
});
