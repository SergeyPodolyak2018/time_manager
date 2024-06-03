import { ITimezone } from '../../interfaces/config/ITimezone';

export enum SchStateType {
  /**
   * Nothing is scheduled for the agent. This is more theoretical state because there's really
   * no state scheduled but, nevertheless, it is sometimes useful to describe this "special -- empty"
   * agent state, e.g. when generating agent's compliance report.
   */
  NONE = 0,
  /**
   * Day off state. This state is full-day state.
   */
  DAY_OFF = 1,
  /**
   * Time Off. This state may and may not be full-day state depending on Time Off type.
   */
  TIME_OFF = 2,
  /**
   * Exception state. This state may and may not be full-day state depending on exception type.
   */
  EXCEPTION = 3,
  /**
   * Break state. It is part-day state and so it always has start time and end time defined.
   * Break state can only exist within shift boundaries.
   */
  BREAK = 4,
  /**
   * Meal state. This state part-day state and so it always has start time and end time defined.
   * Meal state can only exist within shift boundaries.
   */
  MEAL = 5,
  /**
   * Work Activity state. It is part-day state and so it always has start time and end time defined.
   * Since multi-skill agents can be scheduled to work on more than one activity at a time, there can
   * be several overlapping activity states for the same period of time. Activity state can only exist
   * within shift boundaries.
   */
  ACTIVITY = 6,
  /**
   * Activity Set state is artificial state - agent is never scheduled for this state. This state is
   * introduced just as a mean to group several Activity states into one logical state. Just as activity set
   * groups several activities together, Activity Set state group several Activity states. All Activity states
   * that are for activities that don't belong to any activity set are assigned to hypothetical "Work"
   * Activity Set state.
   */
  ACTIVITY_SET = 7,
  /**
   * Shift state. Shift state is artificial state - agent is never scheduled for such state.
   * It is only introduced to describe scheduled shift boundaries, which all other part-day states
   * should fit in. There may also be situations that because of constraints no state can be scheduled
   * for some time window within shift boundaries. In such case Shift state is provided as scheduled state
   * for that time, and it should to be treated as a forced paid break.
   */
  SHIFT = 8,
  /**
   * Marked Time state. It is part-day state and so it always has start time and end time defined.
   * Marked Time state can only exist within shift boundaries and shall never overlap any Time Off state.
   */
  MARKED_TIME = 9,
  WORK_SET,
}

export enum RefType {
  NONE = 0,
  OVERTIME = 1,
  MEETING = 2,
  CALENDAR = 4,
  DETACHED = 5,
  AGENT = 6,
  SET = 7,
}
export enum DayType {
  /**
   * Agent day schedule is empty - no schedule
   */
  NONE = 0,
  /**
   * Agent day schedule is Day Off
   */
  DAY_OFF = 1,
  /**
   * Agent day schedule is full-day Time Off
   */
  TIME_OFF = 2,
  /**
   * Agent day schedule is full-day Exception
   */
  EXCEPTION = 3,
  /**
   * Agent day schedule has Shift scheduled
   */
  SHIFT = 4,
  /**
   * Agent day schedule is one (or more) non-full day exception(s) with defined
   * start and end times but there is no Shift scheduled
   */
  SHIFT_EXCEPTION = 5,
}

export enum DayFlag {
  /**
   * Agent day schedule was built by customer Builder and wasn't modified since
   */
  SCHEDULED = 0,

  /**
   * Agent day schedule was manually modified by user.
   */
  MODIFIED = 1,

  /**
   * Agent day schedule was traded or swapped between agents
   */
  TRADED = 2,
}

export enum AgentActivityType {
  DISABLED = 0,
  PRIMARY = 1,
  SECONDARY = 2,
  AUTO = 3,
}

export enum ActivityType {
  /**
   * Phone Work Activity
   */
  IMMEDIATE_WORK = 0,

  /**
   * Exclusive Activity
   */
  FIXED_STAFF_WORK = 2,

  /**
   * Backlog Activity
   */
  DEFERRED_WORK = 4,

  /**
   * Activity Group
   */
  GROUP = 10,
}

export enum ExceptionTradeRule {
  REGULAR = 1,
  IN_MEETING_PLANNER = 2,
  AS_TIME_OFF = 3,
  CONVERTIBLE_TO_DAY_OFF = 4,
}

export enum CarpoolStatus {
  DISABLED = 0,
  OPEN = 1,
  CLOSED = 2,
}

export enum ShiftType {
  PRIMARY = 1,
  SECONDARY = 2,
}

export enum WarningTypes {
  SCHEDULE_MODIFIED = 'Agent Day Schedule was modified by another user',
}

export const WORK_ID = 0;
export enum ActivitySetType {
  ALL,
  ACTIVITY_SET,
  WORK,
}

export const SITE_TIME_ZONE: ITimezone = {
  name: '',
  value: 0,
  currentOffset: 0,
  gswTimezoneId: 0,
  description: '',
  timezoneId: 0,
};

export class OverlappingWarning extends Error {
  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, OverlappingWarning.prototype);
  }
}
