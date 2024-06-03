import { IAgentTimeline } from './IAgentTimeline';

export interface ITimelineHistory {
  past: IHistoryData[];
  current: IHistoryData;
  future: IHistoryData[];
}

export interface IHistoryData {
  data: IAgentTimeline[];
  isModified?: boolean;
}
