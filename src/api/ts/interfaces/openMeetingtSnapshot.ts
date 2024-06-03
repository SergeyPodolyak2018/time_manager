
export interface IPayLoadOpenMeetingSnapshot {
  agentId?: number | number[];
  siteId?: number | number[];
  buId?: number | number[];
  teamId?: number | number[];
  contractId?: number | number[];
  employeeId?: string | number[];
  firstName?: string;
  lastName?: string;
  startDate?: string;
  endDate?: string;
  enableSecondarySkills?: boolean;
  snapshotId?: string;
}

export interface IResponseOpenMeetingSnapshotData {
  snapshotId:string;
  totalCount:number;
  timestamp:number;
}
export interface IResponseOpenMeetingSnapshotStatus {
  message?:string;
  code:number;
  details?:string[];
}

export interface IResponseOpenMeetingSnapshot {
  data?:IResponseOpenMeetingSnapshotData;
  status:IResponseOpenMeetingSnapshotStatus;
}
