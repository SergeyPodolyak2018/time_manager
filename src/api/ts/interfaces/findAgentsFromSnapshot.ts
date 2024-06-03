
export interface IPayLoadFindAgentsFromSnapshot {
  snapshotId: string,
  firstIndex?: number;
  lastIndex?: number;
}

export interface IResponseFindAgentsFromSnapshotData {
  agentId: number;
  buId: number;
  siteId: number;
  teamId: number;
  contractId?: number[];
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  startDate?: string | number;
  endDate?: string | number;
  seniority?: number;
  email?: string;
  carpoolId?: number;
  comments?: string;
  hourlyWage?: number;
  timestamp?: number;
  teamName?: string;
}
export interface IResponseFindAgentsFromSnapshotStatus {
  message?:string;
  code:number;
  details?:string[];
}

export interface IResponseFindAgentsFromSnapshot {
  data?:IResponseFindAgentsFromSnapshotData[];
  status:IResponseFindAgentsFromSnapshotStatus;
}
