import { IAgentSchedule, ISchWorkState } from '../../../common/interfaces/schedule/IAgentSchedule';

export interface BuildAgentDayInSnapshot {
  agentDays?: IAgentSchedule[];
  states?: ISchWorkState[];
  scheduleShiftItems?: boolean;
  snapshotId?: string;
  modifiedAgentDays?: IAgentSchedule[];
  timezoneId?: number;
}
