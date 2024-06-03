
export interface IPayLoadOpenAgentSnapshot {
  agentId?: number | number[];
  siteId?: number | number[];
  buId?: number | number[];
  teamId?: number | number[];
  contractId?: number | number[];
  employeeId?: string | number[];
  firstName?: string;
  lastName?: string;
  startDate: string;
  endDate: string;
  enableSecondarySkills: boolean;
  useActivityFilter?: boolean;
  snapshotId?: string;
}

export interface IResponseOpenScheduleAgentSnapshotData {
  snapshotId:string;
  totalCount:number;
  timestamp:number;
}
export interface IResponseOpenScheduleAgentSnapshotStatus {
  message?:string;
  code:number;
  details?:string[];
}

export interface IResponseOpenAgentSnapshot {
  data?:any;
  status:IResponseOpenScheduleAgentSnapshotStatus;
}
