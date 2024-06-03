import { SchStateType } from '../../../common/constants/schedule';

export interface IPayLoadOpenScheduleAgentSnapshot {
  agentId?: number | number[];
  siteId?: number | number[];
  buId?: number | number[];
  teamId?: number | number[];
  contractId?: number;
  date?: string;
  startDate?: string;
  endDate?: string;
  activities?: number[];
  virtualActivities?: number[];
  stateTypes?: SchStateType[];
  snapshotId?: string;
  enableSecondarySkills?: boolean;
}

export interface IResponseOpenScheduleAgentSnapshotData {
  snapshotId: string;
  totalCount: number;
  timestamp: number;
}
export interface IResponseOpenScheduleAgentSnapshotStatus {
  message?: string;
  code: number;
  details?: string[];
}

export interface IResponseOpenScheduleAgentSnapshot {
  data?: IResponseOpenScheduleAgentSnapshotData;
  status: IResponseOpenScheduleAgentSnapshotStatus;
}
