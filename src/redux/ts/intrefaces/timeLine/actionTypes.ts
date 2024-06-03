import { IAgentTimeline } from './IAgentTimeline';
import { ISchWorkState } from '../../../../common/interfaces/schedule/IAgentSchedule';

export interface buildAgentDayInSnapshotData {
  agentDays?: IAgentTimeline[];
  modifiedAgentDays?: IAgentTimeline[];
  states?: ISchWorkState[];
  disablePerformanceData?: boolean;
  timezoneId?: number;
}
